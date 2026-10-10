# Music World Type System, Contrast & Touch Target Plan

Implementation plan and audit for the Music World type tokens, WCAG contrast guarantees, and target sizes.
One commit per section. Checkboxes are ticked in the commit that completes them.

---

## Section A: Audit

### A.1 Font-Size Classes & Values Audit
Audit of all distinct font-size classes, inline styles, and CSS values across Music World (`src/components/worlds/music/`).
Anything under 12px (`< 0.75rem`) is flagged as **[UNDER 12PX]**.

| Font Size Token / Class | Computed Size | Count | Status | Example Locations |
|---|---|---|---|---|
| `text-xs` | 0.75rem (12px) | 210 | Standard | `AlbumCard.tsx:12`, `AlbumCard.tsx:36`, `TrackList.tsx:66` |
| `text-sm` | 0.875rem (14px) | 60 | Standard | `AlbumActions.tsx:19`, `AlbumHeader.tsx:33`, `ArtistCard.tsx:13` |
| `text-[10px]` | 0.625rem (10px) | 24 | ⚠️ **[UNDER 12PX]** | `AlbumDetail.tsx:51`, `ArtistDetail.tsx:51`, `SyncOffsetControl.tsx:100`, `PlaybackControls.tsx:65` |
| `text-xl` | 1.25rem (20px) | 23 | Standard | `AlbumActions.tsx:31`, `AlbumHeader.tsx:32`, `ArtistHeader.tsx:29` |
| `text-2xl` | 1.5rem (24px) | 16 | Standard | `AlbumHeader.tsx:32`, `ArtistHeader.tsx:29`, `FrequenciesSection.tsx:145` |
| `text-base` | 1rem (16px) | 16 | Standard | `HomeTab.tsx:87`, `HomeTab.tsx:103`, `PlayerHeader.tsx:43` |
| `text-lg` | 1.125rem (18px) | 13 | Standard | `HomeTab.tsx:87`, `PlayerHeader.tsx:67`, `PlayerSidebar.tsx:71` |
| `text-[11px]` | 0.6875rem (11px) | 10 | ⚠️ **[UNDER 12PX]** | `FrequenciesSection.tsx:163`, `FrequenciesSection.tsx:175`, `SyncOffsetControl.tsx:106`, `PlaylistHeader.tsx:90` |
| `text-3xl` | 1.875rem (30px) | 6 | Standard | `FrequenciesSection.tsx:157`, `HomeTab.tsx:84`, `LyricsStates.tsx:22` |
| `text-[12px]` | 0.75rem (12px) | 3 | Standard | `ArtistDetail.tsx:120`, `ArtistDetail.tsx:142`, `ArtistDetail.tsx:153` |
| `text-4xl` | 2.25rem (36px) | 2 | Standard | `HomeTab.tsx:84`, `MemoriesSection.tsx:100` |
| `text-5xl` | 3rem (48px) | 2 | Standard | `HomeTab.tsx:84`, `PlayerOverlays.tsx:60` |
| `text-[15px]` | 0.9375rem (15px) | 2 | Standard | `HomeTab.tsx:200`, `MediaRow.tsx:109` |
| `text-[13px]` | 0.8125rem (13px) | 2 | Standard | `HomeTab.tsx:203`, `MediaRow.tsx:118` |
| `clamp(1.5rem, 2.2vw, 2.25rem)` | Inline clamp | 1 | Documented Exception | `LyricLines.tsx:125` (Active/inactive lyric lines fluid typography) |

- Total distinct font-size classes: 14 classes + 1 fluid clamp exception.
- Total flagged occurrences under 12px: 34 occurrences (`text-[10px]`: 24, `text-[11px]`: 10).

---

### A.2 Text Elements Using Opacity Below 0.75
Audit of all text elements in Music World where text color or container opacity is below 0.75.

| File & Line | Opacity Selector | Context / Snippet | Role / Nature |
|---|---|---|---|
| `AlbumDetail.tsx:111` | `opacity-70` | `<div className="... opacity-70">No tracks found.</div>` | Empty state text |
| `AlbumDetail.tsx:128` | `opacity-70` | `<div className="... opacity-70">No albums found.</div>` | Empty state text |
| `AlbumDetail.tsx:139` | `opacity-70` | `<div className="... opacity-70">No singles found.</div>` | Empty state text |
| `ArtistDetail.tsx:128` | `opacity-70` | `<div className="... opacity-70">No featured tracks...</div>` | Empty state text |
| `ArtistDetail.tsx:146` | `opacity-70` | `<div className="... opacity-70">No albums found.</div>` | Empty state text |
| `ArtistDetail.tsx:163` | `text-[var(--color-muted)]/70` | `<div className="... text-[var(--color-muted)]/70">No singles...</div>` | Empty state text |
| `FrequenciesSection.tsx:163` | `opacity-60` | `<span className="... opacity-60 mt-0.5">TOP ARTIST</span>` | Metric tile subtitle |
| `FrequenciesSection.tsx:175` | `opacity-60` | `<span className="... opacity-60 mt-0.5">TOP GENRE</span>` | Metric tile subtitle |
| `FrequenciesSection.tsx:188` | `opacity-60` | `<span className="... opacity-60 mt-0.5">MOST PLAYED TRACK</span>` | Metric tile subtitle |
| `HomeTab.tsx:192` | `opacity-60` | `<MusicNoteIcon size={20} className="... opacity-60" />` | Fallback art glyph |
| `MediaRow.tsx:75` | `opacity-70` | `<span className="... opacity-70">1</span>` | Track list index |
| `MediaRow.tsx:118` | `opacity-70` | `className="... opacity-70 truncate"` | Subtitle / artist line |
| `MediaRow.tsx:135` | `opacity-70` | `className="... opacity-70 truncate"` | Album title / metadata |
| `MediaRow.tsx:141` | `opacity-70` | `className="... opacity-70"` | Track duration timestamp |
| `MemoriesSection.tsx:139` | `opacity-70` | `<p className="... opacity-70">Your memory shelf is quiet...` | Empty state caption |
| `PlaylistDetail.tsx:109` | `text-[var(--color-muted)]/70` | `<span className="text-[var(--color-muted)]/70 ...">You don't have access...</span>` | Locked playlist notice |
| `PlaylistHeader.tsx:90` | `opacity-70` | `<span className="... opacity-70 uppercase mb-1">PLAYLIST</span>` | Eyebrow title label |
| `PlaylistHeader.tsx:117` | `text-[var(--color-dark)]/70` | `className="... text-[var(--color-dark)]/70 mt-2 line-clamp-2"` | Playlist description |
| `QueueModal.tsx:205` | `opacity-70` | `<SearchIcon ... opacity-70 pointer-events-none />` | Search adornment icon |
| `QueueModal.tsx:209` | `opacity-70` | `className="... opacity-70 hover:opacity-100 ..."` | Search clear button |
| `QueueModal.tsx:352` | `opacity-70` | `<div className="... opacity-70">` | Queue drag handle / index |
| `QueueModal.tsx:396` | `opacity-70` | `<span className="... opacity-70 font-bold shrink-0">` | Track queue number |
| `QueueModal.tsx:530` | `opacity-70` | `<span className="... opacity-70 font-bold shrink-0">` | History queue number |
| `SyncOffsetControl.tsx:151` | `text-[var(--color-dark)]/70` | `<p className="... text-[var(--color-dark)]/70">Enter admin secret...` | Modal helper text |
| `LyricLines.tsx:30-58` | `opacity: 0.25 - 0.5` | Inactive lyric line styling (`opacity`, `blurPx`) | **Exempt** (inactive lyrics) |

---

### A.3 Interactive Elements Smaller than 24x24px
Audit of all clickable controls (buttons, links, inputs) with dimensions below 24x24px or primary playback controls under 32x32px.

| File & Line | Control | Current Dimensions / Classes | Issue | Target Fix |
|---|---|---|---|---|
| `layout/PlayerHeader.tsx:57` | Clear search button | `p-1` (icon size 14px) ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `layout/PlayerHeader.tsx:72` | Minimize window button | `p-1` with single char `_` ~ 16x18px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `layout/PlayerHeader.tsx:73` | Maximize window button | `p-1` with single char `□` ~ 18x18px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `layout/PlayerHeader.tsx:74` | Close window button | `p-1` with `CloseIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `layout/PlayerOverlays.tsx:45` | Dismiss recovery error | `p-0.5` with `CloseIcon size={12}` ~ 16x16px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `layout/PlayerSidebar.tsx:112` | Add playlist button | `p-1` with `PlusIcon size={14}` ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `MemoriesSection.tsx:128` | Dismiss error button | `p-1` with `CloseIcon size={14}` ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `MemoryEditorModal.tsx:78` | Modal close button | `p-1` with `CloseIcon size={14}` ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `MemoryEditorModal.tsx:89` | Dismiss error button | `p-1` with `CloseIcon size={14}` ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `PlaylistModals.tsx:30, 121, 195` | Modal close buttons | `p-1` with `CloseIcon size={14}` ~ 22x22px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `PlaylistModals.tsx:145` | Public playlist checkbox | `<input type="checkbox" className="w-4 h-4" />` | 16x16px | Minimum 24x24px touch target container |
| `QueueModal.tsx:207` | Clear search filter | `p-0.5` with `CloseIcon size={12}` ~ 16x16px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `QueueModal.tsx:402` | Move track up button | `p-1` with `ChevronUpIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `QueueModal.tsx:411` | Move track down button | `p-1` with `ChevronDownIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `tabs/LibraryTab.tsx:33` | Previous page button | `p-1` with `ChevronLeftIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `tabs/LibraryTab.tsx:42` | Next page button | `p-1` with `ChevronRightIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `now-playing/QueuePanel.tsx:219` | Remove from queue button | `p-1` with `CloseIcon size={12}` ~ 20x20px | < 24x24px | Minimum 24x24px (`w-6 h-6`) |
| `lyrics/SyncOffsetControl.tsx:98` | Decrement offset (-100ms) | `px-1.5 py-0.5` ~ 18px height | < 24x24px | Minimum 24px height (`min-h-[24px] px-2 py-1`) |
| `lyrics/SyncOffsetControl.tsx:113` | Increment offset (+100ms) | `px-1.5 py-0.5` ~ 18px height | < 24x24px | Minimum 24px height (`min-h-[24px] px-2 py-1`) |
| `lyrics/SyncOffsetControl.tsx:122` | Save offset button | `px-2 py-0.5` ~ 18px height | < 24x24px | Minimum 24px height (`min-h-[24px] px-2.5 py-1`) |
| `now-playing/PlaybackControls.tsx:31` | Shuffle button (Primary) | No size set on button; SVG is `w-5 h-5` (20px) | Primary < 32px | Primary control >= 32px (`w-8 h-8 flex items-center justify-center`) |
| `now-playing/PlaybackControls.tsx:44` | Prev track button (Primary) | No size set on button; SVG is `w-6 h-6` (24px) | Primary < 32px | Primary control >= 32px (`w-8 h-8 flex items-center justify-center`) |
| `now-playing/PlaybackControls.tsx:78` | Next track button (Primary) | No size set on button; SVG is `w-6 h-6` (24px) | Primary < 32px | Primary control >= 32px (`w-8 h-8 flex items-center justify-center`) |
| `now-playing/PlaybackControls.tsx:89` | Repeat button (Primary) | No size set on button; SVG is `w-5 h-5` (20px) | Primary < 32px | Primary control >= 32px (`w-8 h-8 flex items-center justify-center`) |

---

### A.4 Palette Generator Code
Current code deriving palette variables in `src/app/api/album-palette/route.ts` and `src/components/worlds/music/palette/PaletteBackground.tsx`:

#### From `src/app/api/album-palette/route.ts`:
```ts
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function mixColors(color1: string, color2: string, weight1: number) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const w1 = weight1;
  const w2 = 1 - w1;
  const r = Math.round(rgb1.r * w1 + rgb2.r * w2);
  const g = Math.round(rgb1.g * w1 + rgb2.g * w2);
  const b = Math.round(rgb1.b * w1 + rgb2.b * w2);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// In GET handler:
const palette = await Vibrant.from(buffer).getPalette();
const baseColor = palette.Vibrant?.hex || '#C2185B';

const computed = {
  bg: mixColors(baseColor, '#ffffff', 0.08),
  light: mixColors(baseColor, '#ffffff', 0.15),
  muted: mixColors(baseColor, '#ffffff', 0.35),
  dark: mixColors(baseColor, '#000000', 0.40),
  vibrant: baseColor
};
```

#### From `src/components/worlds/music/palette/PaletteBackground.tsx`:
```ts
const base = palette?.vibrant || "#C2185B";
const computedBg = palette?.computed?.bg || `color-mix(in srgb, ${base} 8%, #ffffff)`;
const computedLight = palette?.computed?.light || `color-mix(in srgb, ${base} 15%, #ffffff)`;
const computedMuted = palette?.computed?.muted || `color-mix(in srgb, ${base} 35%, #ffffff)`;
const computedDark = palette?.computed?.dark || `color-mix(in srgb, ${base} 40%, #000000)`;

root.style.setProperty("--base-color", base);
root.style.setProperty("--color-bg", computedBg);
root.style.setProperty("--color-light", computedLight);
root.style.setProperty("--color-muted", computedMuted);
root.style.setProperty("--color-vibrant", base);
root.style.setProperty("--color-dark", computedDark);
```

### Section A Checklist
- [x] Audit every distinct font-size class or value used, with counts and example locations.
- [x] Flag every font size under 12px.
- [x] Audit every text element using opacity below 0.75.
- [x] Audit every interactive element smaller than 24x24px and primary controls smaller than 32px.
- [x] Document and paste existing palette generator code.

---

## Section B: Type Tokens

### Specification
Define 6 sizes in the Tailwind theme `@theme` in `src/app/globals.css`, in rem, each with an associated line height:
- `caption`: `0.75rem` (12px), line-height: `1rem` (16px) -> utility: `text-caption`
- `meta`: `0.8125rem` (13px), line-height: `1.125rem` (18px) -> utility: `text-meta`
- `body`: `0.9375rem` (15px), line-height: `1.375rem` (22px) -> utility: `text-body`
- `title`: `1.125rem` (18px), line-height: `1.5rem` (24px) -> utility: `text-title`
- `heading`: `1.5rem` (24px), line-height: `1.875rem` (30px) -> utility: `text-heading`
- `display`: `2.25rem` (36px), line-height: `2.5rem` (40px) -> utility: `text-display`

### Rules
- Nothing under `caption` (`0.75rem`).
- Any control element (tabs, button labels, offset controls, inputs) must be `meta` or larger.
- Documented exception: `LyricLines.tsx` fluid clamp `clamp(1.5rem, 2.2vw, 2.25rem)` for lyric line animation.
- Add performance/design rule to `AGENTS.md`: "No arbitrary text-[Npx] sizes in Music World."

### Section B Checklist
- [ ] Define the 6 tokens and line-heights in `@theme` in `src/app/globals.css`.
- [ ] Migrate all font sizes across Music World files to the 6 type tokens (`text-caption`, `text-meta`, `text-body`, `text-title`, `text-heading`, `text-display`).
- [ ] Migrate all controls (tabs, button labels, search inputs, offset controls) to `text-meta` or larger.
- [ ] Add "no arbitrary text-[Npx] sizes in Music World" rule to `AGENTS.md`.

---

## Section C: Contrast

### Specification
- Add `src/lib/contrast.ts`: WCAG relative luminance and contrast-ratio helper function with unit tests in `src/lib/__tests__/contrast.test.ts`.
- In the palette generator (`src/lib/palette.ts`, updated `src/app/api/album-palette/route.ts` and `src/components/worlds/music/palette/PaletteBackground.tsx`):
  - Guarantee `--color-dark` on `--color-light` and on `--color-bg` is at least 4.5:1.
  - Add `--on-vibrant`: the better of `#ffffff` or `--color-dark` against `--color-vibrant`, minimum 4.5:1; adjust `--color-vibrant` if neither reaches 4.5:1.
  - Add `--color-text-muted` that is at least 4.5:1 on both surfaces (`--color-light` and `--color-bg`).
- Add tests in `src/lib/__tests__/paletteContrast.test.ts`: run the generator against at least 8 real cover colours (yellow, pale pink, grey, near-black, electric blue, off-white, crimson, green) and assert all contrast ratios $\ge 4.5:1$.
- Replace white text on vibrant backgrounds with `text-[var(--on-vibrant)]`.
- Replace opacity-dimmed text with `text-[var(--color-text-muted)]` (inactive lyric lines remain exempt).

### Section C Checklist
- [ ] Implement WCAG contrast-ratio helper and unit tests.
- [ ] Update palette generator to compute and guarantee `--color-dark`, `--on-vibrant`, and `--color-text-muted` at $\ge 4.5:1$.
- [ ] Add palette unit tests asserting contrast ratios across 8 distinct cover colours.
- [ ] Replace white text on vibrant backgrounds with `text-[var(--on-vibrant)]`.
- [ ] Replace opacity-dimmed text with `text-[var(--color-text-muted)]`.

---

## Section D: Target Sizes

### Specification
- Every interactive element (buttons, links, inputs, checkboxes) must have a touch/click target of at least 24x24px.
- Primary controls (playback controls: shuffle, previous, next, repeat, play/pause) must be at least 32x32px.
- Fix all elements flagged in Section A.3 audit.

### Section D Checklist
- [ ] Enforce primary controls in `PlaybackControls.tsx` to at least 32x32px.
- [ ] Enforce minimum 24x24px target size for all header buttons, overlay dismissals, modal close buttons, reorder buttons, pagination controls, and offset controls.
- [ ] Fix checkbox hit target in `PlaylistModals.tsx` to at least 24x24px.
