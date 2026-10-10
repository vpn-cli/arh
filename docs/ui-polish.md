# UI polish pass: Music World

Seven items, done in the phases below. Read AGENTS.md first.

## Ground rules

- One phase per commit. Stop after each phase and wait for my visual check.
- You cannot see the rendered UI. Never write "verified" for visual work.
  End each phase with a list of what I should look at.
- No new features in `SpotifyPlayerUI.tsx`. 400-line file limit.
- Colours come from the existing palette CSS variables only. The theme
  changes with album art, so no hardcoded hex values.
- Sizes below are starting values. Put them in CSS variables or one config
  object so I can tune them without hunting through components.
- No new dependencies without asking me first.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`,
  `left`, `margin`, and never `transition: all`. Nothing may shift layout
  (CLS is already 0.21 and must not get worse).

---

## Phase A: lyrics overlay blocks navigation (bug, item 7)

**Problem:** with the lyrics overlay open, clicking a playlist, nav item or
card changes the view underneath, but the overlay stays on top. I have to
press the close button to see where I went.

**Wanted:** any navigation closes the lyrics overlay automatically.

- Navigation means: sidebar nav items, sidebar playlists, any card or tile,
  "See all", "Back to ...", and opening search results.
- Not navigation: play/pause, next/previous, seek, like, queue actions,
  clicking a lyric line. These must leave the overlay open.
- In the narrow layout the overlay covers the player panel, not the
  content. Leave it open there.
- Implement in ONE place (the function or state that changes the view),
  not in every click handler.
- Watch the known trap: an effect must not depend on a callback that
  changes with the state it sets.

**Before coding, show me:** where the lyrics open state lives, and the
code that changes the current view.

---

## Phase B: foundations (used by every later phase)

### B1. Motion tokens (item 1)

First, list the hover and transition styles currently used on cards, rows,
nav items and buttons, so we can see the inconsistencies. Then add tokens:

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 120ms | press feedback |
| `--motion-base` | 180ms | hover |
| `--motion-slow` | 240ms | view change |
| `--ease-out` | cubic-bezier(0.2, 0.8, 0.2, 1) | everything |

Apply one pattern per element type:

- **Cards and tiles** (Continue Listening, Vibes, Recently Played): rise
  3px, shadow deepens, play button fades in and scales 0.9 to 1. Title
  colour change is transitioned, not instant.
- **Rows** (playlists, tracks, artists): background tint fades in. The
  border must always exist (transparent when idle) so nothing jumps by a
  pixel. Row action icons fade in.
- **Sidebar nav items:** background tint fades in, icon scales to 1.08.
- **Buttons:** scale 1.03 on hover, 0.97 on press.
- **View change** (switching tabs or opening a playlist): new content
  fades in and rises 6px. No exit animation.

Also required:

- Hover styles sit inside `@media (hover: hover)`.
- `:focus-visible` gets the same treatment as hover, plus a visible ring.
- `prefers-reduced-motion`: opacity changes only, no movement.
- Do not touch the lyrics animations.

### B2. One shared row component

Artists and tracks are currently drawn at different sizes (see Phases E
and F). Create one `MediaRow` component and use it for artist rows and
track rows everywhere:

- Image 48px. Circle for artists, rounded square for tracks and playlists.
- Title 15px bold, subtitle 13px.
- Optional rank number, optional trailing actions, optional duration.
- One fallback avatar for missing images.

---

## Phase C: left sidebar (items 2 and 3)

### C1. Width and type size

- Sidebar width: about 250px now, target 296px, as `--sidebar-width`.
- "Your Playlists" rows: thumbnail 32px to 40px, name 14px to 15px,
  song count 11px to 13px.
- Nav labels stay as they are, unless they look small next to the rows.
- Long names still truncate with an ellipsis.
- The centre column gets narrower. Check the Continue Listening row and
  the Vibes tiles at common widths (1280, 1440, 1920). Vibes tile labels
  already overlap at narrow widths; do not make that worse.

### C2. Nav icons

Replace the seven plain glyphs with cute icons in one consistent style:
inline SVG components, rounded strokes, 22px, `currentColor`, in their own
`icons/` folder.

| Item | Icon idea |
|---|---|
| Home | little house with a heart window |
| Playlists | cassette tape |
| Mix | sparkles |
| Vibes | moon and stars |
| Library | vinyl record |
| Memories | polaroid photo |
| Frequencies | sound wave |

**Before wiring them in:** show me all seven side by side on one preview
so I can approve or swap them. Do not use any brand or character artwork.

---

## Phase D: Playlists tab (item 4)

This is the full Playlists view, not the sidebar list.

- Rows are bigger: use `MediaRow`, image 56px, title 16px, meta 13px.
- Spacing is compact: about 6px between rows (the gap is roughly 40px now).
- Hover follows the row pattern from B1.
- Filter box and "+ New" button stay where they are.

---

## Phase E: Vibes detail page (item 6)

**Problems:**

- Artist rows are much smaller than track rows.
- The artist list has no heading, while tracks have "Vibe Tracks".
- Columns are uneven (4 left, 3 right).
- Several artists show a blank avatar.
- The header says "15 Top Artists" but only 7 are drawn.

**Wanted:**

- Artists and tracks both use `MediaRow` at the same size.
- Add a "Vibe Artists" heading that matches "Vibe Tracks".
- Artists in a balanced grid that fills evenly.
- Header card: keep the content, tidy the spacing.

**Report only, change nothing yet:** why are artist images missing, and
why does the count say 15 when 7 are shown? Paste the code that builds
both.

---

## Phase F: Frequencies page (item 5)

- **Time range:** one segmented control with three equal pills. Now it is
  one big button and two plain text labels.
- **Listening profile:** three stat tiles in a row (big number, small
  label) on a palette-tinted surface. The current plain white card clashes
  with the theme.
- **Top Artists and Top Tracks:** both use `MediaRow` with rank numbers,
  so they match each other and the Vibes page.
- **Section headings:** same style as the Home headings.
- **"Play All":** aligned with the Top Tracks heading.

---

## Finish

- Update `docs/vibes-and-ui.md` to match the result. It is out of date.
- Give me a per-phase checklist of what to click and look at.
- Run `git status` and list every file changed, per phase.
