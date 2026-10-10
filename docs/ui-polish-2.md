# Implementation Plan: UI Polish Pass 2 (Music World)

Implementation plan for the second Music World UI polish pass.
Each task has a checkbox grouped by section. One git commit per section, updating the checked boxes in `docs/ui-polish-2.md` together with the code changes.

---

## Section A: Emoji used as controls

### Glyph & Control Audit

| File | Line | Glyph | Context | Functional Role | Replacement |
|---|---|---|---|---|---|
| `src/components/worlds/music/layout/PlayerHeader.tsx` | 54 | `⌕` | Search input adornment | Search indicator icon | `SearchIcon` |
| `src/components/worlds/music/layout/PlayerHeader.tsx` | 62 | `✕` | Search clear button | Clear input control | `CloseIcon` |
| `src/components/worlds/music/layout/PlayerHeader.tsx` | 69 | `♪` | Header logo note | Music branding icon | `MusicNoteIcon` |
| `src/components/worlds/music/layout/PlayerHeader.tsx` | 73 | `×` | Window close button | Close window control | `CloseIcon` |
| `src/components/worlds/music/layout/PlayerOverlays.tsx` | 42 | `⚠️` | Recovery error badge | Warning indicator icon | `WarningIcon` |
| `src/components/worlds/music/layout/PlayerOverlays.tsx` | 48 | `✕` | Dismiss notice button | Close / dismiss control | `CloseIcon` |
| `src/components/worlds/music/layout/PlayerSidebar.tsx` | 96 | `+` | Playlist add button | Create playlist control | `PlusIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 91 | `▶` / `⏸` | Hero play/resume button | Play/Pause toggle icon | `PlayIcon` / `PauseIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 103 | `→` | "See all →" link | Navigation arrow | `ChevronRightIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 118, 125, 133 | `▶` | Continue Listening cards | Card play hover icon | `PlayIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 130 | `♪` | Playlist card fallback art | Fallback music note | `MusicNoteIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 150 | `→` | "See all →" link | Navigation arrow | `ChevronRightIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 167 | `▶` | Vibes tiles play button | Card play hover icon | `PlayIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 179 | `→` | "See all →" link | Navigation arrow | `ChevronRightIcon` |
| `src/components/worlds/music/home/HomeTab.tsx` | 200 | `▶` | Recently Played cards | Play icon overlay | `PlayIcon` |
| `src/components/worlds/music/MediaRow.tsx` | 89 | `👤` / `♪` | Image fallback avatar | Person/Note fallback | `PersonIcon` / `MusicNoteIcon` |
| `src/components/worlds/music/MemoriesSection.tsx` | 123 | `⚠️` | Section error notice | Warning indicator icon | `WarningIcon` |
| `src/components/worlds/music/MemoriesSection.tsx` | 124 | `✕` | Clear error button | Close / dismiss control | `CloseIcon` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 77 | `✕` | Modal close button | Close modal control | `CloseIcon` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 82 | `⚠️` | Editor error notice | Warning indicator icon | `WarningIcon` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 83 | `✕` | Clear error button | Close / dismiss control | `CloseIcon` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 91 | `♪` | Editor track fallback | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/MixSection.tsx` | 96 | `🔀` | Re-mix button | Shuffle mix control | `ShuffleIcon` |
| `src/components/worlds/music/MixSection.tsx` | 107 | `▶` | Play entire mix button | Play control icon | `PlayIcon` |
| `src/components/worlds/music/PlaylistCard.tsx` | 34 | `♪` | Card fallback cover | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/PlaylistCover.tsx` | 28 | `♪` | Default fallback icon | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/PlaylistHeader.tsx` | 20 | `◀` | Back to playlists button | Back control icon | `ChevronLeftIcon` |
| `src/components/worlds/music/PlaylistHeader.tsx` | 26 | `♪` | Header cover fallback | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/PlaylistModals.tsx` | 36 | `+` | New playlist artwork | Add playlist icon | `PlusIcon` |
| `src/components/worlds/music/PlaylistModals.tsx` | 52 | `♪` | Track fallback art | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/AlbumHeader.tsx` | 21 | `◀` | Back to albums button | Back control icon | `ChevronLeftIcon` |
| `src/components/worlds/music/AlbumHeader.tsx` | 27 | `♪` | Album fallback art | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/ArtistHeader.tsx` | 18 | `◀` | Back to artists button | Back control icon | `ChevronLeftIcon` |
| `src/components/worlds/music/ArtistHeader.tsx` | 24 | `👤` | Artist fallback avatar | Fallback person icon | `PersonIcon` |
| `src/components/worlds/music/now-playing/NowPlayingPanel.tsx` | 73 | `▼` | Lyrics toggle button | Chevron toggle icon | `ChevronDownIcon` |
| `src/components/worlds/music/now-playing/NowPlayingPanel.tsx` | 190 | `♪` | Art fallback placeholder | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/now-playing/QueuePanel.tsx` | 145 | `➔` | Browse History link | Forward arrow icon | `ChevronRightIcon` |
| `src/components/worlds/music/now-playing/QueuePanel.tsx` | 200, 269 | `♪` | Queue item fallback art | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/now-playing/QueuePanel.tsx` | 231 | `✕` | Remove from queue | Remove action button | `CloseIcon` |
| `src/components/worlds/music/now-playing/QueuePanel.tsx` | 288 | `+` | "+ Queue" add button | Add to queue icon | `PlusIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 154 | `✕` | Modal close button | Close modal control | `CloseIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 194 | `🔍` | Queue filter input | Search indicator icon | `SearchIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 200 | `✕` | Clear search button | Clear input control | `CloseIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 212 | `🔀` | Shuffle queue button | Shuffle action icon | `ShuffleIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 242, 366, 499 | `♪` | Queue item fallback art | Fallback note icon | `MusicNoteIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 398 | `▲` | Move track up button | Reorder up icon | `ChevronUpIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 407 | `▼` | Move track down button | Reorder down icon | `ChevronDownIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 425, 529 | `▶` | Play queue track button | Play item icon | `PlayIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 433, 536, 544 | `+` | Add to playlist / queue | Add action icon | `PlusIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 444 | `✕` | Remove queue track button | Remove action icon | `CloseIcon` |
| `src/components/worlds/music/QueueModal.tsx` | 570 | `➔` | Back to player link | Forward arrow icon | `ChevronRightIcon` |
| `src/components/worlds/music/tabs/LibraryTab.tsx` | 38 | `◀` | Pagination previous | Prev page control | `ChevronLeftIcon` |
| `src/components/worlds/music/tabs/LibraryTab.tsx` | 47 | `▶` | Pagination next | Next page control | `ChevronRightIcon` |
| `src/components/worlds/music/tabs/PlaylistsTab.tsx` | 38 | `+` | "+ NEW" playlist button | Create playlist icon | `PlusIcon` |
| `src/components/worlds/music/VibesSection.tsx` | 189 | `◀` | Back to vibes button | Back navigation icon | `ChevronLeftIcon` |
| `src/components/worlds/music/lyrics/AddLyricsModal.tsx` | 116 | `✕` | Modal close button | Close modal control | `CloseIcon` |
| `src/components/worlds/music/lyrics/LyricsView.tsx` | 299 | `✕` | Overlay close button | Close overlay control | `CloseIcon` |
| `src/components/worlds/music/lyrics/LyricsView.tsx` | 372 | `↓` | Scroll to current line | Jump down arrow icon | `ChevronDownIcon` |
| `src/components/worlds/music/lyrics/SyncOffsetControl.tsx` | 145 | `✕` | Modal close button | Close modal control | `CloseIcon` |

*Decorative emoji/glyphs that remain untouched:*
- Star/sparkle glyphs in titles and labels: `✨` in `✨ PLAY ✨`, `✦ DYNAMIC BIRTHDAY / DAILY MIX ✦`, `<span>✨ Kawaii Hint:</span>`, `No lyrics needed — just enjoy the melody ✨`.
- Heart glyphs in headings and text labels: `Let's listen together ♡`, `Type to search songs, artists, and playlists ♡`, `No vibes found. Listen to more music! ♡`, `QueuePanel.tsx:89: <span>♥</span> Queue`, `QueueModal.tsx:170: <span>♥</span> Up Next`.
- Ambient/thematic emoji in empty states and hints: `🌸`, `🎀`, `🕒 Recent`, `🕰️`, `📓`, `🔑`.
- Floating musical symbol background particles in `MusicWorld.tsx`.

### Section A Tasks
- [x] Create inline SVG components in `src/components/worlds/music/icons/` using `currentColor`: `PlayIcon`, `PauseIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ChevronUpIcon`, `ChevronDownIcon`, `CloseIcon`, `PlusIcon`, `MusicNoteIcon`, `PersonIcon`, `WarningIcon`, `SearchIcon`, `ShuffleIcon`.
- [x] Re-export all new icon components from `src/components/worlds/music/icons/index.ts`.
- [x] Replace functional glyphs in `layout/PlayerHeader.tsx`, `layout/PlayerOverlays.tsx`, `layout/PlayerSidebar.tsx`.
- [x] Replace functional glyphs in `home/HomeTab.tsx`.
- [x] Replace functional glyphs in `MediaRow.tsx`, `PlaylistCard.tsx`, `PlaylistCover.tsx`, `PlaylistHeader.tsx`, `PlaylistModals.tsx`, `AlbumHeader.tsx`, `ArtistHeader.tsx`.
- [x] Replace functional glyphs in `MixSection.tsx`, `MemoriesSection.tsx`, `MemoryEditorModal.tsx`, `VibesSection.tsx`.
- [x] Replace functional glyphs in `now-playing/NowPlayingPanel.tsx`, `now-playing/QueuePanel.tsx`, `QueueModal.tsx`.
- [x] Replace functional glyphs in `tabs/LibraryTab.tsx`, `tabs/PlaylistsTab.tsx`.
- [x] Replace functional glyphs in `lyrics/AddLyricsModal.tsx`, `lyrics/LyricsView.tsx`, `lyrics/SyncOffsetControl.tsx`.

---

## Section B: Card hover play button (Continue Listening, Vibes tiles)

- [x] Update `.mw-card-play` CSS in `src/app/globals.css`:
  - 40px circle, background `var(--color-vibrant)`, soft shadow.
  - Initial/hidden state: `opacity: 0; transform: translateY(4px);`.
  - Hover and focus state: `opacity: 1; transform: translateY(0);`.
  - Transitions use `--motion-base` and `--ease-out` (no scale pop).
- [x] Update Continue Listening cards in `HomeTab.tsx`:
  - Place `.mw-card-play` bottom-right of the artwork with 8px inset (`bottom-2 right-2`).
  - Render white SVG `PlayIcon` inside.
- [x] Update Vibes tiles in `HomeTab.tsx`:
  - Place `.mw-card-play` bottom-right of the artwork with 8px inset (`bottom-2 right-2`).
  - Render white SVG `PlayIcon` inside.
- [x] Remove hover colour change from card titles in `HomeTab.tsx` (remove `group-hover:text-[var(--color-vibrant)]` from Continue Listening, Vibes, and Recently Played cards).

---

## Section C: Hardcoded colours

### Hex and RGB Colour Audit

| File | Line | Current Value | Context | Planned Replacement |
|---|---|---|---|---|
| `src/components/worlds/music/QueueModal.tsx` | 385 | `#82297D` | Track duration in queue item | `text-[var(--color-dark)] opacity-70` (theme variable) |
| `src/components/worlds/music/QueueModal.tsx` | 519 | `#82297D` | Track duration in recent item | `text-[var(--color-dark)] opacity-70` (theme variable) |
| `src/components/worlds/music/AlbumActions.tsx` | 17 | `#FF99B9` | Play button gradient start | `from-[var(--color-vibrant)] to-[var(--color-vibrant)]` |
| `src/components/worlds/music/AlbumDetail.tsx` | 48, 107, 112 | `#FF4500` | Rate limit & unavailable messages | `text-[var(--color-dark)] opacity-80` |
| `src/components/worlds/music/ArtistDetail.tsx` | 48, 96, 101, 111, 116 | `#FF4500` | Rate limit & unavailable messages | `text-[var(--color-dark)] opacity-80` |
| `src/components/worlds/music/tabs/LibraryTab.tsx` | 54 | `#AD1457` | Hover gradient end | `hover:to-[var(--color-vibrant)]` |
| `src/components/worlds/music/MusicWorld.tsx` | 39 | `#9B4F96` | Top container text color | `text-[var(--color-dark)]` |
| `src/components/worlds/music/MusicWorld.tsx` | 51 | `#FF99B9` | Radial dot pattern | `radial-gradient(var(--color-muted) 2px, transparent 2px)` |
| `src/components/worlds/music/MemoriesSection.tsx` | 142 | `#FFD9EA` | Memory card header border | `border-[var(--color-light)]` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 75 | `#FFD9EA` | Modal header border | `border-[var(--color-light)]` |
| `src/components/worlds/music/MemoryEditorModal.tsx` | 87 | `#FFF0F7` | Track preview box background | `bg-[var(--color-light)]` |
| `src/components/worlds/music/MixSection.tsx` | 72 | `#FFF3F8`, `#FFE8F3` | Mix section banner gradient | `from-[var(--color-light)] to-[var(--color-light)]` |
| `src/components/worlds/music/VibesSection.tsx` | 300 | `#FFFFFF` | Custom vibe tile background | `bg-white` / `bg-[var(--color-bg)]` |
| `src/components/worlds/music/lyrics/AddLyricsModal.tsx` | 102, 105, 121, 129, 135, 143, 158, 166 | `#20233F`, `#FFF0F5`, `#B8E6D0` | Modal borders, inputs, buttons | Palette variables (`var(--color-dark)`, `var(--color-light)`, `var(--color-bg)`) |
| `src/components/worlds/music/lyrics/SyncOffsetControl.tsx` | 94, 99, 105, 114, 123, 132, 134, 161, 178, 186 | `#20233F`, `#FFD0DC`, `#B8E6D0`, `#a2d8be`, `#FFF0F5` | Admin offset control | Palette variables (`var(--color-dark)`, `var(--color-light)`, `var(--color-bg)`) |
| `src/components/worlds/music/lyrics/LyricsStates.tsx` | 37, 66, 116 | `#FFE4A1` | Button backgrounds | Palette variables (`var(--color-light)`, `var(--color-muted)`) |
| `src/components/worlds/music/lyrics/LyricsView.tsx` | 287 | `#FFD0DC`, `#20233F` | Mode tab button | Palette variables (`var(--color-light)`, `var(--color-dark)`) |

*Permitted exceptions staying as-is:*
- Black and white shadow/scrim rgba values (`bg-black/20`, `rgba(0, 0, 0, 0.08)`, `rgba(255, 255, 255, 0.2)`).
- Fixed Vibes tile gradients in `src/config/vibes.ts`.
- Spotify brand identity green (`#1DB954`, `#1ed760`) for official Spotify reconnect and status notices.
- Vinyl record black grooves in `NowPlayingPanel.tsx:182` (`#1F2937`, `#374151`, `#111827`).
- Fallback initial constants in `PaletteBackground.tsx` (`#C2185B`, `#ffffff`, `#000000`).

### Section C Tasks
- [x] Replace purple durations in `QueueModal.tsx` (`#82297D`) with palette variables.
- [x] Replace hardcoded gradient in `AlbumActions.tsx` (`#FF99B9`) with palette variables.
- [x] Replace hardcoded error/rate-limit text colors in `AlbumDetail.tsx` and `ArtistDetail.tsx` (`#FF4500`).
- [x] Replace hardcoded hover gradient in `LibraryTab.tsx` (`#AD1457`) with palette variables.
- [x] Replace hardcoded text and pattern colors in `MusicWorld.tsx` (`#9B4F96`, `#FF99B9`) with palette variables.
- [x] Replace hardcoded pink borders and backgrounds in `MemoriesSection.tsx` and `MemoryEditorModal.tsx` (`#FFD9EA`, `#FFF0F7`) with palette variables.
- [x] Replace hardcoded banner gradient in `MixSection.tsx` (`#FFF3F8`, `#FFE8F3`) with palette variables.
- [x] Replace hardcoded `#FFFFFF` in `VibesSection.tsx` with palette variables.
- [x] Replace hardcoded colors in `lyrics/AddLyricsModal.tsx`, `lyrics/SyncOffsetControl.tsx`, `lyrics/LyricsStates.tsx`, `lyrics/LyricsView.tsx` with palette variables.

---

## Section D: Recently Played on Home

- [x] Style cards with same surface and border as Continue Listening cards: `rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-bg)]/95`.
- [x] 56px artwork (`w-14 h-14 rounded-xl shrink-0 overflow-hidden`), title 15px (`text-[15px] font-bold`), artist 13px (`text-[13px] font-medium`), even padding, equal heights.
- [x] Responsive grid: 3 columns from 1280px (`xl:grid-cols-3`), 2 columns from 768px (`md:grid-cols-2`), 1 column below (`grid-cols-1`).
- [x] Hover states: border darkens (`hover:border-[var(--color-dark)]/40`) and small shadow appears (`hover:shadow-md`), NO lift.
- [x] Centered play icon (SVG `PlayIcon`) on the artwork over a dark scrim (`bg-black/40` on hover/focus).

---

## Section E: Playlist detail header

- [ ] Cover about 160px (`w-40 h-40 rounded-xl shadow-lg object-cover`) with shadow, on the left.
- [ ] Header container uses the same tinted card treatment as the Vibes detail header (`bg-gradient-to-r from-[var(--color-light)] to-[var(--color-light)] p-6 rounded-2xl border-2 border-[var(--color-muted)]`).
- [ ] SVG chevron back button (`ChevronLeftIcon`) positioned at top left.
- [ ] Detail column beside cover:
  - Small "PLAYLIST" label (`text-xs font-bold uppercase tracking-wider text-[var(--color-dark)] opacity-70`).
  - Large title (`text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)]`).
  - Single meta line with owner, track count, and total duration calculated from loaded tracks (without extra requests).
- [ ] Action row under the meta line:
  - Play as a normal-width pill button (`PlayIcon` + "Play", `bg-[var(--color-vibrant)] text-white px-6 py-2.5 rounded-full font-pixel text-sm font-bold shadow-md`).
  - Shuffle, Edit, Delete as round icon buttons.
- [ ] Remove the full-width action bar in `PlaylistDetail.tsx` / `PlaylistActions.tsx`.

---

## Section F: Track row right edge

- [ ] In `MediaRow.tsx`, render trailing actions before duration.
- [ ] Duration sits flush right in a consistent column.
- [ ] Hidden actions leave no gap at the right edge.
