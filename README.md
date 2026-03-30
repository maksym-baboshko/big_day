# diandmax

Frontend-only wedding invitation and event-hub foundation for Maksym & Diana.

Current phase:

- invitation homepage at `/` and `/en`
- personalized invites at `/invite/[slug]`
- mock-driven live screen at `/live`
- RSVP mock submission via `localStorage`
- controlled invitation-first design-system phase 2 with canonical surface primitives
- Storybook + Chromatic for reusable UI and canonical surface stories
- Vitest unit tests + Storybook browser tests + Playwright visual regression baselines

## Routes

| Route | Purpose |
|---|---|
| `/` | Ukrainian homepage |
| `/en` | English homepage |
| `/invite/[slug]` | Personalized invite, `noindex` |
| `/live` | Live projector, `noindex` |
| `/live?state=populated|empty|error` | Mock live state switch |

### Locale resolution

- explicit locale in the URL wins
- `NEXT_LOCALE` cookie wins over first-visit detection
- first visit without locale or cookie uses `Accept-Language`
- `uk` and `ru` resolve to `uk`; every other locale resolves to `en`

## Local setup

```bash
pnpm install
pnpm setup:browsers
pnpm typecheck
pnpm lint
pnpm test
pnpm test:storybook
pnpm test:e2e
pnpm smoke:history-restore:dev
pnpm build
pnpm build-storybook
```

Browser-based lanes use Playwright under the hood. Install Chromium once before running
`pnpm test:storybook`, `pnpm test:e2e`, or `pnpm smoke:history-restore:dev`:

```bash
pnpm setup:browsers
```

`pnpm smoke:history-restore:dev` is a local-only diagnostic lane for the known `next dev`
back/forward restore path. It expects a running dev server on `http://localhost:3000` and lives
with the rest of the browser checks under `e2e/smoke/`.

## Repository layout

- `configs/<tool>/` is the canonical home for real config content.
- root keeps only machine entrypoints and high-signal docs.
- `docs/architecture.md` is the deeper architecture reference.
- `docs/deep-technical-audit-prompt.md` is the reusable repo-specific prompt for a deep engineering audit.
- `.cache/` stores private local/build state.
- `artifacts/` stores readable generated outputs and reports.
- `components.json` stays in root as the shadcn project manifest.
- `.next/` remains a deliberate Next.js runtime exception because nested `distDir` breaks generated type validators.
- `tsconfig.json` stays in root as a thin shell because TS Server/editor discovery and relative path resolution are root-sensitive.
- `biome.json` stays in root as a thin shell because CLI/editor discovery is more predictable from the repository root.
- Vitest and Playwright load their canonical configs via `package.json` scripts, so they do not need root config files.

### Storybook

```bash
pnpm storybook
pnpm build-storybook
```

### Chromatic

First-time local baseline publish:

```bash
CHROMATIC_PROJECT_TOKEN=your-token pnpm chromatic
```

Local Chromatic notes:

- `pnpm chromatic` always publishes from the current local worktree; it does not intentionally reuse an old cached Storybook build
- multiple local publishes can still appear under the same commit SHA when changes are uncommitted, so commit hash alone is not enough to identify which local publish you are looking at
- when debugging a failing local publish, use the exact build URL and build number from the CLI output, and compare the failure trace to the current story code before concluding that Chromatic is showing stale results

Then add the same token as a repo secret:

```text
CHROMATIC_PROJECT_TOKEN
```

The existing workflow in `.github/workflows/chromatic.yml` will then publish Storybook builds on `main`, `develop`, and pull requests targeting those branches.

Do not commit the raw project token into the repository. Keep it only in your local environment and in GitHub Actions secrets.


## Engineering governance

- Contribution policy: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Architecture decisions (ADR): [`docs/adr/README.md`](./docs/adr/README.md)
- Architecture contract: [`docs/architecture.md`](./docs/architecture.md)

## Current architecture

- FSD hybrid: `app → widgets → features → entities → shared`
- `entities/guest` owns personalized invite fixtures and lookups
- `entities/event` owns `/live` mock snapshots and state contracts
- `features/rsvp` owns the submission contract and mock adapter
- `shared/config` contains only true global site constants
- canonical configs live under `configs/`
- root bridge files preserve normal tool discovery without root clutter
- phase 2 is a controlled unification redesign, not strict parity preservation
- RSVP panel language is the canonical surface reference for invitation-first UI

## Design system phase 2

Canonical public surface layer:

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

Second-wave live public composites:

- `FeedEventCard`
- `FeedStatePanel`
- `LeaderboardPanel`
- `LeaderboardStatePanel`

Phase-2 rule:

- extract only canonical building blocks and section-level contracts
- keep page-specific markup local when it is not a real reusable system pattern
- keep `SurfacePanel` narrow; RSVP-specific glow/gradient treatment belongs in `RsvpPanel`
- prefer `SectionShell` for new work; `SectionWrapper` remains a compatibility wrapper that preserves legacy `noPadding` semantics
- valid top-level routes write the last visited route through `VisitedRouteScript`; widgets should not duplicate that write client-side
- allow partial redesign when it improves unification without changing the brand direction

The deleted backend stack is not part of the current runtime. Future server work must plug into the
existing frontend contracts instead of reintroducing direct DB/API logic into UI layers. That
means `drizzle.config.ts`, schema folders, migrations, backend env contracts, and backend-only
dependencies stay out of the repo until the backend phase is reintroduced on purpose.

## Test topology

- `pnpm test` runs colocated unit and pure-logic tests through the `unit` Vitest project.
- `pnpm test:storybook` runs Storybook-driven browser component tests through the `storybook` Vitest project.
- `pnpm test:e2e` runs route-level Playwright flows and screenshot baselines from `e2e/`.
- `pnpm smoke:history-restore:dev` verifies the dev-only browser back/forward restore flow from `e2e/smoke/` against a running `localhost:3000`.
- `pnpm test:coverage` enforces the current unit coverage thresholds and writes reports into `artifacts/vitest/coverage/`.
- `src/testing/` is reserved for shared test mocks and helpers only. Tests themselves stay colocated with source files.
- Storybook stories stay in the default test lane; opt out later with `tags: ["!test"]` only for intentionally decorative or unstable stories.

## Hooks and CI

- `pre-commit` runs `lint-staged` only.
- `pre-push` runs `pnpm typecheck` and `pnpm test`.
- CI is layered into `quality`, `unit`, `build`, `storybook-build`, `storybook-tests`, `e2e`, and the separate `chromatic` workflow.

## Audit prompt

For a repo-specific deep technical audit prompt in Ukrainian, see:

- `docs/deep-technical-audit-prompt.md`
