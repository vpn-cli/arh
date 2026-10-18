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
- `0940053` (2026-10-17 16:53): `feat(main): cuter hero layout — polaroids, player card, marquee`. Redesigned Main World hero into a 3-column kawaii scrapbook composition.
- `617ff8b` (2026-10-17 17:11): `chore(stickers): slice and clip sticker pack`. Added automated sharp slice script (`scripts/slice-sticker-sheet.mjs`) and generated 19 transparent-clipped WebP stickers across bows, food, hello kitty, shinchan, snoopy, and misc.
- `0bb835c` (2026-10-17 18:08): `fix(main): remove empty viewport after end card`. Resolved the ~1 full viewport of empty background below "END OF TRANSMISSION" and "RETURN TO HUB" by updating `<main>`'s bottom padding from `pb-36` (144px) to `pb-16 sm:pb-20` (64px mobile / 80px desktop), ensuring comfortable 64–96px breathing room while preserving Phase 04 active navigation dot tracking.
- `5a84c44` (2026-10-17 18:49): `feat(main): scatter sticker pack across hero`. Scattered the newly sliced sticker pack across the full 100vh × 100vw Main World hero in an organic scrapbook aesthetic. Hand-tuned 19-sticker configuration in `heroStickers.ts` with % coordinates, rotation (-15° to +15°), and weights (heavier items kept small 56–72px). Featured Shin-chan in lower-left with a handwritten-style speech bubble ("namaste ji 🙏" in font-retro). Unified die-cut styling with white border and soft drop shadow. Staggered 40ms pop-in on load, slow idle float drift, and data-cursor="peel" hover reaction. Full reduced motion support. Verified zero overlap across desktop (1920×1080), laptop (1366×768), tablet (820×1180), and mobile (375×812). Excluded and git rm'd lipstick kiss and fingerprint heart. Passed all 611 Vitest tests and production build.
- `c2e048b` (2026-10-17 19:07): `feat(main): floating, parallax, blended hero stickers`. Brought hero stickers alive with 60fps GPU-accelerated motion and pastel blending. Implemented randomized idle bobbing (4–8px, ±2°, 5–9s durations with seeded phase offsets) so no two stickers bob in sync. Added smooth rAF mouse parallax drifting up to 12px opposite the cursor scaled by individual depth factors (0.2–1.0) on desktop pointers, pausing automatically when the tab is hidden. Added hover lift (-4px), subtle wiggle, and 1.08 scale. Upgraded sticker border treatment with a thick ~3px vinyl die-cut white outline (`drop-shadow` in cardinal directions) and soft pink-tinted depth shadow (`rgba(194,24,91,0.18)`). Softened dark/heavy stickers (`saturate(0.85) opacity(0.92)`) while preserving full saturation on character stickers. Fixed Shin-chan's speech bubble emoji by rendering the 🙏 in a dedicated span with a cross-platform emoji font stack to resolve broken glyph rendering in pixel fonts.
- `33fbf07` (2026-10-17 19:12): `fix(main): single mascot bubble, 'aur bhai' on hover`. Unified Hello Kitty mascot speech bubbles into exactly ONE persistent bubble. Cleaned up overlapping secondary reaction bubble tag (`heyy! ✨` / `BOOP! 🌸`) and removed browser default tooltip `title="Click to boop!"`. Implemented smooth text swap from default `"psst… scroll ↓"` to `"aur bhai"` with a bubbly squish-in transition (`scale(0.85) -> scale(1.1) -> scale(1)`) on hover and focus. Added 2s temporary greeting latch on tap/click for mobile and touch devices before reverting.
- `ab0853b` (2026-10-17 19:17): `fix(letter): hidden letter content no longer reserves layout height`. Diagnosed and resolved the persistent empty space at the end of Main World. In previous builds, `TheLetterStationery` was kept in the DOM with `opacity-0` and `pointer-events-none` when closed, causing its 4,681px height (and 4,735px scrapbook backing cardstock) to overflow `letterRef` and stretch document scrollable height to over 4,100px past `#end-of-transmission`. Replaced non-display opacity gating with clean conditional rendering (`if (!isOpen) return null;`) in `TheLetterStationery` and `hidden` visibility on unopened envelope when open. Verified that when closed, stationery reserves 0px layout space, `#end-of-transmission` (RETURN TO HUB) is the final visible element, and document ends cleanly ~80px below (within the target 64–96px range) in both closed and opened states.

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

### 12. Main World Hero Sticker Optimization, Hamster Cleanup, and Bottom Spacing Fix
- **Symptom**:
  1. Unwanted peeking hamster sticker appeared behind Hello Kitty in the hero section.
  2. A massive empty space existed at the bottom of the page between the letter and "END OF TRANSMISSION".
  3. Every sticker displayed a strange vertical white line/streak on its right edge in Chromium/Blink browsers.
  4. Hero stickers felt harshly pasted on and did not blend into the warm pastel cream background.
  5. The floating effect used a mouse parallax script with `requestAnimationFrame` and `mousemove` listeners rather than a tranquil, zero-overhead water floating drift.
- **Root Cause**:
  1. `crop_hamp.png` was anchored under Hello Kitty's mascot cluster in `TheAdventureHero.tsx`.
  2. Stacked bottom paddings and margins (`py-12 md:py-16` on `PhaseSection`, `py-8 sm:py-12` on `TheLetter`, `mt-16 sm:mt-20` on `#end-of-transmission`, and `pb-16 sm:pb-20` on `<main>`) accumulated nearly 360px of dead space.
  3. Chaining eight CSS `drop-shadow(#FFFFFF)` filters on elements with alpha channels in `.hero-sticker-pack-filter` triggered a known Chromium Skia rasterization bug where convolution kernels clamp to bounding box edges, drawing a white vertical streak on the right.
  4. The 8x pure white `#FFFFFF` rims created harsh contrast against `#FAF5E9`.
  5. `HeroStickerBomb.tsx` was running an active rAF lerp loop tracking mouse coordinates across 19 DOM elements.
- **Fix**:
  - Removed `crop_hamp.png` from `TheAdventureHero.tsx`.
  - Replaced the 8 stacked pure-white filters with a dual soft warm plum and rosy depth shadow (`rgba(58, 36, 64, 0.10)` and `rgba(255, 143, 179, 0.16)`) in `src/app/globals.css`, eliminating the white streaks and softly blending stickers into the scene.
  - Removed all mouse event listeners and rAF loops from `HeroStickerBomb.tsx`, replacing them with pure GPU-composited CSS keyframes (`hero-sticker-bob`) simulating slow, calm water buoyancy and drift (zero CPU/JS overhead).
  - Tightened bottom spacing in `MainWorld.tsx` and `TheLetter.tsx` (`mt-6 sm:mt-8` on `#end-of-transmission`, `pb-8 sm:pb-12` on `main`, `!pb-3 md:!pb-4` on `#phase-04-letter`, and `pt-6 sm:pt-10 pb-2 sm:pb-3` on `TheLetter.tsx`).
- **Verification**: Verified in headless and full Chromium via Playwright; all 71 test suites (616 tests) passed; `check:frozen`, `typecheck`, `lint`, and production build passed.

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
- **Total Test Files**: 71 files passed.
- **Total Unit & Integration Tests**: 616 tests passed.
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

---

## 12. Session Log: Main World Hero Sticker Blending Presets (Dev Switch)

### Context & Goals
To allow live side-by-side evaluation and comparison of hero sticker integration into the scrapbook background, three switchable blending presets were designed, configured in `stickerStyles.ts`, and hooked into `HeroStickerBomb.tsx` alongside a dev-only bottom-center switcher and URL query parameter (`?stickers=a|b|c`).

### Architecture & Motion Isolation
To prevent CSS transform collisions (where animations, hover states, or filters overwrite each other), each sticker follows a strict 3-tier element hierarchy:
1. **Outer Wrapper (`.hero-sticker-parallax`)**:
   - Manages mouse parallax translate (`translate3d(x, y, 0)`).
   - Driven by an idle-sleeping `requestAnimationFrame` loop that normalizes pointer offsets across desktop screens, lerps coordinates (0.08 damping), and sleeps when settled for 0% CPU consumption during cursor idle.
   - Bypassed entirely when `prefers-reduced-motion` is active or on coarse/touch screens.
2. **Middle Wrapper (`.hero-sticker-float.hero-sticker-item`)**:
   - Manages idle water-float bobbing (`@keyframes hero-sticker-bob`) via CSS animation.
   - Manages interactive hover scaling (`scale: 1.08; transition: scale 0.22s ...`) using standard CSS `scale` (CSS Transforms Level 2), which operates completely independently of `@keyframes` transform translates.
   - Manages peel cursor (`data-cursor="peel"`), click targets, and holds Shin-chan's speech bubble.
3. **Inner Image (`<Image>` / `<img>`)**:
   - Dedicated strictly to filters, opacity, and `mix-blend-mode`.
   - Never applies transforms or animations directly to the image element.

### The 3 Presets
- **Preset A ("Faded print" — Default)**:
  - Filter: `drop-shadow(-3px 0 0 #FFFFFF) drop-shadow(3px 0 0 #FFFFFF) drop-shadow(0 -3px 0 #FFFFFF) drop-shadow(0 3px 0 #FFFFFF) drop-shadow(0 4px 10px rgba(194, 24, 91, 0.15)) saturate(0.75) contrast(0.88) brightness(1.06) sepia(0.12) hue-rotate(-12deg)`
  - Opacity: `0.88`
  - Outline: 3px stacked white die-cut outline + warm pink drop shadow.
- **Preset B ("Printed on the paper")**:
  - Dark/colored stickers: `mix-blend-mode: multiply`, no white outline, softer ambient shadow (`drop-shadow(0 3px 6px rgba(194, 24, 91, 0.12))`), and base dusty rose color grade.
  - White-heavy stickers (`hello-kitty-peeking`, `snoopy-sleeping`, `shinchan-featured`, `bunny-headphones`): Use Preset A die-cut styling to prevent white illustrations from turning transparent.
- **Preset C ("Washi grain")**:
  - Base Preset A color grade and outline + subtle `blur(0.3px)` on the image to soften digital sharpness.
  - Clipped SVG `feTurbulence` paper noise overlay (`mix-blend-mode: overlay`, `opacity: 0.25`) constrained to each sticker's exact silhouette using `mask-image: url(...)` and `mask-size: contain`.

### Dev-Only Switcher & Production Pruning
- Reads dev query parameter `?stickers=a|b|c` on load; defaults to A.
- Renders an interactive bottom-center pill switcher (`[A] Faded | [B] Paper | [C] Washi`) that toggles presets live and syncs URL parameters via `window.history.replaceState`.
- Conditioned strictly behind `process.env.NODE_ENV !== "production"`. When built for production, the switcher component returns `null` and Next.js / Turbopack dead-code-eliminates the dev UI, guaranteeing 0% presence in production bundles.
- All 71 test suites (618 tests) passing; production build verified cleanly.

---

## 13. Session Log: Locked-In Preset A & Calmer Depth Hierarchy

### Context & Goals
After live side-by-side evaluation, Preset A ("Faded print") was selected as the final styling for the hero stickers. To establish a clear visual hierarchy and ensure the center content column (avatar mascot, title, welcome card, CONTINUE button) remains the unambiguous focus of the hero section, the stickers were organized into 3 depth tiers, pushed outward toward the viewport perimeters, and given tranquil motion curves.

### 1. Preset A Lock-In & Dev Code Stripping
- Removed Presets B and C, the dev switcher component, the `?stickers=` URL query parameter, and associated dev switcher unit tests.
- Preserved the clean 3-layer motion isolation architecture:
  `outer wrapper (parallax translate)` → `middle wrapper (float animation + hover scale)` → `<img> (filters/opacity only)`.
- Removed all obsolete CSS animations (`@keyframes hero-sticker-wiggle-subtle`) and overlay elements to guarantee zero leftover dead code.

### 2. Depth Tiers & Visual Multipliers
The 19 placed stickers were mapped across 3 tiers driven by `depth` (exposed via `TIER_MULTIPLIERS` in `stickerStyles.ts`):
- **BACK (9 stickers: depth 0.25–0.35)**:
  - Multipliers: size ×0.6, opacity 0.45, blur 1.0px, extra desaturation (`saturate(0.6)`), float amplitude 2px.
  - Role: Blends naturally into the cream wallpaper texture as subtle background ambiance.
  - Items: *Cherries (top-left), Vinyl Record, Red Star Small 1, Canon Camera, Red Star Large 1, Billiard Ball 7, Red Ribbon Bow (accent), Red Star Small 2, Red Star Large 2*.
- **MID (7 stickers: depth 0.50–0.65)**:
  - Multipliers: size ×0.8, opacity 0.65, no blur, standard desaturation (`saturate(0.75)`), float amplitude 3px.
  - Items: *Bunny with Headphones, Full Moon, Headphones with Bows, Spider-Man Mask, Coca-Cola Can, Electric Guitar, Red Ribbon Bow (main)*.
- **FRONT (3 stickers: depth 0.85–0.90)**:
  - Multipliers: size ×0.9, opacity 0.80, no blur, standard desaturation (`saturate(0.75)`), float amplitude 4px.
  - Restraints: Strictly reserved for key character illustrations; heavy/dark items are prohibited from FRONT.
  - Items: *Shin-chan Namaste (with speech bubble), Snoopy Sleeping, Hello Kitty Peeking*.

### 3. Perimeter Placement & Center Clearance
- Widened the center clear zone: no sticker is positioned within ~120px of the center column (left stickers kept at `x <= 14%`, right stickers kept at `x >= 85%`).
- Stickers pushed outward to perimeter edges and corners with natural border cropping.
- Kept completely clear of top navigation pills (Home / Main World), right phase tracker dots, and bottom indicators.

### 4. Calmer Motion & Hover Dynamics
- **Float Bobbing**: Calmed vertical amplitudes (2px BACK, 3px MID, 4px FRONT), elongated cycles (7.4s–11.2s), and gentle oscillation rotations (within ±1.0°).
- **Parallax Translate**: Capped maximum mouse drift at 6px (scaled by depth, making BACK tier move only ~1.8px).
- **Subtler Pop-in**: Faster, gentle transition (`scale 0.85 -> 1.0` with opacity fade over 280ms).
- **Hover Interaction**: Hovering over any sticker triggers a 3px lift, a smooth 1.08 scale, and brings the image to full 1.0 opacity (`opacity: 1 !important`) via standard CSS transitions.

### 5. Strengthened Center Mascot Glow
- Expanded the pink radial glow behind the Kitty mascot (`w-56 h-56 sm:w-72 sm:h-72`) and increased the core gradient opacity (`rgba(255, 143, 179, 0.58)` to `0.28`), establishing an unmistakable warm focal center.

### 6. Verification
- All verification gates passed: `check:frozen` (0 modifications to frozen files), `typecheck` (0 errors), `lint -- --quiet` (0 errors), `npm test` (71 suites, 619 tests passed), and `npm run build` (production Next.js build succeeded).

---

## 14. Session Log: Even Jittered-Grid Sticker Layout & Larger Sizes

### Context & Goals
Re-layout the Main World hero stickers using a deterministic seeded jittered-grid system across the entire viewport to eliminate artificial edge clumping, populate intermediate bands (15–35% and 65–85% width), increase base sticker sizes (80–140px), and preserve the locked-in Preset A "Faded print" aesthetic and 3-tier depth hierarchy.

### 1. Jittered Grid Architecture (`stickerGrid.ts`)
- **Grid Subdivision**:
  - Desktop (≥1280px): 6 columns × 4 rows (24 cells).
  - Compact Desktop (1024–1279px): 5 columns × 4 rows (20 cells).
  - Tablet (768–1023px): 4 columns × 4 rows (16 cells, sizes scaled by ×0.8).
  - Mobile (<768px): Corner and edge responsive placement (≤64px small items + Shin-chan, no text overlap).
- **Runtime Center Corridor Detection**:
  - The center content cluster (mascot + speech bubble, title, description card, CONTINUE button) is measured dynamically via `centerRef` (`id="hero-center-content"`) + a debounced (150ms) `ResizeObserver`.
  - Padded by a strict 40px clearance zone. Cells that overlap the center corridor are marked blocked (`isCenterBlocked = true`).
- **Seeded Mulberry32 PRNG (`createPRNG`)**:
  - Algorithm seed `0x4d61616869` guarantees 100% deterministic positioning, jitter (±25% of cell width/height), and rotation (−12° to +12°) on every reload without reshuffling.
- **Intermediate Bands Populated**:
  - The bands between the edges and the center (15–35% and 65–85% width) receive stickers consistently, eliminating empty vertical strips.
- **Variety & Spacing Rules**:
  - The 3 FRONT characters are distributed across separate quadrants (Shin-chan in bottom-left, Snoopy in top-right, Hello Kitty in top-left).
  - No two stickers of the same category (stars, bows) occupy adjacent cells (`areCellsAdjacent` guard).
  - Shin-chan's "namaste ji 🙏" speech bubble is clamped to guarantee it remains inside viewport boundaries.
- **Multi-Obstacle Collision & Nudge Pass**:
  - Validates placements against the center block (+40px), top-left/right navigation pills, right phase tracker dots, and neighbor sticker overlap (>15% area).
  - Automatically attempts radial nudges within the cell boundary; safely hides stickers if clearance cannot be resolved.

### 2. Larger Base Sizes & Updated Depth Multipliers
- Base sizes scaled up to 80–140px.
- Tier multipliers in `TIER_MULTIPLIERS` (`stickerStyles.ts`):
  - **BACK (9 stickers)**: size ×0.85, opacity 0.50, blur 0.6px, saturate 0.60, float amplitude 2px.
  - **MID (7 stickers)**: size ×1.00, opacity 0.70, blur 0.0px, saturate 0.75, float amplitude 3px.
  - **FRONT (3 stickers)**: size ×1.15, opacity 0.85, blur 0.0px, saturate 0.80, float amplitude 4px.
  - Heavy and dark items strictly kept in BACK/MID tiers.

### 3. Preserved Systems
- 3-layer motion isolation: outer wrapper (parallax translate, 0% CPU when idle) → middle wrapper (float bobbing + hover scale) → inner `<img>` (Preset A filters only).
- Smooth hover interaction lifts sticker 3px, scales ×1.08, and brings image to full 1.0 opacity.
- Strong pink radial center glow and reduced-motion accessibility gates preserved.

### 4. Verification & Quality Gates
- **Frozen Guard**: `npm run check:frozen` passed (0 modifications to frozen files).
- **Type Safety**: `npm run typecheck` passed with 0 errors.
- **Linter**: `npm run lint -- --quiet` passed with 0 errors.
- **Tests**: `npm test` passed all 71 test files and 627 unit/integration tests.
- **Build**: `npm run build` compiled successfully in 4.1s with Turbopack.
- **Visual Audit**: Verified precise layout at 1920×1080 (19 visible), 1366×768 (15 visible), and 375×812 (7 visible) via Playwright screenshots.

---

## 15. Session Log: Hello Kitty Mascot Romaji Greeting & Typewriter Animation

### Context & Goals
Update the Main World Hello Kitty mascot's default speech bubble with a warm, personalized bilingual greeting for Arhana in Romaji Japanese, matching the Tokyo/Japan journey theme. The bubble features an authentic 25ms/char typewriter reveal, emoji font fallback for heart symbols, neat 2–3 line wrapping, and strict viewport collision avoidance across 1920, 1366, 768, and 375 widths.

### 1. Romaji Greeting Copy & Single Bubble Swapping
- **Default Copy**:
  `"Watashi wa Hello Kitty! Anata wa Arhana-chan desho? Hajimemashite~ ♡"`
  (Translation: "I am Hello Kitty! You must be Arhana-chan, right? Nice to meet you~ ♡")
- **Heart Emoji Fallback**:
  The trailing `"♡"` is styled with an explicit fallback emoji font family (`"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`) to ensure crisp, uniform cross-platform glyph rendering.
- **Single Bubble Invariant**:
  Hovering or focusing Kitty's avatar smoothly transitions the *same* bubble (`#mascot-speech-bubble`, `data-testid="mascot-speech-bubble"`) to `"aur bhai"`. On leave/blur, it returns to the Romaji greeting.
- **Touch Interaction**:
  Touch devices trigger a 2-second peek of `"aur bhai"` before smoothly restoring the greeting.

### 2. Typewriter Reveal Effect
- Progressively types out the greeting on first render at ~25ms per character via an interval timer.
- Integrated with `usePrefersReducedMotion`: if the user has requested reduced motion, the typewriter effect is immediately bypassed and the full string renders instantly without animation delay.

### 3. Spatial Composition & Multi-Viewport Layout
- Positioned above Kitty: `bottom-full mb-1.5 sm:mb-2.5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-6 md:-right-10`.
- Max widths: `max-w-[200px]` on mobile (`<640px`) and `max-w-[260px]` on desktop (`≥640px`), cleanly wrapping the text into 2–3 lines.
- Downward-pointing tail anchored at `-bottom-1.5`, pointing directly at Hello Kitty's head.
- Deterministic bounding box validation via Playwright confirmed zero collision with the `<h1>THE ADVENTURE</h1>` title and zero viewport clipping:
  - 1920×1080: Bubble `x=834.7, y=220.9` (Title `y=517.0` → ~210px vertical clearance, 0 clipping).
  - 1366×768: Bubble `x=557.7, y=64.9` (Title `y=361.0` → ~210px vertical clearance, 0 clipping).
  - 768×1024: Bubble `x=258.4, y=175.0` (Title `y=489.0` → ~210px vertical clearance, 0 clipping).
  - 375×812: Bubble `x=86.3, y=148.7, w=202.5` (Title `y=371.1` → ~140px vertical clearance, 0 clipping).

### 4. Verification & Quality Gates
- **Frozen Guard**: `npm run check:frozen` verified 100% integrity across all frozen cinema files.
- **Type Safety**: `npm run typecheck` passed with 0 errors.
- **Linter**: `npm run lint -- --quiet` passed with 0 errors.
- **Unit Tests**: `theAdventureHero.test.tsx` (all 6 tests passed) + full suite (`npm test`, 71 test files, 629 tests passed).
- **Production Build**: `npm run build` compiled cleanly in 2.5s via Turbopack.

---

## 16. Session Log: Sarcastic Hero Copy, Notice Card Styling & Mascot Bubble Accessibility

### Context & Goals
Re-anchor the Main World hero section with witty, affectionate birthday copy for Arhana ("CONGRATULATIONS, YOU’RE OLD" + "to celebrate your slow decline, here are 4 phases of mild inconvenience."), transform the subtitle into a cute "Official Notice" stationery card with paper grain, stitched border, header tab pill, corner hearts, rubber stamp, and hover straightening, and fix screen-reader output on the typewriter mascot speech bubble.

### 1. Sarcastic Hero Title & Bow Repositioning
- Replaced title `THE ADVENTURE` with `<h1>` `CONGRATULATIONS, YOU’RE OLD`.
- Typographic apostrophe (`’`) rendered cleanly in Fredoka font.
- Repositioned the perched satin bow atop the initial `"C"` (`-top-3.5 sm:-top-5 -left-1.5 sm:-left-2.5`).
- Scaled smoothly with `text-[clamp(1.4rem,4.2vw,2.65rem)]` and wrapped neatly into 2 lines (`CONGRATULATIONS,` / `YOU’RE OLD`) without colliding with Kitty's speech bubble above or the card below.

### 2. Cute "Official Notice" Description Card
- **Dimensions**: Centered compact card (`w-full max-w-[440px]`), wrapping the copy into 2 lines.
- **Paper & Stitched Border**: Warm cream background (`#FFFBF5`) with subtle SVG `feTurbulence` paper noise overlay (~4% opacity), `rounded-[18px]`, thick outline + offset shadow (`border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440]`), and an inner dashed stitched border (`inset-[6px] rounded-[12px] border border-dashed border-[#FF8FB3]/50`).
- **Header Tab Pill**: Overlaps top border in `font-retro`: `"⚠ OFFICIAL NOTICE"` (`#FFD6E3` background, dark text, warning emoji in an emoji-font span with `aria-hidden="true"`).
- **Corner Accents**: Low-key pink hearts `♥` (`aria-hidden="true"`) in opposite corners.
- **Copy & Highlighter**:
  `to celebrate your slow decline, here are 4 phases of mild inconvenience.` in dark plum `font-baloo` (15px mobile, 17.5px desktop). "mild inconvenience" highlighted with a soft pink marker-style underline (`linear-gradient` on the bottom 40%), not bold.
- **Approved Rubber Stamp**: Tiny stamp at bottom-right corner, rotated −8°: `"APPROVED ✓"` in `font-retro`, pink outline (`border border-[#FF8FB3] text-[#FF8FB3]`), ~60% opacity (`aria-hidden="true"`), never overlapping text.
- **Tactile Hover Dynamics**: Slight −1° resting tilt (`rotate-[-1deg]`); straightens to 0° with a soft 1px lift on hover (`hover:rotate-0 hover:-translate-y-1 hover:shadow-[4px_5px_0_#3A2440]`), fully disabled under `prefers-reduced-motion`.

### 3. Screen Reader Fix (Mascot Bubble Accessibility)
- The mascot speech bubble now exposes its complete text immediately via `aria-label={showGreeting ? "aur bhai" : FULL_GREETING_ACCESSIBLE}`.
- The letter-by-letter animated typewriter span is marked `aria-hidden="true"` so screen readers are not spammed by character additions.
- Zero `aria-live` attributes present on typing elements.
- Decorative card elements (rubber stamp, corner hearts, warning icon) are `aria-hidden="true"`, while `"OFFICIAL NOTICE"` and notice body copy remain cleanly readable.

### 4. Multi-Viewport Layout & Collision Verification
- Automated measurement across all 4 responsive breakpoints confirmed 0 collisions and 0 clipping:
  - **1920×1080**:
    - Bubble: `x=834.7, y=202.4, w=262.6, h=86.7`
    - Title: `x=704.0, y=498.6, w=512.0, h=106.0` (2 lines: "CONGRATULATIONS," / "YOU’RE OLD", ~210px clearance below bubble)
    - Card: `x=739.2, y=616.7, w=441.7, h=108.5` (2 lines of text)
    - Stamp: `x=1070.5, y=705.3, w=97.2, h=32.7`
    - Collisions: Bubble-Title: No, Title-Card: No, Stamp-Text: No, Clipped: No
  - **1366×768**:
    - Bubble: `x=557.4, y=28.6, w=263.2, h=104.5`
    - Title: `x=427.0, y=342.6, w=512.0, h=106.0` (2 lines)
    - Card: `x=462.2, y=460.7, w=441.7, h=108.5` (2 lines)
    - Stamp: `x=793.5, y=549.3, w=97.2, h=32.7`
    - Collisions: Bubble-Title: No, Title-Card: No, Stamp-Text: No, Clipped: No
  - **768×1024**:
    - Bubble: `x=258.4, y=189.4, w=263.2, h=104.5`
    - Title: `x=131.6, y=503.4, w=504.8, h=40.3` (1 line)
    - Card: `x=163.2, y=555.9, w=441.7, h=108.5` (2 lines)
    - Stamp: `x=494.5, y=644.5, w=97.2, h=32.7`
    - Collisions: Bubble-Title: No, Title-Card: No, Stamp-Text: No, Clipped: No
  - **375×812**:
    - Bubble: `x=86.3, y=141.2, w=202.5, h=81.9`
    - Title: `x=16.0, y=363.6, w=343.0, h=56.0` (2 lines)
    - Card: `x=15.2, y=430.6, w=344.6, h=98.7` (2 lines)
    - Stamp: `x=271.3, y=512.5, w=79.3, h=27.7` (below text, 0 overlap)
    - Collisions: Bubble-Title: No, Title-Card: No, Stamp-Text: No, Clipped: No

### 5. Verification & Quality Gates
- **Frozen Guard**: `npm run check:frozen` passed (0 modifications to frozen cinema files).
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint -- --quiet` passed with 0 errors.
- **Unit Tests**: `theAdventureHero.test.tsx` (9 tests passed) + full test suite (`npm test`, 71 test files, 632 tests passed).
- **Production Build**: `npm run build` compiled successfully via Next.js Turbopack in 2.8s.

---

## 17. Session Log: KittyOS Terminal Quiz Rework (Phase 01)

### Context & Goals
Rework the Phase 01 KittyOS Terminal Quiz into an engaging, witty, and personalized clearance flow: a procedurally generated calculus Q1 covering derivatives, integrals, and limits with guaranteed integer answers; replace the old college lore question with a humorous VPN lore Q2 ("Batman", "Gentleman", "Bevkoof"); add an interactive arrow-key option selector with touch/keyboard support; add Q3 ("In every argument, who should apologize?") with sarcastic cycling error responses for picking VPN; and implement approved sarcastic copy for wrong answers, hints, give up, and SKIP.

### 1. Pure Calculus Generator (`src/lib/kittyos/calculusGenerator.ts`)
- Dependency-free module supporting 14 distinct template families across `easy`, `medium`, and `hard`:
  - **Easy**: Polynomial derivatives at a point, definite integrals of linear/quadratic polynomials, limits of polynomials.
  - **Medium**: Chain rule $d/dx (ax+b)^n$, product rule at a point, definite integrals of cubics, removable discontinuity limits $(x^2-a^2)/(x-a)$ as $x \to a$.
  - **Hard**: Trig limits $\lim_{x \to 0} \sin(kx)/x$, exponential limits $\lim_{x \to 0} (e^{kx}-1)/x$, derivatives of $e^{kx}$ and $\ln(kx+1)$ at $x=0$, second derivatives at a point, trig integrals $\int_0^\pi k\sin x\,dx$, integration by parts $\int_0^1 k x e^x\,dx$, and integer area between curves $y = (bL)x$ and $y = bx^2$.
- Every answer is an integer by construction with $|answer| \le 500$.
- Formatted with Unicode math characters ($x^3, \int, \pi, e^x, \ln, -$).
- Strict parser accepting trimmed whitespace, Unicode minus (`−`), positive sign (`+`), and trailing `.0`.
- Unit test suite (`calculusGenerator.test.ts`) verified 2,000 seeded samples per template (28,000 total cases) numerically within $10^{-6}$ via finite differences, Simpson's rule, and symmetric limits.

### 2. Option Selector & Sarcastic Terminal Flow (`useKittyTerminalEngine.ts` & `AsciiSection.tsx`)
- Terminal option selector for Q2 and Q3 with `role="listbox"`, `role="option"`, `aria-selected`, `▸` cursor indicator, and pink highlighted row styling (`#FF8FB3`).
- Arrow key (↑/↓) navigation, number typing (`1`, `2`, `3`), Enter selection, and direct touch/tap interaction.
- Emojis rendered inside isolated spans with an emoji font stack (`Apple Color Emoji`, `Segoe UI Emoji`, `Noto Color Emoji`) to prevent font corruption.
- **Q1**: Wrong answer outputs `> [✗] chii chii hag diya` and prompts retry without failing out. Hint prints template-specific explanation.
- **Q2**: Any option choice outputs the 3 reveal lines:
  - `> [~] partially correct.`
  - `> [!] the full answer is: ALL OF THE ABOVE.`
  - `> [!] it wasn't an option, because no single option could handle him.`
- **Q3**: Apology question with Arhana (correct) and VPN. Picking VPN cycles through 4 sarcastic refusal lines:
  - `> [✗] ERROR: answer rejected. VPN has never been wrong in recorded history.`
  - `> [✗] interesting choice. wrong, but interesting. try again.`
  - `> [✗] the system refuses to process this lie.`
  - `> [✗] you can keep picking it. it will keep being wrong.`
- **Pity notes & Bypass**:
  - 'give up' on Q1/Q2: `> [💔] giving up? after he built an entire operating system for you? wow. noted. VPN will remember this.` (Q2 also displays the 3 reveal lines).
  - 'give up' on Q3: `> [💔] you'd rather give up than apologize. honestly, that tracks.`
  - SKIP button: `> [💔] skipped. weeks of effort, gone in one click. it's fine. he's fine. everything is fine.` (Triggers shrugging cursor expression, zero confetti).
  - REBOOT: Resets quiz state and generates a fresh calculus Q1 avoiding repeat questions in the session.

### 3. Verification & Quality Gates
- **Frozen Guard**: `npm run check:frozen` passed with zero modifications to frozen files.
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npx eslint --quiet` passed with 0 errors.
- **Unit & Integration Tests**: 72 test files passed, 658 tests passed (including `calculusGenerator.test.ts`, `terminalQuestions.test.ts`, and `calculusTerminal.test.tsx`).
- **Production Build**: `npm run build` completed successfully via Turbopack.

---

## 18. Session Log: KittyOS Terminal Skip Note Visibility & Delay Fix

### Context & Diagnosis
- **Reported Bug**: Pressing `⏭ SKIP` in KittyOS showed no pity note and jumped immediately to the `"HAPPY BIRTHDAY!"` end screen (specifically reproducible at the difficulty selection screen before choosing Easy/Medium/Hard).
- **Diagnosis**:
  - The skip note was previously wired into `handleSkip` in `src/components/worlds/main/useKittyTerminalEngine.ts` across all states, but `setInternalUnlocked(true)`, `setStage("cleared")`, and `onUnlock?.()` were executed synchronously in the exact same event loop tick as `setLogs`.
  - Because `isUnlocked = externalUnlocked ?? internalUnlocked` became `true` in the same tick, `AsciiSection.tsx` immediately rendered the end screen (`KittyMascot` + `✦ HAPPY BIRTHDAY! ✦` card) and auto-scrolled down to the bottom, concealing the newly appended terminal line before the user could read it.

### Changes & Architecture
1. **Pity Note Copy Update**:
   - Updated `PITY_LINES.skipButton` in `src/components/worlds/main/terminalQuestions.ts` to exactly:
     `> [💔] mehnat ki kadr hi nhi hai`
   - Preserved existing give up notes (`giveUpQ1orQ2` and `giveUpQ3`).
2. **Sequential Delay and Skip State**:
   - Added `isSkipping` state and `isSkippingRef` guard in `useKittyTerminalEngine.ts`.
   - On `handleSkip` (invoked either by clicking `⏭ SKIP` or typing `skip`/`bypass`):
     - Appends `> [💔] mehnat ki kadr hi nhi hai` to terminal logs immediately.
     - Sets `isSkipping = true`, disabling `submitAnswer`, `navigateOptions`, `selectOption`, and `handleReset`.
     - Starts a 2,500ms timeout (`skipTimerRef`).
     - Under `prefers-reduced-motion`, the 2.5s delay is maintained identically since it represents reading time for the text rather than visual motion.
     - When the timer fires, transitions to `internalUnlocked = true`, `stage = "cleared"`, `isSkipping = false`, and fires `onUnlock?.()`.
3. **Double-Click Protection & UI Disabling**:
   - Double-clicking `⏭ SKIP` is guarded by `if (isSkippingRef.current || internalUnlocked || stage === "cleared") return;`. Subsequent clicks are ignored and do not print duplicate pity notes or queue redundant timers.
   - In `AsciiSection.tsx`, disabled attributes and `opacity-50 pointer-events-none cursor-not-allowed` styles are applied while `isSkipping` to `⏭ SKIP`, `↺ REBOOT`, option selector items, and the command input/submit button.
   - Implemented `logEntry` helper with unique sequence ID generator (`nextLogId`), preventing React key collision warnings during synchronous and fake-timer test runs.
   - Refactored `useKittyTerminalEngine.ts` to strictly adhere to the < 400 lines rule (391 lines).
4. **Behavioral Continuity**:
   - Preserved shrug cursor expression (`dispatchPuzzleSkipped()`), zero confetti, and seamless unlocking of Phase 02 Birthday Vault.

### Verification & Quality Gates
- **Frozen Guard**: `npm run check:frozen` passed.
- **Unit & Integration Tests**:
  - `calculusTerminal.test.tsx`: Verified SKIP at difficulty select, Q1, Q2, and Q3 ensures the pity note appears exactly once, the end screen appears strictly after the 2.5s delay, and double clicks are safely ignored.
  - `AsciiSection.test.tsx` & `terminalQuestions.test.ts`: Updated to assert new copy and delayed unlock sequence.
  - Full test suite: 72 test files passed, 661 tests passed (`npm test`).
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npx eslint --quiet` passed with 0 errors.
- **Production Build**: `npm run build` compiled cleanly in Turbopack.

---

## 19. Session Log: Phase 02 Birthday Vault Sarcastic Copy & Success Modal Rework

### Context & Goals
Rewrite the Phase 02 "Vault Unlocked" success modal copy with witty, sarcastic celebratory tone while preserving the visual aesthetic (cake, washi tape, button styling, layout, and animations). Conduct a stale text sweep for user-facing occurrences of "Adventure" outside frozen files and Home World.

### 1. Copy & Visual Styling Overhaul (`src/components/worlds/main/BirthdayVault.tsx`)
- **Eyebrow**: Replaced `"VAULT UNLOCKED ✦"` with `"ACCESS GRANTED · reluctantly ✦"` in `font-retro text-[10px] tracking-[3px] text-[#7A4B16] font-bold`, removing `uppercase` so `"reluctantly"` renders in lowercase as requested.
- **Title**: Replaced `"HAPPY BIRTHDAY!"` with `"WOW. YOU DID SOMETHING."` in `font-pixel text-2xl sm:text-3xl font-extrabold text-[#2D1B36] tracking-wide text-center leading-tight`, wrapping cleanly without horizontal overflow at 375px mobile viewport.
- **Body**: Replaced previous sincere copy with exact lowercase text:
  `first time for everything, i guess. don’t let it go to your head. there’s not much room up there anyway.`
  Rendered in `font-baloo text-sm sm:text-base text-[#3A2440] font-medium leading-relaxed max-w-md`.
- **Closing Line**: Added softer handwritten closing line below body:
  `okay, one nice thing: thanks for existing. genuinely. 💗`
  Rendered in `font-letter-handwritten text-xs sm:text-sm text-[#FF7597] font-semibold leading-relaxed mt-3 mb-6` (~12px margin-top above it), with the heart emoji `💗` isolated inside an emoji-font span (`EMOJI_FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'`).
- **Button**: Replaced `"RETURN TO ADVENTURE ✦"` with `"CONTINUE YOUR DECLINE ✦"`, retaining identical button styling, sound effect triggers, and modal dismissal behavior.

### 2. Stale Text Sweep: "Adventure" References Outside Frozen Files & Home World
Audited the entire repository for user-facing "Adventure" text. Results:
1. `src/components/worlds/main/BirthdayVault.tsx` (Line 120): `"RETURN TO ADVENTURE ✦"` -> Changed to `"CONTINUE YOUR DECLINE ✦"`.
2. `src/components/worlds/main/theLetterContent.ts` (Line 125): `"May thy new adventures be worth every mile,"` -> User-facing line in 17th-century poem (kept unchanged for user decision).
3. `src/data/scrapbook-data-previous.json` (Line 348): `"pageTitle": "RANDOM ADVENTURES"` -> Historical backup data file (non-active).

### 3. Verification & Quality Gates
- **Unit Tests**: Created `src/components/worlds/main/__tests__/birthdayVault.test.tsx` verifying unopened chest state, unlock sound timing, modal copy, styling classes, emoji span font stack, close button, and Escape key dismissal.
- **Test Suite**: 73 test files passed, 664 tests passed (`npm test`).
- **Frozen Guard**: `npm run check:frozen` passed.
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint -- --quiet` passed with 0 errors.
- **Production Build**: `npm run build` completed successfully with Next.js Turbopack.
- **Mobile Viewport Audit**: Verified layout and typography at 375px mobile screen width via browser subagent with zero horizontal overflow.
- **Git & Push**: Committed `feat(vault): sarcastic unlock modal copy` (`b207d2b`) and pushed to `origin/main`.

---

## 20. Session Log: Phase 04 Letter Poem Stanza Addition ("accidental twinning club")

### Context & Goals
Insert a new 6-line stanza into the Phase 04 letter poem ("50 shades of Maahi") commemorating wardrobe twinning, formatted with identical stanza spacing, along with a marginalia sticker caption "accidental twinning club" styled consistently with existing badges ("☕certified procrastinators" and "🚂delayed train gang") with no emoji.

### 1. Implementation Architecture
- **Content Insertion (`src/components/worlds/main/theLetterContent.ts`)**:
  - Inserted the new stanza (`id: "wardrobe-twinning"`) immediately after `"But distance hasn't granted thee an escape from me as well."` and before `"For if life were a badly organised railway station,"`.
  - Stanza lines:
    ```
    And then there's a mystery no science can explain,
    How our wardrobes conspire as though sharing one brain.
    Be it campus or video call, the result is the same:
    We show up matching, and neither will take the blame.
    Though in fairness, the odds aren't exactly a feat,
    When my whole wardrobe's just three shirts on repeat.
    ```
  - Split the previously combined railway station section into `railway-station` and `railway-station-delayed` with zero removed or modified poem lines in `theLetterContent.ts` (`git diff` showed only additions).
- **Marginalia Sticker Caption (`src/components/worlds/main/TheLetterPoem.tsx`)**:
  - Bound the new sticker caption `"accidental twinning club"` to `section.id === "wardrobe-twinning"` with no emoji, matching the font (`font-letter-handwritten font-bold text-[#881337]`), border, and gradient styling of the existing marginalia badges.
  - Bound the `"🚂 delayed train gang"` sticker badge to `section.id === "railway-station-delayed"`, keeping it accurately aligned with the delayed train stanza.

### 2. Quality Gates & Verification
- **Frozen Guard**: `npm run check:frozen` passed.
- **Unit & Integration Tests**: 73 test suites passed, 664 tests passed (`npm test`).
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npx eslint --quiet` passed with 0 errors.
- **Production Build**: `npm run build` compiled cleanly via Turbopack in 7.9s.
- **Browser Visual Audit**: Verified the opened letter stationery in browser; the new stanza and `accidental twinning club` badge render without clipping, and end-of-page spacing below `RETURN TO HUB` holds cleanly (~64–96px).
- **Git & Push**: Committed `feat(letter): add accidental twinning stanza` (`bfab187`) and pushed to `origin/main`.

---

## 21. Session Log: Phase 04 Letter Poem Full Replacement ("50 shades of Maahi" Final Polish)

### Context & Goals
Completely replace the Phase 04 letter poem ("50 shades of Maahi") with the finalized 16-stanza, 80-line poem. Remove legacy sticker captions ("☕certified procrastinators", "accidental twinning club", and "🚂delayed train gang") from the poem, preserving exact punctuation, capitalization, curly apostrophes, and spacing without altering layout or frozen assets.

### 1. Implementation Details
- **Poem Content Replacement (`src/components/worlds/main/theLetterContent.ts`)**:
  - Replaced all poem sections with the exact 16-stanza text character-for-character.
  - Kept lowercase `"second year, crossed paths, barely acquainted,"`, curly apostrophe `’` in `"If we had patch notes, thine would simply read what’s at stake,"`, and smiley `:)` in `"And may even thy worst days find reasons to smile :)"`.
  - Stanza count: 16 stanzas; Line count: 80 lines (excluding blank stanza separators).
- **Caption Removal (`src/components/worlds/main/TheLetterPoem.tsx`)**:
  - Removed marginalia sticker badge elements (`"☕certified procrastinators"`, `"accidental twinning club"`, and `"🚂delayed train gang"`).
- **Test Assertion Updates (`src/components/worlds/main/__tests__/theLetter.test.tsx`)**:
  - Updated snapshot text queries to match revised lines (`"May our crash sessions survive the oceans between"`, `"I'm rather glad your world collided with mine"`).

### 2. Quality Gates & Verification
- **Exact Line-by-Line Verification**: Script compared the source lines against the reference text saved outside the repository; reported 0 differences across all 80 lines.
- **Frozen Guard**: `npm run check:frozen` passed with 0 violations.
- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint -- --quiet` passed with 0 errors.
- **Unit & Integration Tests**: 73 test suites passed, 665 tests passed (`npm test`).
- **Production Build**: Turbopack production build succeeded cleanly (`npm run build`).
- **Browser Visual Audit**: Verified in headless browser with the letter open that the full poem renders without clipping, sticker captions do not appear, and bottom breathing room below `RETURN TO HUB` holds cleanly at ~48–80px.
- **Git & Push**: Committed `feat(letter): final polished poem` (`777e8b3`) and pushed to `origin/main`.

---

## 22. Session Log: Always Play Intro Sequence & Complete Hamster Story Removal

### Context & Goals
1. Ensure the intro sequence (`ClickToEnterScreen` -> `GameboyLoadingScreen`) plays on EVERY initial visit and browser reload, regardless of previously stored state or deep-link query parameters (`?world=`).
2. Remove the 7-card hamster birthday story completely from the app, along with its associated child components, animations, styles, and legacy gates.
3. Wire the completion of the GameBoy loading screen directly to the destination world (or default `"home"` hub).
4. Preserve the OAuth callback intro bypass (`spotify_auth=`) so Spotify login redirections do not replay the intro.
5. Provide a development-only escape hatch (`?skipIntro=1` when `NODE_ENV !== "production"`).
6. Stage only relevant files, leaving pre-existing working tree deletions untouched.

### 1. Timeline & Architecture
- **Pre-flight & Reference Check**:
  - Investigated git status: noticed 16 pre-existing deleted files (`public/hampter/download (3..9).jpeg`, `public/images/crop_*.png`, `public/images/debug_coords.png`) and 1 untracked file (`public/hampter/PIC-removebg-preview.png`).
  - Executed PowerShell recursive scan across `src/` and `public/` confirming zero references to any of the 16 deleted files.
  - Per owner decision, left these working tree modifications untouched without staging or deleting.
- **Hamster Story Removal**:
  - Deleted `src/components/landing/StoryFlow.tsx` (302 lines).
  - Deleted `src/components/ui/StoryCard.tsx` (53 lines).
  - Deleted `src/components/ui/HamsterSticker.tsx` (93 lines).
- **Landing Page Orchestration (`src/components/landing/LandingPage.tsx`)**:
  - Removed Phase 3 Hamster Story section and background image (`loading_bg_pixel.jpg`).
  - Re-wired `GameboyLoadingScreen.onComplete` directly to `handleIntroComplete()` which calls `goToWorld(worldParam || "home")`.
  - Removed `localStorage.getItem("story_complete")` skip gate; added cleanup call `localStorage.removeItem("story_complete")` on mount so returning visitors are never bypassed.
  - Retained `spotify_auth=` bypass on OAuth return.
  - Implemented dev-only `?skipIntro=1` bypass active only when `process.env.NODE_ENV !== "production"`.
- **Test Suite Updates (`src/components/landing/__tests__/LandingPageGates.test.tsx`)**:
  - Rewrote gate tests to verify:
    1. Intro renders on `/` even if legacy `story_complete="true"` exists in `localStorage`.
    2. Intro renders on `/?world=main` even if `story_complete="true"` exists in `localStorage`.
    3. Completing the intro navigates to deep-linked `?world=main`.
    4. Completing the intro navigates to default `"home"` hub if no world query is provided.
    5. `spotify_auth=` OAuth callback still bypasses intro directly to app/auth loading.
    6. `?skipIntro=1` bypasses intro in development environment.
    7. `?skipIntro=1` does NOT bypass intro in production environment (`NODE_ENV === "production"`).
    8. No story components render anywhere.
- **Orphan Asset Verification**:
  - Scanned codebase for references to the 7 story-only assets: confirmed 0 references remain in active code.
  - Scanned for `data-cursor="hamster"` or hamster cursor CSS: confirmed 0 references remain.

### 2. Hardships & Mitigations
- **Working Tree Pre-existing Deletions**: Unstaged deletions were present in `public/hampter/` and `public/images/`. Handled by strictly avoiding whole-tree git commands (`git add .`, `git restore .`) and staging solely by explicit file paths.
- **Frozen File Compliance**: Verified that no frozen files (`TheEdit*`, `HomeWorld.tsx`, `src/components/worlds/home/*`) were touched. "START NEW GAME" was confirmed to belong solely to `GameboyLoadingScreen.tsx`, not Home World.

### 3. Open Items & Resolution
- **Story-Only Assets Deletion (Resolved)**:
  - Following explicit owner approval, all 7 orphaned story assets (`AWWAAAAAHAHA.jpeg`, `YAAAA hamster.jpeg`, `Squirtle Pikachu dancing.gif`, `so cuteee i love it frrr.jpeg`, `whimsycap.jpeg`, `almarts27 hamster sticker.jpeg`, `loading_bg_pixel.jpg`) totaling ~1.1 MB were removed via `git rm` in commit `7ae2909`.
  - Non-story assets (`Hamster smirk.jpeg`, `devious hamster doodle.jpeg` in Main World letter polaroids) were preserved.
- **Unrelated Working Tree Files**:
  - 16 unstaged deleted files in `public/` and untracked `public/hampter/PIC-removebg-preview.png` remain uncommitted and untouched in the working tree.

### 4. Quality Gates & Verification
- `npm run check:frozen`: Passed (0 violations).
- `npm run lint -- --quiet`: Passed (0 errors, warnings only).
- `npm run typecheck`: Passed (0 errors).
- `npm run test`: Passed (73 test files, 669 tests passed).
- `npm run build`: Passed (Turbopack production build compiled successfully).
- Code Commit: `ea3ab32` (intro always & story removal) pushed and confirmed matching `origin/main`.
- Asset Deletion Commit: `7ae2909` (7 orphaned story assets removed) pushed and confirmed matching `origin/main`.
- Fix Commit: `47210fd` (prevent redundant `goToWorld` call and 500ms flash when target equals current world) pushed and confirmed matching `origin/main`.




