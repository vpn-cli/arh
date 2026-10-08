# Synced Lyrics

Status: planning
Last updated: 2026-10-08

## Source: LRCLIB

Free, no API key, no rate limit, community-contributed.
GET https://lrclib.net/api/get
?artist_name={artist}&track_name={title}&duration={seconds}


Returns `syncedLyrics` (LRC format, `[mm:ss.xx] line`) and `plainLyrics`.
404 when the track isn't in the database.

### Verified behaviour
- Synced lyrics confirmed for Elton John, Billy Joel, Olivia Rodrigo
- Matches despite `- Remastered 2014` suffixes — **no title normalization
  needed**
- Duration is fuzzy (queried 192, actual 194, still matched)

---

## Architecture

### 1. API route — `GET /api/lyrics?trackId={id}`

Server-side so we control caching and the client never calls LRCLIB directly.

- Resolve artist/title/duration from the Spotify track object
- Query LRCLIB
- Cache the result in Upstash keyed by Spotify track ID, including negative
  results (404s) with a shorter TTL so we don't re-query missing tracks on
  every play
- Return `{ synced: LrcLine[] | null, plain: string | null }`

Parse the LRC server-side into `{ time: number, text: string }[]` so the
client receives structured data, not a string to parse per render.

### 2. Timing — reuse the progress bar approach

**Do not put the current line in React state.** It would re-render the whole
player several times per line, which is the exact problem removed from the
progress bar.

Instead, in the existing `requestAnimationFrame` loop:
- Compute elapsed time from the track start timestamp (already available)
- Binary-search the lyric array for the last line with `time <= elapsed`
- If the index changed, update the active line by direct DOM mutation —
  toggle a class on the line element via refs

React re-renders only when the track changes and a new lyric set loads.

### 3. Prefetch

Fetch lyrics for the next queued track alongside the existing palette
prefetch. Same pattern, same place in the code — by the time the track
changes, lyrics are already in memory.

### 4. UI

- Panel in the now-playing area, toggled by a button near the track title
- Active line full opacity, adjacent lines dimmed, rest further dimmed
- Scroll so the active line sits around 40% from the top, using
  `scrollTo({ behavior: 'smooth' })` on index change only — not every frame
- Respect `prefers-reduced-motion`: no smooth scroll when set

### 5. States

| Condition | Behaviour |
|---|---|
| Synced lyrics found | Scrolling highlighted view |
| Plain lyrics only | Static scrollable text, no highlighting, no timer |
| Nothing found | "No lyrics for this track" in the app's voice |
| Still loading | Skeleton, not a spinner |

---

## Constraints

- No new dependencies. Parse LRC by hand — it's a regex and a split.
- No `setState` in the rAF loop.
- Lyric panel must not shift the layout when toggled.
- Never block playback on a lyrics fetch failing.

## Note on licensing

LRCLIB content is user-submitted and the copyright position on displaying
lyrics is unsettled. Fine for a personal project. Revisit before making this
public.