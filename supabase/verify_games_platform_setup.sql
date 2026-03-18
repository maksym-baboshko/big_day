-- Verify the current games platform setup after applying schema / seed / reset.
-- This script is read-only.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'player_profiles',
    'game_definitions',
    'game_sessions',
    'game_rounds',
    'xp_transactions',
    'activity_events',
    'realtime_signals',
    'request_rate_limits',
    'wheel_categories',
    'wheel_tasks',
    'wheel_round_assignments',
    'wheel_player_task_history'
  )
order by c.relname;

select
  c.relname as view_name,
  coalesce(c.reloptions, array[]::text[]) as reloptions,
  has_table_privilege('anon', format('public.%I', c.relname), 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', format('public.%I', c.relname), 'SELECT') as authenticated_can_select,
  has_table_privilege('service_role', format('public.%I', c.relname), 'SELECT') as service_role_can_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in (
    'leaderboard_global_view',
    'leaderboard_game_view',
    'leaderboard_view',
    'live_feed_view'
  )
order by c.relname;

select
  count(*) filter (where is_active) as active_categories,
  count(*) as total_categories
from public.wheel_categories;

select
  count(*) filter (where is_active) as active_tasks,
  count(*) as total_tasks
from public.wheel_tasks;

select count(*) as game_definitions_total
from public.game_definitions;

select
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'realtime_signals'
      and policyname = 'realtime_signals_select_public'
  ) as realtime_signals_public_policy;

select
  exists(
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'realtime_signals'
  ) as realtime_signals_in_publication;

select
  has_function_privilege(
    'anon',
    'public.start_wheel_round_atomic(uuid, uuid, timestamptz, uuid, uuid, integer, integer, integer, text, integer, integer, jsonb, jsonb)',
    'EXECUTE'
  ) as anon_can_execute_start_wheel_round_atomic,
  has_function_privilege(
    'authenticated',
    'public.start_wheel_round_atomic(uuid, uuid, timestamptz, uuid, uuid, integer, integer, integer, text, integer, integer, jsonb, jsonb)',
    'EXECUTE'
  ) as authenticated_can_execute_start_wheel_round_atomic,
  has_function_privilege(
    'service_role',
    'public.start_wheel_round_atomic(uuid, uuid, timestamptz, uuid, uuid, integer, integer, integer, text, integer, integer, jsonb, jsonb)',
    'EXECUTE'
  ) as service_role_can_execute_start_wheel_round_atomic,
  has_function_privilege(
    'anon',
    'public.resolve_wheel_round_atomic(uuid, uuid, timestamptz, text, text, text, integer, integer, timestamptz, timestamptz, jsonb, jsonb, text, integer, jsonb, jsonb, jsonb)',
    'EXECUTE'
  ) as anon_can_execute_resolve_wheel_round_atomic,
  has_function_privilege(
    'authenticated',
    'public.resolve_wheel_round_atomic(uuid, uuid, timestamptz, text, text, text, integer, integer, timestamptz, timestamptz, jsonb, jsonb, text, integer, jsonb, jsonb, jsonb)',
    'EXECUTE'
  ) as authenticated_can_execute_resolve_wheel_round_atomic,
  has_function_privilege(
    'service_role',
    'public.resolve_wheel_round_atomic(uuid, uuid, timestamptz, text, text, text, integer, integer, timestamptz, timestamptz, jsonb, jsonb, text, integer, jsonb, jsonb, jsonb)',
    'EXECUTE'
  ) as service_role_can_execute_resolve_wheel_round_atomic,
  has_function_privilege(
    'anon',
    'public.consume_rate_limit_window(text, text, integer, integer, timestamptz)',
    'EXECUTE'
  ) as anon_can_execute_consume_rate_limit_window,
  has_function_privilege(
    'authenticated',
    'public.consume_rate_limit_window(text, text, integer, integer, timestamptz)',
    'EXECUTE'
  ) as authenticated_can_execute_consume_rate_limit_window,
  has_function_privilege(
    'service_role',
    'public.consume_rate_limit_window(text, text, integer, integer, timestamptz)',
    'EXECUTE'
  ) as service_role_can_execute_consume_rate_limit_window;

select
  'player_profiles' as runtime_table,
  count(*)::bigint as row_count
from public.player_profiles
union all
select 'game_sessions', count(*)::bigint from public.game_sessions
union all
select 'game_rounds', count(*)::bigint from public.game_rounds
union all
select 'xp_transactions', count(*)::bigint from public.xp_transactions
union all
select 'activity_events', count(*)::bigint from public.activity_events
union all
select 'realtime_signals', count(*)::bigint from public.realtime_signals
union all
select 'request_rate_limits', count(*)::bigint from public.request_rate_limits
order by runtime_table;
