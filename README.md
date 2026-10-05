# A Little Corner of the Internet for You ✦ Happy Birthday!

A tiny interactive birthday world built with Next.js, React, and a lot of love. This project turns a standard web page into a handcrafted digital place: part scrapbook, part music room, part indie game, and part personal letter.

It is designed to feel like walking through a small, magical world built specifically for one person — cozy, playful, nostalgic, and just a little bit chaotic in the best way.

## The feeling

Instead of a typical birthday webpage, this project feels like:

- a world-selection screen with a hamster guide
- a scrapbook full of memories and little details
- a music room with a playlist-shaped atmosphere
- a hidden vault of birthday wishes
- a final handwritten message that lands softly

This is not a product landing page. It is a personal digital experience.

## What lives inside

- Home World: the central hub for exploring the experience
- Main World: the main narrative path, with playful sections and a personal letter
- Music World: a mood-driven listening space
- Scrapbook World: a tactile memory gallery of photos and moments
- Hamster interactions: little personality moments, hover states, and affectionate details
- Pixel-art styling: retro, handmade, cozy, and intentionally imperfect

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- GSAP for motion
- Zustand for lightweight state
- TanStack React Query
- Three.js and animation-heavy UI elements

## Repository structure

```text
.
├── src/
│   ├── app/                 # App Router entrypoints and root layout
│   ├── components/
│   │   ├── landing/         # intro and world-selection flow
│   │   ├── ui/              # reusable visual/UI elements
│   │   └── worlds/          # world-specific screens and transitions
│   ├── data/                # scrapbook/content data
│   ├── hooks/               # fetching and data access logic
│   ├── lib/                 # audio, state, Spotify helpers, platform utilities
│   ├── providers/           # React Query provider
│   └── store/               # state stores for app behavior
├── public/                  # images, hamster art, media assets
├── docs/                    # notes and audits related to the project
├── project_overview.md       # canonical product brief and phases
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
├── pnpm-lock.yaml
├── package-lock.json
└── .gitignore
```

## How it works

The experience is driven by world-based navigation, not a traditional page flow. The app starts in a warm intro, then transitions into a home screen that presents the different destinations. From there, the user can choose where to wander.

The skeleton is intentionally simple:

- `src/app/page.tsx` mounts the app
- `src/lib/gameState.ts` controls current world and transitions
- `components/worlds/*` renders each world
- `components/landing/*` handles the welcome and navigation experience
- `data/` and `hooks/` feed the content-rich sections

## Getting started

### Prerequisites

- Node.js 18+
- npm, pnpm, or bun

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Design philosophy

This project leans heavily into a handmade aesthetic:

- pixel-inspired UI
- warm, nostalgic color palette
- playful motion
- layered, intentionally imperfect visual design
- story-driven interactions instead of generic cards
- an atmosphere that feels personal and lived-in

The goal is not polish for polish's sake. The goal is presence.

## Project context

The repo also includes `project_overview.md`, which is the deeper blueprint for the experience. That file explains the intended architecture, world structure, and design rules behind the project. If you want to understand the why behind the app, start there.

## Notes

This repo is best understood as a digital gift rather than a standard application. It was built to feel personal, memorable, and slightly magical — like a tiny corner of the internet made just for someone special.

## License

No explicit license file is currently present in the repository metadata. If you plan to share or redistribute this project publicly, it would be wise to add one.

---

If you're building this for a birthday, a thoughtful note, or a personal milestone, the real purpose of this project is simple:

to make someone feel seen.
