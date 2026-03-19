# Big Day — Wedding Invitation + Games Site

Wedding website for Maksym & Diana.
Date: June 28, 2026.
Venue: Grand Hotel Terminus, Bergen, Norway.

> Keep `AGENTS.md` and `CLAUDE.md` aligned.
> If a local `GEMINI.md` exists, keep that one aligned too.

This repository contains:

- the invitation site at `/` and `/en`
- personalized invite pages at `/invite/[slug]`
- the games hub at `/games`
- the live wheel game at `/games/wheel-of-fortune`
- the projector/live feed page at `/live`
- server APIs for RSVP, games, and live snapshots

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + CSS variables |
| Animation | Framer Motion 12 |
| i18n | next-intl 4 |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Backend services | Supabase + Resend |
| Utilities | clsx + tailwind-merge via `cn()` |

---

## Project Structure

FSD-inspired, with route composition in `app/`, interactive flows in `features/`, shared primitives in `shared/`, and page/section composition in `widgets/`.

```text
src/
├── app/
│   ├── [locale]/                 # invitation, invite, games, live pages
│   └── api/                      # rsvp, live, games APIs
├── features/
│   ├── countdown/
│   ├── game-session/             # auth, local cache, shared contracts, server repository
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── wheel-of-fortune/         # WheelOfFortuneGame + extracted subcomponents
│       ├── WheelOfFortuneGame.tsx
│       ├── WheelChallengeOverlay.tsx
│       ├── WheelLeaderboardCard.tsx
│       ├── ConfettiPop.tsx
│       └── wheel-helpers.ts      # shared constants, types, pure helpers
├── shared/
│   ├── config/                   # wedding data, guests, game catalog, wheel content, metadata helpers
│   ├── i18n/
│   ├── lib/
│   │   └── server/               # server-only utilities
│   │       ├── deferred.ts       # after() + runDeferredTasks for Vercel serverless
│   │       ├── game-api-error-handler.ts  # centralized error → HTTP response mapping
│   │       ├── csp.ts
│   │       └── rate-limit.ts
│   └── ui/
└── widgets/
    ├── invitation-page/
    ├── personal-invitation/
    ├── games-hub/
    ├── games-hero/
    ├── games-shell/
    ├── games-wheel-page/
    ├── live-projector/            # decomposed projector page
    │   ├── LiveProjectorPage.tsx  # composition root
    │   ├── LiveClock.tsx
    │   ├── FeedEventCard.tsx
    │   ├── LeaderboardRow.tsx
    │   ├── HeroEventOverlay.tsx
    │   ├── live-projector-helpers.ts
    │   └── useLiveProjectorSnapshot.ts
    ├── navbar/
    ├── not-found-page/
    └── invitation sections
```

There is still no dedicated `entities/` layer. Keep the current structure unless a change clearly needs a reusable domain module rather than a feature- or shared-level abstraction.

Barrel exports are already used across the repo. Prefer importing from the barrel when one exists.

---

## Product Notes

### Invitation and RSVP

- `/` and `/en` render the full invitation page
- `/invite/[slug]` renders guest-specific copy and seat count
- personalized invite pages prefill RSVP defaults from the guest entry
- `src/app/api/rsvp/route.ts` is implemented and uses `rsvpSchema`
- the RSVP API rate-limits submissions, uses a honeypot `website` field, and sends via Resend or `mock` mode

Current RSVP payload shape:

- `guestNames: string[]`
- `attending: "yes" | "no"`
- `guests: number`
- `dietary?: string`
- `message?: string`
- `website?: string`

### Games platform

- `/games` is the public hub
- only `wheel-of-fortune` is currently playable
- other games remain catalog entries with `comingSoon` status in `src/shared/config/games.ts`
- browser auth/session bootstrap lives in `src/features/game-session/auth-client.ts`
- backend state remains authoritative; game logic and persistence live in `src/features/game-session/server`
- timer remaining seconds are computed server-side in `repository-helpers.ts` — clients cannot influence resolution outcome
- post-response work (broadcast, logging, realtime signals) uses deferred tasks via Next.js `after()` to guarantee execution on Vercel serverless
- all game API routes use a centralized error handler (`handleGameApiError`) for consistent error → HTTP response mapping

### Live projector

- `/live` reads from `/api/live`
- the client receives live updates via Supabase Broadcast (WebSocket) with 30s polling as fallback in `widgets/live-projector/useLiveProjectorSnapshot.ts`
- hero event deduplication uses a sliding window (200 IDs) to prevent unbounded memory growth during long sessions
- the page is intended for projector/live usage and is marked `noindex`

---

## Shared Config, UI, and Styling

`@/shared/config` is the source of truth for wedding data, guest data, game catalog, wheel content, and metadata helpers.

- always import `WEDDING_DATE` from `@/shared/config`
- do not duplicate `VENUE`, `COUPLE`, `DRESS_CODE`, guests, or metadata data in route files or widgets

Current reusable UI primitives in `src/shared/ui`:

- `SectionWrapper`
- `SectionHeading`
- `AnimatedReveal`
- `Ornament`
- `Button`
- `Input`
- `Textarea`

Styling rules:

- colors should go through CSS variables defined in `src/app/globals.css`
- prefer Tailwind classes backed by those variables such as `bg-bg-primary`, `text-text-primary`, `text-accent`
- avoid hardcoded colors in components except intentional config/email/SVG cases
- headings use `heading-serif` or `heading-serif-italic`
- numerals and formal labels use `font-cinzel`
- default motion curve is `[0.22, 1, 0.36, 1]`

---

## Internationalization

- default locale is `uk`
- English uses `/en`
- messages live in `src/shared/i18n/messages/uk.json` and `en.json`
- client navigation must use `@/shared/i18n/navigation`
- new message keys must be added to both locale files with identical structure

---

## Hydration-Sensitive Code

Do not casually refactor these pieces:

- `features/countdown/Countdown.tsx`
- `widgets/splash/Splash.tsx`
- `features/language-switcher/LanguageSwitcher.tsx`
- `features/theme-switcher/ThemeProvider.tsx`
- `widgets/live-projector/useLiveProjectorSnapshot.ts`

These pieces intentionally use hydration-safe patterns such as `useSyncExternalStore`, staged mount logic, and mixed polling/realtime invalidation.

---

## Supabase and Migrations

Required runtime env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Supported fallbacks still exist in code for older setups:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

Supabase CLI workflow on this machine:

```bash
SUPABASE_DB_PASSWORD=
```

`SUPABASE_DB_PASSWORD` is local-only. Do not commit it.

Useful Supabase files:

- `supabase/games_platform_schema.sql`
- `supabase/migrations/*.sql`
- `supabase/config.toml`
- `supabase/seed_wheel_content.sql`
- `supabase/reset_runtime_data.sql`
- `supabase/verify_games_platform_setup.sql`
- `supabase/games_hub_schema.sql` is legacy and should not be applied to the current setup

Migration rules:

- `supabase/games_platform_schema.sql` is the baseline schema snapshot
- incremental database changes go into `supabase/migrations/*.sql`
- when schema changes, update both the baseline snapshot and add a new migration in the same change
- applied migrations stay committed in the repo; do not delete them after pushing
- prefer the repo-local CLI via `pnpm exec supabase` or the `pnpm supabase:*` scripts
- if Supabase CLI is authenticated and local `SUPABASE_DB_PASSWORD` is set, the agent may link the project and run remote migration commands without extra product-level setup
- if CLI auth expires or the database password changes, re-auth/link may be needed

---

## Server Patterns

### Deferred tasks

On Vercel serverless, the runtime may shut down immediately after the response is sent. Fire-and-forget (`void asyncFn()`) is unreliable. All post-response work must go through the deferred tasks pattern:

1. Repository methods return `{ data, deferredTasks: DeferredTask[] }`
2. Route handlers call `after(() => runDeferredTasks(tasks))` after sending the response
3. `runDeferredTasks` uses `Promise.allSettled` so one failure does not block others

This applies to: broadcast signals, activity logging, leaderboard notifications, and live snapshot pushes.

### Centralized error handling

Game API routes use `handleGameApiError()` from `@/shared/lib/server` instead of per-route `instanceof` chains. When adding a new error class, register it in `game-api-error-handler.ts` once.

### Server-side timer computation

`computeServerRemainingSeconds()` in `repository-helpers.ts` calculates the remaining time from `timer_last_started_at` and `timer_remaining_seconds`. Clients never submit remaining seconds for round resolution.

---

## Key Rules

- Never hardcode the wedding date; import `WEDDING_DATE`
- Keep locale message files in sync
- Prefer server components by default
- Keep invite and games route metadata localized
- Use existing barrel exports when they exist
- Treat `/invite/[slug]` and `/live` as intentionally non-indexed surfaces
- Do not remove the current hydration-safe patterns in countdown, splash, language switcher, theme provider, or live snapshot refresh
- Do not replace the server-authoritative wheel flow with client-side randomness or client-side score authority
- Use the deferred tasks pattern for any post-response async work in API routes — never `void asyncFn()`
- Register new game error types in `game-api-error-handler.ts` rather than adding `instanceof` checks in route files

---

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm smoke:games
pnpm generate:wheel-content-seed
pnpm supabase:login
pnpm supabase:link
pnpm supabase:db:push
pnpm supabase:migration:new
pnpm exec supabase db push --linked --dry-run
```
