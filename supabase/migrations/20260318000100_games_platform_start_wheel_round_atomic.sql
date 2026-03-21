create or replace function public.start_wheel_round_atomic(
  p_session_id uuid,
  p_player_id uuid,
  p_started_at timestamptz,
  p_category_id uuid,
  p_task_id uuid,
  p_spin_angle integer,
  p_cycle_number integer,
  p_selection_rank integer,
  p_timer_status text,
  p_timer_duration_seconds integer,
  p_timer_remaining_seconds integer,
  p_round_metadata jsonb,
  p_activity_payload jsonb
)
returns uuid
language plpgsql
set search_path = public, extensions
as $$
declare
  v_round_id uuid := gen_random_uuid();
begin
  insert into public.game_rounds (
    id,
    session_id,
    player_id,
    game_slug,
    status,
    started_at,
    resolution_reason,
    timer_status,
    timer_duration_seconds,
    timer_remaining_seconds,
    timer_last_started_at,
    timer_last_paused_at,
    timer_last_sync_at,
    response_payload,
    metadata
  )
  values (
    v_round_id,
    p_session_id,
    p_player_id,
    'wheel-of-fortune',
    'open',
    p_started_at,
    null,
    p_timer_status,
    p_timer_duration_seconds,
    p_timer_remaining_seconds,
    null,
    null,
    null,
    '{}'::jsonb,
    coalesce(p_round_metadata, '{}'::jsonb)
  );

  insert into public.wheel_round_assignments (
    round_id,
    category_id,
    task_id,
    spin_angle,
    cycle_number,
    selection_rank,
    created_at
  )
  values (
    v_round_id,
    p_category_id,
    p_task_id,
    p_spin_angle,
    p_cycle_number,
    p_selection_rank,
    p_started_at
  );

  insert into public.wheel_player_task_history (
    session_id,
    player_id,
    task_id,
    first_round_id,
    round_id,
    cycle_number,
    assigned_at,
    created_at
  )
  values (
    p_session_id,
    p_player_id,
    p_task_id,
    v_round_id,
    v_round_id,
    p_cycle_number,
    p_started_at,
    p_started_at
  );

  update public.game_sessions
  set
    current_cycle = p_cycle_number,
    total_rounds = total_rounds + 1,
    last_round_started_at = p_started_at
  where id = p_session_id
    and player_id = p_player_id
    and game_slug = 'wheel-of-fortune';

  if not found then
    raise exception 'wheel_session_not_found';
  end if;

  insert into public.activity_events (
    session_id,
    player_id,
    game_slug,
    round_id,
    event_type,
    visibility,
    payload,
    snapshot_prompt_i18n,
    created_at
  )
  values (
    p_session_id,
    p_player_id,
    'wheel-of-fortune',
    v_round_id,
    'wheel.round.started',
    'private',
    coalesce(p_activity_payload, '{}'::jsonb),
    '{}'::jsonb,
    p_started_at
  );

  return v_round_id;
end;
$$;
