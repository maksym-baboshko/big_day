# Big Day

Big Day is a bilingual wedding website for Maksym and Diana with a built-in games platform.

## Public surface

- `/` and `/en`: main invitation page
- `/invite/[slug]`: personalized invitation pages with guest-specific copy and RSVP defaults
- `/games`: games hub
- `/games/wheel-of-fortune`: live game
- `/live`: projector-style live leaderboard and activity feed

## What is implemented

- Ukrainian and English locales via `next-intl`
- light and dark themes
- hydration-safe splash, countdown, and language/theme controls
- invitation sections: story, timeline, venue, dress code, gifts, RSVP
- personalized invitation pages backed by `src/shared/config/guests.ts`
- RSVP API with `zod` validation, honeypot field, rate limiting, and Resend or `mock` email delivery
- Supabase-backed anonymous auth for games
- player onboarding, leaderboard, live feed, and wheel round lifecycle
- server-authoritative timer and score computation
- deferred task execution via Next.js `after()` for reliable post-response work on Vercel serverless
- projector page with Supabase Broadcast (WebSocket) live updates and polling fallback
- rate limiting on every game API endpoint (GET and POST) per authenticated user

## Tech stack

- Next.js 16 App Router
- TypeScript 5 (strict mode)
- Tailwind CSS v4
- Framer Motion 12
- next-intl 4
- react-hook-form + zod
- Supabase
- Resend

## Environment variables

### Base site URL

Used for metadata, sitemap, and robots:

```bash
NEXT_PUBLIC_SITE_URL=
SITE_URL=
```

If neither is set, the app falls back to `http://localhost:3000`. On Vercel it also accepts `VERCEL_PROJECT_PRODUCTION_URL`.

### RSVP email delivery

```bash
RESEND_API_KEY=
RSVP_TO_EMAILS=
RSVP_FROM_EMAIL=
RSVP_SUBJECT_PREFIX=
RSVP_DELIVERY_MODE=
```

Notes:

- `RSVP_TO_EMAILS` accepts comma- or semicolon-separated addresses
- `RSVP_DELIVERY_MODE=mock` logs the email payload instead of sending it
- non-mock mode requires both `RESEND_API_KEY` and `RSVP_TO_EMAILS`

### Games runtime

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

The code also accepts legacy fallbacks:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

### Supabase CLI workflow

Optional, only if you want to manage remote schema changes from this repo:

```bash
SUPABASE_DB_PASSWORD=
```

Do not commit this value.

## Local setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For invitation-only work, that is enough.

For games and live features, configure the Supabase runtime env vars above.

## Database workflow

This repo keeps both a baseline schema snapshot and incremental migrations:

- `supabase/games_platform_schema.sql`: current baseline schema snapshot
- `supabase/migrations/*.sql`: incremental changes to apply on top
- `supabase/games_hub_schema.sql`: legacy snapshot, do not apply to the current setup
- `src/features/game-session/server/supabase-types.generated.ts`: committed DB type surface
- `src/features/game-session/server/supabase-types.generated.meta.json`: schema fingerprint for drift checks

When changing the database:

- add a new migration under `supabase/migrations/`
- update `supabase/games_platform_schema.sql` in the same change
- refresh generated types with `pnpm supabase:types:generate -- --local` or `--linked`
- keep applied migrations committed in the repo

Typical CLI flow:

```bash
pnpm supabase:login
pnpm supabase:link -- --project-ref <project-ref>
pnpm exec supabase db push --linked --dry-run
pnpm supabase:db:push
```

## Useful commands

```bash
pnpm dev
pnpm test
pnpm test:coverage
pnpm test:e2e
pnpm verify:env
pnpm build
pnpm lint
pnpm smoke:games
pnpm generate:wheel-content-seed
pnpm supabase:types:check
pnpm supabase:types:generate -- --local
pnpm supabase:login
pnpm supabase:link
pnpm supabase:db:push
pnpm supabase:migration:new -- <name>
```

`pnpm smoke:games` starts a temporary local Next.js server automatically when `SMOKE_BASE_URL` is not set.
`pnpm test:e2e` and `pnpm test:e2e:ci` both rebuild the app before Playwright starts its dedicated production server, so local browser tests cannot accidentally run against a stale `.next` build.

It still expects:

- Supabase env vars to be configured
- the current schema to be applied in Supabase

If you want to target an already running app instead, set `SMOKE_BASE_URL`.
Run `pnpm verify:env` before smoke-related work to validate the required Supabase runtime env and local anonymous-auth config.

## Quality gates

The minimum local release-readiness checks for this repo are:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm supabase:types:check
pnpm build
pnpm smoke:games
```

CI additionally runs `pnpm test:coverage` to enforce coverage thresholds on the current safety-net surface, `pnpm exec playwright test` after a separate `pnpm build` step for Chromium browser coverage, and `pnpm supabase:types:check -- --verify-output --local` to verify the committed types still match the migrated schema.

## API contracts and observability

- `/api/games/*`, `/api/live`, and `/api/rsvp` share the same error envelope: `error`, `code`, `requestId`, and optional `retryAfterSeconds`.
- Route handlers derive `requestId` from `x-request-id`, then `x-vercel-id`, then fall back to `crypto.randomUUID()`.
- Server-side logging goes through the structured logger helpers in `src/shared/lib/server/logger.ts`; prefer `logServerInfo()` and `logServerError()` over ad-hoc `console.error`.
- Deferred work is labeled. Repository methods return `DeferredTask[]` as `{ label, run }`, so post-response failures remain attributable in logs.

## Test layers

- `pnpm test`: unit and route-level Vitest coverage.
- `pnpm test:coverage`: the same Vitest surface with enforced coverage thresholds.
- `pnpm test:e2e`: Playwright browser tests for RSVP submit, player onboarding, wheel resolve, and live feed refresh, always with a fresh build.
- `pnpm test:e2e:ci`: the same Playwright surface, also with a fresh build when run locally.
- `pnpm smoke:games`: self-contained API smoke coverage against a temporary local Next.js server, with named-step reporting (`cleanup_before`, `auth`, `health_check`, `bootstrap_player`, `save_player`, `start_round`, optional `start_timer`, `resolve_round`, `leaderboard`, `live_snapshot`, `cleanup_after`).

## Live projector behavior

- Polling remains active at all times.
- Supabase Broadcast invalidates the snapshot immediately, and `SUBSCRIBED` forces a refresh.
- Realtime `CHANNEL_ERROR`, `TIMED_OUT`, and `CLOSED` statuses degrade to polling and trigger bounded retry backoff instead of breaking the page.
- Hero-event dedupe uses a sliding 200-ID window to prevent duplicate overlays and unbounded memory growth during long sessions.

## Project structure

```text
src/
├── app/
│   ├── [locale]/                 # invitation, invite, games, live pages
│   └── api/                      # rsvp, live, games APIs
├── features/
│   ├── countdown/
│   ├── game-session/             # auth, local cache, shared types, domain-scoped server repositories
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── wheel-of-fortune/         # game UI, useWheelGame hook, extracted subcomponents and helpers
├── shared/
│   ├── config/                   # wedding data, guests, game catalog, wheel content, metadata helpers
│   ├── i18n/
│   ├── lib/
│   │   └── server/               # deferred tasks, error handler, CSP, rate limiter
│   └── ui/
└── widgets/
    ├── invitation-page/
    ├── personal-invitation/
    ├── games-hub/
    ├── games-shell/
    ├── games-wheel-page/
    ├── live-projector/            # decomposed: LiveClock, FeedEventCard, LeaderboardRow, HeroEventOverlay
    └── page sections
```

## Project rules

- Do not hardcode the wedding date. Import `WEDDING_DATE` from `@/shared/config`.
- Do not hardcode the default motion curve `[0.22, 1, 0.36, 1]` inline. Import `MOTION_EASE` from `@/shared/lib`.
- Keep `src/shared/i18n/messages/uk.json` and `en.json` in sync.
- Prefer CSS variable-based Tailwind classes instead of hardcoded component colors.
- Use barrel exports where they already exist.
- Treat `Countdown`, `Splash`, `LanguageSwitcher`, `ThemeProvider`, `useLiveProjectorSnapshot`, and `useWheelGame` as hydration-sensitive code.
- Use the deferred tasks pattern (`after()` + `runDeferredTasks`) for post-response async work in API routes.
- Register new game error types in `game-api-error-handler.ts` — do not add `instanceof` chains in route files.
