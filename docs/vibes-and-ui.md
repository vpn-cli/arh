# Vibes Section + UI Polish Plan

Status: planning
Last updated: 2026-10-08

## 0. Do this first — it decides Phase 1

Run against our actual client ID:
GET /v1/recommendations?seed_genres=pop&limit=1
GET /v1/audio-features/{any_track_id}

Spotify deprecated both endpoints for apps created after 2024-11-27. A 200
means we have access and the dynamic path is open. A 403 means we take the
static path below. Do not plan around either until this is answered.

**Result: ________** (fill in before starting)

---

## Phase 1 — Vibes routing + data source

### Bug to fix first
Clicking an individual vibe card routes to the Vibes section index instead of
that vibe's playlist. The click handler receives the section route rather than
the item id. Fix the handler and check whether the same one is reused elsewhere
with the same defect.

### Data source — pick based on the curl above

**Path A (default, assume this one): static map.**
Hardcode one Spotify playlist ID per vibe in a single config file:

```ts
// src/config/vibes.ts
export const VIBES = [
  { id: 'gym',   label: 'Gym',   playlistId: '...', emoji: '💪' },
  { id: 'sleep', label: 'Sleep', playlistId: '...', emoji: '🌙' },
  // ...
] as const;
```

Zero API risk, never breaks on deprecation, and for a personal project we
already know which playlists we mean. Fill the IDs by hand.

**Path B (only if `/recommendations` returned 200): seeded generation.**
Map each vibe to seed genres plus target energy/valence, call
`/recommendations`, cache the result per vibe for the session. Keep the static
map as fallback for when the call fails.

**Path C (if we want it personal later, no API risk):**
Pull the user's saved tracks, fetch artist genres, cluster genres into vibes.
More work. Defer unless Path A feels too static after using it.

### Fallback for both paths
If a vibe's playlist ID is missing or the fetch fails, fall back to
`GET /v1/search?q={vibe} playlist&type=playlist` and take the first result.
Never render an empty vibe card.

---

## Phase 2 — Section hierarchy

The three card rows (Continue Listening, Vibes, Recently Played) currently
render identical cards, so the page reads as three repeats with no signal of
what matters.

**Do not build new card components.** Add a `size` variant to the existing one:

| Section | Variant | Shape | Art |
|---|---|---|---|
| Continue Listening | `large` | current size | 2×2 collage (4+ tracks) |
| Vibes | `small` | square, smaller | single image + label overlay |
| Recently Played | `compact` | smaller, denser | single image |

Vibes being square and single-image is what stops it reading as "more
playlists" — different shape carries the different meaning without a new
design system.

---

## Phase 3 — Polish (cheap, high perceived value)

1. **Card hover state.** Play button fades in on hover. Single most
   "finished product" detail available and costs almost nothing.
2. **Hero banner.** "Let's listen together" takes a lot of vertical space for
   one button. Either reduce its height, or make it contextual — show the last
   played playlist with a resume action.
3. **Empty states.** Recently Played and Queue with no items should say
   something in the kawaii voice, not render blank.

---

## Constraints (apply to all phases)

- No redesign. Same palette, same spacing, same component library.
- Palette variables stay on `document.documentElement`; secondary surfaces
  keep the `color-mix` tint approach already implemented.
- Album art keeps the size-variant rules: 64px for list rows, 300px for cards,
  never the 640px original.
- New images below the fold must be lazy-loaded.
- No new dependencies.

## Out of scope

- Audio-reactive visuals (impossible — Spotify SDK audio is DRM-protected,
  see `docs/player-stack.md`)
- Any change to the progress bar implementation
- Any change to the palette crossfade implementation