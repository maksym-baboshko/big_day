# Big Day

Big Day is a personal wedding invitation website.

It was built as a small, polished event site rather than a generic landing page: bilingual, animated, and structured around the actual flow of the day. Guests can read the story, check the venue and dress code, open a personal invitation page, and send an RSVP.

The event:

- June 28, 2026
- Grand Hotel Terminus
- Bergen, Norway

## What the site includes

- Ukrainian and English locales
- Accessibility support for keyboard navigation, focus states, and reduced motion
- Animated intro and section reveals
- Live wedding countdown
- Venue details with map embed
- Dress code and gift sections
- RSVP form with validation
- Guest-specific invitation pages by slug
- Light and dark theme switcher

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- next-intl
- react-hook-form + zod
- Resend for RSVP email delivery

## Accessibility and SEO

The site is built with accessibility in mind: keyboard navigation, visible focus states, skip navigation, semantic landmarks, and reduced-motion support are part of the implementation rather than an afterthought.

SEO is also covered with localized metadata, canonical and alternate language links, Open Graph and Twitter cards, and structured event data.

## Running locally

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## RSVP configuration

The RSVP endpoint can send email notifications. For that to work, set these environment variables:

```bash
RESEND_API_KEY=
RSVP_TO_EMAILS=
RSVP_FROM_EMAIL=
RSVP_SUBJECT_PREFIX=
RSVP_DELIVERY_MODE=
```

Notes:

- `RSVP_TO_EMAILS` accepts a comma- or semicolon-separated list
- `RSVP_DELIVERY_MODE=mock` lets you test without sending real email
- if `RSVP_DELIVERY_MODE` is not `mock`, both `RESEND_API_KEY` and `RSVP_TO_EMAILS` are required

## Project structure

The codebase follows a lightweight FSD-style structure:

```text
src/
├── app/                 # routes, layouts, API handlers
├── features/            # focused interactive features
├── shared/              # config, i18n, utilities, UI primitives
└── widgets/             # full-page sections and composed screens
```

Some notable areas:

- `src/shared/config` stores wedding data, including the date, venue, dress code, and guest list
- `src/shared/i18n/messages` contains `uk.json` and `en.json`
- `src/app/[locale]/invite/[slug]/page.tsx` renders personal invitation pages
- `src/app/api/rsvp/route.ts` handles RSVP submissions

## A few project rules

- Do not hardcode the wedding date; use `WEDDING_DATE` from shared config
- Do not hardcode colors in components; use the design tokens from `globals.css`
- Keep `uk.json` and `en.json` in sync
- Prefer server components unless client interactivity is actually needed
- Import through barrel exports where they exist

## Why this project exists

This repository is both a real invitation website and a small frontend craft project. The goal was to make something warm and personal, while still keeping the codebase clean enough to scale with features like personal guest pages and RSVP delivery.
