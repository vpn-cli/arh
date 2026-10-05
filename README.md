# A Little Corner of the Internet for You

A handcrafted, interactive birthday experience built as a tiny playable world instead of a standard webpage. It blends cozy pixel-art styling, hamster personality, scrapbook memories, music, and a playful narrative into a single indie-web adventure.

This project is designed like an exploration game: the user starts with a warm intro, then moves through a Home World with multiple destinations including Main, Music, and Scrapbook. Each world has its own vibe, pacing, and personality.

## Why this exists

This repo is a personal, handmade birthday gift project. The goal is to make the recipient feel like they are stepping into a small world built just for them: a place with memories, jokes, a few surprises, and a lot of care.

## Highlights

- Three interactive world destinations: Main, Music, and Scrapbook
- Cozy, retro, indie-game-inspired visual language
- Hamster-themed character moments and playful motion design
- Personalized scrapbook and memory-driven composition
- Spotify-adjacent music flow and listening experience
- Story-driven world transitions and micro-interactions
- Built with modern React + Next.js app-router patterns

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- GSAP for motion
- Zustand for client state
- TanStack React Query
- Three.js / canvas-driven visual elements

## Project structure

```text
.
├── src/
│   ├── app/                  # App router pages and layout
│   ├── components/
│   │   ├── landing/          # intro + home world + navigation
│   │   ├── ui/               # reusable UI and pixel-style components
│   │   └── worlds/           # world-specific screens and route logic
│   ├── data/                 # scrapbook / content data
│   ├── hooks/                # Spotify and content hooks
│   ├── lib/                  # audio, state, Spotify helpers
│   ├── providers/            # React Query provider
│   └── store/                # Zustand stores
├── public/                   # static images and media assets
├── docs/                     # repo notes / audits
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
└── pnpm-lock.yaml
```

## The experience

The experience is organized around a simple concept:

- Enter a warm intro / landing sequence
- Arrive at a central Home World
- Choose your destination
- Explore one of the themed worlds
- Return home or continue the journey

The project deliberately avoids feeling like a standard birthday card or generic website. Instead, it tries to feel like a miniature digital world built with intention, personality, and a little bit of chaos.

## Getting started

### Prerequisites

- Node.js 18+ or later
- npm, pnpm, or bun

### Install dependencies

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

## Available scripts

```bash
npm run dev      # start local Next.js dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # run ESLint checks
```

## Notes on architecture

This repository was built as an interactive experience rather than a conventional application. Key architectural patterns include:

- world-based navigation through `GameStateProvider`
- reusable component sets for UI and motion
- content-driven scrapbook sections
- Spotify-related hooks and state handling
- static asset-heavy visuals for the handmade aesthetic

## Design goals

The design direction is intentionally shaped around:

- indie game aesthetics
- retro web flavor
- scrapbook / paper craft energy
- cute, playful motion
- handmade imperfections rather than sterile polish

## Important project context

This project includes a detailed internal planning document in `project_overview.md` that lays out the product vision, architecture, phases, and design principles. If you are working within this repo, that file is the best reference for understanding the intended experience and constraints.

## Project status

This repo is a buildable personal experience project with a strong visual and interaction direction. It is not a generic starter app; it is a bespoke interactive birthday web experience with a defined visual identity and world-based structure.

## License

This project does not currently declare a license in the repository metadata. If you intend to redistribute or reuse it, add an explicit license before publishing.

## A final note

This project is best understood as a digital gift: thoughtful, playful, and built to feel personal. The value is not just in the code, but in the mood, timing, and story woven throughout the experience.

If you want, I can also turn this into a more polished version with:

- a screenshot section
- a feature matrix
- badges for Next.js/TypeScript
- a "How it works" diagram
- a version tailored specifically for GitHub presentation
