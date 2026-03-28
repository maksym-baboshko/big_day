# diandmax — Architecture Overview

This document is the current architectural contract for the `develop` branch.

The repository is in a **frontend-only, mock-first** phase. The previous backend implementation
has been deliberately removed. The next backend phase must integrate through explicit contracts
instead of reviving the deleted Drizzle/Supabase/Resend stack.

---

## 1. Current Product Scope

Implemented now:

- invitation homepage at `/` and `/en`
- personalized invite pages at `/invite/[slug]`
- live projector at `/live`
- local/demo live states via `/live?state=populated|empty|error`
- RSVP submission via mock service backed by `localStorage`
- Storybook coverage for reusable primitives and composites
- Chromatic workflow for Storybook visual review
- Vitest + Playwright + page-level screenshot regression

Not implemented in the current phase:

- API routes
- database
- email delivery
- auth
- realtime transport
- game hub backend

### Locale resolution

- explicit locale in the URL wins
- `NEXT_LOCALE` cookie wins over first-visit detection
- first visit without locale or cookie uses `Accept-Language`
- `uk` and `ru` resolve to `uk`; every other locale resolves to `en`

---

## 2. Architectural Style

Feature-Sliced Design hybrid:

```text
app → widgets → features → entities → shared
```

Dependencies must flow downward only.

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| `app/` | routes, metadata, top-level layouts, route-level composition |
| `widgets/` | section composition and reusable page composites |
| `features/` | focused user interactions and local stateful behavior |
| `entities/` | domain contracts, typed fixtures, repositories, adapters |
| `shared/` | site-wide config, i18n, utilities, design primitives |

### Hard boundaries

- `shared/` must not own domain fixtures
- `features/` must not import each other’s internals
- UI code must not talk to a backend in the current phase
- data sources must be abstracted behind entity/feature contracts

---

## 3. Repository Topology

The repository uses a hybrid bridge model:

- `configs/<tool>/` is the canonical home for real configuration content
- root keeps only tool entrypoints that must stay discoverable
- `docs/` holds deeper human documentation
- `.cache/` holds private local state and build caches
- `artifacts/` holds generated reports and readable build outputs
- `.next/` remains a deliberate Next.js runtime exception for generated build and type artifacts
- `components.json` remains a root exception for shadcn CLI

Current root bridge files:

- `next.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`
- `biome.json`

Root exceptions are intentional:

- `tsconfig.json` stays in root as a thin shell because TypeScript editor discovery and relative
  `include` / `paths` resolution are config-location sensitive.
- `biome.json` stays in root as a thin shell because CLI/editor discovery is most predictable from
  the repository root.

Script-driven config entrypoints:

- `pnpm test` → `configs/vitest/config.ts`
- `pnpm test:watch` → `configs/vitest/config.ts`
- `pnpm test:storybook` → `configs/vitest/config.ts`
- `pnpm test:coverage` → `configs/vitest/config.ts`
- `pnpm test:e2e` → `configs/playwright/config.ts`

---

## 4. Folder Contract

```text
src/
├── app/
│   ├── not-found.tsx
│   ├── [locale]/
│   │   ├── __not-found/[...segments]/page.tsx
│   │   ├── [...segments]/page.tsx
│   │   ├── page.tsx
│   │   ├── invite/[slug]/page.tsx
│   │   └── live/page.tsx
│   ├── globals.css
│   └── layout.tsx
├── entities/
│   ├── guest/
│   │   ├── model/
│   │   ├── types.ts
│   │   └── index.ts
│   └── event/
│       ├── model/
│       ├── types.ts
│       └── index.ts
├── features/
│   ├── countdown/
│   ├── language-switcher/
│   ├── theme-switcher/
│   └── rsvp/
│       ├── components/
│       ├── schema/
│       ├── services/
│       ├── types.ts
│       └── index.ts
├── shared/
│   ├── config/
│   ├── i18n/
│   ├── lib/
│   └── ui/
├── testing/
│   └── mocks/
└── widgets/
    ├── activity-feed/
    ├── footer/
    ├── navbar/
    ├── personal-invitation/
    ├── timeline/
    └── ...
```

Removed from the active architecture:

- `src/app/api/**`
- `src/infrastructure/**`
- `src/shared/lib/server/**`
- guest fixtures in `src/shared/config/`

---

## 5. Domain Contracts

### Guest domain

`entities/guest` is the source of truth for personalized invite data.

Public contracts:

- `LocalizedText`
- `GuestProfile`
- `InvitationContent`
- `GuestRepository`

Current adapters:

- `mockGuestRepository`
- `getAllGuestSlugs`
- `getGuestBySlug`
- `getInvitationContent`

### Live feed domain

`entities/event` is the source of truth for `/live`.

Public contracts:

- `FeedEventType`
- `FeedEvent`
- `LeaderboardEntry`
- `ActivityFeedSnapshot`
- `LiveFeedState`
- `ActivityFeedSource`

Current adapters:

- `mockActivityFeedSource`
- `resolveLiveFeedState`
- `MOCK_EMPTY_ACTIVITY_FEED_SNAPSHOT`
- `MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT`

### RSVP domain

`features/rsvp` owns the submission contract.

Public contracts:

- `RsvpSubmissionInput`
- `RsvpSubmissionResult`
- `RsvpSubmissionService`

Current adapter:

- `mockRsvpSubmissionService`

The mock adapter validates with the real schema and writes accepted submissions into
`localStorage` under `diandmax:rsvp-submissions`.

---

## 6. Runtime Data Flow

### Homepage

- static site config from `shared/config`
- no backend reads
- i18n from `next-intl`

### Personalized invite

- route receives slug
- slug resolves via `entities/guest`
- view derives localized invitation content from the guest contract
- RSVP uses the mock submission service

### Live projector

- route optionally accepts `state`
- state resolves through `resolveLiveFeedState`
- widget reads from `mockActivityFeedSource`
- empty/error/populated are explicit UI states
- hero-event queue behavior remains client-side

### History restore hardening

- `src/shared/ui/PageEnterReveal.tsx` owns above-the-fold entrance motion and never re-hides content on browser history restore
- `src/shared/ui/InViewReveal.tsx` owns observer-driven reveal below the fold and starts its hide/reveal logic only after synchronous client-side viewport measurement
- valid top-level page routes write the last visited route before hydration through `VisitedRouteScript`
- widgets and page sections must not duplicate that write through client-side trackers
- 404 secondary CTA reads the last valid route instead of emulating browser history

---

## 7. Design System Phase 1

Current reusable public APIs:

- `Button`
- `Input`
- `Textarea`
- `GlassPanel`
- `Navbar`
- `Countdown`
- `LanguageSwitcher`
- `ThemeSwitcher`
- `TimelineRail`
- `LeaderboardList`
- `LeaderboardState`
- `Footer`

Storybook currently covers these reusable primitives/composites rather than full pages.

The current DS rule is:

- preserve visual parity first
- extract only stable repeated surfaces
- avoid introducing a competing visual language

---

## 8. Testing and Visual Safety

### Required local gates

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:storybook
pnpm test:e2e
pnpm build
pnpm build-storybook
```

### Test topology

- unit and pure-logic tests stay colocated with source files as `*.test.ts(x)`
- Storybook stories stay colocated with reusable UI and feed the browser component-test lane
- shared test support code lives in `src/testing/`
- route-level flows and page screenshots stay in `e2e/`

### Vitest projects

- `unit` is the fast Node lane used by `pnpm test`
- `storybook` is the browser lane powered by `@storybook/addon-vitest` and Playwright
- `pnpm test:coverage` currently collects the unit coverage baseline into `artifacts/vitest/coverage/`

### Storybook / Chromatic

- Storybook config lives in `configs/storybook/`
- reusable story preview helpers live in `src/testing/storybook/`
- CI builds Storybook in `.github/workflows/ci.yml`
- CI runs Storybook browser tests in `.github/workflows/ci.yml`
- Chromatic publishing lives in `.github/workflows/chromatic.yml`
- required repo secret: `CHROMATIC_PROJECT_TOKEN`
- local first-publish command: `CHROMATIC_PROJECT_TOKEN=your-token pnpm chromatic`
- Storybook static output lives in `artifacts/storybook/static`
- local Chromatic publishes run against the current local worktree, not an intentionally reused old Storybook build
- multiple local publishes can share the same commit SHA when changes are uncommitted, so SHA alone is not sufficient to identify which local publish you are inspecting
- when debugging a local Chromatic failure, rely on the exact build URL/build number from CLI output and compare the failure trace to the current story code

#### Storybook catalog contract

Storybook is a UI catalog for canonical reusable surfaces, not a page gallery.

Use two story types deliberately:

- API stories
  - for public reusable primitives and canonical composites
  - must be args-driven for the props exposed in Docs
  - should keep controls enabled only for safe, serializable props
- composition stories
  - for larger visual demos or section-level compositions
  - may be render-only
  - should disable misleading controls instead of pretending to be a prop playground

#### Controls rules

- Never expose editable controls for non-serializable props such as:
  - `children`
  - `ReactNode`
  - JSX labels, titles, icons, separators
  - arbitrary domain objects
- If Storybook inference would generate a broken or misleading control, override it explicitly or disable it.
- Nullable text-like props that should stay editable in Docs must use an explicit text control.

#### Story wrappers and determinism

- Prefer shared preview helpers from `src/testing/storybook/canvas.tsx` over ad-hoc wrapper `div`s inside stories.
- Keep preview shells visually consistent: centered surface, fullscreen dark canvas, or section demo shell.
- Time-based and stateful stories should be deterministic whenever feasible.
- Prefer fixed story-only setup over `chromatic.disableSnapshot`; use snapshot opt-outs only when instability is intentional and documented.
- Interaction tests belong only to genuinely interactive components and should not leak global state into following stories.

#### Story authoring checklist

- Decide first whether the story is API or composition.
- Ensure every visible Docs control maps to a prop the story really uses.
- Disable controls for anything non-serializable, misleading, or render-only.
- Reuse canonical canvas helpers where possible.
- Keep the sidebar compact and catalog-first; do not add page-scale showcase stories unless the surface is truly canonical.

### Playwright

- functional specs live in `e2e/*.spec.ts`
- local-only browser diagnostics live in `e2e/smoke/`
- page-level visual baselines live in `e2e/visual.spec.ts`
- visual baselines are committed under `e2e/visual.spec.ts-snapshots/`
- visual baselines intentionally omit OS-specific suffixes
- the canonical screenshot lane runs on pinned `macos-15` CI to avoid cross-version rendering drift
- global tolerance (`threshold: 0.3`, `maxDiffPixelRatio: 0.002`) is set in `configs/playwright/config.ts`
- after any UI change that alters page-level appearance, regenerate baselines: `pnpm test:e2e -- --update-snapshots`
- when upgrading the CI macOS pin, regenerate all baselines and commit them alongside the runner change
- runtime outputs live in `artifacts/playwright/`
- local and CI browser lanes both stay on `localhost`, not `127.0.0.1`, to avoid the known Next Intl refresh-loop issue
- `pnpm smoke:history-restore:dev` is the canonical local-only diagnostic for `next dev` back/forward restore issues and expects an already running `localhost:3000`

---

## 9. Design System Phase 2

Phase 2 is a **controlled unification redesign**, not a strict parity-preservation pass.

The goal is to reduce ad-hoc surface recipes and converge invitation-first UI around a compact set
of canonical surfaces. Partial redesign is allowed when it improves unification without changing
the site’s brand direction.

### Canonical surface reference

`SurfacePanel` is the canonical panel language for invitation-first UI and is derived from the
RSVP panel treatment. Nearby surface-heavy blocks should converge toward that visual system instead
of inventing new one-off panel recipes.

`RsvpPanel` keeps the RSVP-specific glow/gradient recipe as a local composition on top of that
surface language instead of widening `SurfacePanel` with RSVP-only escape hatches.

### Public DS contracts

Canonical primitives:

- `SurfacePanel`
- `SectionShell`
- `SectionHeading`
- `PageEnterReveal`
- `InViewReveal`
- `HeaderFrame`

Invitation-first public composites:

- `InvitationHeroIntro`
- `RsvpPanel`
- `RsvpFieldGroup`
- `RsvpActionRow`
- `InvitationSummaryCard`
- `TimelineItemCard`
- `FooterNavCluster`
- `FooterSignatureBlock`
- `BackToTopControl`

Second-wave live composites:

- `FeedEventCard`
- `FeedStatePanel`
- `LeaderboardPanel`
- `LeaderboardStatePanel`

### Extraction rules

- add a new public surface only when it is canonical, repeated, or a deliberate section-level contract
- keep `SurfacePanel` narrow and reusable; page- or feature-specific styling belongs in local composites
- `SectionWrapper` remains a compatibility wrapper around `SectionShell` and preserves legacy `noPadding` semantics
- do not extract page-specific markup into `shared/ui` just because it exists
- keep page orchestration in `widgets/` or `app/`
- prefer fewer strong public APIs over many weak micro-components

### Current phase-2 direction

- invitation-first surfaces are the primary design-system reference
- `/live` participates in the same surface system, but keeps its more functional shell
- strict `main` parity is no longer the goal for this phase
- hydration and history-restore stability remain mandatory for all public motion primitives

### Git hooks

- `pre-commit` runs `lint-staged` only
- `pre-push` runs `pnpm typecheck` and `pnpm test`
- browser lanes stay in CI/manual runs instead of blocking every push

---

## 9. Hydration-Sensitive Files

These files intentionally use guarded mount logic and should not be casually refactored:

- `src/features/countdown/Countdown.tsx`
- `src/widgets/splash/Splash.tsx`
- `src/shared/ui/PageEnterReveal.tsx`
- `src/shared/ui/InViewReveal.tsx`
- `src/features/language-switcher/LanguageSwitcher.tsx`
- `src/features/theme-switcher/ThemeProvider.tsx`

---

## 10. Config Rules

`shared/config` is reserved for true global site constants:

- wedding metadata
- venue data
- couple data
- metadata helpers

It must not regain:

- guest lists
- live feed fixtures
- RSVP mock payloads

Those belong to domain-owned layers.

---

## 11. Backend Re-entry Contract

The future backend must preserve today’s frontend-facing shapes.

### Planned server entry points

- `POST /api/rsvp`
  - request: `RsvpSubmissionInput`
  - response: `RsvpSubmissionResult`
- `GET /api/activity-feed`
  - response: `ActivityFeedSnapshot`

### Planned realtime shape

- each broadcast event must serialize into `FeedEvent`
- leaderboard snapshots must serialize into `LeaderboardEntry[]`

### Planned data ownership

- guest invitation data remains owned by the guest domain
- RSVP persistence becomes an adapter behind `RsvpSubmissionService`
- activity feed polling/realtime becomes an adapter behind `ActivityFeedSource`

### Migration rule

No backend code may be added directly into widgets or page components.
All future backend work must enter through repository/service interfaces that already exist today.

### Re-entry checklist

Do not restore dormant backend artifacts early.

Only when the backend phase starts in earnest, the same change must:

- restore `drizzle.config.ts`
- add the owned schema and migration directories
- define the server env contract
- install backend-only dependencies alongside their first real usage
- keep `GuestRepository`, `RsvpSubmissionService`, and `ActivityFeedSource` as the frontend-facing seams

---

## 12. Security Hardening Notes

Security headers and CSP are intentionally deferred until the remaining inline-script story is
formalized.

Current inline script usage is limited to localized JSON-LD on
`/Users/boshmax/Home/Coding/Projects/26.03/diandmax.com/src/app/[locale]/page.tsx`.

Theme bootstrapping no longer depends on an inline script; the root layout derives the initial
theme from a synced cookie and the client provider keeps `localStorage` and the cookie aligned.

When CSP is introduced, it must account for the JSON-LD script without breaking hydration or the
Next.js runtime.
