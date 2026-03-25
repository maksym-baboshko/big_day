# diandmax — Architecture Overview

> This document is the architectural contract for the diandmax project.
> All PRs must align with the decisions made here.

---

## Project Overview

**diandmax** is a wedding invitation site and future event hub for Maksym & Diana's wedding (June 28, 2026, Grand Hotel Terminus, Bergen, Norway).

**Phase 1 (current):** Wedding invitation site with RSVP.
**Phase 2 (planned):** Game hub — ~6 wedding games, live feed, leaderboard, guest chat, QR-based check-in with Supabase Anonymous Auth.

---

## Tech Stack

| Layer | Tool | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Server-first, streaming, RSC |
| Language | TypeScript 5 strict | Type safety, no `any` |
| Styling | Tailwind CSS v4 | CSS-first, no config file |
| Animation | motion/react | Framer Motion rebranded |
| i18n | next-intl 4 | Native App Router support |
| UI primitives | shadcn/ui + Lucide React | Unstyled, composable |
| Forms | react-hook-form + zod | Validated, type-safe |
| Server state | TanStack Query | Cache, deduplication, optimistic |
| Client state | Zustand | Minimal, no filters/search |
| URL state | Nuqs | Filters, search, pagination |
| Database | Supabase Postgres + Drizzle ORM | Type-safe queries, migrations |
| Email | Resend + react-email | Reusable templates |
| Lint/Format | Biome | Single tool, fast |
| Git hooks | Husky + lint-staged | Pre-commit checks |
| Testing | Vitest + Playwright | Unit + E2E |
| CI/CD | GitHub Actions → Vercel | Deploy only if CI passes |
| Observability | @vercel/analytics + @vercel/speed-insights | Built-in Vercel |

---

## Architectural Style

**Feature-Sliced Design (FSD) hybrid** — adapted for Next.js App Router.

### Layer Hierarchy

```
app → widgets → features → entities → shared
                         ↘ infrastructure
```

Dependencies are **strictly downward only**. No layer may import from a layer above it.

### Layers

| Layer | Path | Responsibility |
|---|---|---|
| `app` | `src/app/` | Routes, layouts, API handlers |
| `widgets` | `src/widgets/` | Page section composition roots |
| `features` | `src/features/` | Product features with UI + logic |
| `entities` | `src/entities/` | Domain models, types, DB queries |
| `shared` | `src/shared/` | Universal building blocks |
| `infrastructure` | `src/infrastructure/` | External service integrations |

### Forbidden Dependencies

```
entities → features          ✗
entities → widgets           ✗
shared   → entities          ✗
shared   → features          ✗
shared   → infrastructure    ✗
featureA → featureB/internal ✗  (only featureA → featureB is allowed)
```

Features communicate via:
- `entities` (shared domain types)
- `shared` contracts
- Server actions

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── live/
│   │   │   └── page.tsx
│   │   └── invite/
│   │       └── [slug]/
│   │           └── page.tsx
│   ├── api/
│   │   └── rsvp/
│   │       └── route.ts
│   ├── global-not-found.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.ts
│   ├── robots.ts
│   └── sitemap.ts
│
├── features/
│   ├── countdown/            # hydration-safe countdown timer
│   │   ├── Countdown.tsx
│   │   └── index.ts
│   ├── language-switcher/    # uk/en toggle
│   │   ├── LanguageSwitcher.tsx
│   │   └── index.ts
│   ├── theme-switcher/       # light/dark toggle
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── index.ts
│   └── rsvp/                 # RSVP form feature
│       ├── components/
│       ├── actions/           # server actions
│       ├── hooks/
│       ├── schema/            # Zod schemas (colocated)
│       └── index.ts
│
├── entities/
│   ├── guest/
│   │   ├── queries/           # fetchGuestBySlug, fetchGuests (Drizzle)
│   │   └── index.ts           # re-exports Guest from @/shared/config
│   └── event/                 # future game hub
│       ├── types.ts
│       └── index.ts
│
├── shared/
│   ├── config/
│   │   ├── wedding.ts         # WEDDING_DATE, VENUE, COUPLE, DRESS_CODE
│   │   ├── guests.ts          # guest list, slug lookup
│   │   ├── site.ts            # SITE_NAME, metadata helpers
│   │   ├── structured-data.ts # Schema.org JSON-LD
│   │   └── index.ts
│   ├── i18n/
│   │   ├── translations/
│   │   │   ├── uk.json
│   │   │   └── en.json
│   │   ├── routing.ts
│   │   ├── navigation.ts
│   │   └── request.ts
│   ├── lib/
│   │   ├── motion.ts          # MOTION_EASE = [0.22, 1, 0.36, 1]
│   │   ├── cn.ts              # clsx + tailwind-merge
│   │   ├── fonts.ts           # Playfair Display, Cinzel, Great Vibes, Inter
│   │   ├── theme-script.ts    # inline theme init script
│   │   ├── useLiteMotion.ts   # device performance hook
│   │   ├── index.ts
│   │   └── server/
│   │       ├── deferred.ts    # after() + runDeferredTasks
│   │       ├── api-error-response.ts
│   │       ├── logger.ts
│   │       ├── csp.ts
│   │       ├── request-id.ts
│   │       └── index.ts
│   └── ui/
│       ├── SectionWrapper.tsx
│       ├── SectionHeading.tsx
│       ├── AnimatedReveal.tsx
│       ├── Ornament.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       └── index.ts
│
├── widgets/
│   ├── invitation/
│   ├── personal-invitation/
│   ├── splash/
│   ├── hero/
│   ├── our-story/
│   ├── timeline/
│   ├── location/
│   ├── dress-code/
│   ├── gifts/
│   ├── navbar/
│   ├── footer/
│   ├── not-found/
│   └── activity-feed/
│       ├── ActivityFeedPage.tsx
│       ├── LiveClock.tsx
│       ├── FeedEventCard.tsx
│       ├── FeedEmptyState.tsx
│       ├── LeaderboardRow.tsx
│       ├── LeaderboardEmptyState.tsx
│       ├── HeroEventOverlay.tsx
│       ├── activity-feed-helpers.ts
│       ├── types.ts
│       └── index.ts
│
└── infrastructure/
    ├── db/
    │   ├── schema.ts          # Drizzle table definitions
    │   ├── client.ts          # Supabase + Drizzle client singleton
    │   └── migrations/
    └── email/
        ├── templates/         # react-email components
        └── sender.ts          # Resend send function

src/testing/
├── helpers/
└── fixtures/
```

---

## Data Strategy

### State Management Rules

| State type | Tool | Location |
|---|---|---|
| Server/async data | TanStack Query | features, widgets |
| URL state (filters, search, pagination) | Nuqs | features |
| Minimal global UI state | Zustand | features/theme-switcher, features/language-switcher |
| Form state | react-hook-form | features/rsvp |

**Filters and search must use URL state (Nuqs), not Zustand.**

### Database Access Rules

- Drizzle queries live only in `entities/*/queries/` or `features/*/`
- UI components never access the DB directly
- Server Actions handle all mutations from the client

### Server Action Priority

Use Server Actions over API routes for mutations wherever possible.
API routes are for: webhooks, external integrations, the RSVP endpoint (existing).

---

## Database Schema

```
guests
  id          uuid PK
  slug        text UNIQUE
  name_uk     text
  name_en     text
  vocative_uk text
  form_name   text
  seats       int
  created_at  timestamptz

rsvp_responses
  id           uuid PK
  guest_slug   text FK→guests.slug
  attending    text  ("yes"|"no")
  guests_count int
  dietary      text nullable
  message      text nullable
  created_at   timestamptz

-- Future: game hub
players
  id               uuid PK
  nickname         text
  supabase_anon_uid text nullable
  guest_slug       text nullable FK→guests.slug
  created_at       timestamptz

game_events                          -- named gameEvents in Drizzle (avoids DOM Event collision)
  id         uuid PK
  type       text
  player_id  uuid FK→players.id
  payload    jsonb
  xp_delta   int
  created_at timestamptz

leaderboard
  id         uuid PK
  player_id  uuid UNIQUE FK→players.id
  nickname   text
  total_xp   int
  updated_at timestamptz
```

---

## Next.js Patterns

### Rendering Strategy

- Server Components by default
- Client Components only when necessary (`"use client"`)
- Server Actions for all mutations

### Performance

- `next/image` for all images
- `next/font` for all custom fonts (no FOUT)
- Dynamic imports for heavy client components
- Streaming + Suspense for slow data
- Optimistic updates via TanStack Query

### Routing

- `[locale]` segment wraps all user-facing routes
- `(locale)` group not used — explicit `[locale]` for next-intl
- `/live` and `/invite/[slug]` are `noindex`

---

## i18n

- Default locale: `uk`
- English: `/en`
- Translations: `src/shared/i18n/translations/{uk,en}.json`
- Client navigation: `@/shared/i18n/navigation` (useRouter, Link, usePathname)
- All UI text must come from translations — no hardcoded strings

---

## Error Handling

All `/api/*` error responses use a unified envelope:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "requestId": "uuid",
  "retryAfterSeconds": 60
}
```

Request ID resolution: `x-request-id` → `x-vercel-id` → `crypto.randomUUID()`.

---

## Email Architecture

```
react-email template  →  sender.ts (Resend)  →  deferred task
```

- Templates in `infrastructure/email/templates/`
- Sending in `infrastructure/email/sender.ts`
- Always fire via deferred tasks (`after()` + `runDeferredTasks()`)
- Never `void asyncFn()` — unreliable on Vercel serverless

---

## Testing Strategy

### Vitest (unit + integration)

Focus:
- `features/rsvp/schema/` — Zod validation
- `entities/*/queries/` — DB query logic (mock Drizzle)
- `shared/lib/` — utility functions
- Server actions — mock dependencies

### Playwright (E2E)

Critical paths:
- Homepage loads, splash animation shows once
- RSVP form submit (success + error)
- `/live` page renders
- `/invite/[slug]` shows personalized copy
- Language switcher (uk ↔ en)
- Theme switcher (light ↔ dark)

---

## CI Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    steps:
      - Install dependencies (pnpm)
      - Typecheck (tsc --noEmit)
      - Biome check
      - Vitest run
      - Playwright test (chromium)
      - Next.js build
  deploy:
    needs: [ci]
    # Vercel deploy — only if all CI checks pass
```

---

## Architectural Invariants (never break these)

1. Dependency direction: `app → widgets → features → entities → shared`
2. No circular dependencies
3. No `any` in TypeScript
4. No hardcoded colors (CSS variables only)
5. No hardcoded wedding data (import from `@/shared/config`)
6. No hardcoded motion curve (import `MOTION_EASE`)
7. No DB access in UI components
8. No `void asyncFn()` in API routes (deferred tasks)
9. No filters/search in Zustand (Nuqs URL state)
10. Hydration-safe patterns preserved in: Countdown, Splash, LanguageSwitcher, ThemeProvider
