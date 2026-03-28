# diandmax — Frontend Contract

Wedding website for Maksym & Diana.  
Date: June 28, 2026.  
Venue: Grand Hotel Terminus, Bergen, Norway.

> Keep `AGENTS.md` and `CLAUDE.md` aligned.
> If a local `GEMINI.md` exists, keep that one aligned too.

This repository is the current rewrite of `diandmax` in a **frontend-only, mock-first** phase.
The old backend runtime is intentionally removed. The future server layer will be reintroduced later
behind explicit contracts instead of evolving the deleted implementation.

---

## Current Scope

- `/` and `/en` render the invitation homepage
- `/invite/[slug]` renders typed personalized invites from mock guest fixtures
- `/live` renders the live projector from typed mock feed data
- `/live?state=populated|empty|error` is the canonical local/demo state switch
- RSVP submits into a local mock service backed by `localStorage`
- Storybook covers reusable UI and design-system phase 2 canonical surfaces
- Chromatic is wired through GitHub Actions and requires `CHROMATIC_PROJECT_TOKEN`

### Explicitly out of scope in the current phase

- API routes
- database access
- Supabase Auth / Realtime
- email sending
- production backend mutations

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 + CSS variables |
| Motion | `motion/react` |
| i18n | `next-intl` |
| Forms | `react-hook-form` + `zod` |
| UI system | custom reusable primitives + Lucide-ready DS direction |
| Testing | Vitest (unit + Storybook browser lanes) + Playwright + page-level screenshots |
| Component docs | Storybook 10 |
| Visual review | Chromatic |
| Lint/format | Biome |
| CI | GitHub Actions |
| Analytics | `@vercel/analytics` + `@vercel/speed-insights` |

### Future-phase policy

Do not keep dormant runtime dependencies installed just because they might be useful later.
Query-state libraries, Supabase, Drizzle, and related backend tooling should return only when a
concrete owned feature lands in the same change.

## Repository Organization

- canonical config content lives in `configs/<tool>/`
- root keeps only machine entrypoints and top-level human entrypoints
- `docs/architecture.md` is the deeper architecture reference
- `.cache/` is for private local state and build caches
- `artifacts/` is for readable generated outputs and reports
- `.next/` stays as a deliberate Next.js runtime exception
- `components.json` remains the root exception for shadcn CLI
- `tsconfig.json` stays in root as a thin shell because TS Server/editor discovery and relative config resolution are root-sensitive
- `biome.json` stays in root as a thin shell because Biome CLI/editor discovery is most predictable from the repository root
- Vitest and Playwright are script-driven from `package.json` via `--config`, so they do not keep root config files

---

## Architecture

Feature-Sliced Design (FSD) hybrid.

Dependency direction:

```text
app → widgets → features → entities → shared
```

### Layer responsibilities

| Layer | Purpose |
|---|---|
| `app/` | routes, metadata, top-level layouts |
| `widgets/` | page sections and composite UI |
| `features/` | focused interactive behavior |
| `entities/` | domain contracts, typed fixtures, repositories/adapters |
| `shared/` | global config, i18n, utilities, UI primitives |

### Testing topology

- unit tests stay colocated with source files as `*.test.ts(x)`
- Storybook stories stay colocated with reusable UI and drive the browser component-test lane
- shared test mocks/helpers live in `src/testing/`
- route-level and visual regression specs stay in `e2e/`

### Current domain ownership

- `entities/guest`
  - `GuestProfile`
  - `InvitationContent`
  - `GuestRepository`
  - typed mock guest repository and slug lookups
- `entities/event`
  - `FeedEvent`
  - `LeaderboardEntry`
  - `ActivityFeedSnapshot`
  - `LiveFeedState`
  - `ActivityFeedSource`
  - typed mock feed source and state resolver
- `features/rsvp`
  - `RsvpSubmissionInput`
  - `RsvpSubmissionResult`
  - `RsvpSubmissionService`
  - mock submission service using `localStorage`

### Current runtime rules

- `shared/config` contains only real global site constants and metadata helpers
- guest fixtures must not live in `shared/config`
- UI must not `fetch` live data in the current phase
- no DB queries, no email sending, no server-only utilities in UI flows
- `/live` must use typed mock source, not `/api/*`
- personalized invites must resolve through `entities/guest`
- locale priority is `URL > NEXT_LOCALE cookie > first-visit Accept-Language`
- first-visit locale detection resolves `uk` and `ru` to `uk`; every other locale resolves to `en`

---

## Public UI APIs

Stable reusable exports in the current phase:

- `Button`
- `Input`
- `Textarea`
- `GlassPanel`
- `SurfacePanel`
- `SectionShell`
- `SectionHeading`
- `PageEnterReveal`
- `InViewReveal`
- `Navbar`
- `Countdown`
- `LanguageSwitcher`
- `ThemeSwitcher`
- `TimelineRail`
- `LeaderboardList`
- `LeaderboardState`
- `Footer`
- `InvitationHeroIntro`
- `RsvpPanel`
- `RsvpFieldGroup`
- `RsvpActionRow`
- `InvitationSummaryCard`
- `TimelineItemCard`
- `FooterNavCluster`
- `FooterSignatureBlock`
- `BackToTopControl`
- `FeedEventCard`
- `FeedStatePanel`
- `LeaderboardPanel`
- `LeaderboardStatePanel`

Phase 2 is a controlled unification redesign:

- RSVP panel language is the canonical surface reference
- invitation-first surfaces lead the system direction
- `/live` follows the same surface language where it is genuinely reusable
- page-specific markup should stay local unless it becomes a canonical system pattern
- `SurfacePanel` stays narrow; RSVP-specific visual treatment belongs in `RsvpPanel`
- `SectionWrapper` is a compatibility wrapper; new section work should prefer `SectionShell`
- `VisitedRouteScript` is the single source of truth for writing the last visited route

Storybook is for these reusable blocks and their variants, not for full pages.

---

## Critical Imports

```ts
import { WEDDING_DATE, WEDDING_DATE_ROMAN } from "@/shared/config";
import { VENUE } from "@/shared/config";
import { MOTION_EASE, cn } from "@/shared/lib";

import { getAllGuestSlugs, getGuestBySlug, getInvitationContent } from "@/entities/guest";
import { mockActivityFeedSource, resolveLiveFeedState } from "@/entities/event";
import { mockRsvpSubmissionService } from "@/features/rsvp";

import { usePathname, Link } from "@/shared/i18n/navigation";
```

---

## Forbidden Patterns

- `any` in TypeScript
- hardcoded colors instead of CSS variables
- hardcoded motion curve instead of `MOTION_EASE`
- hardcoded wedding metadata instead of `@/shared/config`
- domain fixtures in `shared/config`
- API routes or server code for current invitation/live flows
- DB queries in UI components
- cross-feature internal imports
- circular dependencies

---

## Quality Gates

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:storybook
pnpm test:e2e
pnpm build
pnpm build-storybook
```

### Test taxonomy

- `pnpm test` → unit Vitest project
- `pnpm test:storybook` → Storybook-driven browser tests through `@storybook/addon-vitest`
- `pnpm test:e2e` → Playwright route flows and screenshot baselines
- `pnpm test:coverage` → current unit coverage baseline

### Browser verification policy

- Minor local visual tweaks can stop at quick safety checks during iteration:
  - `pnpm lint`
  - `pnpm typecheck`
- Substantial UI/UX changes, or any UI/UX batch before commit, must end with a verification pass.
- Minimum required full lane for substantial UI/UX work:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm test:e2e`
- If the change touches reusable UI surfaces, stories, or visual baselines, also run the relevant visual lane:
  - `pnpm test:storybook`
  - `pnpm build-storybook`
- Do not leave a substantial UI/UX change or a UI/UX commit batch with failing visual, storybook, or e2e checks.
  Fix the regression or update the approved baseline in the same change, then rerun the affected lane.
- Prefer canonical script-driven lanes over raw tool invocations:
  - `pnpm test:e2e`
  - `pnpm test:storybook`
  - `pnpm smoke:history-restore:dev`
- Do not treat raw `pnpm exec playwright test ...` as the canonical verification path in this repo.
  Playwright is configured via `package.json` scripts and explicit `--config` wiring.
- In the Codex desktop sandbox on macOS, ad-hoc browser launches can fail with MachPort / permission errors.
  Treat that as an environment limitation first, not as automatic evidence of a product bug.
- If a build or e2e run fails with `Another next build process is already running`, check for a stale
  `.next/lock` left by an interrupted build, clear it, and rerun the canonical script.
- When reporting browser-test results, prefer the script-driven lane first and mention sandbox instability
  only when the failure is genuinely environment-related.

### Git hooks

- `pre-commit` runs `lint-staged` only
- `pre-push` runs `pnpm typecheck` and `pnpm test`

### CI lanes

- `quality`
- `unit`
- `build`
- `storybook-build`
- `storybook-tests`
- `e2e`
- separate `chromatic` workflow

### Visual regression

- `e2e/visual.spec.ts` owns current page-level screenshot baselines
- homepage and personalized invite use stabilized above-the-fold screenshots
- `/live` uses full-screen baselines for empty and error states
- Playwright screenshot baselines are committed without OS suffixes and the canonical screenshot lane runs on macOS CI to avoid Linux-vs-mac rendering drift

### Chromatic

- workflow file: `.github/workflows/chromatic.yml`
- required secret: `CHROMATIC_PROJECT_TOKEN`

---

## Hydration-Sensitive

Do not casually refactor these:

- `features/countdown/Countdown.tsx`
- `widgets/splash/Splash.tsx`
- `shared/ui/PageEnterReveal.tsx`
- `shared/ui/InViewReveal.tsx`
- `features/language-switcher/LanguageSwitcher.tsx`
- `features/theme-switcher/ThemeProvider.tsx`

---

## Future Backend Re-entry

The next backend phase must plug into the existing frontend contracts instead of replacing them.

Expected re-entry points:

- `GuestRepository`
  - mock today
  - DB-backed later
- `RsvpSubmissionService`
  - localStorage mock today
  - API-backed mutation later
- `ActivityFeedSource`
  - mock snapshots today
  - polling + realtime adapter later

Expected future server contracts:

- `POST /api/rsvp` ← accepts `RsvpSubmissionInput`, returns `RsvpSubmissionResult`
- `GET /api/activity-feed` ← returns `ActivityFeedSnapshot`
- realtime payloads must serialize to `FeedEvent`

Backend artifacts stay out of the repository until that phase starts for real. When it does, the
same change must restore `drizzle.config.ts`, add schema/migrations, define the server env
contract, and wire new backend-only dependencies through the existing repository/service seams.

Do not reintroduce backend code without preserving these frontend-facing shapes.
