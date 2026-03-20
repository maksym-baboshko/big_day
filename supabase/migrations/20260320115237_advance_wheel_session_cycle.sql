-- Atomic wheel session cycle advance with optimistic concurrency control.
--
-- Increments current_cycle by 1 only when the caller's snapshot is still current
-- (i.e. current_cycle = p_current_cycle). Returns the updated row on success, or
-- no rows if another concurrent request already advanced the counter.
--
-- This replaces the previous pattern of a plain UPDATE with a fixed computed value,
-- which was vulnerable to a stale-read window at cycle boundaries: two concurrent
-- startWheelRound requests both reading the same exhausted cycle N would both issue
-- UPDATE … SET current_cycle = N+1, silently overwriting each other.
--
-- With the optimistic lock the losing request receives 0 rows and re-queries the
-- fresh session state, guaranteeing both requests see the correct cycle.

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
