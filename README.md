# 💍 Big Day — Wedding Invitation

> Personal wedding invitation website for **Maksym & Diana**
> June 28, 2026 · Grand Hotel Terminus · Bergen, Norway

---

## Stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 · strict mode |
| **Styling** | Tailwind CSS v4 + CSS variables |
| **Animation** | Framer Motion 12 |
| **i18n** | next-intl 4 · Ukrainian (default) + English |
| **Forms** | react-hook-form + zod |
| **Architecture** | Feature-Sliced Design (FSD-lite) |

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
pnpm build          # production build
pnpm start          # serve production build
npx tsc --noEmit    # type-check without building
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/         # App Router layout + main page
│   └── api/rsvp/         # RSVP API route
├── features/             # Interactive UI features
│   ├── countdown/        # Live countdown (useSyncExternalStore)
│   ├── language-switcher/ # uk/en toggle
│   └── theme-switcher/   # Dark/light mode
├── shared/
│   ├── config/           # Wedding data — single source of truth
│   ├── i18n/             # next-intl config + translation messages
│   ├── lib/              # cn(), fonts
│   └── ui/               # Primitive components
└── widgets/              # Full-page sections
    ├── splash/            # Envelope intro screen
    ├── navbar/            # Sticky navigation
    ├── hero/              # Names + countdown
    ├── our-story/         # Couple portraits + narrative
    ├── timeline/          # Day schedule
    ├── location/          # Venue + Google Maps
    ├── dress-code/        # Color palette guide
    ├── gifts/             # Gift preferences
    ├── rsvp/              # RSVP form
    └── footer/            # Back-to-top + copyright
```

All layers export via `index.ts` barrels — always import from the barrel.

---

## Internationalization

| Locale | URL | File |
|---|---|---|
| Ukrainian (default) | `/` | `src/shared/i18n/messages/uk.json` |
| English | `/en` | `src/shared/i18n/messages/en.json` |

Both files must stay in sync — every key must exist in both.

---

## Wedding Data

All static content lives in `src/shared/config/`:

- **`WEDDING_DATE`** — `new Date("2026-06-28T12:00:00+02:00")` — import this, never hardcode
- **`VENUE`** — name, address, Google Maps embed URL, coordinates
- **`COUPLE`** — names in `{ uk, en }` format
- **`DRESS_CODE`** — color palettes with hex values + bilingual names
- **`guests`** — list with vocative case, seat count, slug + `getGuestBySlug()` / `getAllGuestSlugs()` helpers

---

## Key Conventions

- **Colors** — only via CSS variables (`bg-accent`, `text-text-primary`), never hardcoded hex
- **Tailwind** — v4 canonical classes: `bg-linear-to-b`, `font-cinzel`, `aspect-3/4`, etc.
- **`"use client"`** — only where interactivity or hooks are required; default to server components
- **Images with `fill`** — always include the `sizes` prop; decorative images use `alt=""`
- **Easing** — `[0.22, 1, 0.36, 1]` for all Framer Motion transitions

---

## What's Not Built Yet

- **RSVP backend** — form is complete, `src/app/api/rsvp/route.ts` is a stub
- **Guest-specific pages** — `/[locale]/invite/[slug]` (helpers are ready in config)
