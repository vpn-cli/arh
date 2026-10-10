# Desktop App & Floating Mini-Player Implementation Plan

This document outlines the implementation plan and execution status for making Music World installable as a desktop app (PWA) with a floating mini-player (Document Picture-in-Picture).

---

## PART 1 - World in the URL

- [x] Report how worlds are switched today (`gameState.currentWorld`) and where you will hook in.
- [x] On load, read `?world=` (`home` | `main` | `music` | `scrapbook`). If valid, set current world to it. Ignore invalid values.
- [x] When the world changes, update URL with `history.replaceState` so a refresh stays in the same world. Keep the single `"/"` route. The `/privacy` route is unaffected.

---

## PART 2 - Installable App (PWA)

- [x] Add `src/app/manifest.ts` (Next.js metadata route): `name`, `short_name`, `start_url` `"/?world=music"`, `scope` `"/"`, `display` `"standalone"`, `theme_color` and `background_color` matching default palette.
- [x] Icons: generate 192x192, 512x512, and maskable 512x512 PNG from `public/hampter/hello_kitty_pin.png` with a one-off script, padded so maskable safe zone is respected. Save under `public/icons/app/`.
- [x] Manifest shortcuts: "Music" (`/?world=music`) and "Scrapbook" (`/?world=scrapbook`).
- [x] Check Chrome's current install criteria. Add a service worker ONLY if still required, and make it a pass-through with NO caching, so a new build is never hidden by a stale cache. Report which choice was made.
- [x] Install button: capture `beforeinstallprompt` and show a small "Install app" button in the Music World header. Hide it when already installed (`display-mode: standalone`) or after `appinstalled`.
- [x] Report whether the Spotify login redirect works inside the installed window, with the code path checked.

---

## PART 3 - Compact Window

- [x] Report how Music World lays out today below 768px and below 520px.
- [x] Below 520px wide, the window shows only the player: artwork, title, artist, progress bar, previous / play-pause / next, like, lyrics, and queue buttons. No sidebar, no content column, no horizontal scroll. All controls at least 32px.
- [x] Widening the window restores the full layout with no reload.

---

## PART 4 - Floating Mini-Player (Document Picture-in-Picture)

- [x] Feature-detect `"documentPictureInPicture"` in `window`. If missing, render no button.
- [x] Add a "Pop out" button in the Now Playing panel. On click, call `documentPictureInPicture.requestWindow({ width: 340, height: 420 })`.
- [x] Render a `MiniPlayer` component into that window with `createPortal`: artwork, title, artist, progress, previous / play-pause / next, like. It reads the same store and clock (`getPositionMs`) as the main player and calls the same playback actions. No second SDK player and no duplicate timers.
- [x] Copy the app's stylesheets into the pop-out document and copy the palette CSS variables; update them when the palette changes.
- [x] When the pop-out closes, clean up listeners. Opening it again works.
- [x] Report: does the Spotify SDK already set `navigator.mediaSession` (track info and media keys)? If not, set metadata and play, pause, previous, and next handlers. If it does, change nothing.

---

## PART 5 - Widget View (Replaces Document Picture-in-Picture)

### Part 1: Remove Document Picture-in-Picture
- [x] Remove "Pop out" button, PipHost, PipContext, PopOutPipButton and tests while retaining MediaSessionHost and useMediaSession.
- [x] Remove MiniPlayer in favor of WidgetPlayer.

### Part 2: Widget View
- [x] A new view selected by URL `/?world=music&view=widget` rendering only a `WidgetPlayer` card filling the window (no sidebar, header, content column, or queue).
- [x] `WidgetPlayer` horizontal card layout: album artwork on left (rounded square, full card height minus padding); track title (`text-title`, one line ellipsis) and artist (`text-meta`, one line ellipsis) on right top; previous, play/pause, next (>=36px targets) and like button on right middle; slim seekable progress bar with elapsed and total time (`text-caption`) on right bottom; small expand button on top-right. Card uses album palette variables, large rounded corners, responsive from 360x170 to 520x240.
- [x] Single store (`useSpotifyPlayerStore`), clock (`getSharedPositionMs`), and unified playback actions (`globalPlaybackActions`) with dual loop (RAF + 250ms interval fallback) keeping progress updates running when small or partly covered.
- [x] Standalone window behavior: `window.resizeTo(440, 210)` on initial load; expand button switches to full Music World without `view` param and resizes to 1280x820; matching "Widget" button in header (standalone mode only) switches back and resizes down without page reload or playback interruption.
- [x] Window Controls Overlay title bar: `display_override: ["window-controls-overlay", "standalone"]` in manifest; `titlebar-area` CSS environment variables for title bar drawing; card background marked `app-region: drag`; buttons and progress bar marked `app-region: no-drag`.
- [x] Manifest configuration: `start_url: "/?world=music&view=widget"` with shortcuts "Widget" (`/?world=music&view=widget`), "Full player" (`/?world=music`), and "Scrapbook" (`/?world=scrapbook`).
- [x] Signed-out state: displays "Open the full app to sign in" with button expanding to full view.
- [x] Landing-gate rule: gates skipped only when `story_complete === "true"`, running story first if not completed.
- [x] Normal browser tab preview: `/?world=music&view=widget` centers the same card on page for preview.

---

## Parked: needs hosting first

The following features require remote production deployment, SSL on a live domain, and external service configuration before they can be activated:
1. **Spotify Production Domain Whitelisting**: Redirect URI in Spotify Developer Dashboard requires updating to the production hosting domain (e.g. `https://yourdomain.com/api/spotify/callback`).
