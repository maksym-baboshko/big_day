# diandmax — Wedding Invitation & Event Hub

Wedding website for Maksym & Diana.
Date: June 28, 2026.
Venue: Grand Hotel Terminus, Bergen, Norway.

> Keep `AGENTS.md` and `CLAUDE.md` aligned.
> If a local `GEMINI.md` exists, keep that one aligned too.

This file mirrors `CLAUDE.md`. Refer to `CLAUDE.md` for the full specification.

---

## Quick Reference

**Project:** diandmax
**Stack:** Next.js App Router · TypeScript strict · Tailwind v4 · motion/react · next-intl · shadcn/ui · TanStack Query · Zustand · Nuqs · Supabase Postgres · Drizzle ORM · Biome · Vitest · Playwright · GitHub Actions
**Architecture:** Feature-Sliced Design (FSD) hybrid
**Dependency direction:** `app → widgets → features → entities → shared`

---

## Routes

| Route | Description |
|---|---|
| `/` and `/en` | Full invitation page |
| `/invite/[slug]` | Personalized invite (noindex) |
| `/live` | Activity feed — stub data (noindex) |
| `/api/rsvp` | RSVP POST endpoint |

---

## Critical Imports

```ts
import { WEDDING_DATE, WEDDING_DATE_ROMAN } from "@/shared/config"
import { VENUE } from "@/shared/config"
import { MOTION_EASE } from "@/shared/lib"
import { cn } from "@/shared/lib"
// i18n client navigation:
import { useRouter, usePathname, Link } from "@/shared/i18n/navigation"
```

---

## Forbidden Patterns

- `any` in TypeScript
- hardcoded colors (use CSS variables)
- hardcoded `[0.22, 1, 0.36, 1]` (import `MOTION_EASE`)
- hardcoded wedding date, venue, couple names (import from `@/shared/config`)
- DB queries in UI components
- features importing each other's internals
- `void asyncFn()` in API routes (use deferred tasks)
- filters/search in Zustand (use Nuqs URL state)
- circular dependencies

---

## Quality Gates

```bash
pnpm typecheck   # must pass
pnpm lint        # biome check — must pass
pnpm build       # must pass
```

---

## Hydration-Sensitive (do not refactor)

- `features/countdown/Countdown.tsx`
- `widgets/splash/Splash.tsx`
- `features/language-switcher/LanguageSwitcher.tsx`
- `features/theme-switcher/ThemeProvider.tsx`
