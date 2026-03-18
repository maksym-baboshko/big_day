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

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  game_slug text not null references public.game_definitions(slug),
  status text not null,
  started_at timestamptz not null default timezone('utc', now()),
  timer_started_at timestamptz,
  timer_deadline_at timestamptz,
  resolved_at timestamptz,
  resolution text,
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
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.player_profiles(id) on delete set null,
  game_slug text not null references public.game_definitions(slug),
  round_id uuid references public.game_rounds(id) on delete set null,
  event_type text not null,
  visibility text not null default 'private',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
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
  timer_seconds integer,
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
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wheel_player_task_history (
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  task_id uuid not null references public.wheel_tasks(id) on delete cascade,
  first_round_id uuid not null references public.game_rounds(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (player_id, task_id)
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

alter table if exists public.game_rounds
  add column if not exists timer_started_at timestamptz;

alter table if exists public.game_rounds
  add column if not exists timer_deadline_at timestamptz;

create index if not exists player_profiles_onboarding_idx
  on public.player_profiles (onboarding_completed, updated_at desc);

create index if not exists game_rounds_player_started_idx
  on public.game_rounds (player_id, started_at desc);

create index if not exists game_rounds_game_started_idx
  on public.game_rounds (game_slug, started_at desc);

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

create index if not exists wheel_tasks_category_active_idx
  on public.wheel_tasks (category_id, is_active, created_at desc);

alter table if exists public.game_definitions
  drop constraint if exists game_definitions_status_check;

alter table if exists public.game_definitions
  add constraint game_definitions_status_check
  check (status in ('live', 'comingSoon'));

alter table if exists public.game_rounds
  drop constraint if exists game_rounds_status_check;

alter table if exists public.game_rounds
  add constraint game_rounds_status_check
  check (status in ('assigned', 'completed'));

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
  drop constraint if exists game_rounds_timer_window_check;

alter table if exists public.game_rounds
  add constraint game_rounds_timer_window_check
  check (
    (timer_started_at is null and timer_deadline_at is null)
    or (
      timer_started_at is not null
      and timer_deadline_at is not null
      and timer_deadline_at > timer_started_at
    )
  );

alter table if exists public.activity_events
  drop constraint if exists activity_events_visibility_check;

alter table if exists public.activity_events
  add constraint activity_events_visibility_check
  check (visibility in ('private', 'feed'));

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
  check (response_mode in ('confirm', 'text_input'));

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
  );

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

create or replace view public.leaderboard_view as
select
  p.id as player_id,
  p.display_name as nickname,
  p.avatar_key,
  coalesce(sum(x.delta), 0)::int as total_points,
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
  p.last_seen_at;
