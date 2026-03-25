# diandmax — Wedding Invitation & Event Hub

Wedding website for Maksym & Diana.
Date: June 28, 2026.
Venue: Grand Hotel Terminus, Bergen, Norway.

> Keep `AGENTS.md` and `CLAUDE.md` aligned.
> If a local `GEMINI.md` exists, keep that one aligned too.

This repository is a **full rewrite** of the previous `wedaster` project.
The old codebase has been removed. All code is being rebuilt from scratch with a new stack.

This repository contains:

- the invitation site at `/` and `/en`
- personalized invite pages at `/invite/[slug]`
- the projector/live feed page at `/live` (UI only — games backend is being built)
- the RSVP API at `/api/rsvp`

Future (game hub phase):

- guest check-in with nickname
- ~6 wedding games
- real-time live feed with XP events
- leaderboard
- guest chat

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + CSS variables |
| Animation | motion/react |
| i18n | next-intl 4 |
| Forms | react-hook-form + zod + @hookform/resolvers |
| UI primitives | shadcn/ui + Lucide React |
| Server state | TanStack Query |
| Client state | Zustand |
| URL state | Nuqs |
| Database | Supabase Postgres + Drizzle ORM |
| Email | Resend + react-email |
| Lint/Format | Biome |
| Git hooks | Husky + lint-staged |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → Vercel (Free Plan) |
| Analytics | @vercel/analytics + @vercel/speed-insights |
| Utilities | clsx + tailwind-merge via `cn()` |

---

## Architecture

Feature-Sliced Design (FSD) hybrid with Next.js App Router.

Dependency direction (top → bottom only):

```
app → widgets → features → entities → shared
                         ↘ infrastructure
```

Features must not import each other directly. Cross-feature communication goes through entities, shared contracts, or server actions.

### Layer responsibilities

| Layer | Purpose |
|---|---|
| `app/` | Routes, layouts, API handlers |
| `widgets/` | Page sections and composition roots |
| `features/` | Product features (countdown, rsvp, language-switcher, etc.) |
| `entities/` | Domain models (guest, event, player) |
| `shared/` | UI primitives, config, i18n, lib utilities |
| `infrastructure/` | Supabase/Drizzle client, email sending |

### Project Structure

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                  # invitation page
│   │   ├── layout.tsx
│   │   ├── error.tsx                 # locale-level error boundary
│   │   ├── not-found.tsx             # locale-level 404
│   │   ├── live/page.tsx             # activity feed (noindex)
│   │   └── invite/[slug]/page.tsx    # personalized invite (noindex)
│   ├── api/
│   │   └── rsvp/route.ts
│   ├── global-not-found.tsx          # fallback 404 (globalNotFound)
│   ├── globals.css
│   └── layout.tsx
├── features/
│   ├── countdown/
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── rsvp/
│       ├── components/
│       ├── actions/
│       ├── hooks/
│       └── schema/
├── entities/
│   ├── guest/
│   │   └── queries/                  # fetchGuestBySlug, fetchGuests
│   └── event/                        # game hub (future)
│       └── types.ts
├── shared/
│   ├── config/                       # wedding.ts, guests.ts, site.ts
│   ├── i18n/
│   │   ├── translations/
│   │   │   ├── uk.json
│   │   │   └── en.json
│   │   ├── routing.ts
│   │   ├── navigation.ts
│   │   └── request.ts
│   ├── lib/
│   │   ├── motion.ts                 # MOTION_EASE constant
│   │   ├── cn.ts
│   │   ├── fonts.ts
│   │   ├── theme-script.ts
│   │   └── server/
│   │       ├── deferred.ts
│   │       ├── api-error-response.ts
│   │       ├── logger.ts
│   │       ├── csp.ts
│   │       └── request-id.ts
│   └── ui/                           # shadcn/ui + custom primitives
├── widgets/
│   ├── invitation/
│   ├── personal-invitation/
│   ├── activity-feed/
│   │   ├── ActivityFeedPage.tsx
│   │   ├── LiveClock.tsx
│   │   ├── FeedEventCard.tsx
│   │   ├── LeaderboardRow.tsx
│   │   ├── HeroEventOverlay.tsx
│   │   ├── FeedEmptyState.tsx
│   │   ├── LeaderboardEmptyState.tsx
│   │   ├── activity-feed-helpers.ts
│   │   └── types.ts
│   ├── navbar/
│   ├── not-found/
│   ├── footer/
│   ├── splash/
│   ├── hero/
│   ├── our-story/
│   ├── timeline/
│   ├── location/
│   ├── dress-code/
│   └── gifts/
└── infrastructure/
    ├── db/
    │   ├── schema.ts                 # Drizzle schema
    │   ├── client.ts                 # Supabase + Drizzle client
    │   └── migrations/
    └── email/
        ├── templates/
        └── sender.ts
```

Barrel exports (`index.ts`) are used across the repo. Import from the barrel when one exists.

---

## Product Notes

### Invitation and RSVP

- `/` and `/en` render the full invitation page
- `/invite/[slug]` renders guest-specific copy and seat count
- the RSVP form uses a honeypot `website` field to catch bots
- RSVP responses are persisted to Supabase via Drizzle
- email confirmation is sent via Resend using the deferred tasks pattern

RSVP payload shape:

- `guestNames: string[]`
- `attending: "yes" | "no"`
- `guests: number`
- `dietary?: string`
- `message?: string`
- `website?: string`

### Activity feed (/live)

- `/live` is the activity feed page, marked `noindex`
- renders with stub data until the games backend is built
- type contracts: `LiveSnapshot`, `LiveFeedEventSnapshot`, `LeaderboardEntrySnapshot` in `src/widgets/activity-feed/types.ts`
- connecting real data means wiring `ActivityFeedPage.tsx` to a new `/api/live` endpoint

---

## Shared Config, UI, and Styling

`@/shared/config` is the source of truth for wedding data, guest data, and metadata helpers.

- always import `WEDDING_DATE` and `WEDDING_DATE_ROMAN` from `@/shared/config`
- always import `VENUE` (including `VENUE.locationShort` and `VENUE.directionsUrl`) from `@/shared/config`
- do not duplicate `VENUE`, `COUPLE`, `DRESS_CODE`, guests, or metadata data in route files or widgets

Reusable UI primitives in `src/shared/ui`:

- `SectionWrapper`
- `SectionHeading`
- `AnimatedReveal`
- `Ornament`
- `Button`, `Input`, `Textarea` (built on shadcn/ui)

Styling rules:

- colors go through CSS variables defined in `src/app/globals.css`
- prefer Tailwind classes backed by those variables: `bg-bg-primary`, `text-text-primary`, `text-accent`, `text-error`
- avoid hardcoded colors in components (except intentional config/email/SVG cases)
- headings use `heading-serif` or `heading-serif-italic`
- numerals and formal labels use `font-cinzel`
- default motion curve is `[0.22, 1, 0.36, 1]`; import `MOTION_EASE` from `@/shared/lib` — do not hardcode inline

---

## Internationalization

- default locale is `uk`
- English uses `/en`
- translations live in `src/shared/i18n/translations/uk.json` and `en.json`
- client navigation must use `@/shared/i18n/navigation`
- new message keys must be added to both locale files with identical structure

---

## Hydration-Sensitive Code

Do not casually refactor these:

- `features/countdown/Countdown.tsx`
- `widgets/splash/Splash.tsx`
- `features/language-switcher/LanguageSwitcher.tsx`
- `features/theme-switcher/ThemeProvider.tsx`

These intentionally use hydration-safe patterns (`useSyncExternalStore`, staged mount logic).

---

## Server Patterns

### Deferred tasks

On Vercel serverless, fire-and-forget is unreliable. All post-response work uses:

1. Return `{ data, deferredTasks: DeferredTask[] }` from repository methods
2. Call `after(() => runDeferredTasks(tasks))` in route handlers
3. `runDeferredTasks` uses `Promise.allSettled` — one failure does not block others

Each task is `{ label, run }` for attributable failures in structured logs.

### Unified error envelopes

All `/api/*` error responses:

- `error: string`
- `code: string`
- `requestId: string`
- `retryAfterSeconds?: number`

Request IDs: `x-request-id` → `x-vercel-id` → `crypto.randomUUID()`.

### Structured logging

Use `logServerInfo()` and `logServerError()` from `@/shared/lib/server`.
Payloads include `scope`, `event`, `requestId`, optional `context`, serialized error details.

---

## Database

Drizzle queries must live in `entities/*/queries/` or `features/*/`. UI components never query the DB directly.

Schema tables:

- `guests` — slug, localized names, seat count
- `rsvp_responses` — RSVP submissions
- `players` — future game hub (Supabase anon uid + nickname)
- `game_events` — future live game events (named `gameEvents` in Drizzle to avoid DOM `Event` collision)
- `leaderboard` — future XP rankings

DB-inferred types are prefixed with `Db` (e.g. `DbGuest`, `DbRsvpResponse`) to distinguish from domain models.
Drizzle queries live only in `entities/*/queries/` or `features/*/` — never in UI components.
Use `fetch*` prefix for async DB queries (e.g. `fetchGuestBySlug`), `get*` for sync static lookups (e.g. `getGuestBySlug`).

---

## Architectural Contracts

- Dependencies flow downward only: `app → widgets → features → entities → shared`
- Features must not import from each other's internals (only public `index.ts`)
- Circular dependencies are forbidden
- Filters/search/pagination → URL state (Nuqs), not Zustand
- Zustand → minimal global UI state only (theme, etc.)
- `any` is forbidden in TypeScript
- All Zod schemas are colocated with their feature/entity

---

## Quality Gates

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # biome check
pnpm build       # next build
pnpm test        # vitest run
pnpm test:e2e    # playwright test
```

---

## Key Rules

- Never hardcode the wedding date; import `WEDDING_DATE` from `@/shared/config`
- Never hardcode the Roman numeral date; import `WEDDING_DATE_ROMAN` from `@/shared/config`
- Never hardcode venue strings; import `VENUE` from `@/shared/config`
- Never hardcode `[0.22, 1, 0.36, 1]` inline; import `MOTION_EASE` from `@/shared/lib`
- Keep locale message files in sync
- Prefer server components by default
- Server Actions first for mutations
- Keep invite route metadata localized
- Use existing barrel exports when they exist
- Treat `/invite/[slug]` and `/live` as intentionally non-indexed
- Do not remove hydration-safe patterns in countdown, splash, language switcher, or theme provider
- Use the deferred tasks pattern for any post-response async work — never `void asyncFn()`

---

## Useful Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # drizzle-kit migrate
```
