-- Legacy schema snapshot.
-- Do not apply this file to new or current setups.
-- Use `supabase/games_platform_schema.sql` instead.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  client_session_id uuid not null unique,
  nickname text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_submissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  game_slug text not null,
  submission_type text not null,
  prompt_key text,
  text_value text,
  choice_value text,
  is_correct boolean,
  live_eligible boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  points integer not null check (points >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists game_submissions_player_created_idx
  on public.game_submissions (player_id, created_at desc);

create index if not exists game_submissions_game_created_idx
  on public.game_submissions (game_slug, created_at desc);

create index if not exists points_ledger_player_created_idx
  on public.points_ledger (player_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;

create trigger players_set_updated_at
before update on public.players
for each row
execute function public.set_updated_at();

create or replace view public.leaderboard_view as
select
  p.id as player_id,
  p.client_session_id,
  p.nickname,
  coalesce(sum(pl.points), 0)::int as total_points,
  max(pl.created_at) as last_scored_at,
  p.created_at,
  p.updated_at
from public.players p
left join public.points_ledger pl on pl.player_id = p.id
group by p.id, p.client_session_id, p.nickname, p.created_at, p.updated_at;
