create extension if not exists pgcrypto;

create table if not exists public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  display_name_normalized text,
  avatar_key text not null,
  locale text not null default 'uk',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_definitions (
  slug text primary key,
  status text not null,
  sort_order integer not null,
  live_enabled boolean not null default false,
  title_i18n jsonb not null,
  description_i18n jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  game_slug text not null references public.game_definitions(slug),
  status text not null default 'active',
  current_cycle integer not null default 1,
  total_rounds integer not null default 0,
  resolved_rounds integer not null default 0,
  last_round_started_at timestamptz,
  last_round_resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (player_id, game_slug)
);

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  game_slug text not null references public.game_definitions(slug),
  status text not null,
  started_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolution text,
  resolution_reason text,
  timer_status text not null default 'none',
  timer_duration_seconds integer,
  timer_remaining_seconds integer,
  timer_last_started_at timestamptz,
  timer_last_paused_at timestamptz,
  timer_last_sync_at timestamptz,
  response_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  game_slug text not null references public.game_definitions(slug),
  round_id uuid references public.game_rounds(id) on delete set null,
  reason text not null,
  delta integer not null,
  event_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions(id) on delete set null,
  player_id uuid references public.player_profiles(id) on delete set null,
  game_slug text not null references public.game_definitions(slug),
  round_id uuid references public.game_rounds(id) on delete set null,
  event_type text not null,
  visibility text not null default 'private',
  payload jsonb not null default '{}'::jsonb,
  snapshot_name text,
  snapshot_avatar_key text,
  snapshot_prompt_i18n jsonb not null default '{}'::jsonb,
  snapshot_answer_text text,
  snapshot_xp_delta integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.realtime_signals (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  game_slug text references public.game_definitions(slug) on delete cascade,
  signal_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.request_rate_limits (
  scope text not null,
  identifier text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, identifier, window_started_at)
);

create table if not exists public.wheel_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order integer not null unique,
  weight integer not null default 1,
  title_i18n jsonb not null,
  description_i18n jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.wheel_categories
  drop constraint if exists wheel_categories_sort_order_key;

create table if not exists public.wheel_tasks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.wheel_categories(id) on delete cascade,
  task_key text not null unique,
  interaction_type text not null,
  response_mode text not null default 'confirm',
  execution_mode text not null default 'instant',
  allow_promise boolean not null default false,
  allow_early_completion boolean not null default false,
  difficulty text not null,
  prompt_i18n jsonb not null,
  details_i18n jsonb not null default '{}'::jsonb,
  base_xp integer not null,
  promise_xp integer not null,
  skip_penalty_xp integer not null,
  timeout_penalty_xp integer not null default 0,
  timer_seconds integer,
  feed_safe boolean not null default true,
  requires_other_guest boolean not null default false,
  phone_allowed boolean not null default false,
  public_speaking boolean not null default false,
  physical_contact_level text not null default 'none',
  couple_centric boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wheel_round_assignments (
  round_id uuid primary key references public.game_rounds(id) on delete cascade,
  category_id uuid not null references public.wheel_categories(id),
  task_id uuid not null references public.wheel_tasks(id),
  spin_angle integer not null,
  cycle_number integer not null default 1,
  selection_rank integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wheel_player_task_history (
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  task_id uuid not null references public.wheel_tasks(id) on delete cascade,
  first_round_id uuid references public.game_rounds(id) on delete cascade,
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  cycle_number integer not null default 1,
  assigned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, task_id, cycle_number)
);

alter table if exists public.wheel_tasks
  add column if not exists response_mode text;

alter table if exists public.wheel_tasks
  add column if not exists execution_mode text;

alter table if exists public.wheel_tasks
  add column if not exists allow_promise boolean;

alter table if exists public.wheel_tasks
  add column if not exists allow_early_completion boolean;

update public.wheel_tasks
set response_mode = case
  when interaction_type = 'text_input' then 'text_input'
  else 'confirm'
end
where response_mode is null;

update public.wheel_tasks
set execution_mode = case
  when interaction_type = 'timer' then 'timed'
  when interaction_type = 'async_task' then 'deferred'
  else 'instant'
end
where execution_mode is null;

update public.wheel_tasks
set allow_promise = interaction_type = 'async_task'
where allow_promise is null;

update public.wheel_tasks
set allow_early_completion = interaction_type = 'timer'
where allow_early_completion is null;

update public.wheel_tasks
set promise_xp = 0
where coalesce(allow_promise, false) = false
  and promise_xp <> 0;

alter table if exists public.wheel_tasks
  alter column response_mode set default 'confirm';

alter table if exists public.wheel_tasks
  alter column execution_mode set default 'instant';

alter table if exists public.wheel_tasks
  alter column allow_promise set default false;

alter table if exists public.wheel_tasks
  alter column allow_early_completion set default false;

alter table if exists public.wheel_tasks
  alter column response_mode set not null;

alter table if exists public.wheel_tasks
  alter column execution_mode set not null;

alter table if exists public.wheel_tasks
  alter column allow_promise set not null;

alter table if exists public.wheel_tasks
  alter column allow_early_completion set not null;

alter table if exists public.game_sessions
  add column if not exists status text;

alter table if exists public.game_sessions
  add column if not exists current_cycle integer;

alter table if exists public.game_sessions
  add column if not exists total_rounds integer;

alter table if exists public.game_sessions
  add column if not exists resolved_rounds integer;

alter table if exists public.game_sessions
  add column if not exists last_round_started_at timestamptz;

alter table if exists public.game_sessions
  add column if not exists last_round_resolved_at timestamptz;

alter table if exists public.game_sessions
  add column if not exists metadata jsonb;

alter table if exists public.game_sessions
  add column if not exists created_at timestamptz;

alter table if exists public.game_sessions
  add column if not exists updated_at timestamptz;

update public.game_sessions
set
  status = coalesce(status, 'active'),
  current_cycle = coalesce(current_cycle, 1),
  total_rounds = coalesce(total_rounds, 0),
  resolved_rounds = coalesce(resolved_rounds, 0),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where
  status is null
  or current_cycle is null
  or total_rounds is null
  or resolved_rounds is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table if exists public.game_sessions
  alter column status set default 'active';

alter table if exists public.game_sessions
  alter column current_cycle set default 1;

alter table if exists public.game_sessions
  alter column total_rounds set default 0;

alter table if exists public.game_sessions
  alter column resolved_rounds set default 0;

alter table if exists public.game_sessions
  alter column metadata set default '{}'::jsonb;

alter table if exists public.game_sessions
  alter column created_at set default timezone('utc', now());

alter table if exists public.game_sessions
  alter column updated_at set default timezone('utc', now());

alter table if exists public.game_sessions
  alter column status set not null;

alter table if exists public.game_sessions
  alter column current_cycle set not null;

alter table if exists public.game_sessions
  alter column total_rounds set not null;

alter table if exists public.game_sessions
  alter column resolved_rounds set not null;

alter table if exists public.game_sessions
  alter column metadata set not null;

alter table if exists public.game_sessions
  alter column created_at set not null;

alter table if exists public.game_sessions
  alter column updated_at set not null;

alter table if exists public.game_rounds
  add column if not exists session_id uuid references public.game_sessions(id) on delete cascade;

alter table if exists public.game_rounds
  add column if not exists resolution_reason text;

alter table if exists public.game_rounds
  add column if not exists timer_status text;

alter table if exists public.game_rounds
  add column if not exists timer_duration_seconds integer;

alter table if exists public.game_rounds
  add column if not exists timer_remaining_seconds integer;

alter table if exists public.game_rounds
  add column if not exists timer_last_started_at timestamptz;

alter table if exists public.game_rounds
  add column if not exists timer_last_paused_at timestamptz;

alter table if exists public.game_rounds
  add column if not exists timer_last_sync_at timestamptz;

alter table if exists public.game_rounds
  add column if not exists timer_started_at timestamptz;

alter table if exists public.game_rounds
  add column if not exists timer_deadline_at timestamptz;

update public.game_rounds
set
  timer_status = case
    when coalesce(
      timer_duration_seconds,
      case
        when timer_started_at is not null and timer_deadline_at is not null
        then greatest(1, ceil(extract(epoch from (timer_deadline_at - timer_started_at))))::int
        else null
      end
    ) is null then 'none'
    when resolved_at is not null then 'done'
    when timer_started_at is not null and timer_deadline_at is not null then 'running'
    else 'idle'
  end,
  timer_duration_seconds = coalesce(
    timer_duration_seconds,
    case
      when timer_started_at is not null and timer_deadline_at is not null
      then greatest(1, ceil(extract(epoch from (timer_deadline_at - timer_started_at))))::int
      else null
    end
  ),
  timer_remaining_seconds = case
    when timer_remaining_seconds is not null then timer_remaining_seconds
    when timer_deadline_at is not null and timer_started_at is not null then greatest(
      0,
      ceil(extract(epoch from (timer_deadline_at - timezone('utc', now()))))
    )::int
    else coalesce(
      timer_duration_seconds,
      case
        when timer_started_at is not null and timer_deadline_at is not null
        then greatest(1, ceil(extract(epoch from (timer_deadline_at - timer_started_at))))::int
        else null
      end
    )
  end,
  timer_last_started_at = coalesce(timer_last_started_at, timer_started_at),
  timer_last_paused_at = coalesce(timer_last_paused_at, case when timer_started_at is not null and timer_deadline_at is not null then null else timer_last_paused_at end),
  timer_last_sync_at = coalesce(timer_last_sync_at, timezone('utc', now())),
  resolution_reason = coalesce(
    resolution_reason,
    case
      when resolution = 'skipped' then 'manual_skip'
      when resolution is not null then 'not_applicable'
      else null
    end
  )
where
  timer_status is null
  or (
    timer_duration_seconds is null
    and timer_started_at is not null
    and timer_deadline_at is not null
  )
  or timer_remaining_seconds is null
  or timer_last_sync_at is null
  or (resolution is not null and resolution_reason is null);

update public.game_rounds
set timer_status = 'none'
where timer_status is null;

alter table if exists public.game_rounds
  alter column timer_status set default 'none';

alter table if exists public.game_rounds
  alter column timer_status set not null;

alter table if exists public.xp_transactions
  add column if not exists event_snapshot jsonb;

update public.xp_transactions
set event_snapshot = coalesce(event_snapshot, '{}'::jsonb)
where event_snapshot is null;

alter table if exists public.xp_transactions
  alter column event_snapshot set default '{}'::jsonb;

alter table if exists public.xp_transactions
  alter column event_snapshot set not null;

alter table if exists public.activity_events
  add column if not exists session_id uuid references public.game_sessions(id) on delete set null;

alter table if exists public.activity_events
  add column if not exists snapshot_name text;

alter table if exists public.activity_events
  add column if not exists snapshot_avatar_key text;

alter table if exists public.activity_events
  add column if not exists snapshot_prompt_i18n jsonb;

alter table if exists public.activity_events
  add column if not exists snapshot_answer_text text;

alter table if exists public.activity_events
  add column if not exists snapshot_xp_delta integer;

update public.activity_events
set snapshot_prompt_i18n = coalesce(snapshot_prompt_i18n, '{}'::jsonb)
where snapshot_prompt_i18n is null;

alter table if exists public.activity_events
  alter column snapshot_prompt_i18n set default '{}'::jsonb;

alter table if exists public.activity_events
  alter column snapshot_prompt_i18n set not null;

alter table if exists public.wheel_tasks
  add column if not exists timeout_penalty_xp integer;

alter table if exists public.wheel_tasks
  add column if not exists feed_safe boolean;

alter table if exists public.wheel_tasks
  add column if not exists requires_other_guest boolean;

alter table if exists public.wheel_tasks
  add column if not exists phone_allowed boolean;

alter table if exists public.wheel_tasks
  add column if not exists public_speaking boolean;

alter table if exists public.wheel_tasks
  add column if not exists physical_contact_level text;

alter table if exists public.wheel_tasks
  add column if not exists couple_centric boolean;

update public.wheel_tasks
set
  timeout_penalty_xp = coalesce(timeout_penalty_xp, least(0, skip_penalty_xp + 2)),
  feed_safe = coalesce(feed_safe, true),
  requires_other_guest = coalesce(requires_other_guest, false),
  phone_allowed = coalesce(phone_allowed, false),
  public_speaking = coalesce(public_speaking, false),
  physical_contact_level = coalesce(physical_contact_level, 'none'),
  couple_centric = coalesce(couple_centric, false)
where
  timeout_penalty_xp is null
  or feed_safe is null
  or requires_other_guest is null
  or phone_allowed is null
  or public_speaking is null
  or physical_contact_level is null
  or couple_centric is null;

alter table if exists public.wheel_tasks
  alter column timeout_penalty_xp set default 0;

alter table if exists public.wheel_tasks
  alter column feed_safe set default true;

alter table if exists public.wheel_tasks
  alter column requires_other_guest set default false;

alter table if exists public.wheel_tasks
  alter column phone_allowed set default false;

alter table if exists public.wheel_tasks
  alter column public_speaking set default false;

alter table if exists public.wheel_tasks
  alter column physical_contact_level set default 'none';

alter table if exists public.wheel_tasks
  alter column couple_centric set default false;

alter table if exists public.wheel_tasks
  alter column timeout_penalty_xp set not null;

alter table if exists public.wheel_tasks
  alter column feed_safe set not null;

alter table if exists public.wheel_tasks
  alter column requires_other_guest set not null;

alter table if exists public.wheel_tasks
  alter column phone_allowed set not null;

alter table if exists public.wheel_tasks
  alter column public_speaking set not null;

alter table if exists public.wheel_tasks
  alter column physical_contact_level set not null;

alter table if exists public.wheel_tasks
  alter column couple_centric set not null;

alter table if exists public.wheel_round_assignments
  add column if not exists cycle_number integer;

alter table if exists public.wheel_round_assignments
  add column if not exists selection_rank integer;

update public.wheel_round_assignments
set
  cycle_number = coalesce(cycle_number, 1),
  selection_rank = coalesce(selection_rank, 1)
where cycle_number is null or selection_rank is null;

alter table if exists public.wheel_round_assignments
  alter column cycle_number set default 1;

alter table if exists public.wheel_round_assignments
  alter column selection_rank set default 1;

alter table if exists public.wheel_round_assignments
  alter column cycle_number set not null;

alter table if exists public.wheel_round_assignments
  alter column selection_rank set not null;

alter table if exists public.wheel_player_task_history
  add column if not exists session_id uuid references public.game_sessions(id) on delete cascade;

alter table if exists public.wheel_player_task_history
  add column if not exists first_round_id uuid references public.game_rounds(id) on delete cascade;

alter table if exists public.wheel_player_task_history
  add column if not exists round_id uuid references public.game_rounds(id) on delete cascade;

alter table if exists public.wheel_player_task_history
  add column if not exists cycle_number integer;

alter table if exists public.wheel_player_task_history
  add column if not exists assigned_at timestamptz;

alter table if exists public.wheel_player_task_history
  add column if not exists created_at timestamptz;

insert into public.game_sessions (
  player_id,
  game_slug,
  status,
  current_cycle,
  total_rounds,
  resolved_rounds,
  last_round_started_at,
  last_round_resolved_at,
  metadata
)
select
  gr.player_id,
  gr.game_slug,
  'active',
  1,
  count(*)::int,
  count(*) filter (where gr.resolved_at is not null)::int,
  max(gr.started_at),
  max(gr.resolved_at),
  '{}'::jsonb
from public.game_rounds gr
group by gr.player_id, gr.game_slug
on conflict (player_id, game_slug) do nothing;

update public.game_rounds gr
set session_id = gs.id
from public.game_sessions gs
where
  gr.session_id is null
  and gs.player_id = gr.player_id
  and gs.game_slug = gr.game_slug;

update public.wheel_player_task_history history
set
  round_id = coalesce(history.round_id, history.first_round_id),
  cycle_number = coalesce(history.cycle_number, 1),
  assigned_at = coalesce(history.assigned_at, history.created_at),
  session_id = coalesce(history.session_id, rounds.session_id)
from public.game_rounds rounds
where
  rounds.id = coalesce(history.round_id, history.first_round_id)
  and (
    history.round_id is null
    or history.cycle_number is null
    or history.assigned_at is null
    or history.session_id is null
  );

alter table if exists public.wheel_player_task_history
  drop constraint if exists wheel_player_task_history_pkey;

alter table if exists public.wheel_player_task_history
  alter column session_id set not null;

alter table if exists public.wheel_player_task_history
  alter column round_id set not null;

alter table if exists public.wheel_player_task_history
  alter column cycle_number set not null;

alter table if exists public.wheel_player_task_history
  alter column assigned_at set not null;

alter table if exists public.game_rounds
  alter column session_id set not null;

create unique index if not exists wheel_player_task_history_session_cycle_task_idx
  on public.wheel_player_task_history (session_id, task_id, cycle_number);

create unique index if not exists game_sessions_player_game_idx
  on public.game_sessions (player_id, game_slug);

create unique index if not exists wheel_categories_active_sort_order_idx
  on public.wheel_categories (sort_order)
  where is_active = true;

create index if not exists player_profiles_onboarding_idx
  on public.player_profiles (onboarding_completed, updated_at desc);

create index if not exists game_rounds_player_started_idx
  on public.game_rounds (player_id, started_at desc);

create index if not exists game_rounds_game_started_idx
  on public.game_rounds (game_slug, started_at desc);

with duplicate_open_rounds as (
  select
    id,
    row_number() over (
      partition by session_id
      order by started_at desc, id desc
    ) as open_rank
  from public.game_rounds
  where session_id is not null
    and status = 'open'
)
update public.game_rounds gr
set
  status = 'resolved',
  resolved_at = coalesce(gr.resolved_at, timezone('utc', now())),
  resolution = coalesce(gr.resolution, 'skipped'),
  resolution_reason = coalesce(gr.resolution_reason, 'manual_skip'),
  timer_status = case
    when gr.timer_status = 'none' then 'none'
    else 'done'
  end,
  timer_last_started_at = null,
  timer_last_paused_at = coalesce(gr.timer_last_paused_at, timezone('utc', now())),
  timer_last_sync_at = coalesce(gr.timer_last_sync_at, timezone('utc', now()))
from duplicate_open_rounds duplicates
where gr.id = duplicates.id
  and duplicates.open_rank > 1;

create unique index if not exists game_rounds_session_open_unique_idx
  on public.game_rounds (session_id)
  where status = 'open';

create index if not exists xp_transactions_player_created_idx
  on public.xp_transactions (player_id, created_at desc);

create index if not exists xp_transactions_game_created_idx
  on public.xp_transactions (game_slug, created_at desc);

create unique index if not exists xp_transactions_round_unique_idx
  on public.xp_transactions (round_id)
  where round_id is not null;

create index if not exists activity_events_created_idx
  on public.activity_events (created_at desc);

create index if not exists activity_events_visibility_created_idx
  on public.activity_events (visibility, created_at desc);

create index if not exists realtime_signals_channel_created_idx
  on public.realtime_signals (channel, created_at desc);

create index if not exists realtime_signals_game_created_idx
  on public.realtime_signals (game_slug, created_at desc)
  where game_slug is not null;

create index if not exists request_rate_limits_updated_idx
  on public.request_rate_limits (updated_at desc);

create index if not exists wheel_tasks_category_active_idx
  on public.wheel_tasks (category_id, is_active, created_at desc);

update public.game_rounds
set
  status = case
    when coalesce(status, '') in ('open', 'active', 'pending', 'in_progress')
      and resolved_at is null
      and resolution is null
    then 'open'
    else 'resolved'
  end,
  resolution = case
    when resolution in ('completed', 'promised', 'skipped') then resolution
    when status = 'completed' then 'completed'
    when status = 'promised' then 'promised'
    when status = 'skipped' then 'skipped'
    when resolved_at is not null then coalesce(resolution, 'skipped')
    else resolution
  end,
  resolved_at = case
    when
      case
        when coalesce(status, '') in ('open', 'active', 'pending', 'in_progress')
          and resolved_at is null
          and resolution is null
        then 'open'
        else 'resolved'
      end = 'resolved'
    then coalesce(resolved_at, timezone('utc', now()))
    else null
  end,
  resolution_reason = case
    when
      case
        when resolution in ('completed', 'promised', 'skipped') then resolution
        when status = 'completed' then 'completed'
        when status = 'promised' then 'promised'
        when status = 'skipped' then 'skipped'
        when resolved_at is not null then coalesce(resolution, 'skipped')
        else resolution
      end = 'skipped'
    then coalesce(resolution_reason, 'manual_skip')
    when
      case
        when coalesce(status, '') in ('open', 'active', 'pending', 'in_progress')
          and resolved_at is null
          and resolution is null
        then 'open'
        else 'resolved'
      end = 'resolved'
    then coalesce(resolution_reason, 'not_applicable')
    else resolution_reason
  end
where
  status is null
  or status not in ('open', 'resolved')
  or (resolved_at is null and resolution is not null)
  or (resolved_at is not null and resolution is null);

alter table if exists public.game_definitions
  drop constraint if exists game_definitions_status_check;

alter table if exists public.game_definitions
  add constraint game_definitions_status_check
  check (status in ('live', 'comingSoon'));

alter table if exists public.game_sessions
  drop constraint if exists game_sessions_status_check;

alter table if exists public.game_sessions
  add constraint game_sessions_status_check
  check (status in ('active'));

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_status_check;

alter table if exists public.game_rounds
  add constraint game_rounds_status_check
  check (status in ('open', 'resolved'));

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_resolution_check;

alter table if exists public.game_rounds
  add constraint game_rounds_resolution_check
  check (
    resolution is null
    or resolution in ('completed', 'promised', 'skipped')
  );

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_resolution_timestamp_check;

alter table if exists public.game_rounds
  add constraint game_rounds_resolution_timestamp_check
  check (
    (resolved_at is null and resolution is null)
    or (resolved_at is not null and resolution is not null)
  );

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_resolution_reason_check;

alter table if exists public.game_rounds
  add constraint game_rounds_resolution_reason_check
  check (
    resolution_reason is null
    or resolution_reason in ('manual_skip', 'timed_out', 'not_applicable')
  );

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_timer_status_check;

alter table if exists public.game_rounds
  add constraint game_rounds_timer_status_check
  check (
    timer_status in ('none', 'idle', 'running', 'paused', 'done')
  );

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_timer_state_check;

alter table if exists public.game_rounds
  add constraint game_rounds_timer_state_check
  check (
    (timer_status = 'none' and timer_duration_seconds is null and timer_remaining_seconds is null)
    or (
      timer_status <> 'none'
      and timer_duration_seconds is not null
      and timer_duration_seconds > 0
      and timer_remaining_seconds is not null
      and timer_remaining_seconds >= 0
      and timer_remaining_seconds <= timer_duration_seconds
    )
  );

alter table if exists public.activity_events
  drop constraint if exists activity_events_visibility_check;

alter table if exists public.activity_events
  add constraint activity_events_visibility_check
  check (visibility in ('private', 'feed'));

alter table if exists public.realtime_signals
  drop constraint if exists realtime_signals_channel_check;

alter table if exists public.realtime_signals
  add constraint realtime_signals_channel_check
  check (channel in ('live-projector', 'game-leaderboard'));

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_interaction_type_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_interaction_type_check
  check (
    interaction_type in ('confirm', 'text_input', 'timer', 'async_task')
  );

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_response_mode_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_response_mode_check
  check (response_mode in ('confirm', 'text_input', 'choice'));

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_execution_mode_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_execution_mode_check
  check (execution_mode in ('instant', 'timed', 'deferred'));

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_difficulty_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_difficulty_check
  check (difficulty in ('gentle', 'warm', 'bold'));

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_timer_alignment_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_timer_alignment_check
  check (
    (execution_mode = 'timed' and timer_seconds is not null and timer_seconds > 0)
    or (execution_mode <> 'timed' and timer_seconds is null)
  );

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_promise_alignment_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_promise_alignment_check
  check (
    (allow_promise and execution_mode = 'deferred' and promise_xp >= 0)
    or (not allow_promise and promise_xp = 0)
  );

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_early_completion_alignment_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_early_completion_alignment_check
  check (
    execution_mode = 'timed'
    or allow_early_completion = false
  );

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_xp_bounds_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_xp_bounds_check
  check (
    base_xp >= 0
    and promise_xp >= 0
    and skip_penalty_xp <= 0
    and timeout_penalty_xp <= 0
    and timeout_penalty_xp >= skip_penalty_xp
  );

alter table if exists public.wheel_tasks
  drop constraint if exists wheel_tasks_physical_contact_level_check;

alter table if exists public.wheel_tasks
  add constraint wheel_tasks_physical_contact_level_check
  check (physical_contact_level in ('none', 'handshake', 'high_five', 'hug'));

alter table if exists public.player_profiles enable row level security;
alter table if exists public.game_definitions enable row level security;
alter table if exists public.game_sessions enable row level security;
alter table if exists public.game_rounds enable row level security;
alter table if exists public.xp_transactions enable row level security;
alter table if exists public.activity_events enable row level security;
alter table if exists public.realtime_signals enable row level security;
alter table if exists public.request_rate_limits enable row level security;
alter table if exists public.wheel_categories enable row level security;
alter table if exists public.wheel_tasks enable row level security;
alter table if exists public.wheel_round_assignments enable row level security;
alter table if exists public.wheel_player_task_history enable row level security;

drop policy if exists realtime_signals_select_public on public.realtime_signals;

create policy realtime_signals_select_public
on public.realtime_signals
for select
to anon, authenticated
using (channel in ('live-projector', 'game-leaderboard'));

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'realtime_signals'
  ) then
    execute 'alter publication supabase_realtime add table public.realtime_signals';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- advance_wheel_session_cycle
-- ---------------------------------------------------------------------------

create or replace function public.advance_wheel_session_cycle(
  p_session_id uuid,
  p_current_cycle integer
)
returns setof public.game_sessions
language sql
security definer
set search_path = public
as $$
  update public.game_sessions
  set current_cycle = current_cycle + 1
  where id            = p_session_id
    and current_cycle = p_current_cycle
  returning *;
$$;

-- ---------------------------------------------------------------------------

drop function if exists public.consume_rate_limit_window(text, text, integer, integer, timestamptz);

create or replace function public.consume_rate_limit_window(
  p_scope text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer,
  p_now timestamptz
)
returns table (
  allowed boolean,
  current_count integer,
  remaining integer,
  retry_after_seconds integer,
  rate_limit_window_started_at timestamptz
)
language plpgsql
as $$
declare
  v_now timestamptz := coalesce(p_now, timezone('utc', now()));
  v_window_started_at timestamptz;
  v_current_count integer;
begin
  if p_scope is null or btrim(p_scope) = '' then
    raise exception 'rate_limit_scope_required';
  end if;

  if p_identifier is null or btrim(p_identifier) = '' then
    raise exception 'rate_limit_identifier_required';
  end if;

  if p_limit <= 0 then
    raise exception 'rate_limit_limit_invalid';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'rate_limit_window_invalid';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.request_rate_limits (
    scope,
    identifier,
    window_started_at,
    request_count,
    created_at,
    updated_at
  )
  values (
    p_scope,
    p_identifier,
    v_window_started_at,
    1,
    v_now,
    v_now
  )
  on conflict (scope, identifier, window_started_at)
  do update set
    request_count = public.request_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning public.request_rate_limits.request_count
  into v_current_count;

  return query
  select
    v_current_count <= p_limit,
    v_current_count,
    greatest(p_limit - v_current_count, 0),
    greatest(
      ceil(
        extract(
          epoch from (
            v_window_started_at
            + make_interval(secs => p_window_seconds)
            - v_now
          )
        )
      )::integer,
      0
    ),
    v_window_started_at;
end;
$$;

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

revoke all on function public.consume_rate_limit_window(text, text, integer, integer, timestamptz)
from public, anon, authenticated;

grant execute on function public.consume_rate_limit_window(text, text, integer, integer, timestamptz)
to service_role;

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists player_profiles_set_updated_at on public.player_profiles;
drop trigger if exists game_definitions_set_updated_at on public.game_definitions;
drop trigger if exists game_sessions_set_updated_at on public.game_sessions;
drop trigger if exists wheel_categories_set_updated_at on public.wheel_categories;
drop trigger if exists wheel_tasks_set_updated_at on public.wheel_tasks;

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row
execute function public.set_updated_at();

create trigger game_definitions_set_updated_at
before update on public.game_definitions
for each row
execute function public.set_updated_at();

create trigger game_sessions_set_updated_at
before update on public.game_sessions
for each row
execute function public.set_updated_at();

create trigger wheel_categories_set_updated_at
before update on public.wheel_categories
for each row
execute function public.set_updated_at();

create trigger wheel_tasks_set_updated_at
before update on public.wheel_tasks
for each row
execute function public.set_updated_at();

insert into public.game_definitions (
  slug,
  status,
  sort_order,
  live_enabled,
  title_i18n,
  description_i18n
)
values
  (
    'wheel-of-fortune',
    'live',
    1,
    true,
    '{"uk":"Колесо фортуни","en":"Wheel of Fortune"}'::jsonb,
    '{"uk":"Крути колесо та отримуй питання або маленьке веселе завдання.","en":"Spin the wheel to unlock a question or a playful challenge."}'::jsonb
  ),
  (
    'secret-missions',
    'comingSoon',
    2,
    false,
    '{"uk":"Таємні місії","en":"Secret Missions"}'::jsonb,
    '{"uk":"Отримай приховану роль і виконай дружню місію протягом вечора.","en":"Unlock a secret role and complete a friendly mission during the party."}'::jsonb
  ),
  (
    'roast',
    'comingSoon',
    3,
    false,
    '{"uk":"Прожарка молодят","en":"Roast the Couple"}'::jsonb,
    '{"uk":"Заверши фразу так, щоб було дотепно, але по-доброму.","en":"Finish the prompt with a playful line about the couple."}'::jsonb
  ),
  (
    'time-machine',
    'comingSoon',
    4,
    false,
    '{"uk":"Машина часу","en":"Time Machine"}'::jsonb,
    '{"uk":"Голосуй за смішні прогнози про майбутнє Максима і Діани.","en":"Vote on funny predictions about Maksym and Diana''s future."}'::jsonb
  ),
  (
    'advice-booth',
    'comingSoon',
    5,
    false,
    '{"uk":"Порадниця","en":"Advice Booth"}'::jsonb,
    '{"uk":"Поділися короткою порадою для шлюбу або сімейного життя.","en":"Leave a short piece of advice for married life."}'::jsonb
  ),
  (
    'baby-detective',
    'comingSoon',
    6,
    false,
    '{"uk":"Дитячий детектив","en":"Baby Detective"}'::jsonb,
    '{"uk":"Вгадай, кому належить дитяче фото, і познайомся з гостями ближче.","en":"Guess whose childhood photo is on screen and get to know the guests."}'::jsonb
  )
on conflict (slug) do update
set
  status = excluded.status,
  sort_order = excluded.sort_order,
  live_enabled = excluded.live_enabled,
  title_i18n = excluded.title_i18n,
  description_i18n = excluded.description_i18n;

create or replace view public.leaderboard_global_view as
with ordered_xp as (
  select
    x.id,
    x.player_id,
    x.created_at,
    x.delta,
    sum(x.delta) over (
      partition by x.player_id
      order by x.created_at asc, x.id asc
      rows between unbounded preceding and current row
    )::int as running_total
  from public.xp_transactions x
),
player_totals as (
  select
    p.id as player_id,
    p.display_name as nickname,
    p.avatar_key,
    greatest(coalesce(sum(x.delta), 0), 0)::int as total_points,
    max(x.created_at) as last_scored_at,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    p.last_seen_at
  from public.player_profiles p
  left join public.xp_transactions x on x.player_id = p.id
  group by
    p.id,
    p.display_name,
    p.avatar_key,
    p.onboarding_completed,
    p.created_at,
    p.updated_at,
    p.last_seen_at
),
player_reached as (
  select
    totals.player_id,
    min(ordered_xp.created_at) as score_reached_at
  from player_totals totals
  left join ordered_xp
    on ordered_xp.player_id = totals.player_id
   and ordered_xp.running_total >= totals.total_points
  group by totals.player_id
)
select
  totals.player_id,
  totals.nickname,
  totals.avatar_key,
  totals.total_points,
  totals.last_scored_at,
  totals.onboarding_completed,
  totals.created_at,
  totals.updated_at,
  totals.last_seen_at,
  coalesce(player_reached.score_reached_at, totals.created_at) as score_reached_at,
  dense_rank() over (
    order by
      totals.total_points desc,
      coalesce(player_reached.score_reached_at, totals.created_at) asc,
      totals.player_id asc
  )::int as rank
from player_totals totals
left join player_reached on player_reached.player_id = totals.player_id;

create or replace view public.leaderboard_game_view as
with ordered_xp as (
  select
    x.id,
    x.player_id,
    x.game_slug,
    x.created_at,
    x.delta,
    sum(x.delta) over (
      partition by x.player_id, x.game_slug
      order by x.created_at asc, x.id asc
      rows between unbounded preceding and current row
    )::int as running_total
  from public.xp_transactions x
),
player_totals as (
  select
    p.id as player_id,
    x.game_slug,
    p.display_name as nickname,
    p.avatar_key,
    greatest(coalesce(sum(x.delta), 0), 0)::int as total_points,
    max(x.created_at) as last_scored_at,
    p.onboarding_completed
  from public.player_profiles p
  join public.xp_transactions x on x.player_id = p.id
  group by
    p.id,
    x.game_slug,
    p.display_name,
    p.avatar_key,
    p.onboarding_completed
),
player_reached as (
  select
    totals.player_id,
    totals.game_slug,
    min(ordered_xp.created_at) as score_reached_at
  from player_totals totals
  left join ordered_xp
    on ordered_xp.player_id = totals.player_id
   and ordered_xp.game_slug = totals.game_slug
   and ordered_xp.running_total >= totals.total_points
  group by totals.player_id, totals.game_slug
)
select
  totals.player_id,
  totals.game_slug,
  totals.nickname,
  totals.avatar_key,
  totals.total_points,
  totals.last_scored_at,
  totals.onboarding_completed,
  coalesce(player_reached.score_reached_at, totals.last_scored_at) as score_reached_at,
  dense_rank() over (
    partition by totals.game_slug
    order by
      totals.total_points desc,
      coalesce(player_reached.score_reached_at, totals.last_scored_at) asc,
      totals.player_id asc
  )::int as rank
from player_totals totals
left join player_reached
  on player_reached.player_id = totals.player_id
 and player_reached.game_slug = totals.game_slug;

create or replace view public.live_feed_view as
select
  e.id,
  e.session_id,
  e.player_id,
  e.game_slug,
  e.round_id,
  e.event_type,
  e.visibility,
  e.payload,
  e.snapshot_name,
  e.snapshot_avatar_key,
  e.snapshot_prompt_i18n,
  e.snapshot_answer_text,
  e.snapshot_xp_delta,
  case
    when e.event_type in ('wheel.round.promised', 'leaderboard.new_top_player')
    then true
    else false
  end as is_hero_event,
  e.created_at
from public.activity_events e
where e.visibility = 'feed'
order by e.created_at desc;

create or replace view public.leaderboard_view as
select
  player_id,
  nickname,
  avatar_key,
  total_points,
  last_scored_at,
  onboarding_completed,
  created_at,
  updated_at,
  last_seen_at
from public.leaderboard_global_view;

alter view if exists public.leaderboard_global_view
  set (security_invoker = true);

alter view if exists public.leaderboard_game_view
  set (security_invoker = true);

alter view if exists public.live_feed_view
  set (security_invoker = true);

alter view if exists public.leaderboard_view
  set (security_invoker = true);

revoke all on table public.leaderboard_global_view
from public, anon, authenticated;

revoke all on table public.leaderboard_game_view
from public, anon, authenticated;

revoke all on table public.live_feed_view
from public, anon, authenticated;

revoke all on table public.leaderboard_view
from public, anon, authenticated;

grant select on table public.leaderboard_global_view to service_role;
grant select on table public.leaderboard_game_view to service_role;
grant select on table public.live_feed_view to service_role;
grant select on table public.leaderboard_view to service_role;

revoke all on function public.start_wheel_round_atomic(
  uuid,
  uuid,
  timestamptz,
  uuid,
  uuid,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  jsonb,
  jsonb
)
from public, anon, authenticated;

grant execute on function public.start_wheel_round_atomic(
  uuid,
  uuid,
  timestamptz,
  uuid,
  uuid,
  integer,
  integer,
  integer,
  text,
  integer,
  integer,
  jsonb,
  jsonb
)
to service_role;

revoke all on function public.resolve_wheel_round_atomic(
  uuid,
  uuid,
  timestamptz,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  jsonb,
  jsonb,
  text,
  integer,
  jsonb,
  jsonb,
  jsonb
)
from public, anon, authenticated;

grant execute on function public.resolve_wheel_round_atomic(
  uuid,
  uuid,
  timestamptz,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  jsonb,
  jsonb,
  text,
  integer,
  jsonb,
  jsonb,
  jsonb
)
to service_role;

comment on table public.realtime_signals is
  'Public-safe realtime invalidation layer. Carries only lightweight signals, not feed or leaderboard business data.';

comment on table public.request_rate_limits is
  'Fixed-window request limiter state for public mutation routes.';

comment on view public.leaderboard_global_view is
  'Canonical global leaderboard read model.';

comment on view public.leaderboard_game_view is
  'Canonical per-game leaderboard read model.';

comment on view public.live_feed_view is
  'Canonical projector/live feed read model.';

comment on view public.leaderboard_view is
  'Compatibility alias for legacy global leaderboard consumers. Prefer leaderboard_global_view in new code.';
