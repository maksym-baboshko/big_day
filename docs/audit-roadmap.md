# diandmax Technical Audit, Roadmap, and PR Plan

- Date: 2026-03-30
- Phase: Frontend-only, mock-first
- Scope: `src/`, `configs/`, `e2e/`, `.github/workflows`, architecture/governance artifacts

## 1. Executive Summary

1. The architectural foundation is strong: FSD-hybrid direction is clear and consistent (`app → widgets → features → entities → shared`).
2. The biggest current risk is not architecture drift, but test protection gaps for large UI hotspots.
3. CI layering is mature for this phase (quality/unit/build/storybook/e2e/chromatic), but governance automation is still incomplete.
4. Storybook and visual review setup are good; accessibility is enabled but not fully enforced as a policy gate.
5. i18n routing and locale behavior are thoughtfully implemented with clear precedence rules.
6. Type safety and contracts are in good shape (`strict` TS, `zod`, typed mocks), reducing contract drift risk.
7. Baseline security headers exist, but broader hardening policy is not yet formalized.
8. Performance governance currently lacks explicit measurable budgets.
9. The project is already above-average for its stage; remaining work is mostly execution discipline and risk coverage.

## 2. Scorecard

| Category | Score | Notes |
|---|---:|---|
| Architecture and boundaries | 8/10 | Good layering and runtime seam discipline |
| Code structure and hygiene | 7/10 | Predictable structure, some guardrails still manual |
| Components and design system | 7/10 | Strong direction, but some oversized hotspot components |
| React/Next correctness | 8/10 | App Router, metadata, i18n, route handling are solid |
| TypeScript/contracts | 8/10 | Strict typing, schema validation, typed fixtures |
| Testing strategy | 6/10 | Good lanes, but limited targeted tests for complex UI nodes |
| Accessibility and UX | 7/10 | Good baseline, missing stronger automated enforcement |
| CI/CD and quality gates | 8/10 | Strong pipeline structure |
| Performance and operations | 5/10 | No formal perf budgets yet |
| Security/config/governance | 6/10 | Baseline exists, policy depth still growing |
| Maintainability/scalability | 7/10 | Scalable base, change-risk concentrated in hotspots |

## 3. Strengths to Preserve

- Frontend-only mock-first contract and explicit scope boundaries.
- FSD-hybrid layer direction and domain seam ownership.
- Script-driven test topology (`pnpm test`, `pnpm test:storybook`, `pnpm test:e2e`).
- Storybook + Chromatic integration as a real quality lane.
- Typed domain contracts and schema validation around RSVP flows.

## 4. Findings

### F-01 — High — Testing / Maintainability
- **Problem:** Large, behavior-dense components have limited direct automated protection.
- **Why it matters:** Regression risk is elevated for key user flows.
- **Evidence:**
  - `src/widgets/activity-feed/FeedEmptyState.tsx`
  - `src/features/rsvp/components/RsvpFormSections.tsx`
  - `src/widgets/splash/Splash.tsx`
  - `src/widgets/navbar/HeaderFrame.tsx`
- **Recommendation:** Add focused component-level tests for behavior and accessibility contracts.
- **Priority:** Now.

### F-02 — Medium — Architecture Enforcement
- **Problem:** Layer boundaries are documented, but not fully enforced with automated import-direction checks.
- **Why it matters:** Boundary drift grows with team/project size.
- **Evidence:** Architecture direction documented in ADR and repo docs.
- **Recommendation:** Add automated dependency-direction gate in CI.
- **Priority:** Now.

### F-03 — Medium — Accessibility
- **Problem:** Storybook a11y is available, but policy-level enforcement is not explicit.
- **Why it matters:** Accessibility regressions may slip through reusable surfaces.
- **Evidence:** Storybook addons include a11y; no dedicated enforceable a11y lane policy documented.
- **Recommendation:** Define canonical a11y-required stories and enforce in CI.
- **Priority:** Now.

### F-04 — Medium — Performance
- **Problem:** No measurable performance budget tooling/gates.
- **Why it matters:** UI iteration can silently increase cost.
- **Evidence:** No explicit budget configuration found.
- **Recommendation:** Introduce lightweight budget checks for core routes.
- **Priority:** Soon.

### F-05 — Low/Medium — Security Hardening
- **Problem:** Security headers are present but minimal.
- **Why it matters:** Better baseline hardening reduces browser attack surface.
- **Evidence:** Basic headers in Next config.
- **Recommendation:** Gradually expand policy where deployment constraints allow.
- **Priority:** Later.

### F-06 — Medium — Governance Automation
- **Problem:** Governance docs now exist, but execution needs operational follow-through.
- **Why it matters:** Documentation without CI enforcement can decay.
- **Evidence:** CONTRIBUTING/ADR/CODEOWNERS introduced.
- **Recommendation:** Pair governance docs with CI gates and PR checklist discipline.
- **Priority:** Now.

## 5. Benchmark vs Strong Teams

### Relevant practices to adopt now
- Enforce architecture boundaries in CI.
- Keep visual and interaction tests deterministic.
- Treat reusable UI accessibility as a required quality lane.
- Use ownership mapping (`CODEOWNERS`) for critical paths.
- Introduce lightweight performance budgets early.

### Practices to defer (premature now)
- Microfrontends.
- Heavy release orchestration and enterprise process overhead.
- Backend runtime re-entry in this phase.
- Overly complex platform tooling beyond immediate risk needs.

## 6. Roadmap

### Wave 1 — Quick Wins
- **Goal:** Convert governance into execution discipline.
- **Outcomes:** CONTRIBUTING + CODEOWNERS + ADR usage in PR flow.
- **Dependencies:** None.
- **Exit criteria:** PRs consistently follow checklist and ownership routing.

### Wave 2 — Structural Quality
- **Goal:** Reduce regression risk in hotspot components.
- **Outcomes:** Targeted tests + boundary enforcement + stronger a11y checks.
- **Dependencies:** Wave 1 governance baseline.
- **Exit criteria:** Hotspot tests stable, CI catches boundary violations.

### Wave 3 — Scaling and Operations
- **Goal:** Add measurable non-functional quality controls.
- **Outcomes:** Performance budgets + incremental security hardening.
- **Dependencies:** Stable quality lanes from Wave 2.
- **Exit criteria:** Budget reports and hardening policy integrated into CI/review.

## 7. PR Plan

### PR-1: Hotspot Tests Batch 1
- **Goal:** Protect critical nav/splash behavior.
- **Scope:** `HeaderFrame`, `Splash` tests.
- **Acceptance:** Keyboard/focus/timer behavior validated.
- **Risk:** Medium.

### PR-2: Hotspot Tests Batch 2
- **Goal:** Protect RSVP and live empty/error rendering logic.
- **Scope:** `RsvpFormSections`, `FeedEmptyState` tests.
- **Acceptance:** Error/variant/aria behavior validated.
- **Risk:** Medium.

### PR-3: Boundary Gate in CI
- **Goal:** Enforce FSD dependency direction automatically.
- **Scope:** Add import-direction checks + CI integration.
- **Acceptance:** Deliberate violation fails CI.
- **Risk:** Medium.

### PR-4: Storybook Accessibility Enforcement
- **Goal:** Make reusable surface accessibility checks required.
- **Scope:** Canonical a11y-required stories + CI checks.
- **Acceptance:** a11y violations block merge (with explicit documented exceptions).
- **Risk:** Medium.

### PR-5: Performance Budget Baseline
- **Goal:** Introduce route-level performance budgets.
- **Scope:** Budget config for `/`, `/invite/[slug]`, `/live`.
- **Acceptance:** CI reports budget regressions.
- **Risk:** Medium.

## 8. Standards to Adopt

- **Naming:** Domain-first module names, avoid generic catch-all folders.
- **Boundaries:** Respect layer direction and avoid cross-feature internals.
- **Extraction:** Extract only for clear ownership, complexity reduction, or test seam value.
- **Testing:** Any hotspot-sized component should have targeted behavior tests.
- **Stories:** API stories are args-driven; composition stories deterministic and control-safe.
- **CI:** Required checks depend on change type (unit-only vs reusable UI vs visual changes).
- **Docs:** Architecture contract changes require ADR updates.
- **Review:** Ownership and checklist are mandatory, not optional.
- **Definition of Done:** Code + tests + docs + verification evidence.

## 9. What Not to Do Yet

- Do not introduce microfrontends.
- Do not add heavyweight release machinery without real operational need.
- Do not reintroduce backend runtime in the current frontend-only phase.
- Do not add enterprise process layers that increase friction more than value.

## 10. Next Actions

1. Implement hotspot test batch 1 (`HeaderFrame`, `Splash`).
2. Implement hotspot test batch 2 (`RsvpFormSections`, `FeedEmptyState`).
3. Add CI boundary-direction gate.
4. Add Storybook a11y enforcement policy.
5. Add baseline performance budget checks for core routes.

---

## Notes

- This document is intentionally decision-complete and implementation-oriented.
- Future backend notes are out-of-scope for immediate execution and remain future-phase only.
