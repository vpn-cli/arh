# PHASE 15 UI MAPPING: Hello Kitty / Kawaii Pixel UI

## 1. MAPPING: Hello Kitty UI Element -> Existing Component/State/Action

Based on `soundscape_ref/finaluiref.png`

### 1.1 Window Header (`KawaiiWindowHeader`)
*   **Search Bar**
    *   ↓ `globalSearch` / `<SearchResults />` / `activeTab = 'search'`
*   **Window Controls (Close/Min/Max)**
    *   ↓ Visual only / generic UI actions if applicable

### 1.2 Left Sidebar
*   **Brand Block (Hello Kitty Logo)**
    *   ↓ Static decorative
*   **Primary Navigation (Home, Playlists, Vibes, Search, Library, Memories, Frequencies)**
    *   ↓ `activeTab` state setter
*   **Your Playlists Section**
    *   ↓ `<PlaylistCard />` mapped over `playlists` array (from `usePlaylists`)

### 1.3 Main Content Area
*   **Mix Hero (Greeting & Banner)**
    *   ↓ Generic welcome or `activeTab = 'mix'` / `useBirthdayMix`
*   **Continue Listening (`MusicCardGrid`)**
    *   ↓ `<TrackList />` or mapped `recentTracks` from `useRecentlyPlayed` (or `libraryPage`)
*   **Vibes (`VibesSection`)**
    *   ↓ `<VibesSection />`
*   **Recently Played (`MusicCardGrid`)**
    *   ↓ `recentTracks` from `useRecentlyPlayed`

### 1.4 Right Sidebar (`NowPlayingPanel` & `QueuePanel`)
*   **Now Playing Cover & Vinyl Record**
    *   ↓ `currentTrack.album.images[0].url`
*   **Track Title & Artist**
    *   ↓ `currentTrack.name`, `currentTrack.artists`
*   **Now Playing Controls (Play, Pause, Next, Prev, Shuffle, Repeat)**
    *   ↓ `togglePlay()`, `nextTrack()`, `prevTrack()`, `toggleShuffle()`, etc.
*   **Now Playing Progress Bar**
    *   ↓ `position`, `duration`, `player.seek`
*   **Queue List (`Up Next`)**
    *   ↓ `queue` state, `queueIndex`, `playQueueItem()`, `clearQueue()`
*   **Recently Played Tab (in Queue Panel)**
    *   ↓ `recentTracks` state

### 1.5 Bottom Fixed Bar (`PersistentPlayer`)
*   **Current Track Info (Mini)**
    *   ↓ `currentTrack` info
*   **Playback Controls (Mini)**
    *   ↓ `togglePlay()`, `nextTrack()`, `prevTrack()`
*   **Volume / Progress**
    *   ↓ Device volume (if applicable) or redundant progress bar
*   **Additional Controls (Queue toggle, fullscreen)**
    *   ↓ Visual toggles

---

## 2. PROPOSED COMPONENT STRUCTURE

```text
KawaiiPlayerUI
│
├── KawaiiWindowHeader
│   └── GlobalSearchInput
│
├── KawaiiLayoutBody (flex-row)
│   │
│   ├── KawaiiSidebarLeft
│   │   ├── BrandBlock
│   │   ├── PrimaryNavigation
│   │   └── PlaylistSection
│   │
│   ├── KawaiiMainContent
│   │   ├── MixHeroBanner
│   │   ├── MusicCardGrid (Continue Listening)
│   │   ├── VibesSectionGrid
│   │   └── MusicCardGrid (Recently Played)
│   │
│   └── KawaiiSidebarRight
│       ├── NowPlayingPanel (Vinyl animation, Controls, Progress)
│       └── QueuePanel (Up Next / Recently Played)
│
└── KawaiiPersistentPlayer (Bottom Bar)
    ├── MiniTrackInfo
    ├── MiniControls
    └── Volume/Settings
```

## 3. ASSET UTILIZATION
*   **Reference Images:** `public/soundscape_ref/finalui.png`, `public/soundscape_ref/finaluiref.png`
*   **Colors:** Soft pinks (`#FFB6C1`, `#FFE4E1`, `#FFF0F5`, `#FF69B4`, `#D81B60`)

## 4. NEXT STEPS
Step 1: Rebuild the Layout Shell using the 3-column + header + footer layout shown in `finaluiref.png` with dashed pink borders and solid backgrounds.
