# ✦ arh — A Handcrafted Birthday Sanctuary & Interactive World ✦

> *"A tiny interactive birthday world built with Next.js 16, React 19, and a lot of love. Part scrapbook, part music room, part indie game, and part personal letter — built for Maahi (Arhana) as she prepares to relocate to Japan for her master's degree (Fall 2026)."*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-741%20Passed%20(83%20Files)-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres%20Serverless-00e599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis%20Rate%20Limiter-ff1493?style=for-the-badge&logo=redis)](https://upstash.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15.0-green?style=for-the-badge&logo=greensock)](https://greensock.com/)
[![Protected Cinema](https://img.shields.io/badge/The%20Edit-Frozen%20Verified%20(SHA--256)-blueviolet?style=for-the-badge)](#-operational-safeguards--frozen-invariants)

---

## 📑 Table of Contents

1. [✦ The Vision & Aesthetic Concept](#-the-vision--aesthetic-concept)
2. [🗺️ Interactive Worlds Tour (ASCII & Visualizers)](#️-interactive-worlds-tour)
3. [🏗️ System Architecture & Topology](#️-system-architecture--topology)
4. [🔬 The Micro-Decisions That Shaped Everything (Forensic Deep Dive)](#-the-micro-decisions-that-shaped-everything)
   - [The Butterfly Effect in Software Design](#the-butterfly-effect-in-software-design)
   - [Summary Matrix: 15 Seemingly Innocent Decisions & Their Cascades](#summary-matrix-15-seemingly-innocent-decisions--their-cascades)
   - [Detailed Forensic Case Studies (1 through 10)](#detailed-forensic-case-studies)
5. [⚡ Critical Data Pipelines & Sequence Visualizers](#-critical-data-pipelines)
   - [Spotify Web Playback & Single-Flight Auth Engine](#1-spotify-web-playback--single-flight-auth-engine)
   - [4-Step Resilient Synced Lyrics Pipeline](#2-4-step-resilient-synced-lyrics-pipeline)
   - [Dynamic Album Palette Extraction](#3-dynamic-album-palette-extraction)
   - [Cinematic World Transitions & Paint Synchronization](#4-cinematic-world-transitions--paint-synchronization)
6. [🗄️ Database Architecture & Data Models](#️-database-architecture--data-models)
7. [🛡️ Operational Safeguards & Frozen Invariants](#️-operational-safeguards--frozen-invariants)
8. [🧗 Engineering Hardships & How They Were Solved](#-engineering-hardships--how-they-were-solved)
9. [📊 Performance & Empirical Timing Matrices](#-performance--empirical-timing-matrices)
10. [🧪 Quality Gates & The 10 Golden Interactions](#-quality-gates--the-10-golden-interactions)
11. [📜 Chronological Project History & Session Logs](#-chronological-project-history--session-logs)
12. [🚀 Developer Quickstart & Command Reference](#-developer-quickstart--command-reference)
13. [📖 Glossary of Architectural Terms](#-glossary-of-architectural-terms)

---

## ✦ The Vision & Aesthetic Concept

**arh** is not a commercial product or a generic landing page. It is an intimate, handcrafted digital gift created for Maahi (Arhana) to celebrate her birthday and give her a comforting, interactive piece of home to revisit from across the world when she departs for Japan in Fall 2026.

```
                           ✦  A R H  ✦
        ┌─────────────────────────────────────────────────┐
        │   A Digital Sanctuary for Japan-Bound Maahi     │
        │   ═══════════════════════════════════════════   │
        │   ✦ Hello Kitty, Snoopy & Hampter Motifs        │
        │   ✦ Pastel Pinks, Lavender & Dark Plum Ink       │
        │   ✦ Vinyl Turntable with Real-Time Lyrics       │
        │   ✦ 3D Tactile Photo Memory Scrapbook           │
        │   ✦ Retro CRT KittyOS Terminal & Birthday Vault │
        │   ✦ Vintage Cinema VHS TV ("The Edit")          │
        │   ✦ Deluxe Wax-Sealed Stationery Letter         │
        └─────────────────────────────────────────────────┘
```

### Visual & Sensory Identity
- **Curated Color Palette**: Warm blush pinks (`#FFF4F6`, `#FFB6C1`, `#FF8FB3`), sunshine buttery yellow (`#FFE4A1`), soft lavender (`#DFD5F5`), and dark plum ink text (`#20233F`).
- **Tactile Nostalgia**: Real polaroid frames with subtle drop-shadows, postage stamps, washi tape strips, wax seals, CRT scanline overlays, cassette tapes, and a custom reactive Hello Kitty cursor.
- **The Tri-Part Collaborative Loop**:
  The project was conceived and built through a three-role human-AI engineering loop:
  - **The Owner (Vipin)**: Creative director, UX guardian, and final authority. Evaluates all live screen visuals, audio feel, and user emotion.
  - **Claude (Senior Architect & Reviewer)**: Audits diffs, prevents regressions, models data flows, and creates atomic implementation blueprints.
  - **Google Antigravity (Implementation Agent)**: Autonomous pair programmer running inside the codebase. Executes builds, runs test suites (741 tests), enforces type safety, and writes production code under strict rules.

```mermaid
flowchart LR
    A["👤 The Owner (Vipin)<br/>Artistic Direction & UX Approval"] -->|"Requirements & Constraints"| B["🧠 Claude<br/>Architectural Review & Prompt Design"]
    B -->|"Atomic Step-by-Step Task Blocks"| C["🤖 Google Antigravity<br/>Autonomous Coding Agent"]
    C -->|"Typecheck, Tests & Git Commits"| D{"🔍 Quality Gates<br/>741 Tests, check:frozen"}
    D -->|Pass| E["🚀 Vercel Preview & Real Browser Test"]
    D -->|Fail| C
    E -->|"Visual Validation & Polish Feedback"| A
```

---

## 🗺️ Interactive Worlds Tour

The user experience is structured as an exploration across four distinct, rich digital "Worlds" hosted under a single-page dynamic router ([`WorldRouter.tsx`](file:///d:/Projects/arh/src/components/worlds/WorldRouter.tsx)).

```
                                  [ GAMEBOY LOADING INTRO ]
                                              │
                                              ▼
                                 [ CLICK TO ENTER SCREEN ]
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │    HOME WORLD HUB [FROZEN ❄️]    │
                             │   Collage Cards & Boop Mascot   │
                             └───────────────┬─────────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
  ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
  │      MAIN WORLD      │       │     MUSIC WORLD      │       │   SCRAPBOOK WORLD    │
  │   The 5-Phase Story  │       │    (punkrose.fm)     │       │   3D Flipbook Album  │
  ├──────────────────────┤       ├──────────────────────┤       ├──────────────────────┤
  │ 00: Sarcastic Hero   │       │ • Vinyl Turntable    │       │ • CSS 3D Double Page │
  │ 01: KittyOS Terminal │       │ • Real-time LRCLIB   │       │ • Polaroid Gallery   │
  │ 02: Birthday Vault   │       │   Karaoke Lyrics     │       │ • Zoom Detail Modals │
  │ 03: The Edit [FROZEN]│       │ • Waveform Pills     │       │ • LRU-12 Image Cache │
  │ 04: The Letter       │       │ • Queues & Favourites│       │ • Gesture Lock       │
  └──────────────────────┘       └──────────────────────┘       └──────────────────────┘
```

### 1. Home World (`HomeWorld.tsx`) — FROZEN ❄️
The launchpad of the application, representing a pastel desk covered in interactive scrapbook cards, ambient sparkles, and stickers:
- **Scrapbook Card**: Transitions to the 3D memory album.
- **Main Storyline Card**: Embarks on the multi-phase birthday quest.
- **Music Player Card**: Opens `punkrose.fm`.
- **Boopable Mascot (`HomeMascot.tsx`)**: An interactive companion with audio reactions and romaji greetings.
> [!IMPORTANT]
> `src/components/worlds/HomeWorld.tsx` and `src/components/worlds/home/*` are strictly **FROZEN**. Layout, styles, and card alignments are locked to preserve the original visual craft.

---

### 2. Main World (`MainWorld.tsx`) — The 5-Phase Odyssey
A milestone-driven journey guided by an ambient floating `PhaseTracker`:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PHASE 00: Sarcastic Hero Greeting & Kawaii Tokyo Mascot               │
│  "Happy Birthday Maahi... Ready for the Tokyo adventure?"              │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 01: KittyOS Retro CRT Terminal (calculus & puzzle riddles)      │
│  > solve: lim(x->inf) (1 + 1/x)^x  --> CLEARANCE: [GRANTED]           │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 02: The Birthday Vault (passcode unlocked, confetti explosion)  │
│  Passcode: [ ******** ] -> UNLOCKED! Confetti bursts canvas!          │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 03: The Edit Cinema (Vintage CRT TV & Birthday Video) [FROZEN ❄️]│
│  [ REC ] ●  VHS Scanlines | Custom Hardware Knobs | arh_vid_final.mp4 │
├────────────────────────────────────────────────────────────────────────┤
│  PHASE 04: One Last Thing — The Letter & "50 Shades of Maahi" Poem     │
│  Wax-sealed deluxe stationery, vintage polaroids & moving dedication   │
└────────────────────────────────────────────────────────────────────────┘
```

- **The Edit Cinema TV Wireframe (`TheEditTvHardware.tsx` — FROZEN ❄️)**:
```
  ┌──────────────────────────────────────────────────────────────┐
  │  (•) POWER     [ VINTAGE SONY TRINITRON CRT TV ]     VOLUME  │
  ├──────────────────────────────────────────────────────────────┤
  │ ┌──────────────────────────────────────────────────────────┐ │
  │ │ [REC] ● 00:03:24.12                 SP PLAY  ►  1080p    │ │
  │ │                                                          │ │
  │ │             ▶  arh_vid_final.mp4 (VIDEO)                 │ │
  │ │                                                          │ │
  │ │ ~~~~~~~~~~~~~~~~~ CRT SCANLINES ~~~~~~~~~~~~~~~~~~~~~~~~ │ │
  │ └──────────────────────────────────────────────────────────┘ │
  ├──────────────────────────────────────────────────────────────┤
  │ [⏪ REW]   [⏯ PLAY/PAUSE]   [⏩ FF]   [ 🔘 TUNING ]   [ 🎚️ BRI ]│
  └──────────────────────────────────────────────────────────────┘
```

---

### 3. Music World (`MusicWorld.tsx` — punkrose.fm)
A bespoke Spotify client and streaming listening room built specifically around her musical taste:

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │  punkrose.fm ✦ NOW PLAYING                                      [X]  │
  ├───────────────────────────────────┬───────────────────────────────────┤
  │                                   │                                   │
  │           ╭───────────╮           │  ♪ BACK HOME — JOJI               │
  │        ╭──╯           ╰──╮        │  Album: SMITHEREENS               │
  │       │     ● 33 RPM      │       │                                   │
  │       │   [VINYL DECK]    │       │  [01:14] ━━━━━━━●────── [03:42]   │
  │        ╰──╮           ╭──╯        │                                   │
  │           ╰───────────╯           │  ▂ ▄ ▅ █ ▇ ▅ ▃ ▄ ▆ [Sound Waves]  │
  │                                   │                                   │
  │   [Tonearm tracks song position]  │  [⏮ PREV]   [⏯ PAUSE]   [⏭ NEXT]  │
  ├───────────────────────────────────┴───────────────────────────────────┤
  │  SYNCED LYRICS DRAWER (LRCLIB Karaoke Highlight)                      │
  │  "Here in the darkness, I feel so at home..."                         │
  │  "▶ [01:14] Driving through Tokyo at midnight under neon signs..."    │
  ├───────────────────────────────────────────────────────────────────────┤
  │  TABS: Liked Songs | Birthday Mix | Curated Vibes | Memories | Queue  │
  └───────────────────────────────────────────────────────────────────────┘
```

- **Vinyl Record Component (`VinylRecord.tsx`)**: Realistically spins during playback, flips to reveal behind-the-scenes memory photos, and smoothly tracks playback using a tonearm without per-frame React re-renders.
- **Waveform Pills (`FrequenciesSection.tsx`)**: Responsive, non-overlapping canvas visualizers synchronized with audio tempo.
- **Synced Lyrics Drawer (`SyncedLyrics.tsx`)**: Sub-frame karaoke word wipes powered by LRCLIB timestamp parsing.

---

### 4. Scrapbook World (`ScrapbookWorld.tsx`)
A tactile 3D photobook constructed with CSS 3D perspective transforms (`ThreeDScrapbook.tsx`):
- **Tactile Turning**: Double-page turn animations resembling heavy matte paper spreads.
- **Polaroid Memory Gallery**: Photos of friends, pets ("moo" and "moomoo"), memorable dates, and handwritten sticky notes.
- **Inspect Modal with LRU-12 Cache**: Full-screen photo viewer with pre-windowing (`+/- 2` neighbour preload), lazy thumbnail background fallbacks, and gesture locks to prevent accidental swipe dismissals.

---

## 🏗️ System Architecture & Topology

The application is deployed as a serverless Next.js 16 web application backed by Neon Serverless Postgres and Upstash Redis.

```mermaid
graph TB
    subgraph Client ["Client Browser (Next.js 16 App Router)"]
        UI["UI Layer: React 19 & Tailwind v4"]
        GSAP["GSAP 3.15 Transition Engine"]
        Zustand["Zustand Stores (Player, Queue, GameState)"]
        SDK["Spotify Web Playback SDK (EME / Widevine)"]
        Canvas["HTML5 Canvas Confetti & Waveforms"]
    end

    subgraph Edge ["Next.js Serverless Route Handlers"]
        Proxy["/api/spotify/proxy/[...path]"]
        Auth["/api/spotify/session & callback"]
        Lyrics["/api/lyrics (4-Step Pipeline)"]
        Palette["/api/album-palette (node-vibrant)"]
        Memories["/api/memories & /api/scrapbook"]
    end

    subgraph Cache ["Upstash Redis (Serverless HTTP)"]
        RateLimit["Sliding-Window Rate Limiter (Lua)"]
        CircuitBreaker["Circuit Breaker (spotify_api_lock)"]
        Scan["Non-blocking SCAN Cache Invalidation"]
    end

    subgraph Storage ["Neon Serverless Postgres"]
        Drizzle["Drizzle ORM Engine"]
        T1[("lyrics_cache")]
        T2[("scrapbook_versions")]
        T3[("memories")]
    end

    subgraph Upstream ["External Upstream APIs"]
        SpotifyAPI["Spotify Web API (api.spotify.com)"]
        LRCLIB["LRCLIB Community Database"]
        CDN["Spotify Image CDN (i.scdn.co)"]
    end

    UI --> Zustand
    Zustand --> SDK
    UI --> GSAP

    Zustand --> Proxy
    Proxy --> RateLimit
    Proxy --> CircuitBreaker
    RateLimit --> SpotifyAPI
    Proxy --> SpotifyAPI

    UI --> Auth
    Auth --> SpotifyAPI

    UI --> Lyrics
    Lyrics --> T1
    Lyrics --> LRCLIB

    UI --> Palette
    Palette --> CDN

    UI --> Memories
    Memories --> Drizzle
    Drizzle --> T2
    Drizzle --> T3
```

---

## 🔬 The Micro-Decisions That Shaped Everything

### The Butterfly Effect in Software Design
Throughout the development of **arh**, the most catastrophic bugs, performance crashes, and user-facing regressions were never caused by complex algorithms or grand architecture. They were triggered by **tiny, seemingly innocuous decisions** — a single boolean attribute, an inline arrow function, a cookie domain flag, or an unbracketed hook return.

```mermaid
flowchart TD
    SubtleDecision["Trivial Choice<br/>(e.g., inline arrow function, key={id}, Domain=<host>)"]
    --> InvisibleTrap["Hidden Engine Mechanism<br/>(React Fiber remount, rAF cancellation, browser cookie precedence)"]
    --> MassiveCascade["Cascading Catastrophe<br/>(144fps drops to 20fps, infinite auth loops, blank screen flashes)"]
    --> ForensicAnalysis["Forensic Diagnosis<br/>(Chrome DevTools Tracing, Packet Inspection, Sub-frame Timings)"]
    --> InvariantLock["Permanent Invariant Guard<br/>(Automated lint rule, Git Hook, Frozen SHA-256 Checksum)"]
```

---

### Summary Matrix: 15 Seemingly Innocent Decisions & Their Cascades

| # | The "Innocent" Decision | What It Seemed Like | The Cascading Disaster | The Forensic Invariant Lock |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Adding `Domain=<host>` to auth cookies | "Ensures cookies work across subdomains" | Duplicate cookies created; browsers sent conflicting tokens, triggering **infinite re-login loops** in multi-tab sessions | Strict **Host-Only Cookies**; raw `Set-Cookie` `Max-Age=0` eviction headers |
| **2** | Adding `key={track.id}` to `VinylRecord.tsx` | "Standard React practice for resetting component state" | Entire DOM node destroyed & recreated on track change; tonearm jumped, **sleeve animation flickered** violently | Removed `key={id}`; adopted `latestTrackRef` + **3s DEFER pending guard** |
| **3** | Passing inline lambda to `HomeWorldPaintSignal` | `onPainted={() => setIsTargetPainted(true)}` | New function reference recreated on every render; cancelled pending `rAF` loop; **Hub faded out 200ms before painting** | Stabilized with `useCallback` + `hasFiredRef`; gated GSAP on paint event |
| **4** | Letting Service Worker cache video files | "Improves offline PWA performance" | SW stripped HTTP `206 Partial Content` (Range headers); **Safari & iOS video buffering broke completely** | Upgraded to `v2-no-cache-passthrough`; explicit **Range request bypass** |
| **5** | Chaining 8 CSS `drop-shadow` filters on stickers | "Creates a nice glowing white cutout sticker border" | Chromium Skia rasterizer clamping bug; drew **ugly white vertical streaks** down the right edge of every sticker | Replaced with SVG stroke filter & pre-rendered high-res sticker assets |
| **6** | Joining artists with comma for LRCLIB search | `track.artists.join(', ')` | LRCLIB returned 404 for collaborations (e.g. Joji & BENEE); **permanently cached "Not Found" for 7 days** in Postgres | Isolated `getArtistNames` helper; built **4-tier query cascade** with primary artist fallback |
| **7** | Attaching mouse drag/swipe listeners to 3D book | "Enables tactile swipe gestures on mobile" | 2-pixel mouse micro-movement hijacked click events; **clicking a photo failed to open the inspect modal** | Completely **disabled swipe/drag/wheel gestures on book view**; reserved for carousel |
| **8** | Unbounded image rendering in photo inspect modal | "Simple `map()` over photo array in carousel" | Rapid flicking spawned dozens of concurrent image requests; **white flickers, blank cards, and mobile OOM** | Strict **LRU-12 cache**, lazy thumbnail background layer, and `+/- 2` windowing |
| **9** | Storing track progress seconds in React state | `const [currentSec, setCurrentSec] = useState(0)` | Dispatched 60 state updates/sec; entire component tree re-rendered; **FPS crashed from 144 to 20 FPS** | **Position strictly outside React state**; driven via Web Animations API & CSS vars |
| **10** | Concurrent token refresh without locks | Multiple components calling `getSpotifySession()` | 2 simultaneous refresh requests to Spotify; second request rotated token; **Spotify revoked token with `invalid_grant`** | **Single-Flight Mutex** using `navigator.locks('spotify-token-refresh')` |
| **11** | Shared app-wide rate limit budget (50 req/30s) | "One rate limiter is enough for the site" | 1 visitor spamming search or song skips **locked out the birthday person** from playing music | Atomic **Lua script in Upstash Redis** enforcing app budget AND user budget |
| **12** | Early return for free-tier accounts before hooks | `if (tier === 'free') return null;` before `useState` | Violated React's Rules of Hooks when account loaded; **caused fatal client crashes and CI build failures** | Component composition: **outer conditional gate + inner hook-bearing component** |
| **13** | Placing internal architecture PDF in `public/` | "Convenient place to reference design notes" | Next.js statically served internal developer API notes to the open internet; **unauthorized PDF leak** | Moved all sensitive technical documents into protected root `docs/` folder |
| **14** | Synthesizing audio click on global cursor clicks | "Cute retro audio feedback on every button" | Caused sensory fatigue and **consumed transient user activation token**, muting video playback in The Edit | Completely removed `CursorSoundToggle`; reserved audio for user-directed media |
| **15** | Attempting autoplay video on initial page load | "Surprises visitor with instant cinema experience" | Modern browsers block unmuted autoplay; **video muted silently and threw browser console policy errors** | Added **Gameboy "Click To Enter" audio unlock screen** before hub mount |

---

### Detailed Forensic Case Studies

#### Case Study 1: The Domain Cookie Catastrophe (Why 1 Attribute Caused Infinite Login Loops)
- **The Innocent Code**:
  ```typescript
  // BAD: What seemed standard
  res.cookies.set('spotify_access_token', token, {
    domain: process.env.COOKIE_DOMAIN || req.headers.get('host'),
    httpOnly: true,
  });
  ```
- **The Disaster**: When users visited the site via both apex domain and subdomains (or preview branches), browsers stored two distinct cookies: one scoped to `.domain.com` and one scoped to `host-only`. During token refresh, the server updated the host-only cookie, but the browser continued transmitting the stale domain-scoped cookie. The server saw an expired token, returned `401 Unauthorized`, redirected to login, and locked the user in an inescapable refresh loop.
- **The Forensic Fix**:
  ```typescript
  // GOOD: Strict Host-Only + Raw Eviction Header
  res.cookies.set('spotify_access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // NO domain attribute = Host-Only cookie!
  });
  // Explicitly evict legacy domain-scoped variants via raw Set-Cookie
  res.headers.append('Set-Cookie', 'spotify_access_token=deleted; Path=/; Domain=' + host + '; Max-Age=0');
  ```
- **Architectural Rule**: *Never set `Domain=` on authentication cookies unless cross-subdomain sharing is strictly required. Always treat auth cookies as Host-Only.*

---

#### Case Study 2: The `key={track.id}` Vinyl Sleeve Flutter (Why a React Key Ruined the UI)
- **The Innocent Code**:
  ```tsx
  // BAD: What felt like idiomatic React
  <VinylRecord key={currentTrack?.id} track={currentTrack} />
  ```
- **The Disaster**: Whenever Spotify's Web Playback SDK emitted an intermittent track transition event (e.g. from `null` to `track` or between relinked IDs), React unmounted the entire `VinylRecord` component and remounted a brand-new DOM element. The vinyl record stopped spinning, the tonearm snapped back to 0° and violently re-swung, and the album sleeve flickered white.
- **The Forensic Fix**:
  1. Removed `key={track.id}` so the component instance persists continuously.
  2. Maintained an internal `latestTrackRef` and only triggered slide animations when track IDs actually changed.
  3. Implemented a 3-second **pending-track guard** (`playbackHelpers.ts`) with `DEFER` logic: when the user clicks a song, the store waits for the SDK state to reconcile on `id`, `linked_from.id`, or `uri` before applying updates.
- **Architectural Rule**: *Never use dynamic entity IDs as React keys on persistent hardware or media simulator components. State transitions must be animated internally, not driven by DOM destruction.*

---

#### Case Study 3: The Inline Arrow Function in `WorldRouter` (The Hub Fade-Before-Paint Bug)
- **The Innocent Code**:
  ```tsx
  // BAD: Seemingly harmless callback prop in WorldRouter.tsx
  <HomeWorldPaintSignal onPainted={() => setIsTargetPainted(true)} />
  ```
- **The Disaster**: In `HomeWorldPaintSignal`, a `useEffect` watched `[onPainted]`:
  ```tsx
  useEffect(() => {
    let a1 = requestAnimationFrame(() => {
      let a2 = requestAnimationFrame(() => onPainted());
    });
    return () => { cancelAnimationFrame(a1); cancelAnimationFrame(a2); };
  }, [onPainted]);
  ```
  Because `() => setIsTargetPainted(true)` was declared inline, every single state update or re-render of `WorldRouter` created a brand-new function pointer. The `useEffect` cleanup hook fired, cancelled the pending double-frame rAF, and scheduled a fresh cycle. The paint signal was pushed from 2700ms to 3200ms — *after* the exit overlay had already faded away, revealing an unpainted, blank Hub layout!
- **The Forensic Fix**:
  ```tsx
  // GOOD: Stabilized useCallback with hasFiredRef guard
  const handleHomeWorldPainted = useCallback(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    setIsTargetPainted(true);
  }, []);
  ```
  Additionally, the GSAP transition engine was refactored so that exit dissolves are strictly gated on `isTargetPainted === true`.
- **Architectural Rule**: *Callbacks passed into paint-timing or animation hooks must always be memoized with `useCallback` or guarded with refs to avoid resetting frame schedulers.*

---

#### Case Study 4: Service Worker Caching Video Files (How a PWA Feature Broke Video Streaming)
- **The Innocent Code**:
  ```javascript
  // BAD: Catch-all service worker fetch interceptor in public/sw.js
  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
  });
  ```
- **The Disaster**: Browsers stream high-definition `.mp4` video files using HTTP `Range` headers (e.g. `Range: bytes=0-1048575`) to request media in chunks and allow audio seeking. When a service worker intercepts a request with `event.respondWith(fetch(req))`, it strips the byte-range headers or returns an opaque HTTP 200 response instead of HTTP 206 Partial Content. Safari and iOS WebKit immediately halted playback, causing infinite loading spinners on "The Edit" cinema.
- **The Forensic Fix**:
  ```javascript
  // GOOD: v2-no-cache-passthrough with explicit Range bypass
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (
      url.pathname.startsWith('/videos/') ||
      url.pathname.endsWith('.mp4') ||
      url.pathname.endsWith('.mp3') ||
      event.request.headers.has('range')
    ) {
      return; // Pass through to native browser networking pipeline!
    }
  });
  ```
- **Architectural Rule**: *Service Workers must NEVER intercept media streaming files (`.mp4`, `.webm`, `.mp3`) or requests bearing HTTP Range headers.*

---

#### Case Study 5: The 8x Drop-Shadow Chromium Skia Streak Bug
- **The Innocent Code**:
  ```css
  /* BAD: Chaining drop-shadows to simulate a thick cartoon sticker cutout */
  .hero-sticker-pack-filter {
    filter: drop-shadow(0px 2px #fff) drop-shadow(0px -2px #fff)
            drop-shadow(2px 0px #fff) drop-shadow(-2px 0px #fff)
            drop-shadow(2px 2px #fff) drop-shadow(-2px -2px #fff)
            drop-shadow(2px -2px #fff) drop-shadow(-2px 2px #fff);
  }
  ```
- **The Disaster**: In Blink/Chromium browsers on Windows, applying more than 4 consecutive CSS `drop-shadow()` filters on transparent PNG images causes the Skia rasterization engine's convolution kernel to clamp at bounding box edges. This resulted in an unsightly, razor-sharp vertical white line down the right side of every sticker on the screen.
- **The Forensic Fix**: Removed the chained CSS filter and replaced it with SVG stroke filters and pre-rendered transparent assets with clean alpha channels.
- **Architectural Rule**: *Never chain multiple CSS `drop-shadow()` filters on alpha-channel images; use SVG filter primitives or bake outlines directly into the raster assets.*

---

#### Case Study 6: Joining Artists with Commas in LRCLIB Searches
- **The Innocent Code**:
  ```typescript
  // BAD: Naive string concatenation for lyrics query
  const query = `${track.title} ${track.artists.map(a => a.name).join(', ')}`;
  ```
- **The Disaster**: Tracks like "Back Home" by Joji & BENEE or "Afterthought" were queried as `"Back Home Joji, BENEE"`. Community lyrics databases like LRCLIB rarely catalog songs with formatted comma strings; they index them under the primary artist `"Joji"`. Because the API returned 404, the system marked the song as `source: 'not_found'` and cached that negative result in Postgres for 7 days. Maahi could not see lyrics for her favorite songs!
- **The Forensic Fix**:
  Created `src/lib/artistNames.ts` with `getArtistNames(track)` and implemented a **4-tier query cascade**:
  1. *Step A*: Exact query with all metadata (`track + primary artist + album + duration`).
  2. *Step B*: Relaxed query without album (`track + primary artist + duration`).
  3. *Step C*: Cleaned search query stripping remaster tags and featured artists.
  4. *Step D*: Broad search fallback.
  Transient upstream errors (5xx/429) are flagged with `hasUpstreamError: true` and are **never cached** in Neon as `not_found`.
- **Architectural Rule**: *External API lookups must employ defensive multi-tier fallback chains and treat operational failures separately from clean 404s.*

---

#### Case Study 7: Book-View Swipe Gestures Hijacking Photo Click Events
- **The Innocent Code**:
  ```tsx
  // BAD: Attaching touch and pointer drag handlers to the 3D book spread
  <div onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd}>
    {pages.map(page => <PhotoCard onClick={openInspectModal} />)}
  </div>
  ```
- **The Disaster**: When a user tapped on a memory photo polaroid, their finger or mouse inevitably jittered by 1–2 pixels between pointerdown and pointerup. The drag handler interpreted this micro-movement as a page swipe, consumed the event, and cancelled the `onClick` event. Visitors were completely unable to open photos!
- **The Forensic Fix**:
  Completely disabled pointer drag, swipe, and wheel gesture handlers on the 3D book view ([Commit `f1aa9d3`](file:///d:/Projects/arh/docs/session-16#L111)). Swiping gestures were reserved exclusively for the full-screen photo inspect carousel where navigation is unambiguous.
- **Architectural Rule**: *Do not combine drag-to-navigate gestures with clickable nested elements on 3D transformed containers.*

---

#### Case Study 8: Unbounded Carousel Memory Spikes & White Flickers
- **The Innocent Code**:
  ```tsx
  // BAD: Rendering all full-size polaroids in the inspect carousel
  {photos.map((photo, i) => (
    <img key={i} src={`/arh/full/${photo.filename}`} className={i === active ? 'block' : 'hidden'} />
  ))}
  ```
- **The Disaster**: Scrapbook World contains hundreds of high-resolution polaroid memories. Rapid swiping across the carousel spawned dozens of concurrent high-resolution image requests. On mobile devices, this triggered Out-Of-Memory (OOM) browser tab crashes; on Slow 4G connections, cards flickered white for seconds while images buffered.
- **The Forensic Fix**:
  1. Built a windowed rendering engine loading only `currentIdx - 2` to `currentIdx + 2`.
  2. Integrated an in-memory **LRU-12 cache** to keep recently viewed cards alive without re-fetching.
  3. Added a blurry, lightweight thumbnail background image layer that renders instantly while full-resolution photos stream in.
- **Architectural Rule**: *Media carousels must implement strict index windowing, LRU caching, and thumbnail placeholders to survive low-end mobile hardware.*

---

#### Case Study 9: Storing Playback Seconds in React State
- **The Innocent Code**:
  ```tsx
  // BAD: What novice React developers write for music players
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPlaybackSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  ```
- **The Disaster**: Updating React state every second (or on every `rAF` frame for sub-second smooth bars) triggered a root-level reconciliation pass down through the vinyl turntable, lyrics drawer, waveform visualizer, and navigation sidebar. CPU usage spiked to 100%, and animation frame rates plummeted from 144 FPS to 20 FPS.
- **The Forensic Fix**:
  1. Mandated the architectural invariant: **Playback position NEVER goes in React state**.
  2. Playback progress is calculated via `performance.now()` offsets stored in mutable refs.
  3. Tonearm rotation, vinyl spinning, and progress bars are updated via direct DOM styles or the Web Animations API without touching the React render pipeline.
- **Architectural Rule**: *High-frequency temporal variables (audio playback, scroll offsets, cursor positions) must never reside in React state.*

---

#### Case Study 10: Multi-Tab Token Refresh Race Conditions
- **The Innocent Code**:
  ```typescript
  // BAD: Unsynchronized client fetch for token refresh
  async function getFreshToken() {
    const res = await fetch('/api/spotify/session');
    return res.json();
  }
  ```
- **The Disaster**: If a user opened the site in two browser tabs simultaneously, both tabs detected that the access token was expiring. Tab A and Tab B fired simultaneous `GET /api/spotify/session` requests. Spotify's OAuth PKCE server processed Tab A's request, rotated the refresh token, and returned a new token. When Tab B's request arrived 50ms later with the old refresh token, Spotify detected token reuse and **revoked the refresh token entirely with `invalid_grant`**, logging the user out!
- **The Forensic Fix**:
  ```typescript
  // GOOD: Single-flight mutex via Web Locks + inFlightPromise
  let inFlightTokenPromise: Promise<SessionData> | null = null;
  export async function getSpotifySession(): Promise<SessionData> {
    if (inFlightTokenPromise) return inFlightTokenPromise;
    inFlightTokenPromise = navigator.locks.request('spotify-token-refresh', async () => {
      const res = await fetch('/api/spotify/session');
      return res.json();
    }).finally(() => { inFlightTokenPromise = null; });
    return inFlightTokenPromise;
  }
  ```
- **Architectural Rule**: *OAuth token refresh operations across browser tabs must be serialized using Web Locks (`navigator.locks`) to prevent token rotation revocation.*

---

## ⚡ Critical Data Pipelines

### 1. Spotify Web Playback & Single-Flight Auth Engine

The application securely streams full music tracks in the browser via the Spotify Web Playback SDK using Authorization Code PKCE flow:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Client Hook (usePlaybackActions)
    participant Lock as Navigator Web Locks ('spotify-token-refresh')
    participant Route as Server (/api/spotify/session)
    participant Redis as Upstash Redis (Sliding Lua)
    participant Spotify as Spotify API / SDK

    User->>Browser: Click Play on Song
    Browser->>Lock: Request single-flight session refresh
    Note over Lock: Prevents multi-tab race conditions
    Lock->>Route: GET /api/spotify/session (with HttpOnly Cookie)
    Route->>Spotify: Refresh access_token
    Spotify-->>Route: 200 OK { access_token, expires_in: 3600 }
    Route-->>Lock: Return Host-Only Set-Cookie
    Lock-->>Browser: Session Token { accessToken }

    Browser->>Route: POST /api/spotify/proxy/me/player/play
    Route->>Redis: Execute SPOTIFY_RATE_LIMIT_LUA
    alt Rate Budget Exceeded (50 req / 30s)
        Redis-->>Route: 429 { retryAfter: 12s }
        Route-->>Browser: 429 Circuit Protected
    else Budget OK
        Redis-->>Route: 200 OK (reserve slot)
        Route->>Spotify: PUT /v1/me/player/play
        Spotify-->>Route: 204 No Content
        Spotify->>Browser: SDK 'player_state_changed' Event
        Note over Browser: Pending-Track Guard reconciles Vinyl Art!
    end
```

---

### 2. 4-Step Resilient Synced Lyrics Pipeline

Lyrics are resolved using a zero-cost, community-driven database ([LRCLIB](https://lrclib.net)) cached in Neon Postgres:

```mermaid
flowchart TD
    Start(["Song Starts Playing"]) --> ClientCache{"In-Memory<br/>Client Cache?"}
    ClientCache -- Hit --> Render["Render Karaoke Synced Display"]
    ClientCache -- Miss --> API["GET /api/lyrics?trackId={id}&title={t}&artist={a}"]
    
    API --> Neon{"Neon DB<br/>lyrics_cache?"}
    Neon -- "Hit (synced / plain)" --> Parse["Parse LRC Timestamps"]
    Neon -- "Hit (not_found < 7d)" --> ReturnNF["Return 404 (Cached Not Found)"]
    
    Neon -- Miss --> Cooldown{"Server Cooldown<br/>Active (60s)?"}
    Cooldown -- Yes --> Err503["Return 503 Upstream Cooldown"]
    Cooldown -- No --> StepA["Step A: Exact Query<br/>(track + artist + album + duration)"]
    
    StepA -- Found --> SaveNeon["Save to Neon DB (source='lrclib')"]
    StepA -- Not Found --> StepB["Step B: Relaxed Query<br/>(track + artist + duration)"]
    
    StepB -- Found --> SaveNeon
    StepB -- Not Found --> StepC["Step C: Clean Search<br/>(clean track + primary artist)"]
    
    StepC -- Found --> SaveNeon
    StepC -- Not Found --> StepD["Step D: Broad Search<br/>(clean query string)"]
    
    StepD -- Found --> SaveNeon
    StepD -- Not Found --> CacheNF["Cache to Neon as 'not_found' (7 days)"]
    
    SaveNeon --> Parse
    Parse --> Render
```

---

### 3. Dynamic Album Palette Extraction

Every album cover dynamically transforms the color ambiance of Music World:
1. `GET /api/album-palette?url={image_url}` extracts 64px image buffer from Spotify's CDN.
2. `node-vibrant` isolates Vibrant, DarkVibrant, and Muted swatches.
3. WCAG luminance calculations determine high-contrast text color tokens.
4. CSS custom variables (`--color-vibrant`, `--color-dark`, `--color-light`) morph across a 400ms CSS transition.

---

### 4. Cinematic World Transitions & Paint Synchronization

Navigating between worlds triggers a custom GSAP choreography designed to eliminate blank frames:

```mermaid
stateDiagram-v2
    [*] --> Idle: Current World Displayed
    Idle --> TransitionInit: User Clicks World Portal Button
    TransitionInit --> PreloadTarget: Preload target chunk & assets
    PreloadTarget --> IrisExpanding: Expand circle clip-path from click coordinates (600ms)
    IrisExpanding --> Staging: Mount Target World behind holding clip (3.0s)
    Staging --> PaintCheck: HomeWorldPaintSignal (Two-Frame rAF)
    PaintCheck --> PaintVerified: TARGET_WORLD_PAINTED_EVENT received
    PaintVerified --> GSAPExit: Start Exit Zoom & Crossfade Dissolve (500ms)
    GSAPExit --> TransitionComplete: Unmount outgoing world & cleanup video buffer
    TransitionComplete --> Idle: Target World Fully Interactive
```

---

## 🗄️ Database Architecture & Data Models

Persistence is provided by **Neon Serverless Postgres** via **Drizzle ORM**.

```mermaid
erDiagram
    lyrics_cache {
        text spotify_id PK "Spotify Track ID"
        text source "lrclib | manual | not_found"
        text synced "LRC formatted timestamped lines"
        text plain "Unsynchronized lyric text"
        boolean instrumental "True if track has no vocals"
        timestamp fetched_at "Timestamp of cache entry"
        integer offset_ms "Manual playback sync offset (-5000 to +5000)"
    }

    scrapbook_versions {
        serial id PK "Version record ID"
        text name "Branch name ('main' default)"
        jsonb data "Full JSON spread data of pages & polaroids"
        boolean is_current "Unique index on true"
        timestamp created_at "Created timestamp"
    }

    memories {
        uuid id PK "Generated UUID"
        text spotify_user_id "Owner Spotify User ID"
        text spotify_uri "Target Track / Album / Artist URI"
        text entity_type "track | album | artist | playlist"
        text note "Personal handwritten memory note"
        text category "Category tag"
        text date_label "Display date (e.g. 'Oct 2024')"
        timestamp created_at "Creation timestamp with TZ"
        timestamp updated_at "Update timestamp with TZ"
    }
```

### Connection Strategy:
- **`DATABASE_URL` (Pooled Serverless HTTP)**: Uses `@neondatabase/serverless` `neon()` for all Next.js API route queries. Stateless, connection-limit-free HTTP round-trips.
- **`DATABASE_URL_UNPOOLED` (Direct TCP Connection)**: Used exclusively by `drizzle-kit` and `scripts/apply-migration.ts` for schema migrations requiring direct catalog locking.

---

## 🛡️ Operational Safeguards & Frozen Invariants

### 1. The Frozen Files Integrity Gate
The cinema section ("The Edit") and the Home World are strictly protected from accidental modifications, auto-formatting, or automated refactoring.

| Protected File / Asset | SHA-256 Checksum / Type | Status |
| :--- | :--- | :---: |
| `src/components/worlds/HomeWorld.tsx` | Layout & mascot desk container | ❄️ FROZEN |
| `src/components/worlds/home/*` | All subcomponents of Home World | ❄️ FROZEN |
| `src/components/worlds/main/TheEdit.tsx` | Cinema player & VHS overlay | ❄️ FROZEN |
| `src/components/worlds/main/TheEditControls.tsx` | OSD controls & playback toggles | ❄️ FROZEN |
| `src/components/worlds/main/TheEditTvHardware.tsx` | Retro TV bezel, knobs & branding | ❄️ FROZEN |
| `src/components/worlds/main/TheEditEndCard.tsx` | Cinema credits & end card sequence | ❄️ FROZEN |
| `src/components/worlds/main/TheEditHelloKitty.tsx` | TV top mascot sticker | ❄️ FROZEN |
| `src/components/worlds/main/fullscreenUtils.ts` | Cross-browser fullscreen helpers | ❄️ FROZEN |
| `public/videos/arh_vid_final.mp4` | `1c88b1bea228f2d005d1eb8d439737f37e3287a9c8ed0ff342895eebc2e967ae` | ❄️ FROZEN |
| `public/images/ar.jpeg` | `7451eee8d0665fb1da8689339f4574a01f33dc7fc28d9df031831547f9c4c10c` | ❄️ FROZEN |

> [!CAUTION]
> Every commit and PR triggers `npm run check:frozen`. Any unauthorized edit to these files or mismatch in media checksums will immediately fail the build.

### 2. Mandatory Architectural Constraints
- **400-Line Limit**: No React component file may exceed 400 lines. Complex components must be decomposed into dedicated hooks and subcomponents.
- **No Playback Position in React State**: Playback time and progress cursors must never be stored in React state. Updates are driven directly via `requestAnimationFrame` or Web Animations API.
- **GPU Transform & Opacity Only**: All motion transitions must animate `transform` and `opacity` exclusively. Never animate `width`, `height`, `left`, `top`, or `margin`.
- **No Off-Screen Filters**: Avoid `filter: blur()` or `will-change` on elements that are off-screen.
- **Strict Single Task Branching**: Never push directly to `main`. Every feature or fix must be tested on a preview URL before a fast-forward merge commit.

---

## 🧗 Engineering Hardships & How They Were Solved

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        ENGINEERING HARDSHIPS SOLVED                            │
├───────────────────────────────┬────────────────────────────────────────────────┤
│ Challenge                     │ Engineering Solution                           │
├───────────────────────────────┼────────────────────────────────────────────────┤
│ 1. Spotify 429 Rate Limits    │ Atomic Redis Lua script + Circuit Breaker lock │
│ 2. Video Dissolve Gap         │ Paint Signal gating via two-frame rAF          │
│ 3. Vinyl Sleeve Art Flicker   │ Pending-track guard with 3-second DEFER logic  │
│ 4. Scrapbook Flick Blanks     │ Windowed carousel (+/-2) & LRU-12 image cache  │
│ 5. Duplicate Spotify Cookies  │ Host-only cookies & Set-Cookie Max-Age=0 cleanup│
│ 6. Multi-Artist Lyric Misses  │ Primary artist fallback in 4-step search chain │
│ 7. EME DRM in Free Spotify    │ Client tier inspection & safe URL routing      │
│ 8. Service Worker Video Breaks│ No-cache pass-through for HTTP Range requests  │
└───────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 📊 Performance & Empirical Timing Matrices

### Empirical Paint & Exit Matrix (Measured on Production Turbopack Build)

| CPU Condition | Hop Direction | Iris Duration | Target Mount | Paint Verified | Exit Animation Start | Exit Animation End | Invariant: Exit $\ge$ Paint | Dropped Frames | Frame Rate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1× (Unthrottled)** | **hub → main** | 600 ms | 3349 ms | 3713 ms | **5376 ms** | 5881 ms | **TRUE (+1663ms)** | 0 | 144 FPS |
| **1× (Unthrottled)** | **hub → scrapbook** | 600 ms | 3187 ms | 3514 ms | **5214 ms** | 5735 ms | **TRUE (+1700ms)** | 0 | 145 FPS |
| **1× (Unthrottled)** | **main → hub** | 600 ms | 4034 ms | 4073 ms | **4847 ms** | 5346 ms | **TRUE (+774ms)** | 0 | 126 FPS |
| **4× CPU Slowdown** | **hub → main** | 600 ms | 3582 ms | 4098 ms | **5727 ms** | 6238 ms | **TRUE (+1629ms)** | 0 | 15 FPS |
| **4× CPU Slowdown** | **hub → scrapbook** | 600 ms | 3442 ms | 3896 ms | **5570 ms** | 6236 ms | **TRUE (+1674ms)** | 0 | 16 FPS |
| **4× CPU Slowdown** | **main → hub** | 600 ms | 4675 ms | 4934 ms | **5573 ms** | 6072 ms | **TRUE (+639ms)** | 0 | 28 FPS |

> [!TIP]
> Under both normal conditions and extreme 4× CPU throttling, `Exit Start >= Paint Verified` held true across 100% of runs with **0 dropped frames**.

---

## 🧪 Quality Gates & The 10 Golden Interactions

### Automated Test Matrix: 741 Vitest Tests
```
Test Files  83 passed (83)
     Tests  741 passed (741)
  Duration  32.88s (Vitest + MSW Mock Suite)
```
- **MSW (Mock Service Worker)** intercepts all 29 Spotify Web API endpoints during testing.
- **Server-Side Lua Test Suite** simulates concurrent atomic sliding-window rate limit reserves.
- **WCAG Palette Contrast Test Suite** runs 48 contrast calculations on extracted color swatches.

### The 10 Golden Interactions Checklist (Pre-Release Gate)
1. **Cold Load**: Transition video plays smoothly; page is responsive.
2. **Scrapbook Cold Load**: Network tab confirms `0` requests to `/arh/full/` before album open.
3. **Photo Open**: Tapped photo lands centered and renders crisp immediately.
4. **Photo Swipe**: Swiping forward 5 and backward 5 never flickers a blank card.
5. **Hard Flick**: High-velocity drag flick lands cleanly on the intended photo.
6. **Viewer Close/Reopen**: Closing and reopening photo inspect modal is instantaneous.
7. **Music Track Advance**: Play from search -> Skip Next x3: Vinyl art matches title with zero toast errors.
8. **Network Throttling**: Repeat steps 3–5 under Chrome DevTools "Slow 4G".
9. **Tablet Touch Test**: Validate touch targets and modal layouts on iPad viewport.
10. **Session Token Expiry Simulation**: Set `spotify_token_expires_at` to past timestamp; reload; verify token auto-renews seamlessly without login redirect loop.

---

## 📜 Chronological Project History & Session Logs

```mermaid
gantt
    title arh Development Chronology & Major Milestones
    dateFormat  YYYY-MM-DD
    section Foundation
    Project Inception & Architecture Blueprint :2026-09-01, 2026-09-10
    Next.js 16 + Neon Postgres + Drizzle Setup  :2026-09-11, 2026-09-18
    section Worlds
    Home World Layout & Frozen Lock-in         :2026-09-19, 2026-09-25
    Main World: KittyOS, Vault & The Edit TV   :2026-09-26, 2026-10-04
    Music World: Vinyl Deck & Synced Lyrics   :2026-10-05, 2026-10-12
    Scrapbook World: 3D Flipbook & Inspect     :2026-10-13, 2026-10-18
    section Hardening
    GSAP Transition Choreography & Paint Signal :2026-10-19, 2026-10-21
    Production Hardening, Auth & Lyrics Polish :2026-10-22, 2026-10-23
```

### Major Milestones Log

- **Sessions 01–10**: Architectural foundation. Implementation of Neon Postgres schemas, Spotify OAuth PKCE flow, and Drizzle ORM models.
- **Sessions 11–16**: Spotify player refactoring. Introduction of `SPOTIFY_RATE_LIMIT_LUA` in Upstash Redis, LRCLIB integration, and album color palette extraction.
- **Sessions 17–21**: Main World polish. KittyOS terminal calculus riddle generator, birthday vault passcode validation, and wax-sealed stationery letter.
- **Sessions 22–24**: Entry sequence redesign. Gameboy cartridge loading screen and ClickToEnter audio unlock screen.
- **Sessions 25–28**: Transition engineering. Encoding high-efficiency WebP/MP4 transition clips, eliminating dissolve gaps, and implementing the 3.0s holding video state.
- **Sessions 29–31**: Timing calibration. Replacement of static timeouts with two-frame rAF Paint Signals (`HomeWorldPaintSignal`), guaranteeing zero unpainted frames.
- **Handoffs #11–#16 (Oct 22, 2026)**:
  - **PR #1 (`f1aa9d3`)**: Scrapbook gesture safety; disabled accidental drag triggers on book view.
  - **PR #2 (`457f7f9`)**: Portal descriptions & vault closing copy refinement.
  - **PR #3 (`4aea181`)**: Spotify session single-flight architecture (`navigator.locks`) and elimination of domain-scoped cookie loops.
  - **PR #4 (`445480c`)**: Vinyl record art desync fix with 3-second DEFER pending-track guard.
  - **Current**: Lyrics multi-artist query fallback (`getArtistNames`) and LRCLIB matching optimization.

---

## 🚀 Developer Quickstart & Command Reference

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (or `pnpm`)
- **Accounts**: Spotify Developer App, Neon Postgres database, and Upstash Redis instance.

### 1. Environment Setup
Create a `.env.local` file in the project root:

```env
# Spotify Developer API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# Neon Serverless Postgres
DATABASE_URL=postgres://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
REDIS_KEY_PREFIX=dev:

# Rate Limiting Budgets
SPOTIFY_RATE_LIMIT_WINDOW_SEC=30
SPOTIFY_RATE_LIMIT_APP_BUDGET=50
SPOTIFY_RATE_LIMIT_USER_BUDGET=30
```

### 2. Available Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Launch local Next.js development server on `http://localhost:3000` |
| `npm run build` | Compile optimized production bundle with Turbopack |
| `npm run start` | Serve compiled production build |
| `npm test` | Run complete Vitest suite (83 files, 741 tests) |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run typecheck` | Run TypeScript compiler verification (`tsc --noEmit`) |
| `npm run lint` | Execute ESLint checks across codebase |
| `npm run check:frozen`| Verify SHA-256 checksums and headers on protected files |
| `npm run db:migrate` | Apply Drizzle database migrations to Neon Postgres |
| `npm run slideshow` | Re-generate memory slideshow asset config |

---

## 📖 Glossary of Architectural Terms

- **EME (Encrypted Media Extensions)**: The W3C browser standard for playing DRM-encrypted audio streams. Required by the Spotify Web Playback SDK to play full music tracks via Widevine CDM.
- **LRCLIB**: An open-source, community-driven database of timestamped lyrics (`.lrc` files) queried by artist, title, album, and track duration.
- **Single-Flight Request**: A synchronization pattern utilizing web locks (`navigator.locks`) ensuring that duplicate concurrent calls to fetch a resource (e.g. an access token) share a single network call.
- **Sliding-Window Rate Limiter**: An atomic Redis Lua algorithm using sorted sets (`ZREMRANGEBYSCORE` & `ZCARD`) to enforce sliding request thresholds over a rolling 30-second window.
- **Paint Signal**: A two-frame `requestAnimationFrame` handshake dispatched by newly mounted components to notify the transition engine that the DOM has visually painted.
- **Jittered Grid**: A placement algorithm generating organic, non-overlapping sticker offsets to create a cozy, handmade scrapbook aesthetic.
- **Host-Only Cookie**: An HTTP cookie set without a `Domain=` parameter, restricting its availability exclusively to the exact originating origin and preventing subdomain session conflicts.

---

<p align="center">
  <b>✦ Built with love, code, and care for Maahi ✦</b><br/>
  <i>Happy Birthday & Wishing You an Amazing Adventure in Japan! 🇯🇵</i>
</p>
