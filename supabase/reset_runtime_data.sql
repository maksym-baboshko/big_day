begin;

-- Destructive script.
-- Confirm before running this file in one of two ways:
--
-- 1. Replace the confirmation token below:
--      __CONFIRM_RESET_RUNTIME_DATA__ -> yes
--
-- 2. Or prepend this in the same SQL batch:
--      set local app.reset_runtime_data_confirm = 'yes';
--
-- Without that explicit confirmation the script will abort before touching data.

do $$
begin
  if current_setting('app.reset_runtime_data_confirm', true) is null then
    perform set_config(
      'app.reset_runtime_data_confirm',
      '__CONFIRM_RESET_RUNTIME_DATA__',
      true
    );
  end if;

  if current_setting('app.reset_runtime_data_confirm', true) is distinct from 'yes' then
    raise exception using
      errcode = 'P0001',
      message = 'reset_runtime_data.sql is destructive. Replace `__CONFIRM_RESET_RUNTIME_DATA__` with `yes` or run `set local app.reset_runtime_data_confirm = ''yes'';` in the same query batch to confirm.';
  end if;
end;
$$;

-- Preserve platform structure and content:
-- - public.game_definitions
-- - public.wheel_categories
-- - public.wheel_tasks
-- - all derived leaderboard/feed views
--
-- Reset only runtime/user data so the games behave like a fresh event.

truncate table
  public.request_rate_limits,
  public.realtime_signals,
  public.activity_events,
  public.xp_transactions,
  public.wheel_player_task_history,
  public.wheel_round_assignments,
  public.game_rounds,
  public.game_sessions
restart identity cascade;

-- Remove all app-level player records.
delete from public.player_profiles;

-- Remove Supabase Auth anonymous users.
delete from auth.users
where is_anonymous is true;

commit;
