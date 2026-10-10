# Vibes Section + UI Polish

Status: implemented
Last updated: 2026-10-10

## Overview & Current State

The Music World UI polish has been completed across Phases A–F:

1. **Motion & Row Styling (Phase B1 & B2)**:
   - Music World CSS rules layered inside `@layer components` in `src/app/globals.css`.
   - Focus rings standardized to `outline: 2px solid var(--color-vibrant); outline-offset: 2px`.
   - `MediaRow` unified component (`src/components/worlds/music/MediaRow.tsx`):
     - Non-interactive outer container with `after:absolute after:inset-0` stretched button overlay for row clickability without nested button HTML errors.
     - Supports `imageSlot`, `imageUrl`, `imageSize` (48px default, 56px in Playlists tab), `imageShape` (`rounded` vs `circle`), `rank`, `duration`, and `actions`.
     - Zero hardcoded hex colors; strictly uses theme tokens (`var(--color-dark)`, `var(--color-vibrant)`, `var(--color-light)`).
   - `PlaylistCover` (`src/components/worlds/music/PlaylistCover.tsx`):
     - Renders 2×2 grid collage for 4+ images with `pickImage` at half size for each quadrant.
     - Renders single image via `pickImage` for 1–3 images.
     - Fallback icon `♪` when images are missing.
   - `TrackRow` wraps `MediaRow` preserving caller props.

2. **Sidebar & Navigation (Phase C1 & C2)**:
   - Responsive sidebar width: `--sidebar-width: 256px` base, expanding to `296px` at `@media (min-width: 1280px)`.
   - Sidebar playlist list uses `MediaRow` with `PlaylistCover` (size 40) and `pickImage`.
   - 7 custom inline SVG kawaii navigation icons (`src/components/worlds/music/icons/`):
     - Home (house with heart window), Playlists (cassette), Mix (sparkles), Vibes (moon & stars), Library (vinyl record), Memories (polaroid), Frequencies (sound wave).
     - Standardized with 22px default, `strokeWidth: 2`, `currentColor`, rounded stroke caps/joins.
     - Dev preview available at `/diagnose/icons`.

3. **Playlists Tab (Phase D)**:
   - Playlists list rendered via `MediaRow` with `imageSize={56}`, `PlaylistCover`, and compact 6px (`gap-1.5`) spacing.

4. **Vibes Detail Page (Phase E)**:
   - Vibe Artists rendered using `MediaRow` at 48px circle, matching track row sizing.
   - Matching "Vibe Artists" and "Vibe Tracks" section headings.
   - Balanced 2-column responsive grid (`grid-cols-1 md:grid-cols-2 gap-2`).

5. **Frequencies Page (Phase F)**:
   - Time range selector converted into a 3-pill equal segmented control.
   - Listening Profile converted into three stat tiles on a palette-tinted surface.
   - Top Artists rendered via `MediaRow` with 1-based ranks in 2 columns.
   - "Play All" button aligned with the Top Tracks heading matching the Home section heading style.

---

## Parked

The following items are deferred / parked for future iterations:

1. **Vibes Artist Count Discrepancy**:
   - The header card reports 15 Top Artists, but only 7 are drawn in the category.
2. **Missing Artist Images**:
   - Several vibe artists return blank avatar icons from the API / clustering pipeline.
3. **Compact TrackRow Variant in Search**:
   - Search results currently use the default track row rather than a compact variant.