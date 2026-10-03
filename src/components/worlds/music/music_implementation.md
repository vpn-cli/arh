# KAWAII PLAYER — IMPLEMENTATION PLAN

## 0. PROJECT GOAL

This project is a private, personal Spotify client made as a birthday gift for one friend.

The goal is NOT to recreate Spotify feature-for-feature.

The goal is:

> Build a beautiful, highly personalized music environment that she can actually use as her everyday Spotify interface.

The application should eventually feel like:

"Spotify, but this entire interface was made specifically for her."

The current visual identity is already established:
- KAWAII_PLAYER.EXE
- pink scrapbook / indie-game aesthetic
- cute personal UI
- vinyl player
- playlists
- custom navigation
- birthday-gift atmosphere

DO NOT redesign the application from scratch.

DO NOT replace the existing visual identity.

The current playback/authentication architecture is already functional and must be preserved.

---

# 1. CURRENT FUNCTIONALITY — DO NOT BREAK

The following functionality already works and should be treated as stable infrastructure:

- Spotify OAuth login
- OAuth token refresh
- Spotify Web Playback SDK
- Browser playback device
- Playlist loading
- Playlist playback
- Individual track playback
- Play
- Pause
- Previous
- Next
- Seek
- Zustand player state
- TanStack Query
- Next.js Spotify proxy
- Redis caching
- Saved-track status
- Save / unsave tracks using the current Spotify library API

IMPORTANT:

Before implementing any new feature, understand the existing architecture.

Do not rewrite the authentication or playback architecture unless a concrete bug requires it.

Do not introduce WebSockets.

Do not introduce unnecessary polling.

Do not create a second Spotify.Player instance.

There must remain one authoritative playback instance.

---

# 2. DEVELOPMENT PRINCIPLE

Every feature must follow this lifecycle:

1. Inspect existing implementation.
2. Identify existing reusable components/hooks/API utilities.
3. Design the smallest required architecture.
4. Implement backend/API layer.
5. Implement state/query layer.
6. Implement UI functionality.
7. Test actual Spotify interaction.
8. Test loading/error/empty states.
9. Test that existing playback still works.
10. Only then move to the next feature.

Do NOT implement 10 features simultaneously.

Each phase should leave the application in a working state.

---

# 3. DESIGN STRATEGY

Do NOT perform the final visual redesign yet.

However, while implementing functionality, establish:

- reusable layout containers
- reusable cards
- reusable track rows
- reusable album cards
- reusable artist cards
- reusable playlist cards
- page headers
- section headers
- modal/drawer primitives
- loading states
- empty states
- error states
- navigation slots
- responsive containers

The current visual styling can remain approximately as-is.

The final visual pass will happen AFTER the functional architecture is complete.

Important:

Build components so their visual presentation can later be changed without rewriting their data logic.

Separate:

DATA
↓
STATE
↓
DOMAIN COMPONENTS
↓
LAYOUT
↓
VISUAL STYLING

Do not mix Spotify API logic directly into decorative UI components.

---

# 4. PRODUCT INFORMATION ARCHITECTURE

Eventually the application should contain these conceptual areas:

## PLAYLISTS

The user's Spotify playlists.

## MIX

Personalized home/dashboard.

Possible sections:

- Continue Listening
- Recently Played
- Recently Played Playlists
- Liked Songs
- Frequently Played
- Quick Play
- Recently Added

## SEARCH

Global Spotify search.

Search:

- Tracks
- Artists
- Albums
- Playlists

Potentially:

- Shows
- Episodes
- Audiobooks

Only implement additional content types if they are actually useful.

## LIBRARY

Personal saved content:

- Liked Songs
- Saved Albums
- Followed Artists
- Saved Playlists

## QUEUE

Current playback queue:

- Now Playing
- Up Next
- Add to Queue
- Play Next
- Remove where supported

## VIBES

A custom presentation layer over her existing music.

Examples:

- gym
- late night
- comfort
- crying
- party
- study
- sunshine
- romantic
- etc.

This should eventually feel custom to her rather than like a Spotify clone.

## FREQUENCIES

Personal listening information:

- Top Artists
- Top Tracks
- Time ranges
- Listening patterns

## MEMORIES

The unique birthday layer.

This is NOT Spotify functionality.

It is application-specific metadata attached to Spotify objects.

Example:

{
  "spotifyUri": "spotify:track:...",
  "memory": "...",
  "date": "...",
  "type": "memory"
}

This allows personal messages, memories, notes, etc. to exist around songs without modifying Spotify content.

---

# 5. PHASE 0 — FOUNDATION AUDIT

Before adding anything:

Audit the entire application.

Create a short internal report containing:

- current route structure
- current component structure
- Zustand stores
- TanStack Query hooks
- Spotify API abstraction
- proxy architecture
- authentication flow
- player architecture
- Redis usage
- reusable UI components
- existing technical debt
- existing duplicated logic
- API endpoints currently used
- deprecated Spotify endpoints still present

Search the entire repository for deprecated Spotify API patterns.

Especially check for:

/me/tracks/contains
/me/tracks
/me/albums
/me/following
/playlists/{id}/tracks
/users/{id}/playlists
/tracks?ids=
/albums?ids=
/artists?ids=
/artists/{id}/top-tracks
/browse/new-releases
/browse/categories

Do NOT blindly replace working functionality.

Identify exactly where each endpoint is used and migrate only where necessary.

Create:

docs/SPOTIFY_API_AUDIT.md

---

# 6. PHASE 1 — PLAYER HARDENING

Before adding major features, make the existing player extremely reliable.

Verify:

- play
- pause
- next
- previous
- seek
- shuffle
- repeat
- volume
- track switching
- playlist playback
- browser refresh
- expired access token
- token refresh
- playback after token refresh
- player ready state
- player not ready state
- network failure
- Spotify API failure

Add proper UI states:

- Loading
- Playing
- Paused
- Buffering
- No device
- Authentication expired
- Playback unavailable
- Generic error

Do not add visual polish yet.

Deliverable:

PLAYER_STABLE = TRUE

---

# 7. PHASE 2 — LIKED SONGS / LIBRARY

Implement a proper Library section.

Required:

### Liked Songs

Fetch:

GET /me/tracks

Implement:

- pagination
- track rows
- play track
- play from here
- unlike
- like
- loading state
- empty state
- error state

Saved-state checking should use:

GET /me/library/contains

Save:

PUT /me/library

Remove:

DELETE /me/library

Use Spotify URIs.

Do NOT use the old entity-specific save/remove/contains endpoints.

Also implement:

### Saved Albums

GET /me/albums

### Followed Artists

GET /me/following?type=artist

Only if the current OAuth scopes support them.

Do not add unnecessary requests.

Cache query results appropriately.

---

# 8. PHASE 3 — SEARCH

Implement global search.

Search types:

- track
- artist
- album
- playlist

UX:

User types:

"tame impala"

↓

debounced request

↓

results grouped by type

↓

click result

↓

open/play appropriate content

Search must support pagination.

IMPORTANT:

Current Spotify API search limit is max 10 per type.

Do not request limit > 10.

Use offset pagination.

Do not assume old Spotify search limits from tutorials.

Implement:

- debounce
- query caching
- pagination
- loading skeleton
- empty result state
- error state
- keyboard interaction
- clear search
- recent searches if useful

Do not build the final search visual design yet.

Create reusable:

SearchResult
TrackResult
ArtistResult
AlbumResult
PlaylistResult

---

# 9. PHASE 4 — PLAYLIST DETAIL

Clicking a playlist should open a proper playlist detail view.

Display:

- cover
- title
- description
- track count
- owner where available
- tracks
- duration where available

Actions:

- Play
- Shuffle
- Add to Queue
- Save/follow where applicable
- individual track play
- like/unlike
- add track to another playlist

Use:

GET /playlists/{id}

GET /playlists/{id}/items

IMPORTANT:

Do not use the deprecated:

/playlists/{id}/tracks

Spotify's current API uses:

/playlists/{id}/items

Also account for the current playlist response shape:

items.items.item

Do not assume:

tracks.tracks.track

---

# 10. PHASE 5 — ALBUM PAGES

Implement album detail.

Display:

- album artwork
- album title
- artist
- release information where available
- tracks

Actions:

- play album
- shuffle album
- play individual track
- save album
- unsave album

Use:

GET /albums/{id}

GET /albums/{id}/tracks

GET /me/library/contains

PUT /me/library

DELETE /me/library

Create reusable album components.

---

# 11. PHASE 6 — ARTIST PAGES

Implement artist detail pages.

Display:

- artist image
- artist name
- albums
- singles where available

Use:

GET /artists/{id}

GET /artists/{id}/albums

Do NOT build the application around:

/artists/{id}/top-tracks

That endpoint was removed from the current Development Mode API.

If we want an "essential tracks" section, derive it from currently available data rather than depending on the removed endpoint.

---

# 12. PHASE 7 — QUEUE

Implement a proper queue interface.

Fetch:

GET /me/player/queue

Add:

POST /me/player/queue

Support:

- current item
- next items
- add to queue
- play next
- queue refresh
- loading state
- empty state

Queue actions should integrate with the existing player.

Do not create a separate playback engine.

The Spotify player remains the source of truth.

---

# 13. PHASE 8 — PLAYLIST MANAGEMENT

Only after playlist playback and playlist detail are stable.

Implement:

### Create playlist

POST /me/playlists

### Update playlist

PUT /playlists/{id}

Support:

- rename
- description
- visibility if appropriate

### Add items

POST /playlists/{id}/items

### Remove items

DELETE /playlists/{id}/items

### Reorder / replace

PUT /playlists/{id}/items

Create reusable actions:

- Add to playlist
- Remove from playlist
- Create playlist
- Add to new playlist

UI can use a modal/drawer.

Do not overcomplicate the interface.

---

# 14. PHASE 9 — RECENTLY PLAYED

Implement:

GET /me/player/recently-played

Requires:

user-read-recently-played

Use it for:

MIX → Recently Played

Features:

- click to play
- play all
- display recently played tracks
- deduplicate where appropriate

Do not continuously poll this endpoint.

Fetch when the MIX page is opened/refreshed and cache it.

---

# 15. PHASE 10 — MIX

Now build the personalized home experience.

MIX should become the default "home" environment.

Suggested structure:

MIX

--------------------------------

Good evening, [name]

Continue Listening

[track cards]

Recently Played

[track rows]

Your Liked Songs

[playlist/card]

Your Playlists

[playlist cards]

Top Artists

[artist cards]

Quick Play

[actions]

--------------------------------

Do not make this generic Spotify Home.

It should be personalized to the specific friend.

Avoid unnecessary recommendation APIs.

Use data we already have:

- playlists
- liked songs
- recently played
- top tracks
- top artists

---

# 16. PHASE 11 — FREQUENCIES

Implement the personal statistics area.

Use:

GET /me/top/artists

GET /me/top/tracks

Support time ranges where available.

Potential UI:

FREQUENCIES

Top Artists
[artist cards]

Top Tracks
[track rows]

Time Range:
4 weeks / 6 months / all time

Do NOT fabricate statistics.

Do not show fake "minutes listened" unless we actually have enough data to calculate it reliably.

Avoid pretending Spotify provides data that it does not provide.

---

# 17. PHASE 12 — VIBES

This is where the project starts becoming unique.

VIBES should be an application-level presentation of her music.

Do not create an elaborate recommendation engine.

Instead initially allow:

playlist → vibe

Example:

ENGLISH GYM SONGS
→ ENERGY

TIMELESS CANDLELIGHT
→ ROMANTIC

PARTY
→ CHAOS

etc.

The mapping can initially be local application metadata.

Example:

{
  playlistId: "...",
  vibe: "energy",
  label: "MAIN CHARACTER ENERGY",
  description: "...",
  artwork: "..."
}

Then build a custom VIBES interface.

This layer should not alter Spotify data.

---

# 18. PHASE 13 — MEMORIES

This is the birthday-specific feature.

Create a separate application data model.

Example:

Memory:

{
  id,
  spotifyUri,
  type,
  title,
  message,
  createdAt
}

Possible types:

- memory
- note
- birthday
- inside joke
- dedication

Example:

Track:
"Song Name"

MEMORY

"This song reminds me of..."

The Spotify track remains untouched.

The memory belongs to this application.

Important:

Do not synchronize visual effects to the Spotify audio itself.

Memories should be user-triggered UI experiences, not audio-reactive overlays.

---

# 19. PHASE 14 — NAVIGATION RESTRUCTURE

Only after the core functionality exists.

Current navigation can then evolve into:

PLAYLISTS
MIX
SEARCH
LIBRARY
QUEUE

and potentially:

VIBES
FREQUENCIES
MEMORIES

Do not force every feature into the sidebar.

Some can be:

- modal
- drawer
- contextual page
- player overlay

Determine this based on actual usage after functionality exists.

---

# 20. PHASE 15 — FINAL UX / VISUAL REDESIGN

NOW perform the major design pass.

Do not change the functionality.

Only improve:

- hierarchy
- spacing
- typography
- colors
- decorative elements
- animation
- transitions
- cards
- navigation
- responsive layout
- empty states
- loading states
- player placement
- artwork treatment
- micro-interactions

Preserve the existing KAWAII_PLAYER.EXE identity.

The final design should feel:

- personal
- cute
- nostalgic
- polished
- slightly game-like
- scrapbook-like
- intentionally designed

Avoid making it look like a generic AI-generated dashboard.

---

# 21. RESPONSIVE DESIGN

Do not leave mobile responsiveness until the end.

During every feature:

- desktop
- tablet
- narrow desktop
- mobile

must remain structurally usable.

However:

DO NOT perform final responsive visual polish until Phase 15.

---

# 22. PERFORMANCE RULES

Avoid unnecessary Spotify API requests.

Rules:

1. Cache stable metadata.
2. Do not poll continuously unless absolutely required.
3. Use player SDK events instead of repeatedly requesting playback state.
4. Deduplicate identical queries.
5. Use TanStack Query caching.
6. Use Redis only as an optimization.
7. Redis failure must never break Spotify functionality.
8. Never request large amounts of data unnecessarily.
9. Respect current Spotify endpoint limits.
10. Avoid fetching the same track metadata repeatedly.

---

# 23. ERROR HANDLING

Every feature must handle:

Loading
Empty
Success
Error
Unauthorized
Token refresh
Spotify unavailable

Errors should be user-friendly.

Never expose:

- access tokens
- refresh tokens
- client secrets
- internal Spotify errors unnecessarily

---

# 24. TESTING REQUIREMENT

After each phase:

### Functional test

Verify the feature manually.

### Regression test

Verify:

- current track still plays
- pause still works
- next still works
- previous still works
- seek still works
- playlist playback still works
- authentication still works

### Network test

Check:

- status codes
- unnecessary repeated requests
- deprecated endpoints
- failed requests
- duplicate requests

### Console test

No unexpected errors.

---

# 25. GIT / IMPLEMENTATION DISCIPLINE

Implement one phase at a time.

After each completed phase:

1. Test it.
2. Fix bugs.
3. Refactor only if necessary.
4. Commit the working state.

Suggested commits:

feat(player): harden playback
feat(library): add liked songs
feat(search): add global search
feat(playlists): add playlist detail
feat(albums): add album pages
feat(artists): add artist pages
feat(queue): add playback queue
feat(playlists): add playlist management
feat(history): add recently played
feat(mix): add personalized dashboard
feat(frequencies): add listening statistics
feat(vibes): add vibe system
feat(memories): add personal memories
feat(ui): restructure navigation
feat(ui): final visual polish

---

# 26. IMPORTANT — DO NOT DO THESE

Do NOT:

- rewrite working authentication
- create a second playback system
- introduce WebSockets
- introduce unnecessary polling
- use deprecated Spotify endpoints
- use old Spotify tutorials without checking current API behavior
- build fake Spotify statistics
- build a fake recommendation engine
- overengineer the backend
- redesign the entire UI after every feature
- create unnecessary abstractions
- add features merely because Spotify has them

This is a personal music application.

Prioritize usefulness and personality over feature count.

---

# 27. IMPLEMENTATION ORDER

The exact order is:

PHASE 0
Foundation Audit

↓

PHASE 1
Player Hardening

↓

PHASE 2
Library / Liked Songs

↓

PHASE 3
Search

↓

PHASE 4
Playlist Detail

↓

PHASE 5
Album Pages

↓

PHASE 6
Artist Pages

↓

PHASE 7
Queue

↓

PHASE 8
Playlist Management

↓

PHASE 9
Recently Played

↓

PHASE 10
MIX

↓

PHASE 11
FREQUENCIES

↓

PHASE 12
VIBES

↓

PHASE 13
MEMORIES

↓

PHASE 14
Navigation Restructure

↓

PHASE 15
Final UX + Visual Redesign

↓

PHASE 16
Final QA + Performance + Polish

---

# 28. RULE FOR ANTIGRAVITY

DO NOT IMPLEMENT THE ENTIRE PLAN IN ONE REQUEST.

At the beginning of each implementation session:

1. Identify the current phase.
2. Inspect the existing code.
3. Implement only that phase.
4. Test it.
5. Report:
   - files changed
   - APIs added/changed
   - components added
   - tests performed
   - issues found
   - remaining work

Then STOP.

Wait for approval before moving to the next phase.
