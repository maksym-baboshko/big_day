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

When changing the database:

- add a new migration under `supabase/migrations/`
- update `supabase/games_platform_schema.sql` in the same change
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
pnpm build
pnpm lint
pnpm smoke:games
pnpm generate:wheel-content-seed
pnpm supabase:login
pnpm supabase:link
pnpm supabase:db:push
pnpm supabase:migration:new -- <name>
```

`pnpm smoke:games` expects:

- the Next.js app to be running locally
- Supabase env vars to be configured
- the current schema to be applied in Supabase

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
- Keep `src/shared/i18n/messages/uk.json` and `en.json` in sync.
- Prefer CSS variable-based Tailwind classes instead of hardcoded component colors.
- Use barrel exports where they already exist.
- Treat `Countdown`, `Splash`, `LanguageSwitcher`, `ThemeProvider`, `useLiveProjectorSnapshot`, and `useWheelGame` as hydration-sensitive code.
- Use the deferred tasks pattern (`after()` + `runDeferredTasks`) for post-response async work in API routes.
- Register new game error types in `game-api-error-handler.ts` — do not add `instanceof` chains in route files.
