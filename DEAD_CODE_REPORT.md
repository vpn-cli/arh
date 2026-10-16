# Dead Code & Unnecessary Code Audit Report

**Branch:** `cleanup/dead-code`  
**Date:** October 15, 2026  
**Auditor:** Antigravity  

---

## 1. Baseline Verification Status

Prior to detecting and removing dead code, all standard validation suites were executed on `cleanup/dead-code` after fixing the CommonJS `require()` call in [terminalQuestions.test.ts](file:///d:/Projects/arh/src/components/worlds/main/__tests__/terminalQuestions.test.ts):

| Command | Status | Result / Details |
|---|---|---|
| `npm test` (`vitest run`) | **PASS** | 65 / 65 test files passed (551 / 551 tests passed) |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** | 0 type errors |
| `npm run build` (`next build`) | **PASS** | Turbopack compiled clean; all 22 static and dynamic routes generated |
| `npm run lint` (`eslint`) | **BASELINE RECORDED** | 7 pre-existing hook-ordering errors in `SpotifyModeBadge.tsx` and `VolumeButton.tsx`, 672 warnings |

---

## 2. SAFE TO DELETE
Confirmed **zero references anywhere** across source code, templates, configs, scripts, data files, or dynamic string interpolations.

### A. Unused Source Code Files (`src/`)
| File Path | Description | Reason Dead |
|---|---|---|
| [`src/components/ui/PhotoDetailModal.tsx`](file:///d:/Projects/arh/src/components/ui/PhotoDetailModal.tsx) | Modal component for photo zoom | 0 imports in the repository. Full photo view in 3D Scrapbook uses internal state. |
| [`src/components/ui/PixelWindow.tsx`](file:///d:/Projects/arh/src/components/ui/PixelWindow.tsx) | Legacy pixel window frame | Superseded by [`IndiePixelWindow.tsx`](file:///d:/Projects/arh/src/components/ui/IndiePixelWindow.tsx); 0 imports in codebase. |
| [`src/components/ui/TypewriterIntro.tsx`](file:///d:/Projects/arh/src/components/ui/TypewriterIntro.tsx) | Intro typewriter animation | 0 imports in codebase. The introductory sequence uses `ClickToEnterScreen` and `GameboyLoadingScreen`. |
| [`src/components/worlds/music/PlaylistActions.tsx`](file:///d:/Projects/arh/src/components/worlds/music/PlaylistActions.tsx) | Full-width playlist action buttons | Removed during UI refactoring (per `docs/ui-polish-2.md`); only referenced by unused backup file. |
| [`src/components/worlds/music/PlaylistDetail.backup.tsx`](file:///d:/Projects/arh/src/components/worlds/music/PlaylistDetail.backup.tsx) | Backup copy of PlaylistDetail | Orphaned backup file with 0 references in the app router or components. |
| [`src/components/worlds/PlaceholderWorld.tsx`](file:///d:/Projects/arh/src/components/worlds/PlaceholderWorld.tsx) | Placeholder world stub | `WorldRouter.tsx` only routes to `HomeWorld`, `MainWorld`, `MusicWorld`, and `ThreeDScrapbook`. 0 imports. |

### B. Unused Root Development Scripts, Monolithic Dumps & Scraps
| File Path | Description | Reason Dead |
|---|---|---|
| [`OriginalUI.tsx`](file:///d:/Projects/arh/OriginalUI.tsx) | 108 KB monolithic UI archive | Legacy monolithic code explicitly excluded in `tsconfig.json` and `eslint.config.mjs`. |
| [`OriginalUI_utf8.tsx`](file:///d:/Projects/arh/OriginalUI_utf8.tsx) | 54 KB monolithic UI archive | Stray duplicate root file explicitly excluded in `tsconfig.json` and `eslint.config.mjs`. |
| [`replace.js`](file:///d:/Projects/arh/replace.js) | One-off refactoring regex script | One-time migration script used to modify `SpotifyPlayerUI.tsx`. Not referenced in `package.json` or scripts. |
| [`replace_footer.js`](file:///d:/Projects/arh/replace_footer.js) | One-off refactoring script | One-time regex script. Not referenced anywhere. |
| [`rewrite_player.py`](file:///d:/Projects/arh/rewrite_player.py) | Python AST rewriting script | One-time Python script used during player decomposition. Not referenced anywhere. |
| [`update-spotify.js`](file:///d:/Projects/arh/update-spotify.js) | One-off script | One-time migration script for Spotify endpoints. |
| [`update-ui.js`](file:///d:/Projects/arh/update-ui.js) | One-off script | One-time migration script for UI tokens. |
| [`scratch_test.ts`](file:///d:/Projects/arh/scratch_test.ts) | 9-line manual Spotify test script | Ad-hoc scratch testing script. |
| [`tracks`](file:///d:/Projects/arh/tracks) | 7-line scrap text file | Plain-text raw dump of a 403 Forbidden Spotify response. |
| [`debug_divs.txt`](file:///d:/Projects/arh/debug_divs.txt) | Scrap text dump | Dump of div layout debugging output. |
| [`clip_image.py`](file:///d:/Projects/arh/clip_image.py) | One-off image clipping script | Ad-hoc PIL script. |
| [`convert_heic.py`](file:///d:/Projects/arh/convert_heic.py) | One-off HEIC conversion script | Ad-hoc PIL script. |
| [`patch_image.py`](file:///d:/Projects/arh/patch_image.py) | One-off image patch script | Ad-hoc PIL script. |
| [`ref.png`](file:///d:/Projects/arh/ref.png) | 2.0 MB root screenshot | Root reference screenshot; not referenced by code. |

### C. Confirmed Dead Assets in `public/`
| File Path | Description | Reason Dead |
|---|---|---|
| `public/hampter/chromeremotedesktophost.msi` | 18.6 MB Windows installer binary | Stray Google Chrome Remote Desktop installer inadvertently placed into `public/`. |
| `public/hampter/download (10).jpeg.crdownload` | Incomplete Chrome download | Abandoned temporary browser download file. |
| `public/hampter/Unconfirmed 855211.crdownload` | Incomplete Chrome download | Abandoned temporary browser download file. |
| `public/images/arh.code-workspace` | VS Code workspace file | Editor configuration file accidentally saved into `public/images/`. |
| `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` | Default Next.js template SVGs | Leftovers from `create-next-app`; not used by any component. |
| `public/fonts/Pokemon-Solid.ttf` | 25.5 KB font file | Not declared in `@font-face` or used anywhere in CSS/JSX. |
| `public/player-bg.jpg` | 552 KB image | Never referenced in CSS, JSX, or JSON. |
| `public/bedroom-bg.jpg` | 600 KB image | Never referenced in CSS, JSX, or JSON. |
| `public/images/loading_bg.jpg` | Unused background image | Code uses `/images/loading_bg_pixel.jpg`. |
| `public/images/terminal-kitty.png` | Uncompressed PNG | Code in `KittyMascot.tsx` uses `/images/terminal-kitty.webp`. |
| `public/images/hampters/` (12 files) | PNG sprite crops | The active application uses `/hampter/devious hamster doodle.jpeg` via `HamsterSticker.tsx`. |
| `public/images/polaroids/` (6 files) | Loose polaroid images | Polaroid frames in the UI are rendered via CSS borders/styling, not static image files. |
| `public/images/room-art.jpg`, `public/images/room-scene.png` | Unused scene concepts | 0 references in JSX or CSS. |
| `public/images/portals/*.png` (`hk-main.png`, `hk-mascot.png`, `hk-music.png`, `hk-scrapbook.png`) | Uncompressed PNG duplicates | All components (`HomeScrapbookCard.tsx`, `MainWorld.tsx`, etc.) use the `.webp` versions. |
| `public/images/elements/*.png` (27 files) + `manifest.json` | Uncompressed PNG duplicates | `floatingElementsData.ts` and `TheLetter.tsx` reference the `.webp` versions (`bouquet_wrap.webp`, etc.). |

### D. Unused Dead Exports & Code in Source Files
| File Path | Lines | Identifier | Reason Dead |
|---|---|---|---|
| [`src/components/ui/gameboy/GameboyParallax.tsx`](file:///d:/Projects/arh/src/components/ui/gameboy/GameboyParallax.tsx#L73-L90) | L73–90 | `export default function GameboyParallax` | Only the named hook `useGameboyParallax` is used by `GameboyLoadingScreen.tsx`. The default wrapper component is never imported. |
| [`src/components/kitty/KittyMascot.tsx`](file:///d:/Projects/arh/src/components/kitty/KittyMascot.tsx#L42) | L42 | `export { KittyMascot }` | Redundant named export; all consumers import the default export. |
| [`src/components/worlds/main/PhaseTracker.tsx`](file:///d:/Projects/arh/src/components/worlds/main/PhaseTracker.tsx#L20) | L20 | `export const PHASES = MAIN_PHASES;` | Alias never imported; consumers import `MAIN_PHASES`. |
| [`src/hooks/useSpotify.ts`](file:///d:/Projects/arh/src/hooks/useSpotify.ts#L80-L89) | L80–89 | `export function useDevices` | Unused hook; device discovery is not mounted in the UI. |
| [`src/hooks/useSpotify.ts`](file:///d:/Projects/arh/src/hooks/useSpotify.ts#L156-L163) | L156–163 | `export function useAddToSpotifyQueue` | Unused hook; player queue mutations are handled via `usePlaybackActions` and client state. |
| [`src/lib/server/spotifyLogger.ts`](file:///d:/Projects/arh/src/lib/server/spotifyLogger.ts#L20-L24) | L20–24 | `export function resetRequestTimestampsForTesting` | Unused test utility; no tests call it. |
| [`src/lib/spotify/artists.ts`](file:///d:/Projects/arh/src/lib/spotify/artists.ts#L16-L18) | L16–18 | `export async function getArtistTopTracks` | Spotify deprecated this endpoint in Feb 2026; stub returns `{ tracks: [] }` and has 0 callers. |
| [`src/lib/spotify/playlists.ts`](file:///d:/Projects/arh/src/lib/spotify/playlists.ts#L2) | L2 | `normalizeSavedTrack` import | Unused import in `playlists.ts` (only `normalizePlaylistItem` is used). |
| [`src/lib/server/redis.ts`](file:///d:/Projects/arh/src/lib/server/redis.ts#L29) | L29 | `export const SPOTIFY_LOCK_KEY` | Raw constant without environment prefix; production code uses `getSpotifyLockKey()`. |

---

## 3. NEEDS REVIEW
Items that are possibly used dynamically, for diagnostics/debugging, reference material, or external tooling.

### A. Debug & Diagnostic Tooling (User Explicitly Instructed to Flag)
| File Path | Description | Why Needs Review |
|---|---|---|
| [`src/app/diagnose/page.tsx`](file:///d:/Projects/arh/src/app/diagnose/page.tsx) | System diagnosis dashboard | Internal developer diagnostic UI. Keep if needed for production debugging. |
| [`src/app/diagnose/icons/page.tsx`](file:///d:/Projects/arh/src/app/diagnose/icons/page.tsx) | Icon preview & audit page | Internal diagnostic UI to inspect icon rendering. |
| [`src/app/diagnose/icons/IconsPreviewClient.tsx`](file:///d:/Projects/arh/src/app/diagnose/icons/IconsPreviewClient.tsx) | Client component for icon audits | Used exclusively by `/diagnose/icons`. |
| [`src/app/api/spotify/diagnose/route.ts`](file:///d:/Projects/arh/src/app/api/spotify/diagnose/route.ts) | Spotify API diagnostic route | Verifies Spotify tokens, rate limits, and scopes. |
| [`src/app/api/debug/route.ts`](file:///d:/Projects/arh/src/app/api/debug/route.ts) | Debug state endpoint | Writes debug payload to `diagnostics.json`. |
| [`src/app/api/log/route.ts`](file:///d:/Projects/arh/src/app/api/log/route.ts) | Browser logging endpoint | Appends client logs to `browser-logs.txt`. |
| [`diagnostics.json`](file:///d:/Projects/arh/diagnostics.json) | Local debug dump file | Generated at runtime by `/api/debug`. |
| [`diagnose-results.json`](file:///d:/Projects/arh/diagnose-results.json) | Saved diagnostic results | Static test output file from a prior diagnose run. |
| [`browser-logs.txt`](file:///d:/Projects/arh/browser-logs.txt) | Local client log dump | Generated at runtime by `/api/log`. |

### B. Heavy Video & Document Files in `public/`
| File Path | Size | Why Needs Review |
|---|---|---|
| `public/arh_vid.mp4` | 37.5 MB | Duplicate of `public/videos/arh_vid.mp4`. The app code in `TheEdit.tsx` loads `/videos/arh_vid_final.mp4`, `/videos/real_vid.mp4`, and fallback `/Arh.mp4`. |
| `public/videos/arh_vid.mp4` | 37.5 MB | Unreferenced duplicate video; app code uses `arh_vid_final.mp4`. |
| `public/videos/arhvidfinal.mp4` | 56.3 MB | Unreferenced video without underscores; app code uses `arh_vid_final.mp4` (18.5 MB). |
| `public/hampter/IMG_2678.MOV` | 14.1 MB | QuickTime video in `public/hampter/`. Never referenced in code. |
| `public/hampter/SOUNDSCAPES_reference_assets.zip` | 4.8 MB | Reference asset zip archive stored in public folder. |
| `public/hampter/Non-Premium Spotify Accounts Behavior, Dev vs Production.pdf` | 134 KB | Spotify research PDF stored in public folder. |
| `public/soundscape_ref/` (`finaluiref.png`, `wireframe.png`) | 3.5 MB | Design wireframes and UI references. |
| `public/ref/download (9).jpeg` | 14 KB | Design reference file. |
| `to_fix/` | 28.2 MB | Folder containing screen recording of bug (`A Little Corner of the Internet for You...mp4`). |

### C. Dynamically Referenced Assets (DO NOT DELETE)
These files appear unreferenced to static grep, but are **actively loaded at runtime**:
1. **Scrapbook WebP Photos** (`public/arh/grid/*.webp` and `public/arh/full/*.webp`):
   - [`ThreeDScrapbook.tsx:94-118`](file:///d:/Projects/arh/src/components/worlds/scrapbook/ThreeDScrapbook.tsx#L94-L118) dynamically converts image paths from `scrapbook-data.json` using `toWebp(src.replace('/arh/', '/arh/grid/'))`. Deleting these breaks the 3D photo album.
2. **Music Navigation Icons** (`public/icons/nav/*.png`):
   - [`PlayerSidebar.tsx:101`](file:///d:/Projects/arh/src/components/worlds/music/layout/PlayerSidebar.tsx#L101) dynamically loads `/icons/nav/${item.id}.png`. All 7 icons are active.
3. **Snoopy Sticker Files** (`public/stickers/snoopy-v1/r*c*.png`):
   - Dynamically mapped by [`stickerConfig.ts`](file:///d:/Projects/arh/src/components/worlds/music/stickerConfig.ts) and validated by [`StickerIcon.test.tsx`](file:///d:/Projects/arh/src/components/worlds/music/__tests__/StickerIcon.test.tsx).

### D. Spotify Library API Client Methods
| File Path | Function | Why Needs Review |
|---|---|---|
| [`src/lib/spotify/library.ts:8`](file:///d:/Projects/arh/src/lib/spotify/library.ts#L8) | `checkTracksSaved(trackIds)` | Part of Spotify API client library; current UI checks likes via Neon DB / Memories store. |
| [`src/lib/spotify/library.ts:15`](file:///d:/Projects/arh/src/lib/spotify/library.ts#L15) | `saveTrack(trackId)` | Spotify library mutation helper; not currently bound to a button. |
| [`src/lib/spotify/library.ts:19`](file:///d:/Projects/arh/src/lib/spotify/library.ts#L19) | `removeTrack(trackId)` | Spotify library mutation helper; not currently bound to a button. |

### E. Animation Library Overlap & Three.js Analysis
Per user request:
- **GSAP vs Framer Motion**:
  - GSAP is used throughout the entire codebase (`MainWorld.tsx`, `HomeWorld.tsx`, `MusicWorld.tsx`, `HomeMascot.tsx`, `StoryCard.tsx`, `HamsterSticker.tsx`, `AuthLoadingOverlay.tsx`).
  - `framer-motion` is listed in `package.json`, but has **zero imports** in the entire codebase. There is no active feature overlap because Framer Motion is never invoked.
- **Three.js**:
  - `three` and `@types/three` are listed in `package.json`, but **zero files in `src/` import Three.js**.
  - The "3D Scrapbook" ([`ThreeDScrapbook.tsx`](file:///d:/Projects/arh/src/components/worlds/scrapbook/ThreeDScrapbook.tsx)) is constructed entirely with CSS 3D transforms (`perspective: 2000px`, `transform-style: preserve-3d`). There are no Three.js helpers or canvas renderers mounted anywhere.

---

## 4. UNUSED DEPENDENCIES

Evaluation of dependencies flagged by Knip taking `.npmrc` (`legacy-peer-deps=true`) and peer dependency chains into account:

| Package | Status | Verdict | Explanation |
|---|---|---|---|
| `three` | `dependencies` | **SAFE TO DELETE** | Zero imports in `src/`, `scripts/`, or configs. Scrapbook uses pure CSS 3D. |
| `@types/three` | `dependencies` | **SAFE TO DELETE** | Type definitions for Three.js; unneeded since `three` is not used. |
| `framer-motion` | `dependencies` | **SAFE TO DELETE** | Zero imports in `src/`. All animations use GSAP. |
| `@testing-library/user-event` | `devDependencies` | **SAFE TO DELETE** | Zero usages across all 65 test files (tests use `fireEvent` from `@testing-library/react`). |
| `@neon/env` | `dependencies` | **NEEDS REVIEW** | Not directly imported. Could be used by Neon CLI environment injection in CI/CD. |
| `@neon/config` | `dependencies` | **DO NOT DELETE (IN USE)** | Imported and actively used in [`neon.ts:1`](file:///d:/Projects/arh/neon.ts#L1) (`defineConfig`). Knip missed it because `neon.ts` is in the project root. |
| `tailwindcss` | `devDependencies` | **DO NOT DELETE (IN USE)** | Required peer package for `@tailwindcss/postcss` and resolves `@import "tailwindcss";` in `src/app/globals.css`. Removing it breaks the CSS build. |

---

## 5. Next Steps

Awaiting your approval before making any deletions. Once approved, Phase 4 will proceed in isolated, verified commits on branch `cleanup/dead-code`:
1. **Commit 1:** Remove safe unused source files in `src/components/`
2. **Commit 2:** Remove safe unused root scripts, monolithic dumps, and scraps
3. **Commit 3:** Remove safe unused assets in `public/`
4. **Commit 4:** Clean up unused exports & imports in source files
5. **Commit 5:** Remove confirmed unused dependencies (`three`, `@types/three`, `framer-motion`, `@testing-library/user-event`)
6. **Re-validation:** Run `npm test`, `npm run build`, `npm run lint`, and `npm run typecheck` after every single commit.
