# ADR 0001: Frontend-only mock-first phase contract

- Status: Accepted
- Date: 2026-03-30

## Context

`diandmax` is currently in a frontend-only rewrite phase. The previous backend runtime was removed deliberately. The team needs fast and safe UI/UX and domain-contract iteration without mixing in partially restored backend code.

## Decision

Until a separately approved backend re-entry phase begins:

1. The following stay out of scope:
   - API routes;
   - database access;
   - Supabase/Auth/Realtime integrations;
   - email sending;
   - production backend mutations.
2. Runtime behavior is modeled through stable frontend seams:
   - `GuestRepository`
   - `ActivityFeedSource`
   - `RsvpSubmissionService`
3. Future backend work must integrate through these existing contracts instead of bypassing UI/domain layers.

## Consequences

- Positive:
  - predictable frontend scope;
  - lower testing and review complexity;
  - reduced risk of reviving legacy backend debt by accident.
- Negative:
  - features that require server persistence/realtime are postponed;
  - some integration risk is deferred to the future backend phase.
