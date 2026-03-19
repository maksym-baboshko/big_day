-- Hotfix: ensure leaderboard.new_top_player is emitted atomically
-- even when the previous #1 loses XP and another player becomes the new leader.

create or replace function public.resolve_wheel_round_atomic(
  p_round_id uuid,
  p_player_id uuid,
  p_resolved_at timestamptz,
  p_resolution text,
  p_resolution_reason text,
  p_timer_status text,
  p_timer_duration_seconds integer,
  p_timer_remaining_seconds integer,
  p_timer_last_paused_at timestamptz,
  p_timer_last_sync_at timestamptz,
  p_response_payload jsonb,
  p_round_metadata jsonb,
  p_xp_reason text,
  p_xp_delta integer,
  p_xp_event_snapshot jsonb,
  p_xp_metadata jsonb,
  p_activity_events jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_session_id uuid;
  v_previous_leaderboard jsonb := '[]'::jsonb;
  v_previous_top_player_id uuid;
  v_current_top_player_id uuid;
  v_current_top_player_name text;
  v_current_top_player_avatar_key text;
  v_current_top_player_previous_rank integer;
begin
  if coalesce(p_xp_delta, 0) <> 0 then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'player_id', player_id,
          'rank', rank
        )
        order by rank asc, score_reached_at asc, player_id asc
      ),
      '[]'::jsonb
    )
    into v_previous_leaderboard
    from public.leaderboard_global_view
    where onboarding_completed = true
      and nickname is not null
      and total_points > 0;

    select nullif(v_previous_leaderboard->0->>'player_id', '')::uuid
      into v_previous_top_player_id;
  end if;

  update public.game_rounds
  set
    status = 'resolved',
    resolved_at = p_resolved_at,
    resolution = p_resolution,
    resolution_reason = p_resolution_reason,
    timer_status = p_timer_status,
    timer_duration_seconds = p_timer_duration_seconds,
    timer_remaining_seconds = p_timer_remaining_seconds,
    timer_last_started_at = null,
    timer_last_paused_at = p_timer_last_paused_at,
    timer_last_sync_at = p_timer_last_sync_at,
    response_payload = coalesce(p_response_payload, '{}'::jsonb),
    metadata = coalesce(p_round_metadata, '{}'::jsonb)
  where id = p_round_id
    and player_id = p_player_id
    and status = 'open'
  returning session_id into v_session_id;

  if v_session_id is null then
    raise exception 'wheel_round_not_open';
  end if;

  if coalesce(p_xp_delta, 0) <> 0 then
    insert into public.xp_transactions (
      player_id,
      game_slug,
      round_id,
      reason,
      delta,
      event_snapshot,
      metadata,
      created_at
    )
    values (
      p_player_id,
      'wheel-of-fortune',
      p_round_id,
      p_xp_reason,
      p_xp_delta,
      coalesce(p_xp_event_snapshot, '{}'::jsonb),
      coalesce(p_xp_metadata, '{}'::jsonb),
      p_resolved_at
    );
  end if;

  if jsonb_typeof(coalesce(p_activity_events, '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(p_activity_events, '[]'::jsonb)) > 0 then
    insert into public.activity_events (
      session_id,
      player_id,
      game_slug,
      round_id,
      event_type,
      visibility,
      payload,
      snapshot_name,
      snapshot_avatar_key,
      snapshot_prompt_i18n,
      snapshot_answer_text,
      snapshot_xp_delta,
      created_at
    )
    select
      v_session_id,
      p_player_id,
      'wheel-of-fortune',
      p_round_id,
      item->>'event_type',
      item->>'visibility',
      coalesce(item->'payload', '{}'::jsonb),
      nullif(item->>'snapshot_name', ''),
      nullif(item->>'snapshot_avatar_key', ''),
      coalesce(item->'snapshot_prompt_i18n', '{}'::jsonb),
      nullif(item->>'snapshot_answer_text', ''),
      case
        when item ? 'snapshot_xp_delta'
          and jsonb_typeof(item->'snapshot_xp_delta') = 'number'
        then (item->>'snapshot_xp_delta')::integer
        else null
      end,
      p_resolved_at
    from jsonb_array_elements(coalesce(p_activity_events, '[]'::jsonb)) as item;
  end if;

  if coalesce(p_xp_delta, 0) <> 0 then
    select
      player_id,
      nickname,
      avatar_key
    into
      v_current_top_player_id,
      v_current_top_player_name,
      v_current_top_player_avatar_key
    from public.leaderboard_global_view
    where onboarding_completed = true
      and nickname is not null
      and total_points > 0
    order by rank asc, score_reached_at asc, player_id asc
    limit 1;

    if v_current_top_player_id is not null then
      select (entry->>'rank')::integer
      into v_current_top_player_previous_rank
      from jsonb_array_elements(v_previous_leaderboard) as entry
      where entry->>'player_id' = v_current_top_player_id::text
      limit 1;
    end if;

    if v_current_top_player_id is not null
      and v_current_top_player_id is distinct from v_previous_top_player_id
      and coalesce(v_current_top_player_previous_rank, 0) <> 1 then
      insert into public.activity_events (
        session_id,
        player_id,
        game_slug,
        round_id,
        event_type,
        visibility,
        payload,
        snapshot_name,
        snapshot_avatar_key,
        snapshot_prompt_i18n,
        snapshot_answer_text,
        snapshot_xp_delta,
        created_at
      )
      values (
        v_session_id,
        v_current_top_player_id,
        'wheel-of-fortune',
        p_round_id,
        'leaderboard.new_top_player',
        'feed',
        jsonb_build_object(
          'rank', 1,
          'previousRank', v_current_top_player_previous_rank,
          'heroEvent', true
        ),
        v_current_top_player_name,
        v_current_top_player_avatar_key,
        '{}'::jsonb,
        null,
        case when v_current_top_player_id = p_player_id then p_xp_delta else null end,
        p_resolved_at
      );
    end if;
  end if;

  update public.game_sessions
  set
    resolved_rounds = resolved_rounds + 1,
    last_round_resolved_at = p_resolved_at
  where id = v_session_id
    and player_id = p_player_id
    and game_slug = 'wheel-of-fortune';

  if not found then
    raise exception 'wheel_session_not_found';
  end if;

  return p_round_id;
end;
$$;
