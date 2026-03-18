# Wedding Games Platform Redesign

Status: draft  
Scope: redesign the current wheel game into a mobile-first wedding game platform foundation.

## Stage 1. Current-State Analysis

### What exists today

- The current wheel is a client-side minigame with 8 fixed sectors stored in `src/shared/config/games.ts`.
- The winning sector is chosen in the browser with `Math.random()` inside `src/features/wheel-of-fortune/WheelOfFortuneGame.tsx`.
- The server only persists the final spin result and awarded points through `POST /api/games/wheel`.
- Player identity is not based on Supabase auth. It is a locally generated `clientSessionId` stored in local storage by `src/features/game-session/usePlayerSession.ts`.
- The Supabase schema only contains `players`, `game_submissions`, `points_ledger`, and `leaderboard_view`.
- The `/live` route is a placeholder and has no real activity pipeline.

### Why the current model must be replaced

- Client-side randomness cannot enforce per-player no-repeat rules.
- Hardcoded sectors do not match the new 10-category content model.
- There is no task lifecycle: no assigned round, no completion state, no skip state, no promise state.
- There is no event history suitable for a live projector feed.
- XP is too narrow. It only reflects one wheel spin instead of a shared platform-wide progression.
- The current schema is generic in the wrong place and too thin in the places that matter now.

### Baseline conclusion

This is not a refactor of the current wheel. It is a new runtime model that should replace the current `wheel-of-fortune` logic while preserving only the surrounding shell, styling language, and routing surface where useful.

## Stage 2. New Product Model

### Product principles

- The game must be server-authoritative.
- The phone experience must stay fast: one primary action per screen.
- The wheel is a category selector, not the content source.
- XP is global across all wedding games.
- Every meaningful action becomes an event.
- Wheel-specific content should be specialized; shared platform behavior should be reusable.

### Core platform entities

1. `auth identity`
   - A Supabase anonymous auth user created on first entry.
   - This is the technical identity for the device session.

2. `player profile`
   - Human-facing profile linked to the auth identity.
   - Stores username, avatar, locale, timestamps, and summary stats.

3. `game definition`
   - Shared catalog entry for each game in the wedding platform.
   - Provides status, ordering, and live-feed visibility settings.

4. `game round`
   - One atomic play attempt.
   - For the wheel: one spin that assigns one category and one task.

5. `wheel category`
   - One of the 10 category wedges on the wheel.
   - Used for visual wheel mapping and content grouping.

6. `wheel task`
   - A content item that can be assigned after a category is selected.
   - Carries response type, XP settings, and display text.

7. `xp transaction`
   - Append-only ledger entry with signed XP delta.
   - Used for totals, leaderboards, and animation payloads.

8. `activity event`
   - Append-only event stream for feed, history, analytics, and future games.

### Architectural decision

The project now has real shared domain models. This is the point where adding an `entities/` layer becomes justified.

Recommended new cross-cutting modules:

- `src/entities/player`
- `src/entities/game-round`
- `src/entities/xp`
- `src/entities/activity`

Wheel-specific behavior stays in features and widgets:

- `src/features/player-onboarding`
- `src/features/wheel-spin`
- `src/features/wheel-challenge`
- `src/widgets/live-feed`

## Stage 3. Core Game Flows

### Flow A. Entry and identity bootstrap

1. User opens `/games/wheel-of-fortune`.
2. Browser creates or restores a Supabase anonymous auth session.
3. Server upserts a `player_profile` for that auth user.
4. If profile is incomplete, the user sees onboarding.
5. User enters a username.
6. Server assigns a random avatar from a controlled avatar set.
7. Client receives a hydrated player snapshot.

Decision:
- The auth user is the source of truth.
- Local storage can cache UI state, but not identity authority.

### Flow B. Spin and task assignment

1. User taps `Spin`.
2. Client calls a server endpoint, not a client-side randomizer.
3. Server selects a category from the 10 wheel categories.
4. Server selects one unseen task from that category for the player.
5. Server creates a `game_round`.
6. Server emits assignment events.
7. Client animates the wheel toward the returned category.
8. Client opens the fullscreen challenge overlay with the assigned task.

Decision:
- The server must choose both category and task.
- Assignment must be transactional to prevent duplicate task assignment under rapid taps or retry races.

### Flow C. Challenge resolution

Supported task interaction types:

- `text_input`
- `confirm`
- `timer`
- `async_task`

Allowed outcomes:

- `completed`
- `skipped`
- `promised`

Resolution rules:

1. Client submits the round outcome.
2. Server validates that the round is still open.
3. Server stores the response payload.
4. Server writes the XP transaction.
5. Server writes activity events.
6. Server returns the updated player totals and XP animation payload.

Decision:
- A round can be resolved exactly once.
- `promised` is a first-class outcome, not a fake completion.

### Flow D. Projector live feed

The projector should read from activity, not directly from raw round tables.

Feed blocks:

- top players
- latest actions
- latest XP events
- active-now pulse

Decision:
- The live screen should subscribe to a curated event stream or view.
- The feed must hide private payloads and only display event-safe text.

## Stage 4. Supabase Data Model

### Shared tables

#### `player_profiles`

- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `display_name_normalized text not null`
- `avatar_key text not null`
- `locale text not null default 'uk'`
- `onboarding_completed boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `last_seen_at timestamptz not null`

Purpose:
- canonical player record for every anonymous or future upgraded user.

#### `game_definitions`

- `slug text primary key`
- `status text not null`
- `sort_order integer not null`
- `live_enabled boolean not null default false`
- `title_i18n jsonb not null`
- `description_i18n jsonb not null`

Purpose:
- one place to manage which games are active and projector-visible.

#### `game_rounds`

- `id uuid primary key`
- `player_id uuid not null references player_profiles(id)`
- `game_slug text not null references game_definitions(slug)`
- `status text not null`
- `started_at timestamptz not null`
- `resolved_at timestamptz`
- `resolution text`
- `response_payload jsonb not null default '{}'::jsonb`
- `metadata jsonb not null default '{}'::jsonb`

Purpose:
- shared runtime record for one play attempt.

#### `xp_transactions`

- `id uuid primary key`
- `player_id uuid not null references player_profiles(id)`
- `game_slug text not null references game_definitions(slug)`
- `round_id uuid references game_rounds(id)`
- `reason text not null`
- `delta integer not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

Purpose:
- append-only XP ledger across all games.

#### `activity_events`

- `id uuid primary key`
- `player_id uuid references player_profiles(id)`
- `game_slug text not null references game_definitions(slug)`
- `round_id uuid references game_rounds(id)`
- `event_type text not null`
- `visibility text not null`
- `payload jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

Purpose:
- append-only history and projector feed source.

### Wheel-specific tables

#### `wheel_categories`

- `id uuid primary key`
- `slug text not null unique`
- `sort_order integer not null unique`
- `weight integer not null default 1`
- `title_i18n jsonb not null`
- `description_i18n jsonb not null`
- `is_active boolean not null default true`

Purpose:
- defines the 10 wheel wedges and their ordering.

#### `wheel_tasks`

- `id uuid primary key`
- `category_id uuid not null references wheel_categories(id)`
- `task_key text not null unique`
- `interaction_type text not null`
- `difficulty text not null`
- `prompt_i18n jsonb not null`
- `details_i18n jsonb not null default '{}'::jsonb`
- `base_xp integer not null`
- `promise_xp integer not null`
- `skip_penalty_xp integer not null`
- `timer_seconds integer`
- `is_active boolean not null default true`
- `metadata jsonb not null default '{}'::jsonb`

Purpose:
- source of the 200 tasks and their mechanics.

#### `wheel_round_assignments`

- `round_id uuid primary key references game_rounds(id) on delete cascade`
- `category_id uuid not null references wheel_categories(id)`
- `task_id uuid not null references wheel_tasks(id)`
- `spin_angle integer not null`

Purpose:
- wheel-specific extension data for a shared round.

#### `wheel_player_task_history`

- `player_id uuid not null references player_profiles(id)`
- `task_id uuid not null references wheel_tasks(id)`
- `first_round_id uuid not null references game_rounds(id)`
- `created_at timestamptz not null`
- `primary key (player_id, task_id)`

Purpose:
- enforces no-repeat tasks per player.

### Derived views

- `player_xp_totals`
- `leaderboard_view`
- `live_feed_view`

### Required database functions

#### `bootstrap_player_profile()`

Responsibilities:

- create or restore the anonymous auth-linked profile
- assign default avatar if missing
- return the current player snapshot

#### `start_wheel_round()`

Responsibilities:

- find categories with remaining unseen tasks for the player
- select one category
- select one unseen task in that category
- insert the shared round
- insert the wheel assignment row
- insert the player-task history row
- emit assignment activity events
- return the round payload for the client

#### `resolve_wheel_round()`

Responsibilities:

- validate round ownership and open status
- update round resolution and response payload
- insert XP transaction
- emit activity events
- return updated player totals and live event payload

Decision:
- Supabase RPC is the right place for transactional assignment and resolution.
- The current multi-call repository pattern is not enough for no-repeat and ledger consistency.

### RLS direction

- Players can read and update only their own profile.
- Players can read only their own rounds and XP history.
- Public projector consumers can read only curated live-feed views.
- Service role remains available for admin tools and seeding.

## Stage 5. XP System

### XP goals

- reward participation more than performance theater
- keep choices meaningful without punishing shy guests too hard
- make the leaderboard move often enough to feel alive
- support six games with one total XP number

### Proposed base values

Difficulty bands:

- `gentle` = 12 XP
- `warm` = 18 XP
- `bold` = 26 XP

Interaction modifiers:

- `text_input` = +4 XP
- `timer` success bonus = +6 XP
- `async_task` has no completion bonus, but supports promise mode cleanly

Outcome rules:

- `completed` = `base_xp + interaction_modifier`
- `promised` = configured `promise_xp`, usually 35% to 45% of full value
- `skipped` = configured penalty, default `-6 XP`

Guardrails:

- total XP cannot drop below 0
- one round produces at most one XP transaction
- admin adjustments use a separate reason code

### Why this balance works

- Completion feels rewarding even for short tasks.
- Skip carries a cost, but not enough to make the game stressful.
- Promise mode remains useful for longer tasks without matching full completion value.
- Content authors can tune difficulty per task without changing core logic.

## Stage 6. Content System for 200 Tasks

### Category list

1. Treasure of Memories
2. Improvisation
3. Honest or Action
4. Stream of Kind Words
5. Find the Truth
6. Joyful Dilemma
7. Similar or Different
8. Small Challenge
9. Wisdom for the Day
10. In Their Style

### Content rules

- warm, clean, and socially safe
- no cringe
- no dancing tasks
- no toast prompts
- Christian-friendly tone
- fast to understand on a phone
- safe to do in a wedding hall without host intervention

### Content mix target per category

- 8 `confirm`
- 6 `text_input`
- 4 `timer`
- 2 `async_task`

Reason:
- most tasks should stay one-tap or one-input
- enough variety exists without slowing down the queue

### Storage decision

The 200 tasks should be seeded into `wheel_tasks`, not hardcoded into the wheel component.

Recommended source files:

- `supabase/seed_wheel_categories.sql`
- `supabase/seed_wheel_tasks.sql`

Alternative if content authoring in TypeScript is preferred:

- `src/shared/config/wheel-content/`
- a dedicated seed script that writes into Supabase

## Stage 7. Implementation Plan

### Slice 1. Platform foundation

- add browser Supabase client support for anonymous auth
- introduce `entities/` for player, round, XP, activity
- add new Supabase schema and RPC functions
- replace `clientSessionId` identity with auth-linked player bootstrap

### Slice 2. Wheel runtime

- replace fixed-sector config with 10 categories
- move randomness to the server
- build fullscreen challenge overlay and resolution flows
- add no-repeat enforcement

### Slice 3. XP and history

- switch totals to the new ledger
- add recent history for the player
- add XP event payloads for UI animation

### Slice 4. Live projector

- replace placeholder `/live`
- subscribe to leaderboard and activity updates
- add event-safe feed cards and XP bursts

### Slice 5. Content seeding

- seed 10 categories
- seed 200 wheel tasks
- validate balance by category, type, and XP distribution

## Immediate next implementation slice

The first code slice should not touch the visual wheel yet.

It should do only this:

1. Introduce anonymous Supabase auth bootstrap.
2. Add the new shared schema and RPC contracts.
3. Create a new player snapshot API based on `player_profiles`.
4. Keep the current UI shell, but move it onto the new identity model.

Reason:
- every later step depends on identity, transactional round creation, and the new ledger.
- changing the wheel UI first would only create rework.
