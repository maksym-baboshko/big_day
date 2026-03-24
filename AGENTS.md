# Big Day — Wedding Invitation Site

Wedding website for Maksym & Diana.
Date: June 28, 2026.
Venue: Grand Hotel Terminus, Bergen, Norway.

> Keep `AGENTS.md` and `CLAUDE.md` aligned.
> If a local `GEMINI.md` exists, keep that one aligned too.

This repository contains:

- the invitation site at `/` and `/en`
- personalized invite pages at `/invite/[slug]`
- the projector/live feed page at `/live` (UI only — games backend is being rebuilt)
- the RSVP API at `/api/rsvp`

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
| Testing | Vitest + React Testing Library |
| Backend services | Supabase (rate-limit RPC) + Resend |
| Utilities | clsx + tailwind-merge via `cn()` |

---

## Project Structure

FSD-inspired, with route composition in `app/`, interactive flows in `features/`, shared primitives in `shared/`, and page/section composition in `widgets/`.

```text
src/
├── app/
│   ├── [locale]/                 # invitation, invite, live pages
│   └── api/
│       └── rsvp/                 # RSVP submission API
├── features/
│   ├── countdown/
│   ├── language-switcher/
│   └── theme-switcher/
├── shared/
│   ├── config/                   # wedding data, guests, metadata helpers
│   ├── i18n/
│   ├── lib/
│   │   ├── motion.ts             # MOTION_EASE — canonical default animation curve
│   │   └── server/               # server-only utilities
│   │       ├── deferred.ts       # after() + runDeferredTasks for Vercel serverless
│   │       ├── supabase.ts       # Supabase admin client singleton
│   │       ├── rate-limit.ts     # enforceRateLimit via Supabase RPC
│   │       ├── api-error-response.ts
│   │       ├── logger.ts
│   │       ├── csp.ts
│   │       └── request-id.ts
│   └── ui/
└── widgets/
    ├── invitation-page/
    ├── personal-invitation/
    ├── live-projector/           # projector page (stub data — games backend pending)
    │   ├── LiveProjectorPage.tsx  # composition root
    │   ├── LiveClock.tsx
    │   ├── FeedEventCard.tsx
    │   ├── LeaderboardRow.tsx
    │   ├── HeroEventOverlay.tsx
    │   ├── FeedEmptyState.tsx
    │   ├── LeaderboardEmptyState.tsx
    │   ├── live-projector-helpers.ts
    │   └── types.ts              # LiveSnapshot, LiveFeedEventSnapshot, LeaderboardEntrySnapshot
    ├── navbar/
    ├── not-found-page/
    ├── rsvp/
    └── invitation sections (our-story, timeline, location, dress-code, gifts, hero, splash)
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
- the RSVP API rate-limits submissions, uses a honeypot `website` field that short-circuits bot-like submissions, and sends via Resend or `mock` mode
- rate-limiting fails gracefully (skipped with a log entry) if Supabase is not configured

Current RSVP payload shape:

- `guestNames: string[]`
- `attending: "yes" | "no"`
- `guests: number`
- `dietary?: string`
- `message?: string`
- `website?: string`

### Live projector

- `/live` is the projector/live feed page, marked `noindex`
- the page currently renders with stub data — the games backend will be built in a future phase
- type contracts live in `src/widgets/live-projector/types.ts`: `LiveSnapshot`, `LiveFeedEventSnapshot`, `LeaderboardEntrySnapshot`
- connecting real data means wiring `LiveProjectorPage.tsx` to a new `/api/live` endpoint

---

## Shared Config, UI, and Styling

`@/shared/config` is the source of truth for wedding data, guest data, and metadata helpers.

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
- default motion curve is `[0.22, 1, 0.36, 1]`; import `MOTION_EASE` from `@/shared/lib` — do not hardcode the array inline

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

These pieces intentionally use hydration-safe patterns such as `useSyncExternalStore` and staged mount logic.

---

## Supabase

Supabase is currently used only for RSVP rate-limiting via a `consume_rate_limit_window` RPC function.
A full games backend will be built in a future phase using Supabase migrations.

If `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SECRET_KEY` are not set, `enforceRateLimit` skips silently — requests go through without rate-limiting.

Required runtime env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Supported fallbacks:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase CLI (`supabase` devDependency) is available for future migration work. When starting a new games backend phase, run `pnpm exec supabase init` to reinitialize the local project directory.

---

## Server Patterns

### Deferred tasks

On Vercel serverless, the runtime may shut down immediately after the response is sent. Fire-and-forget (`void asyncFn()`) is unreliable. All post-response work must go through the deferred tasks pattern:

1. Repository methods return `{ data, deferredTasks: DeferredTask[] }`
2. Route handlers call `after(() => runDeferredTasks(tasks))` after sending the response
3. `runDeferredTasks` uses `Promise.allSettled` so one failure does not block others

Each deferred task is labeled as `{ label, run }`, so failures remain attributable in structured logs.

### Unified error envelopes and request IDs

All `/api/*` error responses share the same shape:

- `error: string`
- `code: string`
- `requestId: string`
- `retryAfterSeconds?: number`

Request IDs come from `x-request-id`, then `x-vercel-id`, then `crypto.randomUUID()`.

### Structured server logging

Prefer `logServerInfo()` and `logServerError()` from `@/shared/lib/server` over direct `console.error` / `console.log` in server code.
Structured log payloads include `scope`, `event`, `requestId`, optional `context`, and serialized error details.

---

## Quality Gates

Minimum local verification before considering the repo ready:

```bash
pnpm lint
pnpm test
pnpm build
```

CI runs `pnpm test:coverage` to enforce coverage thresholds on the current safety-net surface.

---

## Key Rules

- Never hardcode the wedding date; import `WEDDING_DATE`
- Never hardcode the default motion curve `[0.22, 1, 0.36, 1]` inline; import `MOTION_EASE` from `@/shared/lib`
- Keep locale message files in sync
- Prefer server components by default
- Keep invite route metadata localized
- Use existing barrel exports when they exist
- Treat `/invite/[slug]` and `/live` as intentionally non-indexed surfaces
- Do not remove the current hydration-safe patterns in countdown, splash, language switcher, or theme provider
- Use the deferred tasks pattern for any post-response async work in API routes — never `void asyncFn()`

---

## Useful Commands

```bash
pnpm dev
pnpm test
pnpm test:coverage
pnpm lint
pnpm build
pnpm supabase:login
```
