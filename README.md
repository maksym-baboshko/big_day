# Big Day

Big Day is a bilingual wedding website for Maksym and Diana.

The project now has two public surfaces:

- the invitation experience at `/` and `/en`
- the wedding games platform at `/games`, with a live projector view at `/live`

## Current public routes

- `/` and `/en`: main invitation page
- `/invite/[slug]`: personalized invitation pages with guest-specific copy and RSVP defaults
- `/games`: games hub
- `/games/wheel-of-fortune`: live game
- `/live`: projector-style live leaderboard and activity feed

## What is implemented

- Ukrainian and English locales via `next-intl`
- Light and dark themes
- Hydration-safe animated splash, countdown, and language/theme controls
- Wedding sections: story, timeline, venue, dress code, gifts, RSVP
- Personalized invitation cards with seat counts from `src/shared/config/guests.ts`
- RSVP API with `zod` validation, honeypot field, rate limiting, and Resend/mock email delivery
- Supabase-backed anonymous auth for games
- Player onboarding, leaderboard, live feed, and wheel round lifecycle
- Projector page backed by `/api/live` plus Supabase realtime refresh

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

### Games and live platform

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

## Local setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm smoke:games
pnpm generate:wheel-content-seed
```

`pnpm smoke:games` expects:

- the Next.js app to be running locally
- Supabase env vars to be configured
- the schema from `supabase/games_platform_schema.sql` to be applied

## Project structure

```text
src/
├── app/
│   ├── [locale]/                 # invitation, games, live, invite pages
│   └── api/                      # rsvp, live, games APIs
├── features/
│   ├── countdown/
│   ├── game-session/             # auth, local session cache, shared client/server types
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── wheel-of-fortune/
├── shared/
│   ├── config/                   # wedding data, game catalog, wheel content, metadata helpers
│   ├── i18n/
│   ├── lib/
│   └── ui/
└── widgets/
    ├── invitation-page/          # assembled invitation screen
    ├── games-hub/
    ├── games-shell/
    ├── games-wheel-page/
    ├── live-projector/
    ├── personal-invitation/
    └── page sections
```

## Project rules

- Do not hardcode the wedding date. Import `WEDDING_DATE` from `@/shared/config`.
- Keep `src/shared/i18n/messages/uk.json` and `en.json` in sync.
- Prefer CSS variable-based Tailwind classes instead of hardcoded component colors.
- Use barrel exports where they already exist.
- Treat `Countdown`, `Splash`, `LanguageSwitcher`, and `ThemeProvider` as hydration-sensitive code.

## Current product status

- RSVP delivery is implemented and no longer a stub.
- Personalized invite pages are implemented and statically generated.
- The games hub is live, but only `wheel-of-fortune` is currently playable.
- `/live` is meant for projector/live usage and is marked `noindex`.
