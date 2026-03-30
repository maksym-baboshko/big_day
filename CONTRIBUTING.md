# Contributing to diandmax

Thanks for contributing to `diandmax`.

This repository is currently in a **frontend-only, mock-first** phase. The active runtime does not include backend code, API routes, database access, auth, or email delivery. All changes must respect the current frontend seams:

- `GuestRepository`
- `ActivityFeedSource`
- `RsvpSubmissionService`

## 1) Before you start

1. Read:
   - `README.md`
   - `AGENTS.md`
   - `docs/architecture.md`
2. Confirm your change preserves the dependency direction:

```text
app → widgets → features → entities → shared
```

## 2) Local setup

```bash
pnpm install
pnpm setup:browsers
```

## 3) Baseline quality gates

Minimum for most changes:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

For reusable UI, stories, animations, or visual baseline changes:

```bash
pnpm test:storybook
pnpm build-storybook
pnpm test:e2e
```

For substantial UI/UX changes before merge, also run:

```bash
pnpm build
```

## 4) PR checklist

Before opening a PR:

- [ ] Scope complies with the frontend-only phase contract.
- [ ] No backend runtime additions (API routes/DB/auth/email).
- [ ] Dependency direction across layers is preserved.
- [ ] Tests are added/updated for changed behavior.
- [ ] Stories are updated for reusable surfaces (where applicable).
- [ ] If page visuals changed, e2e screenshot baselines are updated in the same change set.
- [ ] If an architecture contract changed, add an ADR in `docs/adr/`.

## 5) Story rules

- Storybook is a reusable API/composition catalog, not a page gallery.
- API stories must be args-driven.
- Do not expose controls for `children`, JSX, icons, or non-serializable domain objects.
- Motion-heavy composition stories must use a stable baseline (typically `motion: "reduce"`).

## 6) ADR policy

Use ADRs for decisions that change:

- layer/module contracts;
- public APIs of reusable components;
- quality gates or CI policy;
- strategic runtime constraints for the current phase.

Format and index: `docs/adr/README.md`.

## 7) CODEOWNERS and review

`CODEOWNERS` defines required reviewers for critical paths. If your PR touches owned paths, wait for at least one owner approval before merge.
