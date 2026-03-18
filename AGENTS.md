# Big Day — Wedding Invitation + Games Site

Wedding website for Maksym & Diana.
Date: June 28, 2026.
Venue: Grand Hotel Terminus, Bergen, Norway.

This repository is no longer only an invitation landing page. It currently contains:

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

FSD-inspired, with route-level composition in `app/`, interactive flows in `features/`, shared primitives in `shared/`, and page/section composition in `widgets/`.

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                 # invitation homepage
│   │   ├── invite/[slug]/page.tsx   # personalized invite pages
│   │   ├── games/page.tsx           # games hub
│   │   ├── games/[slug]/page.tsx    # game detail pages
│   │   └── live/page.tsx            # projector/live page
│   └── api/
│       ├── rsvp/route.ts
│       ├── live/route.ts
│       └── games/...                # player, leaderboard, wheel lifecycle
├── features/
│   ├── countdown/
│   ├── game-session/                # browser auth/session + shared game contracts
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── wheel-of-fortune/
├── shared/
│   ├── config/                      # wedding data, game catalog, wheel content, SEO helpers
│   ├── i18n/                        # routing, messages, request config
│   ├── lib/                         # cn(), fonts, theme script, lite motion, server helpers
│   └── ui/                          # reusable UI primitives
└── widgets/
    ├── invitation-page/
    ├── personal-invitation/
    ├── games-hub/
    ├── games-hero/
    ├── games-shell/
    ├── games-wheel-page/
    ├── live-projector/
    ├── navbar/
    ├── not-found-page/
    └── invitation sections
```

There is still no dedicated `entities/` layer in the codebase. Keep the current structure unless a change truly needs a reusable domain module rather than a feature- or shared-level abstraction.

Barrel exports are already used across the repo. Prefer importing from the barrel when one exists.

---

## Current Product Surface

### Invitation experience

- `/` and `/en` render the full invitation page
- `/invite/[slug]` renders guest-specific invitation copy and seat count
- RSVP defaults are personalized from the guest entry when a slug is present

### Games platform

- `/games` is the public hub
- only `wheel-of-fortune` is currently playable
- other games remain catalog entries with `comingSoon` status in `src/shared/config/games.ts`

### Live projector

- `/live` reads from `/api/live`
- the client also subscribes to Supabase realtime signals to refresh faster
- the page is intended for projector/live usage and is marked `noindex`

### RSVP backend

- `src/app/api/rsvp/route.ts` is implemented
- the API validates payloads with `rsvpSchema`
- it rate-limits submissions
- it uses a honeypot `website` field
- it sends emails through Resend or logs in `mock` mode

---

## Shared Config Rules

`@/shared/config` is the source of truth for site data and metadata helpers.

- `WEDDING_DATE` must always come from `@/shared/config`
- `VENUE`, `COUPLE`, `DRESS_CODE`, and guest data live there
- game catalog and wheel content definitions also live there
- metadata helpers such as `getMetadataBase()`, `getSiteUrl()`, and `getOpenGraphLocale()` are already centralized

Do not duplicate this data in widgets, features, or route files.

---

## Shared UI (`@/shared/ui`)

| Component | Purpose |
|---|---|
| `SectionWrapper` | Section shell with optional fade removal, alternate bg, and full-height mode |
| `SectionHeading` | Shared section heading with subtitle and gold divider |
| `AnimatedReveal` | Scroll reveal wrapper with direction, delay, threshold, and optional blur |
| `Ornament` | Decorative SVG corner element |
| `Button` | Polymorphic button with `primary`, `secondary`, `outline`, `ghost` variants |
| `Input` | Styled input with `error?: boolean` |
| `Textarea` | Styled textarea with `error?: boolean` |

---

## Styling Conventions

### Design tokens

Colors should flow through CSS variables defined in `src/app/globals.css`.

Use Tailwind classes backed by those variables, for example:

- `bg-bg-primary`
- `bg-bg-secondary`
- `text-text-primary`
- `text-text-secondary`
- `text-accent`
- `border-accent/20`

Avoid hardcoding colors in components. The only intentional hardcoded hex values are data/config values such as dress-code swatches and certain self-contained SVG/email styles.

### Typography

- headings: `heading-serif` / `heading-serif-italic`
- numerals and formal labels: `font-cinzel`
- script accent: `font-[family-name:var(--font-vibes)]`
- body: Inter on `<body>`

### Motion

House easing curve: `[0.22, 1, 0.36, 1]`

Use it unless there is a concrete reason not to.

---

## Internationalization

- default locale: `uk`
- English uses `/en`
- messages live in `src/shared/i18n/messages/uk.json` and `en.json`
- client navigation must use `@/shared/i18n/navigation`
- new message keys must be added to both locale files with identical structure

---

## Hydration-Sensitive Code

Do not casually refactor these pieces:

- `features/countdown/Countdown.tsx`
  - uses `useSyncExternalStore` with a singleton interval to avoid hydration mismatch
- `widgets/splash/Splash.tsx`
  - uses `useSyncExternalStore` for mount detection and session-based display
- `features/language-switcher/LanguageSwitcher.tsx`
  - uses `useSyncExternalStore` to keep the locale label hydration-safe
- `features/theme-switcher/ThemeProvider.tsx`
  - uses `queueMicrotask` during mount to avoid React 19 warning patterns
- `widgets/live-projector/useLiveProjectorSnapshot.ts`
  - combines polling with realtime invalidation; preserve both paths unless intentionally redesigning it

---

## RSVP Notes

The RSVP schema is no longer the old single-name stub. Current fields are:

- `guestNames: string[]`
- `attending: "yes" | "no"`
- `guests: number`
- `dietary?: string`
- `message?: string`
- `website?: string` (honeypot)

Important behavior:

- personalized invite pages prefill the first guest name and max seat count
- `attending` is driven by custom buttons and `setValue(...)`
- `/api/rsvp` returns `503` when Resend env is missing in non-mock mode
- mock mode is supported for local testing

Environment variables:

```bash
RESEND_API_KEY=
RSVP_TO_EMAILS=
RSVP_FROM_EMAIL=
RSVP_SUBJECT_PREFIX=
RSVP_DELIVERY_MODE=
```

---

## Games Platform Notes

The games platform is Supabase-backed.

Client side:

- anonymous auth is created/restored through `features/game-session/auth-client.ts`
- player snapshot is cached in local storage, but backend state remains authoritative

Server side:

- route handlers live under `src/app/api/games`
- repository logic lives in `src/features/game-session/server`
- rate limiting uses a Supabase RPC-backed fixed window
- wheel content is seeded from JSON source files into SQL

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Supported fallbacks remain in code for older setups:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

Useful related files:

- `supabase/games_platform_schema.sql`
- `supabase/seed_wheel_content.sql`
- `supabase/reset_runtime_data.sql`
- `supabase/verify_games_platform_setup.sql`

Useful commands:

```bash
pnpm generate:wheel-content-seed
pnpm smoke:games
```

---

## Key Rules

- Never hardcode the wedding date; import `WEDDING_DATE`
- Keep locale message files in sync
- Prefer server components by default
- Keep invite and games route metadata localized
- Use existing barrel exports
- Treat `/invite/[slug]` and `/live` as intentionally non-indexed surfaces
- Do not remove the current hydration-safe patterns in countdown, splash, language switcher, or theme provider
- Do not replace the server-authoritative wheel flow with client-side randomness

---

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm smoke:games
pnpm generate:wheel-content-seed
```
