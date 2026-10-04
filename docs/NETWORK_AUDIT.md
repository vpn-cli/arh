# Network Request / Spotify API Audit

## 1. Baseline Test

- **Fresh Page Load**: Initially, the application fetched `/me`, `/me/playlists`, `/me/tracks` (twice), and `/me/library/contains` all simultaneously upon mounting, regardless of which tab was active.
- **Idle Behavior**: No background API polling is observed.
- **Playback**: Playback correctly relies on Spotify Web Playback SDK events.
- **Window Focus**: Previously, returning to the window after navigating away would trigger rapid refetches of the currently playing track's save status due to default TanStack Query configurations.

## 2. Spotify SDK Streaming Requests

- **HTTP 206 Partial Content**: The expected `~300–350 KB` requests initiated by `index.js` for audio chunks are completely isolated to the SDK. The application architecture correctly leaves these alone and does not attempt to intercept or suppress them.

## 3. Application API Audit

| Endpoint | Source Hook | Purpose | Action Taken |
|---|---|---|---|
| `/me` | `usePlaylists` | Getting the current user ID to filter playlists | Changed to only fetch when the `playlists` tab is active. |
| `/me/playlists` | `usePlaylists` | Listing playlists | Changed to only fetch when the `playlists` tab is active. |
| `/me/tracks` | `useLikedTracks`, `useBirthdayMix` | Getting saved tracks | Both fetched simultaneously on load. Modified to use conditional `enabled` flags based on `activeTab`. |
| `/me/top/tracks` | `useBirthdayMix` | Mixing top tracks with saved tracks | Changed to only fetch when the `mix` tab is active. |
| `/me/library/contains` | `useTrackSavedStatus`, `useAlbumSavedStatus` | Determining if a track/album is liked | Missing `staleTime` caused window-focus refetching. Added 5 minute `staleTime`. |
| `/me/player/devices` | `useDevices` | Listing active cast devices | Already optimally configured (`enabled: false`, requires explicit click). |

## 4. Duplicate Requests

**Issue Found**: `GET /me/tracks?limit=50` was requested twice independently by `useLikedTracks` and `useBirthdayMix` exactly when the player loaded.
**Resolution**: TanStack Query dedupes based on identical query keys, but these hooks used different keys (`['spotify', 'likedTracks']` vs `['spotify', 'birthdayMix']`). Instead of hacking the query keys, I added conditional `enabled` flags so that `useBirthdayMix` and `usePlaylists` are skipped until their respective tabs are activated by the user.

## 5. Polling

**Issue Found**: None.
**Resolution**: There is no application-level polling of `/me/player` or similar endpoints. The `setInterval` block inside `SpotifyPlayerUI.tsx` exclusively calls the SDK's local `player.getCurrentState()` method which resolves immediately without creating HTTP requests.

## 6. React Effects

**Issue Found**: Unnecessary refetches due to default StrictMode and missing `staleTime`.
**Resolution**: Ensured effects tracking errors (e.g., rate limit timers) only run when actual errors are thrown. The main player initialization correctly runs only when a valid token is established and does not duplicate `Spotify.Player` instances on re-renders.

## 7. TanStack Query Configuration

**Issue Found**: `useTrackSavedStatus` and `useAlbumSavedStatus` defaulted to `staleTime: 0`. Since TanStack Query's default `refetchOnWindowFocus` is true, switching tabs in your OS or browser and coming back would immediately trigger a new `GET /me/library/contains` request for the currently playing item.
**Resolution**: Configured all queries with appropriate `staleTime` (usually 5 minutes, or 1 hour for the birthday mix) to allow caching to absorb these navigations.

## Final Result
`NETWORK_HEALTHY = TRUE`
