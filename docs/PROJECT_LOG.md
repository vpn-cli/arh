# Project Log and Architecture Study: arh

A comprehensive record of the vision, architecture, engineering hardships, operational safeguards, and development history of the **arh** project.

Repo: https://github.com/vpn-cli/arh

---

## 1. Overview

### Purpose and Context
**arh** is an interactive birthday gift website created for Maahi, who is preparing to relocate to Tokyo, Japan for her master's degree (Fall 2026). The project serves as a digital sanctuary, memory vault, and celebratory experience that she can revisit from anywhere in the world.

The core goals of the project are:
- To provide a personal, comforting online space filled with shared memories, inside jokes, and encouragement for her upcoming move to Tokyo.
- To celebrate her birthday through interactive, playful storytelling that unfolds across distinct digital worlds.
- To serve a complete, personalized music listening experience that integrates directly with her Spotify library and music tastes.

### Aesthetic Theme
The visual and sensory identity of **arh** is anchored in a nostalgic, pastel kawaii aesthetic:
- **Visual Palette**: Warm pastel pinks (`#FFF4F6`, `#FFB6C1`, `#FF8FB3`), buttery yellows (`#FFE4A1`), lavender blues (`#DFD5F5`), and dark plum ink text (`#20233F`).
- **Motifs and Characters**: Hello Kitty, Snoopy, cute hamster stickers, vintage postage stamps, bows, cherries, polaroid frames, and stationery textures.
- **Micro-Interactions**: Retro pixel typography, CRT monitor scanlines, audio cassette and vinyl deck graphics, and a custom native Hello Kitty cursor that reacts to interactive buttons.

### Development Workflow and Collaboration
The project was constructed through a tri-part human-AI collaborative loop:
1. **The Owner (Vipin)**: Sets the artistic direction, product vision, feature priorities, constraints, and accepts/rejects architectural decisions. The owner directly monitors live browser execution, validates visuals on real screens, and holds the ultimate authority over all commits and deployments.
2. **Claude (Architect & Reviewer)**: Audits the codebase, performs read-only reviews, analyzes regressions, designs resilient architectural strategies, and writes explicit, step-by-step implementation prompts for the coding agent.
3. **Google Antigravity (Implementation Agent)**: The autonomous pair programming agent executing inside the repository. AGY implements features, writes automated tests, runs builds and typechecks, diagnoses runtime errors, and produces atomic, verifiable git commits under strict rules defined in `AGENTS.md`.

---

## 2. Tech Stack

Every technology in the **arh** stack was chosen to satisfy specific creative, operational, and performance needs.

### Core Framework and Language
- **Next.js 16 (App Router, Turbopack)**:
  - *What it is*: React framework providing server-side rendering (SSR), streaming, route handlers, and rapid local builds via Turbopack.
  - *Why it was chosen*: Offers zero-bundle server utilities, dynamic API route endpoints, fast page transitions, and clean production bundling.
  - *How it is used*: Hosts the multi-world single-page container (`src/app/page.tsx`), handles all backend API routes (`src/app/api/`), serves static assets, and injects runtime environment flags.
- **React 19 & TypeScript**:
  - *What it is*: Modern component library with strict static type checking.
  - *Why it was chosen*: React 19's concurrent rendering primitives and strict TypeScript typing prevent runtime crashes, guarantee API contract stability, and enforce rigorous state boundaries.
- **Tailwind CSS v4 (`@tailwindcss/postcss`)**:
  - *What it is*: A modern utility-first CSS framework configured via PostCSS.
  - *Why it was chosen*: Eliminates runtime stylesheet overhead and provides consistent design token mapping across custom fonts, borders, and animations.
  - *How it is used*: Defines theme tokens (e.g. `--color-vibrant`, `--color-dark`), component utility classes in `@layer components` in `src/app/globals.css`, and powers responsive layouts.

### Persistence and Database
- **Neon Postgres**:
  - *What it is*: Serverless PostgreSQL database architecture with instant branching, autoscaling, and zero-overhead HTTP querying.
  - *Why it was chosen*: Cold-starts are instant over HTTP without persistent connection pools, and database branches enable isolated testing without touching production data.
- **Drizzle ORM & drizzle-kit**:
  - *What it is*: TypeScript-first object-relational mapping library and migration engine.
  - *Why it was chosen*: Maximum type safety with zero runtime overhead, direct SQL control, and clean schema definitions.
  - *Pooled vs. Unpooled URLs*:
    - `DATABASE_URL` (Pooled/HTTP Serverless Connection): Used by runtime Next.js API routes (`src/db/index.ts`) via `@neondatabase/serverless` `neon()`. Executes quick, stateless SQL statements over HTTP without maintaining stateful TCP connections across serverless lambda invocations.
    - `DATABASE_URL_UNPOOLED` (Direct Unpooled Connection): Used by `drizzle-kit` and migration scripts (`scripts/apply-migration.ts`, `drizzle.config.ts`). DDL operations (such as `CREATE TABLE`, `ALTER TABLE`, adding indices, and recording migrations) require direct access to Postgres catalogs and transaction states that connection poolers may disrupt or restrict.

### Caching, Rate Limiting, and Coordination
- **Upstash Redis (`@upstash/redis`)**:
  - *What it is*: Serverless Redis accessed over stateless REST HTTP.
  - *Why it was chosen*: Operates without long-lived TCP sockets, perfectly matching serverless environments.
  - *How it is used*:
    1. *Sliding-Window Rate Limiter*: Atomic Lua script (`SPOTIFY_RATE_LIMIT_LUA` in `src/lib/server/redis.ts`) enforcing dual budgets (50 requests/30s for the whole app, 30 requests/30s per user) to safeguard against Spotify 429 lockouts.
    2. *Circuit Breaker*: Trips a global lock key `spotify_api_lock` when Spotify issues a 429 `Retry-After`, halting further upstream traffic.
    3. *Response Caching*: Caches expensive Spotify endpoints (`/me`, `/me/playlists`, `/search`, `/me/tracks`, `/me/library/contains`, `/playlists/{id}`) for 1 hour.
    4. *Cache Busting via SCAN*: Uses a non-blocking `deleteByPattern` SCAN loop to invalidate cached playlists or track states immediately when mutations occur.
    5. *Key Namespacing*: Automatically prefixes keys via `REDIS_KEY_PREFIX` (defaults to `"dev:"`, set to `""` in production) to isolate local development and testing from live data.

### Music and Lyrics
- **Spotify Web Playback SDK & Web API**:
  - *What it is*: Spotify's browser streaming SDK and REST API.
  - *Why it was chosen*: Allows the web app to stream high-fidelity audio directly in the browser while syncing playback state, devices, and library data.
  - *Auth Flow*: Implemented using Spotify OAuth Authorization Code with PKCE and secure server-managed `HttpOnly` cookies (`spotify_access_token`, `spotify_refresh_token`). Tokens are auto-refreshed seamlessly in the background by the Next.js API proxy (`/api/spotify/proxy/[...path]`).
  - *Free vs. Premium Behavior*: The Spotify Web Playback SDK requires a Spotify Premium subscription to decrypt and stream audio in the browser via Encrypted Media Extensions (EME/Widevine). Free-tier visitors cannot initialize the browser player. The app gracefully detects free accounts (`accountTier === 'free'`), skips the SDK initialization, provides a polite notice, hides volume controls, and routes track clicks out to the official Spotify client.
- **LRCLIB**:
  - *What it is*: An open-source, community-driven database of synchronized lyrics.
  - *Why it was chosen*: Delivers timestamped LRC format lyrics for karaoke-style word wipes and real-time playback synchronization without expensive proprietary API licenses.

### PWA and Performance Infrastructure
- **Service Worker (`public/sw.js`)**:
  - *What it is*: A lightweight background worker registered on the client.
  - *Why it was chosen*: Satisfies modern browser PWA installability requirements (allowing Maahi to install the app on desktop) without caching stale code bundles.
  - *Media & Range Pass-Through*: Crucially configured as a no-cache pass-through (`v2-no-cache-passthrough`) that explicitly exempts `.mp4`, `.mp3`, `/videos/`, and HTTP `Range` requests from worker interception. This prevents the service worker from stripping byte-range requests required for video streaming.
- **Quality Gates and Tooling**:
  - *Vitest & MSW*: Fast unit testing framework paired with Mock Service Worker to intercept and mock all 29 Spotify API endpoints during tests and local development.
  - *ESLint & TypeScript*: Zero-tolerance type checking (`tsc --noEmit`) and error-level linting guarding React Hooks rules.
  - *Git Hooks (`.githooks/`)*: Custom pre-commit and pre-push hooks preventing frozen file modifications and catching broken builds before code touches GitHub.
  - *GitHub Actions CI*: Automated multi-job workflow verifying code integrity on every pull request and push.
  - *scripts/check-frozen.mjs*: Security and integrity script verifying SHA-256 checksums and headers on protected media and cinema components.
- **Hosting and Deployment**:
  - Vercel (unverified - inferred from Next.js serverless architecture, headers configuration in `next.config.ts`, and deployment documentation in `docs/session-12`).

---

## 3. Architecture

### Folder Map of `src/`

```
src/
├── app/                    # Next.js App Router root
│   ├── api/                # Serverless API routes (Spotify proxy, lyrics, memories, scrapbook, terminal)
│   ├── diagnose/           # Developer diagnostics and test harness pages
│   ├── privacy/            # Privacy policy for external integrations
│   ├── globals.css         # Global tokens, typography, keyframes, cursor classes
│   ├── layout.tsx          # Root HTML layout and global context providers
│   └── page.tsx            # Root entry point hosting WorldRouter
├── components/             # Reusable React UI components
│   ├── landing/            # Retro Gameboy loading screen, intro story flow, and parallax hero
│   ├── pwa/                # Service worker registration and PWA install prompts
│   ├── ui/                 # Shared UI primitives (native cursor, stickers, modals, cards)
│   └── worlds/             # The four distinct interactive experiences ("Worlds")
│       ├── HomeWorld.tsx   # FROZEN: World selection menu with scrapbook collage cards
│       ├── WorldRouter.tsx # Dynamic query-param-driven routing between worlds
│       ├── home/           # Subcomponents for Home World (mascot, cards, floating elements)
│       ├── main/           # Main World storyline (KittyOS terminal, vault, The Edit cinema, letter)
│       ├── music/          # Music World (punkrose.fm): Spotify player, vinyl, lyrics, queue
│       └── scrapbook/      # 3D interactive flipbook memory album
├── config/                 # Static configuration files (slideshow, sound effects)
├── context/                # React contexts (CursorContext for cursor state management)
├── data/                   # Default JSON seed data for scrapbook spreads
├── db/                     # Database layer: Drizzle schemas, types, and Neon client
├── hooks/                  # Global React hooks (Spotify data queries, window dimensions)
├── instrumentation.ts      # Server instrumentation hook for MSW mock initialization
├── lib/                    # Shared utility libraries (audio, lyrics lookup, palette, math)
│   ├── server/             # Server-only utilities (Redis client, rate limiter, auth tokens)
│   └── spotify/            # Spotify API abstractions and image parsers
├── mocks/                  # MSW mocks for Spotify APIs and stub player for offline development
├── providers/              # Application-wide providers (QueryClient, SpotifyPlayerProvider)
└── store/                  # Global client stores (Zustand: playback state, volume, memories)
```

### The Four Worlds

#### 1. Home World (`src/components/worlds/HomeWorld.tsx`) — FROZEN
The central hub of the application. Presents a pastel desk covered in floating scrapbook cards, stickers, and ambient sparkle animations. Visitors can choose which world to enter:
- **Scrapbook Card**: Directs to the 3D flipbook memory album.
- **Main Storyline Card**: Enters the multi-phase birthday journey.
- **Music Player Card**: Launches punkrose.fm.
- **Interactive Mascot**: Includes an interactive boopable mascot (`HomeMascot.tsx`) with sound effects.
*Policy*: Home World is strictly frozen to preserve its handcrafted layout and visual balance.

#### 2. Main World (`src/components/worlds/main/MainWorld.tsx`)
The centerpiece narrative experience structured as a linear, milestone-driven storyline guided by a fixed `PhaseTracker`:
- **Phase 00 (Hero)**: Warm birthday greeting and introduction.
- **Phase 01 (KittyOS Terminal)**: A retro CRT command terminal (`AsciiSection.tsx`, `useKittyTerminalEngine.ts`) where Maahi must solve playful calculus and Tokyo travel puzzles. Guarded by dynamic question states and rewarded with clearance tokens.
- **Phase 02 (Birthday Vault)**: An unlocked celebratory vault (`BirthdayVault.tsx`) with an animated birthday card, celebration confetti, and passcode unlocking.
- **Phase 03 (The Edit)**: A nostalgic vintage cinema TV (`TheEdit.tsx`, `TheEditTvHardware.tsx`) running an exclusive birthday video montage (`arh_vid_final.mp4`). Features custom hardware knobs, VHS scanline overlay, REC/PAUSE on-screen displays, and an end-card animation. Strictly FROZEN.
- **Phase 04 (One Last Thing / The Letter / "50 Shades of Maahi")**: A deluxe stationery letter (`TheLetter.tsx`, `TheLetterEnvelope.tsx`, `TheLetterPoem.tsx`) featuring real polaroid photos, a wax seal opening animation, and an emotional poem commemorating her move to Tokyo.

#### 3. Music World (`src/components/worlds/music/MusicWorld.tsx` — punkrose.fm)
A bespoke, comprehensive music player that connects directly to Spotify:
- **Now Playing Deck**: Realistic vinyl record that spins during playback, flips to reveal memory photos, and features a tone arm that tracks song progress.
- **Sound Waves**: Fluid, non-overlapping animated visualizer pills that gently wave during playback and settle when paused.
- **Synced Lyrics Drawer**: Real-time karaoke-style word-by-word highlighted lyrics powered by LRCLIB and synchronized with sub-frame accuracy via `requestAnimationFrame`.
- **Navigation & Views**: Liked Songs, Custom Playlists, Dynamic Birthday Mix, Curated Vibes, Listening Frequencies (top artists/tracks), and Personal Memories.
- **Queue Manager**: Live queue reordering, track removal, and upcoming track summaries.

#### 4. Scrapbook World (`src/components/worlds/scrapbook/ScrapbookWorld.tsx`)
A tactile 3D photobook (`ThreeDScrapbook.tsx`) built using CSS 3D transforms:
- Allows flipping forward and backward through realistic textured spreads.
- Displays polaroid pictures of friends, pets ("moo" and "moomoo"), memorable dates, and handwritten notes.
- Includes photo zoom detail modals and full administrative edit capabilities.

---

### Data Flows

#### 1. Lyrics Fetching Pipeline
```
[User clicks song]
       │
       ▼
[useLyrics Hook] (Check in-memory cache)
       │ (cache miss)
       ▼
[GET /api/lyrics?trackId={id}&title={t}&artist={a}]
       │
       ▼
[Neon Postgres: lyrics_cache]
       ├── (Hit: manual or lrclib) ──► Return parsed LRC
       ├── (Hit: not_found < 7 days) ──► Return not_found
       │
       ▼ (Cache miss)
[Server Upstream Cooldown Check] (Check 60s in-memory error map)
       │
       ▼
[lookupLyrics 4-step Chain]
       ├── Step a: /api/get (track + artist + album + duration)
       ├── Step b: /api/get (track + artist + duration, without album)
       ├── Step c: /api/search (cleaned track + primary artist)
       └── Step d: /api/search (query string: cleaned title + artist)
       │
       ├── (Success) ──► Save to Neon (source='lrclib') ──► Parse LRC ──► Client
       ├── (Upstream 5xx/429/Timeout) ──► DO NOT CACHE ──► Set 60s Cooldown ──► 503/429 Error
       └── (Clean empty search) ──► Cache to Neon (source='not_found', 7d) ──► Client
```

#### 2. Album Palette Generation
```
[Track Changes in SpotifyPlayerStore]
       │
       ▼
[useAlbumPalette Hook] (Check client cache)
       │ (cache miss)
       ▼
[GET /api/album-palette?url={spotify_image_url}]
       │
       ▼
[Next.js Server Route]
       ├── Fetch 64px image buffer from i.scdn.co
       ├── node-vibrant extracts vibrant, dark, and muted swatches
       ├── generatePalette() computes accessible high-contrast color tokens
       └── Returns JSON with Cache-Control: public, max-age=31536000, immutable
       │ (If fetch fails: logs warning and returns fallback #C2185B palette)
       ▼
[CSS Custom Properties]
       └── Root applies --color-vibrant, --color-dark, --color-light
       └── Smooth 400ms CSS transitions morph the entire page theme effortlessly
```

#### 3. Spotify Playback Synchronization
```
[User clicks Play on TrackRow]
       │
       ▼
[usePlaybackActions: playTrack()]
       │
       ▼
[POST /api/spotify/proxy/me/player/play]
       ├── Checked by Rate Limiter (SPOTIFY_RATE_LIMIT_LUA)
       ├── Checked by Circuit Breaker (spotify_api_lock)
       └── Proxied to api.spotify.com/v1/ with HttpOnly Cookie Access Token
       │
       ▼
[Spotify Web Playback SDK Engine]
       ├── Emits 'player_state_changed' DOM event
       └── PlayerProvider catches event without per-frame React state
       │
       ▼
[Zustand Store: useSpotifyPlayerStore]
       ├── Updates currentTrack, isPaused, duration, deviceId
       └── Notifies subscribed components (Vinyl, Controls, Waveform)
```

#### 4. Scrapbook Edit Mode
```
[Admin user makes edits in 3D Scrapbook]
       │
       ▼
[POST /api/save-scrapbook]
       ├── Header: x-scrapbook-secret (matched against SCRAPBOOK_ADMIN_SECRET)
       ├── Validates JSON array of spreads with left/right pages
       └── db.batch() transactional execution:
             1. UPDATE scrapbook_versions SET is_current = false WHERE is_current = true
             2. INSERT INTO scrapbook_versions (data, is_current = true)
       │
       ▼
[GET /api/get-scrapbook]
       └── Selects WHERE is_current = true ──► Renders updated 3D photobook
```

---

### Database Schema

The database consists of three tables defined in `src/db/schema.ts`:

#### 1. `scrapbook_versions`
Stores historical and active revisions of the 3D scrapbook spreads.
- `id` (`serial`, Primary Key): Auto-incrementing version identifier.
- `name` (`text`, default `"main"`): Descriptive label for the save (e.g. `"initial-seed"`, `"client-update"`).
- `data` (`jsonb`, `notNull`): Complete JSON data array of spreads, pages, polaroids, rotation angles, and handwritten captions.
- `isCurrent` (`boolean`, default `true`): Flag identifying the currently active scrapbook version.
- `createdAt` (`timestamp`, `defaultNow`): Creation timestamp.
- *Constraints*: Partial unique index `is_current_unique` on `isCurrent` where `is_current = true`. Ensures that only one row can ever be marked active at any given moment.

#### 2. `lyrics_cache`
Stores cached lyrics resolved from LRCLIB or manually persisted by the owner.
- `spotifyId` (`text`, Primary Key): Spotify track ID.
- `source` (`text`, `notNull`): Source origin (`'lrclib'`, `'manual'`, or `'not_found'`).
- `synced` (`text`): Raw LRC timestamped lyric string.
- `plain` (`text`): Plain text lyrics without timestamps.
- `instrumental` (`boolean`, default `false`, `notNull`): True if the track has no vocal lyrics.
- `fetchedAt` (`timestamp`, `defaultNow`, `notNull`): Timestamp of retrieval (used to expire 7-day negative caches).
- `offsetMs` (`integer`, default `0`, `notNull`): Persistent millisecond timing offset to calibrate synchronization drift.

#### 3. `memories`
Stores personal scrapbook notes attached to Spotify songs, albums, and artists.
- `id` (`uuid`, Primary Key, `defaultRandom`): Unique memory entry identifier.
- `spotifyUserId` (`text`, `notNull`): Owner Spotify user ID (e.g. `"mock-user"` or actual account ID).
- `spotifyUri` (`text`, `notNull`): Spotify URI of the attached track or album (`spotify:track:...`).
- `entityType` (`text`, `notNull`): Type of target (`'track'`, `'album'`, `'artist'`).
- `note` (`text`, `notNull`): Personal memory caption or story.
- `category` (`text`): Grouping tag (e.g. `"Tokyo"`, `"Favorites"`).
- `dateLabel` (`text`): User-friendly display date.
- `createdAt` (`timestamp with time zone`, `defaultNow`, `notNull`): Creation timestamp.
- `updatedAt` (`timestamp with time zone`, `defaultNow`, `notNull`): Last edit timestamp.
- *Constraints*: Composite unique constraint `memories_user_uri_unique` on `(spotifyUserId, spotifyUri)`. Ensures one memory per user per track.

---

### API Routes Reference

| Route Path | Method | Purpose | Authentication | Caching & Rate Limiting |
|---|---|---|---|---|
| `/api/spotify/login` | GET | Initiates Spotify OAuth flow, constructs scopes, and redirects to Spotify | None | None |
| `/api/spotify/callback` | GET | Handles Spotify OAuth callback, exchanges authorization code for tokens, sets `HttpOnly` cookies | None | Sets secure cookies |
| `/api/spotify/session` | GET | Verifies whether the visitor has an active Spotify session | Cookie | None |
| `/api/spotify/logout` | POST | Clears Spotify session cookies | Cookie | None |
| `/api/spotify/proxy/[...path]` | ANY | Transparent reverse proxy to `api.spotify.com/v1/`. Automatically handles token refresh on 401 | Cookie | Rate limited via Redis Lua script (50 app / 30 user per 30s); 1-hour Redis cache on cacheable GETs |
| `/api/spotify/diagnose` | GET | Diagnostics report on Spotify credentials and connection (dev only, 404 in production) | Dev only | None |
| `/api/lyrics` | GET | Resolves synchronized or plain lyrics for a track ID | None | Neon cache; in-memory 60s upstream error cooldown; 7-day negative cache |
| `/api/lyrics` | POST | Persists manual lyrics for tracks missing from LRCLIB | Secret (`x-scrapbook-secret`) | Direct write to Neon (`source: 'manual'`) |
| `/api/lyrics` | PATCH | Adjusts persistent timing synchronization offset (`offsetMs`) | Secret (`x-scrapbook-secret`) | Direct write to Neon |
| `/api/album-palette` | GET | Extracts vibrant, dark, and muted theme palettes from album art URL | None | Edge cached (`max-age=31536000, immutable`); 60s fallback on error |
| `/api/get-scrapbook` | GET | Retrieves current active scrapbook spread data | None | Cached via database query |
| `/api/save-scrapbook` | POST | Saves new revision of scrapbook spreads and updates active version | Secret (`x-scrapbook-secret`) | Transactional batch write in Neon |
| `/api/scrapbook-versions` | GET | Lists historical scrapbook versions for administrative rollback | Secret (`x-scrapbook-secret`) | Direct Neon select |
| `/api/scrapbook-versions/restore` | POST | Rolls back the active scrapbook to a prior version ID | Secret (`x-scrapbook-secret`) | Transactional batch write in Neon |
| `/api/memories` | GET, POST, DELETE | Reads, creates, and removes personal song memories | Cookie (Spotify User) | Scoped by Spotify User ID in Neon |
| `/api/memories/import` | POST | Imports memories from client storage into Neon | Cookie (Spotify User) | Scoped by Spotify User ID |
| `/api/terminal/question` | GET | Serves dynamic calculus and puzzle challenges for KittyOS | None | Dynamic server response |
| `/api/log` | POST | Client telemetry and debug event logging | None | Server console logging |
| `/api/debug` | GET | Server environment and configuration debugging inspection | None | None |

---

## 4. Timeline

A chronological record of project development across all 217 commits:

### Phase 1: Foundation and Gameboy Loading Scene (2026-09-29 to 2026-10-01)
- `f01f9e6` (2026-09-29): Repository initialized with Next.js, Tailwind, base assets, and design system documentation.
- `5227f3e` (2026-09-29): Added cursor parallax movement to the Gameboy loading screen.
- `01adca5` (2026-09-29): Added waving grass, viewport-anchored foreground elements, and blooming flowers to the pixel scene.
- `acbf2f1` (2026-09-29): Redrew foreground flora as authentic pixel art matching the background's grid.
- `d098ace`, `e97f9be`, `40487f3`, `e4d7508` (2026-09-29): Rooted pixel plants into grass clumps, locked ground alignment, and hid root overflows below the viewport.
- `66b45b6` (2026-09-29): Critical performance fix: stopped re-rendering a 1,700-node DOM tree on every animation frame.
- `4732a6b`, `979e26c` (2026-09-29): Connected the 7-card intro story directly to "START NEW GAME" and finalized loading mechanics.
- `9cc83e0` (2026-09-30): Landing page initialized.
- `6197df9`, `8641104`, `281ca92` (2026-10-01 to 2026-10-02): Structured Main World layout and ambient audio soundscape.

### Phase 2: Spotify Player Integration and Early Scrapbook (2026-10-02 to 2026-10-05)
- `93d1167` (2026-10-02): Created custom progress bar with Hello Kitty thumb handle.
- `90ebfd3` (2026-10-02): Initialized Spotify Web API integration and prototype scrapbook.
- `5accaa5`, `9e1f07b`, `783e420`, `60d753c` (2026-10-03): Resolved jittery scrapbook flipping, dangling DOM elements, edit errors, and added page progress indicators.
- `8ffa5aa`, `9041a19`, `b13d8b2`, `35a0195` (2026-10-04): Implemented Spotify login redirects, liked songs error handling, and search functionality.
- `737b9db`, `87ac008`, `2665a1e` (2026-10-04): Added playlist playback, artist detail pages, and track listings.
- `6055c7d`, `9844b2a`, `a444a14` (2026-10-04): Cleaned up import parsing bugs and syntax in `SpotifyPlayerUI.tsx`.
- `aed2211`, `c668a3d`, `c9f4ddb`, `27e5da5` (2026-10-04): Completed Phase 6 and Phase 7: queue implementation, reordering, and playback context hardening.
- `8c08b50` through `4c2bbac` (2026-10-04): Added artist features, playlist creation/deletion, recents, dynamic birthday mix, and vibe categories with genre fallbacks.
- `130fa87`, `1d3f68a` (2026-10-04 to 2026-10-05): Initialized and stabilized personal song memories subsystem.
- `5fe6d4b`, `ac01530`, `0a06400`, `7a49413` (2026-10-05): Recomposed kawaii music player, refined visual hierarchy in queue, and applied WCAG contrast standards.

### Phase 3: Neon Database Migration and Scrapbook Polish (2026-10-06 to 2026-10-07)
- `fe6a984`, `ed7a76f`, `5ed1c8a`, `b73309f`, `a406dc2` (2026-10-06 to 2026-10-07): Optimized scrapbook media assets, improved 3D transform performance, added UI buttons, and smooth fade-in transitions.
- `b303b96`, `9809629` (2026-10-07): Initialized Neon Postgres and added `.env.example`.
- `0d054af` (2026-10-07): Migrated scrapbook persistence from local JSON to Neon Postgres + Drizzle ORM with authenticated saves.
- `b4d1983` (2026-10-07): Updated player architecture to support non-Premium Spotify visitors gracefully.

### Phase 4: Synced Lyrics, LRCLIB Pipeline, and Music World Architecture (2026-10-08 to 2026-10-09)
- `3b7cfd8` (2026-10-08): Implemented dynamic album-art color changes during playback.
- `c276be5` (2026-10-08): Added static playlist map for vibe categorization.
- `ad62659`, `85c3678`, `30dea0a`, `1a1e584`, `3965292` (2026-10-08): Designed and built synchronized lyrics architecture: LRCLIB API route, LRC parser, karaoke word wipes, and lyrics database caching.
- `eaf1e27`, `602fd3b`, `0bdd0fd` (2026-10-08 to 2026-10-09): Fixed playlist lag, enforced single Spotify player instance, lazy-loaded worlds, and deferred scrapbook audio decoding.
- `4c56cda` (2026-10-09): Migrated to updated Spotify API guidelines, handled unowned playlists, and clamped search limits.
- `1102ff8`, `a98331e`, `baad759` (2026-10-09): Major modular refactor: extracted lyrics view, playback actions, now-playing panel, and queue modal out of `SpotifyPlayerUI.tsx`.
- `01efd03`, `e794931` (2026-10-09): Added per-track manual lyrics sync offset in edit mode and bound progress bar directly to the shared clock.

### Phase 5: Design Systems, MediaRow, Kawaii Icons, and Type Tokens (2026-10-10)
- `448da78`, `9afdb30`, `37e3597`, `91e0181` (2026-10-10): Added unified motion tokens, layered Music World CSS into `@layer components`, and auto-closed lyrics overlay on navigation.
- `92affcb`, `1a83341`, `abd27fd`, `b5e2c0e` (2026-10-10): Created shared `MediaRow` component with stretched button overlay, `pickImage` utility, and accessible focus rings.
- `0a4980c`, `db19706`, `dfcd324`, `a4338d9`, `2bd4381`, `bf47d00` (2026-10-10): Responsive sidebar (296px), `PlaylistCover` 2x2 collage rendering, custom inline SVG kawaii navigation icons, and standardized vibe/frequencies grids.
- `e55142e` (2026-10-10): Migrated memories from browser `localStorage` to Neon Postgres partitioned by Spotify user ID.
- `a1f6f5a` through `5acf7d8` (2026-10-10): Replaced control emojis with SVG components, eliminated hardcoded colors in favor of theme variables, integrated sticker icons, and defined typography type tokens.

### Phase 6: PWA Desktop App, Pinterest Sync, MiniPlayer, and Widget (2026-10-10 to 2026-10-11)
- `4eaba55`, `55e9656`, `8ebf46d`, `4de25ee`, `1a7b939`, `8dfdd76`, `2613d79`, `977d90f`, `50d35d8`, `1885300` (2026-10-10): Built Pinterest board synchronization scripts, manual image slideshow builder, privacy policy page, and hero backdrop slideshow.
- `fc1522e` (2026-10-10): Synchronized active world state with URL query parameters (`?world=...`).
- `0f21c9f`, `3c219f1` (2026-10-10): PWA desktop app manifest and responsive compact window layout below 520px.
- `93402d7`, `807efea`, `bbe3179` (2026-10-10 to 2026-10-11): Implemented and refined Document Picture-in-Picture floating mini-player.
- `9808ddd`, `aec53fb`, `ad14b96`, `ff57d39` (2026-10-11): Replaced Document Picture-in-Picture with standalone desktop widget player using Window Controls Overlay.
- `fb45949`, `45ca046` (2026-10-11): Required authentic track end before auto-continuing, and clamped search results.

### Phase 7: Vinyl Record, Stickers, Queue, and Player Polish (2026-10-11 to 2026-10-12)
- `ce54e5f`, `8336c96`, `9b0f4ee`, `0135cb9` (2026-10-11): Fixed queue sync bugs, typed search parameters, fixed hook order in `AlbumDetail`, and guaranteed clicked track playback even with shuffle enabled.
- `94f82b9`, `b97dd6c`, `7c6053c` (2026-10-11): Extracted and placed Snoopy sticker icons across Music World.
- `c107180`, `a58ea6d`, `ddd1450`, `e42dad7`, `a4d0d79`, `d3d7147` (2026-10-11): Up Next queue filtering, star like button, vinyl sticker interactions, and volume popover.
- `cb58ea8`, `f83186b`, `750ea6c`, `9702ca3` (2026-10-11): Redesigned sound wave bars, album sleeve slide transitions, and playback control tray.
- `e1213ba`, `b08fdf2`, `17d04d4`, `3ad98e4`, `dc7a3e0`, `6b2b9d4` (2026-10-12): Surfaces theme adherence, volume popover refinement, and dynamic waveform motion.
- `09c9b95`, `d4b32a7`, `a3ccbc2` (2026-10-12): Renamed music world experience to **punkrose.fm**, aligned Spotify broadcast device name, and accelerated waves.

### Phase 8: Spotify Lockout Defense: Rate Limiter, Mock Mode, and Redis SCAN (2026-10-12)
- `fbd20f1` (2026-10-12): Added Spotify lockout guards and restricted memory loading strictly to Music World.
- `9123828` (2026-10-12): Crucial reliability milestone:
  - Implemented atomic Lua sliding-window rate limiter in Redis (`reserveSpotifyRateLimit`).
  - Added full offline mock mode via MSW covering all 29 Spotify endpoints.
  - Implemented Redis SCAN pattern cache busting (`deleteByPattern`).
  - Namespaced Redis keys via `REDIS_KEY_PREFIX`.
- `1758448`, `e65ea10` (2026-10-12): Refreshed dependencies and removed author metadata.

### Phase 9: Multi-World Overhaul: Home World, Main World, and CI Setup (2026-10-12 to 2026-10-15)
- `65971a7`, `b6932db`, `cce76b7`, `3fbf3e2`, `8096a58` (2026-10-12): Added character graphics extraction script, Gameboy cartridge components, redesigned home world selection, and smooth world exit transitions.
- `d9755ec`, `d80052c` (2026-10-13): Updated home and main world assets, and improved mock/live Spotify session recovery.
- `70f494d`, `34016f4` (2026-10-13): Added comprehensive GitHub Actions CI workflow on Node.js 22.
- `ffe5e00` (2026-10-13): Redesigned Main World and permanently FROZE Home World.
- `9970193`, `109f6ab` (2026-10-14): Modularized The Edit cinema player into controls, hardware, and fullscreen utilities; cleaned router dynamic loading.
- `c7d7211`, `41828b0`, `807482f`, `f8e29a5` (2026-10-14): KittyOS calculus questions endpoint, enlarged boopable mascot, WCAG accessible dialogs, and AsciiSection clearance callbacks.
- `e486713`, `e8323a4`, `d96c8ec`, `a2fcf3c`, `cde4f2d` (2026-10-14): Responsive WebP assets for Moo, clipped pixel Kitty terminal mascot, smoothed scroll behavior, and deluxe letter stationery.
- `68dc748` through `fef7806` (2026-10-15): Fixed ESM imports in tests, pruned 50MB+ of unused legacy assets/fonts/dependencies (Three.js), and cleaned git ignores.
- `1f9fd24` (2026-10-16): Refined Main World storyline phases, faded letter background, and active milestone tracker.

### Phase 10: Expressive Cursor, Micro-Interactions, Resilient Lyrics, and Cinema Lockdown (2026-10-16 to 2026-10-17)
- `cf60e3a` (2026-10-17 00:54): Expressive Hello Kitty cursor with micro-interactions.
- `be954e5` (2026-10-17 01:23): Security chore: moved development notes PDF out of `public/` into `docs/`.
- `67a4f11` (2026-10-17 02:34): Removed floating SFX toggle and click sound effects to prevent audio interference.
- `030038a` (2026-10-17 02:34): Fixed cursor blink timer self-cancellation and improved latency.
- `80f2fb4` (2026-10-17 02:37): Resilient lyrics lookup overhaul: status union, 4-step LRCLIB chain, Levenshtein title matching, and prevention of negative caching on upstream errors.
- `fd93acd` (2026-10-17 02:51): Added custom User-Agent for LRCLIB, 60s upstream error cooldowns, and mobile sticker layout fixes.
- `63d7ade` (2026-10-17 03:01): Fixed React rules-of-hooks violations in `VolumeButton` and `SpotifyModeBadge`, and added errors-only linting to pre-push git hook.
- `9dc24f9` (2026-10-17 12:16): Replaced laggy DOM cursor with zero-latency hybrid native CSS cursor with 32px/64px image sets, baked badges, and hotspots.
- `0954f96` (2026-10-17 12:25): Removed lerped glow in native mode and restricted cursor swaps to interactive states.
- `06475d0`, `bd8da08` (2026-10-17 12:48 to 13:11): Restored micro-interactions by transferring physics transforms onto target buttons rather than the cursor.
- `dac6c62` (2026-10-17 12:58): Bound The Edit cinema player directly to native `<video>` DOM events, eliminated SFX click interference, and added "TAP FOR SOUND" unmuting fallback.
- `abc0639`, `c4d6b76` (2026-10-17 13:25 to 15:07): Investigated delayed video audio, reverted incorrect video re-encoding, and identified Service Worker Range request stripping as root cause.
- `cab4e0f` (2026-10-17 15:26): Permanently FROZE The Edit, instituted SHA-256 integrity checks (`scripts/check-frozen.mjs`) in git hooks and CI, and released Service Worker v2.
- `eed43d3` (2026-10-17 15:39): Set `arh_vid_final.mp4` as the sole cinema video source and added load error retry poster banner.
- `05ccef3` (2026-10-17 15:41): Removed unused legacy `public/Arh.mp4` video binary.
- `f7979a6` (2026-10-17 16:15): docs: add full project log.
- `fedecea` (2026-10-17 16:18): docs: update project log.
- `2a5ee06` (2026-10-17 16:30): feat(letter): update postage stamps to Okayama with enhanced visual hierarchy.
- `d413fe1` (2026-10-17 16:31): feat(letter): add strawberry cake and clipped out Batman stickers to letter stationery.


---

## 5. Hardships and How They Were Solved

### 1. Custom Hello Kitty Cursor Latency and Glitches
- **Symptom**: The custom Hello Kitty cursor felt sluggish, lagged 1-2 frames behind the mouse pointer on high-refresh displays, the eye-blink animation repeatedly cancelled itself, and the cursor was completely invisible in Snipping Tool screenshots.
- **Root Cause**:
  - The cursor was initially rendered as a React DOM element positioned via `mousemove` event listeners and Framer Motion spring physics. Because browser main-thread layout and JavaScript execution run asynchronously from the operating system's hardware cursor plane, DOM cursors inherently suffer ~16ms latency.
  - The blink timer in `useKittyCursorPhysics` was repeatedly reset because `mousemove` events triggered state updates that re-initialized the timer hook.
  - Snipping Tool and screen capture utilities record the window framebuffer, whereas native hardware cursors are composited separately by the GPU display server; a DOM cursor *should* appear in screenshots, but once switched to native CSS cursor, it does not. Furthermore, Windows and Chrome hardware cursor subsystems do not repaint a static hardware cursor unless the pointer moves.
- **Fix**:
  - Commits `9dc24f9` and `0954f96` overhauled the architecture to a zero-latency hybrid native CSS cursor.
  - Pre-rendered 32px (1x) and 64px (2x retina) PNG expression frames with baked-in locked badges and defined hotspots using `scripts/generate-cursor-expressions.mjs`.
  - Mapped cursor states (`pointer`, `locked`, `text`, `happy`, `music`, `sleepy`, `wink`) through CSS custom rules and `[data-kitty="..."]` attributes using `image-set()`.
  - Preserved a `CURSOR_RENDER_MODE` rollback flag in `src/components/ui/cursorUtils.ts` to allow instant switching between native and DOM modes.
- **Commits**: `030038a`, `9dc24f9`, `0954f96`.
- **Lesson**: Never attempt to drive full-screen mouse pointers via JavaScript DOM nodes when high responsiveness is required; use native CSS cursors with `image-set()` and define precise hotspot offsets.

### 2. Micro-Interactions Lagging on the Cursor
- **Symptom**: After switching to a native cursor, the app lost its charming bouncy micro-reactions, but attempting to animate the cursor itself caused sluggishness and visual jitter.
- **Root Cause**: An animated custom cursor attempts to do two conflicting things: track hardware position instantly and run continuous transformation physics.
- **Fix**:
  - Commits `06475d0` and `bd8da08` decoupled the responsibilities: the cursor remains a native, zero-latency pointer, while the interactive target elements (buttons, stickers, cards) handle the spring physics, bouncy presses (`active:scale-95`), slight lifts (`hover:-translate-y-0.5`), and particle emissions.
- **Commits**: `06475d0`, `bd8da08`.
- **Lesson**: Keep the cursor lightweight and fast; move playful physical reactions and micro-animations onto the interactive elements being hovered or clicked.

### 3. Lyrics Lookup: "Uff" Missing from LRCLIB and Latched 503 Errors
- **Symptom**: The Hindi song "Uff" (one of Maahi's favorite tracks) failed to display lyrics in Music World. Even worse, if LRCLIB experienced a transient 503 Service Unavailable or network timeout, the application permanently treated the song as "Not Found" (`notFound: true`) and cached that failure for 7 days in Neon Postgres!
- **Root Cause**:
  - The lyrics route lacked a status union: any non-200 HTTP response from LRCLIB was treated as a clean negative result and inserted into `lyrics_cache` with `source: 'not_found'`.
  - Exact search matching failed because Spotify track titles often contain album/single/remaster suffixes or featured artists that do not match LRCLIB's records.
  - LRCLIB simply did not have lyrics for "Uff", and there was no administrative fallback for the site owner to supply lyrics manually.
- **Fix**:
  - Introduced a strict status union: `'loading' | 'found' | 'instrumental' | 'not_found' | 'error' | 'upstream_error'`.
  - Built an intelligent 4-step fallback chain in `src/lib/lyricsLookup.ts`: Step a (track + artist + album + duration) -> Step b (track + artist + duration) -> Step c (search by cleaned title and primary artist) -> Step d (search query).
  - Added title cleaning to strip `(feat. ...)`, `Remastered`, `Radio Edit`, and Levenshtein distance matching (max 20% edit distance) to prevent false positives.
  - Upstream errors (5xx, 429, timeouts) explicitly set `hasUpstreamError: true` and are **never cached** in Neon as `not_found`.
  - Added a 60-second in-memory server cooldown map (`upstreamErrorCooldown`) to prevent hammering LRCLIB during outages.
  - Added an owner-only manual lyrics entry endpoint (`POST /api/lyrics` and `PATCH /api/lyrics` guarded by `SCRAPBOOK_ADMIN_SECRET`) allowing the owner to manually input synced or plain lyrics into Neon with `source: 'manual'`. Manual entries take absolute precedence and are never overwritten.
- **Commits**: `80f2fb4`, `fd93acd`.
- **Lesson**: Never collapse transient server errors into domain "not found" states; separate operational failures from missing data, implement fallback search strategies, and provide an administrative bypass for critical content.

### 4. Local `.env.local` Pointed at Production Database
- **Symptom**: During local testing of memory creation and lyrics synchronization, test records (such as `"mock-user"` entries) began appearing in the live database.
- **Root Cause**: `.env.local` was configured with the production Neon database connection strings (`DATABASE_URL` and `DATABASE_URL_UNPOOLED`), so local development ran against production storage.
- **Fix**:
  - The owner manually audited the Neon database and cleaned up the test rows.
  - Documented deployment requirements in `docs/session-11` and `docs/session-12` mandating a separate Neon branch for local development.
  - Implemented a graceful error fallback in `/api/album-palette/route.ts` that catches network/database errors and returns a curated `#C2185B` theme palette with a 60-second `Cache-Control` header to prevent cascading UI crashes.
- **Commits**: `4c2bbac`, `9123828`, `e55142e`.
- **Lesson**: Always maintain strictly isolated database branches or credentials for local development, and ensure API routes provide reliable fallbacks so database hiccups never crash UI themes.

### 5. Rules of Hooks Lint Failures and Free-Tier Volume Crash
- **Symptom**: GitHub Actions CI failed on pull requests due to ESLint `react-hooks/rules-of-hooks` errors, and the player crashed when loaded on free-tier Spotify accounts.
- **Root Cause**:
  - In `VolumeButton.tsx`, an early return `if (accountTier === 'free') return null;` was placed before hook invocations (`useState`, `useRef`), violating React's fundamental rule that hooks must execute in the exact same order on every render.
  - In `SpotifyModeBadge.tsx`, an early return `if (process.env.NODE_ENV === 'production') return null;` preceded hook calls.
  - The local pre-push hook only ran type checks and tests, allowing lint errors to bypass local verification and fail remotely in CI.
- **Fix**:
  - Refactored both components into an outer gate and an inner hook-bearing component (`VolumeButtonInner`, `SpotifyModeBadgeInner`). The outer component evaluates the condition and conditionally mounts the inner component, ensuring hooks never execute out of order.
  - Updated `.githooks/pre-push` to run `npm run lint -- --quiet` (errors-only linting), ensuring all React hook rules are enforced before any push.
- **Commit**: `63d7ade`.
- **Lesson**: Conditional early returns must never precede React hook declarations; use component composition (outer gate + inner component) and enforce lint checks in pre-push git hooks.

### 6. The Edit Audio and Play-State Desync Regression
- **Symptom**: When entering The Edit in Main World, clicking the play button caused desynchronized audio, video controls displayed "Pause" while the video was stopped, opening fullscreen broke playback, and background audio from the GameBoy loading screen continued playing underneath the video.
- **Root Cause**:
  - UI state (`isPlaying`, `hasStarted`) was managed optimistically in React state instead of listening to native `<video>` DOM events (`onPlay`, `onPlaying`, `onPause`, `onVolumeChange`).
  - Triggering sound effects (SFX chime) or requesting fullscreen asynchronously upon the user's initial click consumed the browser's transient user activation token, causing browser autoplay policies to block unmuted video playback.
  - `ClickToEnterScreen` attempted to unmute all videos globally, while the Gameboy loading screen component did not pause its internal video upon being hidden.
- **Fix**:
  - Bound all TheEdit UI indicators directly to native HTMLMediaElement DOM events.
  - Synchronously requested fullscreen and initiated `.play()` directly on the user gesture before executing secondary audio or state updates.
  - Added a "TAP FOR SOUND" button affordance in case browser policy forced muted playback.
  - Ensured the Gameboy loading screen explicitly pauses upon completion.
- **Commit**: `dac6c62`.
- **Lesson**: Media player UI state must always mirror native DOM media events; user gesture activations must trigger media playback immediately without intervening asynchronous operations.

### 7. Incorrect Video Binary Swap and Service Worker Range Request Stripping
- **Symptom**: An automated attempt to fix delayed audio led an AI agent to re-encode the video binaries to `real_vid.mp4` and swap the source. The video began buffering endlessly, and seeking audio stalled completely.
- **Root Cause**:
  - The root cause of the video buffering was not the video encoding, but the Service Worker (`public/sw.js`).
  - The service worker was intercepting fetch requests for video files with `event.respondWith(fetch(event.request))`. When a service worker intercepts media requests, it strips HTTP 206 Partial Content (Range requests). Browsers require byte-range requests for progressive video streaming and audio seeking; stripping them forces the browser to download the entire video from byte 0 before playing audio.
- **Fix**:
  - Commit `c4d6b76` immediately reverted the video binaries and restored `arh_vid_final.mp4`.
  - Commit `cab4e0f` upgraded the service worker to `v2-no-cache-passthrough`, adding an explicit bypass for video files and Range requests:
    ```javascript
    if (
      url.pathname.startsWith('/videos/') ||
      url.pathname.endsWith('.mp4') ||
      url.pathname.endsWith('.webm') ||
      url.pathname.endsWith('.mp3') ||
      event.request.headers.has('range')
    ) {
      return; // Pass directly to native browser networking pipeline
    }
    ```
  - Permanently FROZE The Edit files and media binaries (`scripts/check-frozen.mjs`) with SHA-256 checksum enforcement.
  - Commit `eed43d3` established `arh_vid_final.mp4` as the sole video source and added a retry banner on load errors.
- **Commits**: `abc0639`, `c4d6b76`, `cab4e0f`, `eed43d3`.
- **Lesson**: Service workers must never intercept media files or HTTP Range requests; always preserve native browser byte-range streaming, and freeze sensitive media files against unauthorized automated modifications.

### 8. Public PDF Leak
- **Symptom**: An internal development notes PDF containing Spotify API analysis was discovered inside `public/`.
- **Root Cause**: Files placed anywhere inside the Next.js `public/` directory are automatically served statically to the public internet without authentication.
- **Fix**: Moved `Non-Premium Spotify Accounts Behavior, Dev vs Production.pdf` from `public/` into the protected `docs/` folder.
- **Commit**: `be954e5`.
- **Lesson**: Never store developer notes, documentation, architecture diagrams, or credentials inside `public/`.

### 9. Annoying Cursor Audio Clicking
- **Symptom**: Every mouse click generated an audio click/thud, annoying visitors and interfering with video audio contexts.
- **Root Cause**: A global sound effect toggle (`CursorSoundToggle.tsx`) was attached to cursor clicks in `CursorContext.tsx`.
- **Fix**: Removed `CursorSoundToggle.tsx` and purged cursor sound synthesis from `CursorContext.tsx`.
- **Commit**: `67a4f11`.
- **Lesson**: Global cursor audio creates sensory fatigue and conflicts with media playback; eliminate unnecessary decorative audio.

### 10. Spotify API 429 Lockout and Hot-Reload Request Storms
- **Symptom**: During development and testing, Spotify returned HTTP 429 Too Many Requests, locking the application out of Spotify APIs for hours.
- **Root Cause**: Hot module reloading, window focus refetches in TanStack Query, uncached `/me` profile checks, and unbounded queries during memory loading piled up dozens of simultaneous requests against Spotify's developer quota.
- **Fix**:
  - Implemented an atomic sliding-window rate limiter in Upstash Redis (`SPOTIFY_RATE_LIMIT_LUA` in `src/lib/server/redis.ts`).
  - Added an in-memory and Redis circuit breaker (`spotify_api_lock`) honoring `Retry-After`.
  - Built an offline mock mode using MSW mocking all 29 Spotify endpoints for development (`npm run dev`).
  - Added request deduplication for identical in-flight GET requests (`src/lib/server/spotifyInFlight.ts`).
- **Commit**: `9123828`.
- **Lesson**: Third-party APIs with strict rate limits require defensive architecture from day one: atomic rate limiting, circuit breakers, caching, and a local mock mode.

### 11. PowerShell UTF-16LE Output Redirection Corrupted Git Log Viewing
- **Symptom**: When dumping the full 217-commit git history to scratch storage using PowerShell `>` redirection, inspecting the file failed with an `unsupported mime type text/plain; charset=utf-16le` error.
- **Root Cause**: Windows PowerShell defaults to UTF-16LE encoding when redirecting command stdout with `>`.
- **Fix**: Re-exported the commit log explicitly using `Out-File -Encoding utf8`, allowing clean UTF-8 inspection without tool failures.
- **Commit**: Process fix during commit `f7979a6`.
- **Lesson**: On Windows systems, avoid bare `>` shell redirection for text processing tools; always explicitly specify UTF-8 encoding.


---

## 6. How Things Work (Deep Dives)

### The Native CSS Hello Kitty Cursor System
The custom cursor is engineered to deliver zero latency, crisp pixel art, and context-sensitive reactions without incurring DOM overhead.

1. **Asset Generation (`scripts/generate-cursor-expressions.mjs`)**:
   - High-resolution SVG frames are rasterized using `sharp` into 32px (1x) and 64px (2x retina) PNG assets.
   - Expression states include: `default`, `pointer`, `locked`, `happy`, `music`, `sleepy`, `wink`, `dizzy`, `peel`, and `squeeze`.
   - The `locked` badge is pre-baked directly into the PNG pixels to eliminate multi-layered DOM composition.
2. **CSS `image-set()` and Hotspot Definition (`src/app/globals.css`)**:
   - Cursors are applied using standard CSS rules with high-DPI scaling:
     ```css
     body, [data-kitty="default"] {
       cursor: -webkit-image-set(
         url('/hampter/cursor/kitty_default_32.png') 1x,
         url('/hampter/cursor/kitty_default_64.png') 2x
       ) 6 4, auto !important;
     }
     button, a, [data-kitty="pointer"] {
       cursor: -webkit-image-set(
         url('/hampter/cursor/kitty_hover_32.png') 1x,
         url('/hampter/cursor/kitty_hover_64.png') 2x
       ) 6 4, pointer !important;
     }
     [data-kitty="locked"] {
       cursor: -webkit-image-set(
         url('/hampter/cursor/kitty_locked_32.png') 1x,
         url('/hampter/cursor/kitty_locked_64.png') 2x
       ) 6 4, not-allowed !important;
     }
     ```
   - The coordinates `6 4` define the hotspot (the exact pixel offset corresponding to Kitty's left ear/bow tip where clicks register).
3. **State Cascade and Priority**:
   - Priority cascades from explicit HTML attributes down to semantic tag defaults:
     `[data-kitty="locked"]` > `[data-kitty="music"]` > `[data-kitty="pointer"]` > `button` / `a` > `body`.
4. **Rollback Flag**:
   - If a browser environment does not support native cursor `image-set()`, `CURSOR_RENDER_MODE` in `src/components/ui/cursorUtils.ts` can be toggled to restore DOM-based rendering.

---

### The Lyrics Pipeline End-to-End
Synchronized lyrics provide an immersive karaoke experience in Music World.

1. **Client Trigger**: When a track starts playing, `useLyrics` in `src/components/worlds/music/lyrics/useLyrics.ts` checks its module-level cache. If missing, it requests `/api/lyrics?trackId={id}&title={t}&artist={a}`.
2. **Neon Database Cache Check**: The API route checks `lyrics_cache` in Neon Postgres:
   - If `source === 'manual'`, it is returned immediately (manual owner overrides are permanent).
   - If `source === 'lrclib'`, the cached LRC text is returned.
   - If `source === 'not_found'` and the entry is younger than 7 days, it returns `status: 'not_found'`.
3. **Resilient 4-Step Lookup Chain (`src/lib/lyricsLookup.ts`)**:
   - If uncached, the server executes a 4-step search against LRCLIB with an overall 8-second deadline:
     - **Step a**: Exact lookup with track name, artist name, album name, and duration.
     - **Step b**: Exact lookup without album name.
     - **Step c**: Search query using sanitized track name and primary artist name.
     - **Step d**: Broad text search with combined title and artist terms.
   - Titles are sanitized using `cleanTrackTitle` to strip suffixes like `(feat. ...)`, `- Remastered`, `Radio Edit`, or `Deluxe Edition`.
   - Results are validated using `isCloseMatch`: checks Levenshtein distance on normalized strings and rejects candidates whose duration differs by more than 3 seconds (to prevent sync drift).
4. **Failure Separation**:
   - If LRCLIB returns a 5xx error, 429 rate limit, or timeout, the server returns `status: 'upstream_error'` and records a 60-second in-memory cooldown. **It never saves upstream errors as `not_found` in Neon.**
   - Only clean, empty search responses are cached as `not_found` for 7 days.
5. **Client Synchronization**:
   - In `LyricsView.tsx`, playback position is read from the audio clock via `requestAnimationFrame` (never stored in React state).
   - Active lyric lines and word wipes are updated by mutating inline CSS transforms and classes, maintaining 60fps performance without triggering React re-renders.

---

### The Service Worker Strategy and Media Streaming
Why media files and byte-range requests must bypass Service Workers:

1. **HTTP 206 Partial Content (Range Requests)**:
   - When playing video or audio, browsers do not download the entire media file at once. Instead, `<video>` and `<audio>` elements emit HTTP requests with a `Range: bytes=start-end` header to fetch small chunks progressively.
   - This allows users to jump forward in a video timeline without waiting for preceding megabytes to download.
2. **The Service Worker Trap**:
   - If a service worker intercepts a fetch request using `event.respondWith(fetch(event.request))`, standard Service Worker implementations often buffer the entire response, omit or mishandle the `Range` headers, or fail to stream HTTP 206 responses correctly.
   - This causes video players to stall, video audio to lag, or media seeking to break entirely.
3. **The Pass-Through Fix (`public/sw.js`)**:
   - Service Worker v2 (`v2-no-cache-passthrough`) checks incoming requests before interception:
     ```javascript
     if (
       url.pathname.startsWith('/videos/') ||
       url.pathname.endsWith('.mp4') ||
       url.pathname.endsWith('.webm') ||
       url.pathname.endsWith('.mp3') ||
       url.pathname.endsWith('.ogg') ||
       url.pathname.endsWith('.wav') ||
       event.request.headers.has('range')
     ) {
       return; // Direct pass-through to native browser networking
     }
     ```
   - By returning without calling `event.respondWith()`, the request is handed directly to the browser's native C++ network stack, preserving full byte-range streaming and instantaneous audio seeking.

---

### The Frozen-Files Guard and Git Hooks
To protect painstakingly calibrated creative assets from inadvertent agent edits, the repository employs a multi-tiered freeze system:

1. **The Frozen Files List (`scripts/check-frozen.mjs`)**:
   - Protects all components of The Edit:
     - `src/components/worlds/main/TheEdit.tsx`
     - `src/components/worlds/main/TheEditControls.tsx`
     - `src/components/worlds/main/TheEditTvHardware.tsx`
     - `src/components/worlds/main/TheEditEndCard.tsx`
     - `src/components/worlds/main/TheEditHelloKitty.tsx`
     - `src/components/worlds/main/fullscreenUtils.ts`
     - `src/components/worlds/main/__tests__/theEditFullscreen.test.tsx`
     - `public/videos/arh_vid_final.mp4` (SHA-256: `1c88b1bea228f2d005d1eb8d439737f37e3287a9c8ed0ff342895eebc2e967ae`)
     - `public/images/ar.jpeg` (SHA-256: `7451eee8d0665fb1da8689339f4574a01f33dc7fc28d9df031831547f9c4c10c`)
2. **Three-Tier Enforcement**:
   - **File Headers**: Code files must include `FROZEN: do not modify without explicit owner approval. See AGENTS.md.`
   - **Binary Hash Verification**: The script computes the SHA-256 digest of media files on disk; if a single byte differs, it fails immediately.
   - **Git Status & Commit Inspection**: The script inspects `git status --porcelain` and unpushed commit diffs against `origin/main` to detect any modifications to frozen files.
3. **Execution Points**:
   - **Pre-commit Hook (`.githooks/pre-commit`)**: Rejects any commit modifying frozen files.
   - **Pre-push Hook (`.githooks/pre-push`)**: Rejects any push modifying frozen files.
   - **CI Pipeline (`.github/workflows/ci.yml`)**: Runs `frozen-check` as its first job on Ubuntu.
   - **Override**: The only permitted bypass is setting `ALLOW_FROZEN=1` with explicit owner consent.

---

### Spotify Authentication and Web Playback SDK
1. **Authentication Flow**:
   - Visitor navigates to `/api/spotify/login`. The route constructs an authorization URL with required scopes (`streaming`, `user-read-email`, `user-read-private`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`, `user-top-read`, `user-read-recently-played`).
   - Spotify redirects back to `/api/spotify/callback`. The server exchanges the authorization code for tokens, encrypts them, and sets secure `HttpOnly`, `SameSite=Lax` cookies.
2. **Transparent Token Refresh in API Proxy**:
   - When the client calls `/api/spotify/proxy/[...path]`, the proxy attaches the access token from the cookie.
   - If Spotify responds with `401 Unauthorized`, the proxy automatically invokes `refreshSpotifyToken()` using the refresh token cookie, writes the new tokens to the response headers, and retries the upstream request once transparently.
3. **Web Playback SDK Initialization**:
   - `SpotifyPlayerProvider.tsx` loads the Spotify Web Playback SDK script (`https://sdk.scdn.co/spotify-player.js`).
   - If the account tier is verified as Premium, it creates a single `Spotify.Player` instance named `"punkrose.fm"`.
   - On `ready`, it captures the `device_id` and sets it active.
   - Playback state changes are synchronized with the Zustand store `useSpotifyPlayerStore`.

---

## 7. Testing and Quality

### Test Suite Metrics
- **Total Test Files**: 69 files passed.
- **Total Unit & Integration Tests**: 601 tests passed.
- **Test Framework**: Vitest with `@testing-library/react` and `jsdom`.
- **API Mocking**: Mock Service Worker (MSW) mocking all 29 Spotify endpoints and stubbing the Web Playback SDK player.

### Test Categories
1. **Playback & Queue Verification**:
   - Queue synchronization, live-queue copying, boundary bounds handling, track-end detection (`src/components/worlds/music/playback/__tests__/queueBugs.test.ts`, `playback.test.ts`).
2. **Rate Limiting & Redis**:
   - Sliding-window Lua script validation, concurrent slot reservations, budget trimming, and SCAN pattern deletion (`src/lib/server/__tests__/rateLimiter.test.ts`, `redisScan.test.ts`).
3. **Lyrics Engine**:
   - LRC timestamp parsing, word timing estimations, title sanitization, Levenshtein matching, and upstream error isolation (`src/lib/__tests__/lyrics.test.ts`, `lyricsLookup.test.ts`, `lyricsRoute.test.ts`).
4. **Color Extraction & Contrast**:
   - WCAG 2.1 AA luminance contrast calculations, fallback palette generation, and vibrant text readability (`src/lib/__tests__/paletteContrast.test.ts`, `contrast.test.ts`).
5. **Frozen Integrity & Fullscreen**:
   - The Edit fullscreen utilities and event bindings (`theEditFullscreen.test.tsx`).
6. **Cursor Physics & Utilities**:
   - Native cursor image-set mappings, priority cascades, and hotspot calculations (`cursorUtils.test.ts`).

### Verification Workflow
Before pushing code, all four verification gates must be run:
1. `npm run check:frozen`: Verifies integrity of frozen cinema files and checksums.
2. `npm run typecheck`: Validates complete TypeScript type safety (`tsc --noEmit`).
3. `npm run lint -- --quiet`: Confirms zero ESLint errors and strict adherence to React Hooks rules.
4. `npm test`: Executes all 601 tests in the Vitest suite.

### GitHub Actions CI
The CI workflow (`.github/workflows/ci.yml`) runs on Node.js 22 across 5 parallel jobs:
- `frozen-check`: Verifies frozen files and checksums.
- `typecheck`: Runs `npm run typecheck`.
- `lint`: Runs `npm run lint`.
- `test`: Runs `npm test`.
- `build`: Runs production Next.js build with `SPOTIFY_LIVE=0` and mock client credentials.

---

## 8. Commands Cheat Sheet

| Command | Purpose and Execution Details |
|---|---|
| `npm run dev` | Starts local Next.js development server with Turbopack. Defaults to offline mock mode for Spotify. |
| `npm run build` | Compiles an optimized production build of the Next.js application. |
| `npm start` | Launches the compiled production server locally (serves the last successful build). |
| `npm run lint` | Runs ESLint across all TypeScript and React files. |
| `npm run lint -- --quiet` | Runs ESLint reporting errors only (used in pre-push git hooks). |
| `npm run typecheck` | Executes `tsc --noEmit` to verify type safety without writing output files. |
| `npm test` | Runs the full Vitest automated test suite once. |
| `npm run test:watch` | Runs Vitest in interactive watch mode for test-driven development. |
| `npm run check:frozen` | Executes `node scripts/check-frozen.mjs` to verify frozen files, checksums, and headers. |
| `npm run db:migrate` | Runs `tsx scripts/apply-migration.ts` using `DATABASE_URL_UNPOOLED` to execute pending Drizzle migrations. |
| `npm run slideshow` | Runs `tsx scripts/build_slideshow.ts` to crop and optimize manual images into `public/slideshow/`. |
| `npm run optimize-images`| Runs `node scripts/optimize-images.mjs` to optimize and convert PNGs/JPEGs to WebP. |

---

## 9. Rules and Lessons Learned for AI Coding Agents

When working with autonomous AI pair programming agents (such as Google Antigravity), adhere to these battle-tested rules:

1. **Never Swap, Re-encode, or Alter Media Without Explicit Approval**:
   - Media binaries are not generic code; re-encoding or swapping media can alter codecs, strip keyframes, and break byte-range streaming. Media changes must always be requested and approved by the owner first.
2. **Distinguish Bugs From Intentional Design Choices Before "Restoring"**:
   - Do not assume an unconventional visual element is a bug. Verify whether it was intentionally placed before attempting to revert or restructure it.
3. **Always Verify Claims With Git Tools**:
   - Never accept speculative claims about repository status. Always execute `git status`, `git diff`, and `git log` to confirm actual filesystem states.
4. **Complete the Full Gate Pipeline on Every Task**:
   - Every implementation session must finish with the complete four-step gate sequence: `check:frozen` -> `typecheck` -> `lint` -> `test` -> `build`. Never push unverified code.
5. **Never Execute Database Destructive Commands Unasked**:
   - Never run `drizzle-kit push`, `drizzle-kit drop`, or table truncation commands without explicit owner authorization.
6. **Use Isolated Database Branches for Local Work**:
   - Ensure local `.env.local` points to a dedicated development database branch so mock records never pollute production data.
7. **Strict Enforcement of React Hooks Rules**:
   - Never put conditional returns above React hook invocations. Structure components using outer gates and inner children to prevent hook mismatches.
8. **Decouple Heavy Transforms From the Cursor**:
   - Keep custom cursors lightweight using native CSS `image-set()`. Place interactive animations and spring physics on the target elements rather than the pointer.

---

## 10. Open Items and Future Work

Current pending tasks and backlog items:

1. **Verify The Edit Audio Timing After Service Worker Unregistration**:
   - Test audio playback timing in a clean browser profile after completely unregistering any legacy Service Worker caches to confirm zero audio lag.
2. **Verify "Uff" Lyrics**:
   - Verify that the lyrics for "Uff" load cleanly via the resilient lookup pipeline or confirm manual lyrics entry in Neon `lyrics_cache` (currently unverified).
3. **Provision Neon Dev Branch for Local Work**:
   - Create an isolated Neon development branch and dev Upstash Redis namespace so local development and mock mode never touch production storage.
4. **Optional Hand-Drawn 32px Pixel Cursor Frames**:
   - Hand-draw dedicated 32x32 pixel art bitmaps for Hello Kitty cursor expressions rather than downsampling from 64px.
5. **Optional ESLint Warning Cleanup**:
   - Clean up remaining non-error ESLint warnings (~696 warnings, primarily `@typescript-eslint/no-explicit-any` in test fixtures and mock handlers).
6. **Visually Confirm Main World Redesigns**:
   - Visually confirm the Phase 04 navigation dot fix, hero presentation, and the newly integrated Okayama postage stamps, strawberry cake sticker, and Batman sign-off sticker (`d413fe1`) in real browser viewports.
7. **Full Project Log Creation and Verification**:
   - `docs/PROJECT_LOG.md` was created, verified against all 601 tests, committed (`f7979a6`), and pushed to GitHub `origin/main`. Continually maintained in sync with all project progression.



---

## 11. Glossary

- **Faststart (`moov` atom at front)**: An MP4 encoding configuration where the movie metadata (`moov` atom) is placed at the very beginning of the file rather than the end, allowing browsers to start playback immediately without downloading the entire video.
- **Range Request (HTTP 206 Partial Content)**: An HTTP request header (`Range: bytes=start-end`) used by browsers to fetch specific byte slices of a file. Essential for video streaming and audio seeking.
- **Service Worker**: A client-side script running in the background separate from web pages. Used for offline caching, push notifications, and PWA features.
- **Pooled Connection**: A database connection routed through a connection pooler (e.g. PgBouncer) that shares a pool of persistent connections across multiple short-lived serverless requests.
- **Unpooled Connection**: A direct, non-pooled TCP connection to the database. Required for DDL migrations and schema changes.
- **Rules of Hooks**: Core React invariants requiring hooks to be called at the top level of function components, never inside loops, conditions, or after early returns.
- **Hotspot**: The specific coordinate pixel within a mouse cursor bitmap (e.g. `6 4`) that registers click events.
- **Spring Physics**: Animation technique modeling natural motion using physical equations (stiffness, damping, mass) rather than linear timing curves.
- **Cache-Control**: HTTP response header specifying caching policies (e.g. `public, max-age=31536000, immutable`).
- **Sliding-Window Rate Limiting**: An algorithm that counts requests within a sliding time window (e.g. 30 seconds) using sorted sets to prevent burst over-quota traffic.
- **Circuit Breaker**: A software pattern that temporarily blocks outgoing requests to a failing or rate-limited service to prevent worsening the failure.
- **Encrypted Media Extensions (EME) / Widevine**: Browser APIs that enable DRM-protected media playback; required by Spotify's Web Playback SDK.
- **Levenshtein Distance**: A mathematical metric measuring the number of single-character edits required to transform one string into another; used in lyrics title matching.
- **Turbopack**: Rust-based bundler powering Next.js local development builds for high-speed compilation.
- **MSW (Mock Service Worker)**: An API mocking library that intercepts HTTP requests at the network level using Service Worker or Node request interception.
- **Zustand**: Lightweight React state management library based on simplified publish-subscribe stores without context provider boilerplate.
