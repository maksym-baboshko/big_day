# ADR 0002: FSD-hybrid dependency direction

- Status: Accepted
- Date: 2026-03-30

## Context

The codebase combines Next.js App Router with an FSD-hybrid module layout. Without a formal dependency direction, growing teams typically introduce cycles, cross-layer coupling, and unclear ownership.

## Decision

The canonical dependency direction is:

```text
app → widgets → features → entities → shared
```

Rules:

1. Dependencies must flow downward only.
2. `shared` must not own domain fixtures.
3. `features` must not import internals of other `features`.
4. Public module APIs should stay predictable (`index.ts`); deep imports require explicit justification.

## Consequences

- Positive:
  - reduced coupling across layers;
  - easier scaling for collaborative development;
  - clearer code ownership boundaries.
- Negative:
  - sometimes requires extra adapters/facades;
  - increases expectations for review and lint automation discipline.
