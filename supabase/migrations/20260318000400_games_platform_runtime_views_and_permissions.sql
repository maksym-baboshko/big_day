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
