# Spotify API & Foundation Audit Report

## Phase 0 - Foundation Audit
*Date: 2026-10-04*

### 1. Current Route Structure
- **Root**: `src/app/page.tsx` & `src/app/layout.tsx` (Current structure places all worlds inside one route `page.tsx`).
- **API Routes**: `src/app/api/` containing:
  - `/get-scrapbook`, `/save-scrapbook`, `/log`
  - `/spotify/login`, `/spotify/callback`, `/spotify/session`, `/spotify/proxy/[...path]`

### 2. Current Component Structure
- `src/components/ui/` and `src/components/landing/` for foundation.
- `src/components/worlds/music/MusicWorld.tsx` hosts the music interface.
- Architecture Constraint Assessment: The current codebase lacks the separated Domain Components structure (e.g. `TrackRow.tsx`, `AlbumCard.tsx`) mandated by `architecture.md`. `MusicWorld.tsx` and UI currently mixes API calling logic/hooks directly, which needs separation later.

### 3. Zustand Stores
- `src/store/spotifyStore.ts`: `useSpotifyPlayerStore` tracks the Spotify Web Playback SDK state, managing `player`, `deviceId`, `isReady`, `isActive`, `currentTrack`, `isPaused`, `isShuffle`, `position`, `duration`, and `error`.
- Architecture Constraint Assessment: This follows the architectural guideline that Zustand is used exclusively for global playback state, acting as the single source of truth.

### 4. TanStack Query Hooks
Located in `src/hooks/useSpotify.ts`:
- `useSpotifySession`: Checks for active session via `/api/spotify/session`.
- `usePlaylists`: Fetches `/me/playlists`.
- `useDevices`: Fetches `/me/player/devices`.
- `useBirthdayMix`: Fetches `/me/top/tracks` and `/me/tracks`.
- `useSpotifySearch`: Fetches `/search`.
- `useTrackSavedStatus`: Fetches `/me/library/contains`.
- `useSpotifyMutations`: Includes `play`, `toggleSave` (via `/me/library`), `toggleShuffle`.
- Architecture Constraint Assessment: The architectural rule requires TanStack query to be the bridge to Spotify APIs (`Track C: Data Architecture`). Currently, hooks exist but are all clumped inside `useSpotify.ts` instead of separated by domain (e.g., `useLikedTracks.ts`, `useSearch.ts`).

### 5. Spotify API Abstraction
- Defined in `src/lib/spotifyClient.ts` as `proxyFetch`.
- Uses `p-queue` to limit concurrency to 2 and enforce a 200ms interval (throttling).
- Translates API errors and intercepts 429 (pauses queue globally based on `Retry-After`).
- Architecture Constraint Assessment: The base `proxyFetch` respects the `Spotify API -> Next.js Proxy -> API Functions` separation constraint. However, API functions are mostly directly written inside TanStack queries in `useSpotify.ts` rather than abstracted into separate files (`lib/spotify/player.ts`, etc.).

### 6. Proxy Architecture
- Defined in `src/app/api/spotify/proxy/[...path]/route.ts`.
- Automatically retrieves `spotify_access_token` and `spotify_refresh_token` from cookies.
- Transparently proxies requests to `https://api.spotify.com/v1/`.
- Automatically refreshes tokens if a `401 Unauthorized` is encountered, updates cookies, and retries the request exactly once.

### 7. Authentication Flow
- Handled primarily on the server using `HttpOnly` cookies.
- `/api/spotify/login` redirects to Spotify OAuth.
- `/api/spotify/callback` processes the authorization code and sets cookies.
- UI components are completely insulated from Auth and Token Refresh logic, satisfying the Architecture constraint.

### 8. Player Architecture
- Relies on Spotify Web Playback SDK integration in `SpotifyPlayerUI.tsx` / `MusicWorld.tsx`.
- State is synchronized with `useSpotifyPlayerStore` (Zustand).
- Architecture Constraint Assessment: Compliant. The SDK is the authoritative playback engine and Zustand mirrors it.

### 9. Redis Usage
- Uses Upstash Redis (`@upstash/redis`).
- **Circuit Breaker**: Keys like `spotify_api_lock` block requests for the duration of a `Retry-After`.
- **Caching**: GET requests to `me/playlists`, `search`, `me/tracks`, `me/library`, and `playlists/` are cached for 1 hour.

### 10. Existing Technical Debt / Duplicated Logic
- **Architecture Debt**: The UI mixes domain rendering (like rendering a track) with API fetching instead of relying on decoupled Domain Components like `TrackRow`.
- **Hook Clumping**: All queries are stuffed in `useSpotify.ts` instead of separated (`useSearch`, `usePlaylists`).
- **API File Abstraction**: There is no pure API abstraction layer (e.g. `getLikedTracks()`). TanStack queries call `proxyFetch` directly.
- The `proxyFetch` in `useBirthdayMix` manually queries and merges `/me/top/tracks` and `/me/tracks` to generate a mix.

### 11. API Endpoints Currently Used
- `GET /me/playlists`
- `GET /me/player/devices`
- `GET /me/top/tracks`
- `GET /me/tracks`
- `GET /search`
- `GET /me/library/contains`
- `PUT /me/player/play`
- `PUT /me/library`
- `DELETE /me/library`
- `PUT /me/player/shuffle`

### 12. Deprecated Spotify Endpoints Still Present
- **Found:** None.
- **Not Found (Migrated or Unused):** `/me/tracks/contains` (migrated to `/me/library/contains`), `/me/albums`, `/me/following`, `/playlists/{id}/tracks`, `/users/{id}/playlists`, `/tracks?ids=`, `/albums?ids=`, `/artists?ids=`, `/artists/{id}/top-tracks`, `/browse/new-releases`, `/browse/categories`.

## Conclusion & Architecture Alignment
The current foundation works but requires refactoring to comply with `architecture.md` (to be done incrementally as required by features):
1. Extract API calls to `src/lib/spotify/` and create granular custom hooks (`src/hooks/`).
2. Build domain primitives (e.g., `TrackRow.tsx`) to handle reusable rendering before adding new features.
