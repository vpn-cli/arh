# KAWAII PLAYER --- UI & ARCHITECTURE FOUNDATION

## Purpose

This document defines the **architecture foundation** that should be
developed alongside the feature implementation.

The purpose is NOT to redesign the application yet.

The goal is to ensure that:

-   Spotify/API logic is separated from UI
-   components are reusable
-   future visual redesign can happen without rewriting functionality
-   navigation can evolve as features are added
-   the current player remains stable
-   new pages use consistent structural primitives
-   Antigravity does not create large, tightly coupled components

This document should be treated as a companion to:

`IMPLEMENTATION_PLAN.md`

------------------------------------------------------------------------

# 1. Core Architecture Principle

Use this separation:

``` text
Spotify API
     ↓
Next.js Spotify Proxy
     ↓
Spotify Service / API Functions
     ↓
TanStack Query Hooks
     ↓
Domain Components
     ↓
Layout Components
     ↓
Visual Styling
```

The important rule is:

> UI components should not know how Spotify authentication, proxying,
> caching, or token refresh works.

For example, avoid:

``` tsx
<button onClick={() => fetch("/api/spotify/proxy/...")}>
```

inside a reusable TrackRow.

Prefer:

``` tsx
const playTrack = usePlayTrack();

<TrackRow
  track={track}
  onPlay={() => playTrack(track)}
/>
```

The component knows what it should do, not how Spotify does it.

------------------------------------------------------------------------

# 2. Three Layers To Build Simultaneously

There are three architecture tracks.

## Track A --- Component Architecture

Build reusable UI/domain components.

## Track B --- Layout Architecture

Establish stable layout slots without doing the final visual redesign.

## Track C --- Data Architecture

Create clean Spotify API functions and TanStack Query hooks.

All three should evolve alongside the feature implementation.

------------------------------------------------------------------------

# 3. COMPONENT ARCHITECTURE

Use a structure approximately like:

``` text
components/
│
├── player/
│   ├── Player.tsx
│   ├── PlayerControls.tsx
│   ├── ProgressBar.tsx
│   ├── VolumeControl.tsx
│   ├── NowPlaying.tsx
│   ├── PlayerArtwork.tsx
│   └── PlaybackStatus.tsx
│
├── music/
│   ├── TrackRow.tsx
│   ├── TrackList.tsx
│   ├── AlbumCard.tsx
│   ├── ArtistCard.tsx
│   ├── PlaylistCard.tsx
│   ├── MusicGrid.tsx
│   └── PlayButton.tsx
│
├── search/
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   ├── TrackSearchResult.tsx
│   ├── ArtistSearchResult.tsx
│   ├── AlbumSearchResult.tsx
│   └── PlaylistSearchResult.tsx
│
├── playlists/
│   ├── PlaylistHeader.tsx
│   ├── PlaylistTrackList.tsx
│   ├── PlaylistActions.tsx
│   └── PlaylistEditor.tsx
│
├── library/
│   ├── LibraryHeader.tsx
│   ├── LikedSongs.tsx
│   ├── SavedAlbums.tsx
│   └── FollowedArtists.tsx
│
├── queue/
│   ├── QueuePanel.tsx
│   ├── QueueItem.tsx
│   └── QueueList.tsx
│
├── artist/
│   ├── ArtistHeader.tsx
│   ├── ArtistAlbums.tsx
│   └── ArtistSingles.tsx
│
├── album/
│   ├── AlbumHeader.tsx
│   └── AlbumTrackList.tsx
│
├── mix/
│   ├── MixSection.tsx
│   ├── ContinueListening.tsx
│   ├── RecentlyPlayed.tsx
│   └── QuickPlay.tsx
│
├── vibes/
│   ├── VibeCard.tsx
│   ├── VibeGrid.tsx
│   └── VibeView.tsx
│
├── frequencies/
│   ├── TopArtists.tsx
│   ├── TopTracks.tsx
│   └── TimeRangeSelector.tsx
│
├── memories/
│   ├── MemoryCard.tsx
│   ├── MemoryPanel.tsx
│   └── MemoryEditor.tsx
│
└── layout/
    ├── AppShell.tsx
    ├── Sidebar.tsx
    ├── MainContent.tsx
    ├── PlayerDock.tsx
    ├── PageHeader.tsx
    ├── Section.tsx
    └── ContentContainer.tsx
```

This is a target architecture.

Do NOT create every file immediately.

Create components when the corresponding feature is implemented.

------------------------------------------------------------------------

# 4. COMPONENT RESPONSIBILITIES

Each component should have one clear responsibility.

## TrackRow

Responsible for presenting one track.

It may receive:

``` ts
type TrackRowProps = {
  track: SpotifyTrack;
  onPlay?: () => void;
  onLike?: () => void;
  onAddToQueue?: () => void;
  showAlbum?: boolean;
  showArtist?: boolean;
};
```

It should NOT:

-   fetch Spotify data
-   refresh tokens
-   call Spotify directly
-   manage global playback state unnecessarily

------------------------------------------------------------------------

## TrackList

Responsible for rendering multiple TrackRows.

``` tsx
<TrackList
  tracks={tracks}
  onPlayTrack={handlePlay}
/>
```

It should handle:

-   list layout
-   empty state
-   loading skeleton if appropriate

It should not know how Spotify data was fetched.

------------------------------------------------------------------------

## AlbumCard

Responsible for displaying album information.

It should support:

-   artwork
-   title
-   artist
-   click navigation
-   play action if required

------------------------------------------------------------------------

## ArtistCard

Responsible for displaying artist information.

------------------------------------------------------------------------

## PlaylistCard

Responsible for displaying playlist information.

------------------------------------------------------------------------

# 5. SHARED DOMAIN TYPES

Do not create slightly different representations of the same Spotify
entity throughout the app.

Prefer shared types:

``` text
types/
├── spotify.ts
├── player.ts
├── playlist.ts
├── library.ts
├── queue.ts
└── memories.ts
```

If the Spotify API returns a large object but the UI only needs a
subset, define a clear application type rather than passing arbitrary
objects everywhere.

Example:

``` ts
type TrackSummary = {
  id: string;
  uri: string;
  name: string;
  artists: ArtistSummary[];
  album?: AlbumSummary;
  durationMs: number;
  imageUrl?: string;
};
```

This makes components independent from raw API response shapes.

------------------------------------------------------------------------

# 6. DATA LAYER

Create a clean separation between:

``` text
Spotify API endpoint
        ↓
API function
        ↓
TanStack Query hook
        ↓
Component
```

Example:

``` text
lib/spotify/
├── player.ts
├── tracks.ts
├── albums.ts
├── artists.ts
├── playlists.ts
├── library.ts
├── search.ts
└── history.ts
```

Possible functions:

``` ts
getLikedTracks()
getAlbum()
getAlbumTracks()
getArtist()
getArtistAlbums()
getPlaylist()
getPlaylistItems()
searchSpotify()
getQueue()
getRecentlyPlayed()
getTopArtists()
getTopTracks()
```

Mutation functions:

``` ts
saveTrack()
removeTrack()
saveAlbum()
removeAlbum()
addToQueue()
createPlaylist()
updatePlaylist()
addPlaylistItems()
removePlaylistItems()
```

These functions should communicate with the existing Next.js Spotify
proxy.

------------------------------------------------------------------------

# 7. TANSTACK QUERY LAYER

Do not call the Spotify API directly from visual components.

Create hooks such as:

``` text
hooks/
├── useLikedTracks.ts
├── useSavedAlbums.ts
├── useFollowedArtists.ts
├── useSearch.ts
├── usePlaylist.ts
├── usePlaylistItems.ts
├── useAlbum.ts
├── useArtist.ts
├── useQueue.ts
├── useRecentlyPlayed.ts
├── useTopArtists.ts
└── useTopTracks.ts
```

Example:

``` tsx
const {
  data,
  isLoading,
  isError
} = useLikedTracks();
```

Mutations should invalidate or update the appropriate query cache.

Example:

``` text
save track
   ↓
mutation succeeds
   ↓
invalidate liked songs
   ↓
invalidate saved status
   ↓
UI updates
```

Avoid manually refetching unrelated data.

------------------------------------------------------------------------

# 8. PLAYER STATE

The Spotify Web Playback SDK remains the authoritative playback engine.

Zustand should contain application playback state such as:

``` ts
type PlayerState = {
  deviceId?: string;
  currentTrack?: TrackSummary;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  playerReady: boolean;
};
```

Do not create separate playback state inside individual components.

For example:

Bad:

``` text
Player.tsx → local isPlaying
TrackRow.tsx → local isPlaying
MiniPlayer.tsx → local isPlaying
```

Good:

``` text
Spotify.Player
      ↓
Zustand
      ↓
Player.tsx
MiniPlayer.tsx
TrackRow.tsx
Queue.tsx
```

One source of truth.

------------------------------------------------------------------------

# 9. ACTION HOOKS

Create reusable player actions.

For example:

``` text
hooks/player/
├── usePlayTrack.ts
├── usePlayPlaylist.ts
├── useTogglePlay.ts
├── useNextTrack.ts
├── usePreviousTrack.ts
├── useSeek.ts
├── useSetVolume.ts
├── useToggleShuffle.ts
└── useSetRepeat.ts
```

This prevents every component from implementing Spotify playback logic
differently.

Example:

``` tsx
const playTrack = usePlayTrack();

playTrack(track);
```

The hook handles the actual Spotify interaction.

------------------------------------------------------------------------

# 10. LAYOUT ARCHITECTURE

Do not finalize the visual layout yet.

Instead create stable structural slots.

The conceptual structure should be:

``` text
AppShell
│
├── Sidebar
│
├── MainContent
│
└── PlayerDock
```

Inside MainContent:

``` text
MainContent
│
├── PageHeader
│
├── PageContent
│
└── optional overlays/drawers
```

This gives us freedom to completely redesign the visual arrangement
later.

------------------------------------------------------------------------

# 11. APP SHELL

Create:

``` tsx
<AppShell>
  <Sidebar />
  <MainContent>
    {children}
  </MainContent>
  <PlayerDock />
</AppShell>
```

The AppShell should not know what page is currently being displayed
beyond the routing/layout requirements.

Do not put Spotify API calls into AppShell.

------------------------------------------------------------------------

# 12. SIDEBAR

The sidebar should eventually support navigation concepts such as:

``` text
PLAYLISTS
MIX
SEARCH
LIBRARY
QUEUE

VIBES
FREQUENCIES
MEMORIES
```

But do not assume all of these must remain permanent sidebar items.

Some may eventually become:

-   drawers
-   overlays
-   contextual actions
-   player controls

Keep navigation configuration separate from the visual component.

Example:

``` ts
const navigationItems = [
  { id: "playlists", label: "PLAYLISTS", href: "/playlists" },
  { id: "mix", label: "MIX", href: "/mix" },
  { id: "search", label: "SEARCH", href: "/search" },
];
```

This allows the visual sidebar to change later without rewriting
routing.

------------------------------------------------------------------------

# 13. PAGE CONTAINER

Create a reusable:

``` tsx
<Page>
  <PageHeader />
  <Section>
    ...
  </Section>
</Page>
```

All major pages should use the same structural primitives.

This will make the final visual redesign much easier.

------------------------------------------------------------------------

# 14. SECTION COMPONENT

Create a reusable Section primitive.

Conceptually:

``` tsx
<Section
  title="Recently Played"
  action={<ViewAllButton />}
>
  ...
</Section>
```

The Section component should handle:

-   title
-   optional subtitle
-   optional action
-   content spacing

Do not hardcode colors or decorative styling that prevents later
redesign.

------------------------------------------------------------------------

# 15. LOADING STATES

Every data-driven component should have a loading state.

Create reusable:

``` text
components/ui/
├── Skeleton.tsx
├── TrackRowSkeleton.tsx
├── CardSkeleton.tsx
├── ListSkeleton.tsx
└── PageSkeleton.tsx
```

Avoid giant page-level loading spinners whenever possible.

Prefer content-shaped skeletons.

------------------------------------------------------------------------

# 16. EMPTY STATES

Create a reusable EmptyState component.

Examples:

``` tsx
<EmptyState
  title="No liked songs yet"
  description="Songs you save will appear here."
/>
```

Different features can provide different copy while using the same
structure.

------------------------------------------------------------------------

# 17. ERROR STATES

Create reusable ErrorState.

It should support:

-   title
-   description
-   retry action

Example:

``` tsx
<ErrorState
  title="Couldn't load your library"
  onRetry={refetch}
/>
```

Do not expose raw Spotify/API error objects directly to the user.

------------------------------------------------------------------------

# 18. MODALS AND DRAWERS

Create reusable primitives:

``` text
components/ui/
├── Modal.tsx
├── Drawer.tsx
├── Dropdown.tsx
├── ContextMenu.tsx
└── ConfirmDialog.tsx
```

These will later be useful for:

-   Add to Playlist
-   Queue
-   Track options
-   Playlist editor
-   Memory editor
-   Device selector

Do not create five different modal implementations.

------------------------------------------------------------------------

# 19. FUTURE LAYOUT SLOTS

The current interface can continue looking roughly like:

``` text
┌───────────────────────────────────────────────┐
│              KAWAII_PLAYER.EXE                │
├───────────────┬───────────────────────────────┤
│               │                               │
│ PLAYLISTS     │                               │
│ MIX           │           CONTENT             │
│ SEARCH        │                               │
│               │                               │
│               │                               │
├───────────────┴───────────────────────────────┤
│                  PLAYER                        │
└───────────────────────────────────────────────┘
```

Later we can decide whether the final version becomes:

``` text
Sidebar + Content + Player
```

or:

``` text
Sidebar + Content + Right Queue + Player
```

or:

``` text
Top Navigation + Content + Floating Player
```

or something much more custom.

Do not lock this decision prematurely.

------------------------------------------------------------------------

# 20. ROUTING ARCHITECTURE

Prefer routes that represent content rather than UI implementation
details.

Potential structure:

``` text
app/
├── page.tsx
├── mix/
│   └── page.tsx
├── search/
│   └── page.tsx
├── library/
│   └── page.tsx
├── playlists/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── albums/
│   └── [id]/
│       └── page.tsx
├── artists/
│   └── [id]/
│       └── page.tsx
├── queue/
│   └── page.tsx
├── vibes/
│   └── page.tsx
├── frequencies/
│   └── page.tsx
└── memories/
    └── page.tsx
```

Actual routing should be adapted to the existing application.

Do not rewrite existing routes simply to match this document.

------------------------------------------------------------------------

# 21. VISUAL DESIGN RULE

Until the final design phase:

DO:

-   preserve current aesthetic
-   preserve current pink/scrapbook identity
-   reuse existing visual language
-   make components structurally reusable
-   keep spacing reasonably consistent
-   use existing assets

DO NOT:

-   redesign the entire sidebar
-   redesign the player
-   introduce a new color system
-   replace the current typography
-   add large animation systems
-   move every component around
-   spend significant time on visual polish

The current UI is a working shell.

The final visual design comes later.

------------------------------------------------------------------------

# 22. DESIGN TOKENS

Even before the final redesign, move repeated visual values into
centralized tokens where practical.

Examples:

``` text
spacing
radius
font sizes
transitions
z-index
layout widths
player heights
sidebar widths
```

Do not obsess over perfect values yet.

The goal is centralization.

For example:

``` css
--player-height
--sidebar-width
--content-max-width
--page-padding
--section-gap
```

This will make the final visual pass much faster.

------------------------------------------------------------------------

# 23. FEATURE IMPLEMENTATION CONTRACT

Whenever a new feature is implemented, Antigravity should ask:

### Data

What Spotify data does this feature require?

### API

Which current Spotify endpoint provides it?

### Query

Should this use TanStack Query?

### Mutation

Does this change Spotify/application data?

### State

Does it need Zustand or can server/query state handle it?

### Component

Can an existing reusable component handle it?

### Layout

Where does the feature live structurally?

### Visual

Can the visual treatment remain temporary until final design?

------------------------------------------------------------------------

# 24. EXAMPLE --- ADDING LIKED SONGS

Do NOT build the entire page as one component.

Instead:

``` text
GET /me/tracks
       ↓
getLikedTracks()
       ↓
useLikedTracks()
       ↓
LikedSongsPage
       ↓
TrackList
       ↓
TrackRow
```

The TrackRow should not know that the track came from "Liked Songs."

It should simply render a track.

This allows the same TrackRow to be reused in:

-   Search
-   Playlist
-   Album
-   Recently Played
-   Queue
-   MIX
-   Liked Songs
-   Frequencies

------------------------------------------------------------------------

# 25. EXAMPLE --- SEARCH

Architecture:

``` text
SearchBar
    ↓
useSearch(query)
    ↓
searchSpotify()
    ↓
Spotify proxy
```

Results:

``` text
SearchResults
   ├── TrackSearchResult
   ├── ArtistSearchResult
   ├── AlbumSearchResult
   └── PlaylistSearchResult
```

These should reuse the common:

-   TrackRow
-   ArtistCard
-   AlbumCard
-   PlaylistCard

where practical.

Do not create completely separate visual implementations of the same
entities.

------------------------------------------------------------------------

# 26. EXAMPLE --- QUEUE

Architecture:

``` text
useQueue()
    ↓
QueuePanel
    ↓
QueueList
    ↓
QueueItem
```

QueueItem can reuse TrackRow primitives where appropriate, but should
not be forced into the exact same layout if queue-specific controls
require a different presentation.

Reuse data behavior, not blindly every pixel.

------------------------------------------------------------------------

# 27. MEMORIES ARCHITECTURE

Memories are application-specific.

Keep them completely separate from Spotify data.

Example:

``` text
lib/memories/
├── memory-service.ts
└── memory-types.ts

hooks/
└── useMemories.ts

components/memories/
├── MemoryCard.tsx
├── MemoryPanel.tsx
└── MemoryEditor.tsx
```

A memory can reference:

``` ts
spotifyUri
```

but should not modify the Spotify track itself.

This separation will keep the birthday-specific functionality clean.

------------------------------------------------------------------------

# 28. VIBES ARCHITECTURE

Vibes are also application-specific.

Do not force Spotify to store vibe metadata.

Use application data:

``` ts
type Vibe = {
  id: string;
  name: string;
  description?: string;
  playlistIds: string[];
  artwork?: string;
};
```

Then:

``` text
Vibe
 ↓
playlist IDs
 ↓
Spotify playlists
```

This lets the custom VIBES system evolve independently.

------------------------------------------------------------------------

# 29. WHAT NOT TO ABSTRACT

Do not create abstractions just because they are theoretically reusable.

Avoid:

``` text
UniversalCard
UniversalEntity
UniversalDataHook
UniversalManager
UniversalService
```

if they don't provide real value.

Prefer small, obvious abstractions:

``` text
TrackRow
AlbumCard
ArtistCard
PlaylistCard
Section
Modal
Drawer
```

Readable code is more important than maximum abstraction.

------------------------------------------------------------------------

# 30. STATE MANAGEMENT RULE

Use:

### TanStack Query

For:

-   Spotify API data
-   server/cache state
-   playlists
-   tracks
-   albums
-   artists
-   search results
-   queue
-   recently played

Use:

### Zustand

For:

-   current playback state
-   player/device state
-   transient client-side UI state where appropriate

Use:

### Local React state

For:

-   search input
-   modal open/closed
-   temporary form fields
-   hover state
-   local UI interactions

Do not put everything into Zustand.

------------------------------------------------------------------------

# 31. PERFORMANCE RULE

Reusable architecture must not create excessive rendering.

Use:

-   query caching
-   stable props
-   memoization only where profiling justifies it
-   virtualization only for genuinely large lists
-   lazy loading for heavy sections where useful

Do not optimize prematurely.

Correctness first.

------------------------------------------------------------------------

# 32. TESTING RULE

Whenever a shared component changes, test every major location where it
is used.

For example, changing TrackRow should be checked in:

-   Search
-   Playlist
-   Album
-   Library
-   Queue
-   Recently Played
-   MIX

Shared components are powerful but changes can have wide impact.

------------------------------------------------------------------------

# 33. FINAL DESIGN PHASE

Once functionality is complete, the architecture should allow us to
redesign the application without rewriting:

-   Spotify API calls
-   query hooks
-   player logic
-   authentication
-   mutations
-   domain data
-   routing logic

The final design phase should primarily modify:

``` text
layout
styling
composition
animation
visual hierarchy
navigation presentation
```

not the underlying Spotify integration.

------------------------------------------------------------------------

# 34. ANTIGRAVITY WORKFLOW

When given this document:

DO NOT implement everything immediately.

For each implementation session:

1.  Inspect the current repository.
2.  Identify existing components that can be reused.
3.  Identify missing architecture needed for the current feature.
4.  Implement only the required foundation.
5.  Keep existing functionality working.
6.  Test the affected feature.
7.  Check for regressions.
8.  Report what changed.
9.  STOP.

Do not jump ahead to unrelated architecture.

------------------------------------------------------------------------

# 35. SUCCESS CRITERIA

The architecture is successful if, at the end:

### Adding a new Spotify feature

does NOT require rewriting the player.

### Redesigning the UI

does NOT require rewriting Spotify API calls.

### Changing the sidebar

does NOT require changing page logic.

### Changing TrackRow styling

does NOT require changing track-fetching logic.

### Adding a new place where tracks appear

can reuse:

``` text
TrackRow
TrackList
PlayButton
TrackActions
```

### Adding birthday-specific functionality

does NOT require modifying Spotify's data model.

------------------------------------------------------------------------

# 36. FINAL PRINCIPLE

Build the application like this:

``` text
FUNCTIONAL CORE
       ↓
CLEAN DATA LAYER
       ↓
REUSABLE DOMAIN COMPONENTS
       ↓
STABLE LAYOUT SYSTEM
       ↓
PERSONAL FEATURES
       ↓
FINAL VISUAL DESIGN
```

The architecture should disappear underneath the experience.

The user should only see:

> "This feels like a music app that was made specifically for me."
