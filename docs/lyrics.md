# Synced Lyrics

Status: implemented
Last updated: 2026-10-10

## Overview & Current State

The Synced Lyrics subsystem is fully integrated with LRCLIB and the Music World player:

1. **API & Data Pipeline**:
   - `GET /api/lyrics?trackId={id}`: Server route resolving artist, title, and duration to fetch from LRCLIB.
   - Cached locally and in memory via `useLyrics` with prefetching for queued tracks.
   - Server-side and client-side LRC parsing into structured line timings and estimated word-level wipe delays.

2. **Playback Synchronization**:
   - `requestAnimationFrame` polling reads playback position from the audio provider without placing sub-second timestamps in React state (preventing player-wide re-renders).
   - Dynamic class and style updates apply active line scrolling and inline karaoke word wipes.
   - `SyncOffsetControl` allows manual microsecond offset adjustment and persistent timing correction.

3. **Layout & Responsive Behavior**:
   - On screens `< 1024px` (`max-lg`): Docks as a 380px drawer on the right (`max-lg:w-[380px] max-lg:right-0`).
   - On screens `≥ 1024px` (`lg`): Spans the central content area, anchoring to the responsive sidebar boundary (`lg:left-[var(--sidebar-width)] lg:right-[400px] xl:right-[420px] 2xl:right-[440px]`).

---

## Parked

The following items are deferred / parked across the Music World UI:

1. **Vibes Artist Count Discrepancy**:
   - Header card reports 15 Top Artists while 7 are drawn.
2. **Missing Artist Images**:
   - Several vibe artists show blank avatars from Spotify data clustering.
3. **Compact TrackRow Variant in Search**:
   - Search results currently render the default track row size rather than a compact variant.