# Player Stack — ROI Assessment & Build Order

Status: planning
Last updated: 2026-10-07

## 0. Blocking constraints (read before estimating anything)

### Spotify playback is gated three ways
- **Premium only.** Free accounts cannot use the Web Playback SDK at all.
- **DRM/Widevine.** Playback runs through EME. Fails in Electron, flaky in
  some mobile browsers, no reliable iOS background audio.
- **No audio stream access.** The decrypted audio never reaches the Web Audio
  graph. `AnalyserNode`, `MediaElementSource`, AudioWorklet — all unavailable.

**Implication:** we need a non-Premium visitor path from day one, not as a
polish item. Design for it now: album art + metadata + "open in Spotify" is a
perfectly good degraded state if it looks intentional.

### Verify before committing to any beat-sync work
Spotify deprecated `audio-features` / `audio-analysis` for apps created after
2024-11-27. Test with our actual client ID against a known track:
`GET /v1/audio-analysis/{id}` — 200 or 403 decides whether beat-accurate
visuals are on the table.

---

## Tier 1 — Do now

| Item | Why it's first |
|---|---|
| **GSAP (core + Flip)** | Highest visual payoff per hour of anything here. Flip is free as of GSAP's Webflow acquisition, so playlist↔now-playing morphing costs us nothing but implementation time. |
| **Album-art color extraction** | Transforms the whole screen from one 3KB dependency. Biggest perceived-effort-to-actual-effort ratio in the table. |
| **Playback state machine** | Unglamorous and unavoidable. Everything below depends on a trustworthy `playing / paused / loading / no-premium / error` state. |

### Changes to make

**GSAP**
- Install `gsap`. Register plugins once in a client-only module, not per component.
- Build a shared timeline for the vinyl: spin tied to `isPlaying`, not a loop
  we start and stop. Use `timeScale(0)` to pause so it resumes at the same
  rotation instead of snapping.
- Respect `prefers-reduced-motion` at the GSAP global level
  (`gsap.ticker` / matchMedia) rather than per-animation.

**Color extraction — do it server-side**
- Do **not** run Color Thief in the browser. It needs canvas pixel access on a
  cross-origin image, and it blocks the main thread during a transition.
- Add `GET /api/album-palette?id={albumId}` using `node-vibrant` or `sharp`.
  Fetch the 64px Spotify art variant, extract, return hex values.
- Cache aggressively — palette for an album never changes. Upstash (already
  installed) keyed by album ID, or just `revalidate: false` on the route.
- Apply via CSS custom properties on a wrapper, transitioned in CSS. Then the
  color change is free and GSAP doesn't need to know about it.

**next/image — one config gotcha**
- Add `i.scdn.co` to `images.remotePatterns` or every album art 500s.
- Consider `unoptimized` for album art specifically. Spotify already serves
  640/300/64 variants, so Vercel's optimizer adds a billable transformation
  per unique album for zero gain. Keep optimization for our own assets.

---

## Tier 2 — High ROI, once Tier 1 ships

**GSAP Flip for playlist ↔ now-playing**
The single most "expensive-looking" interaction available to us and it's
mostly declarative. Worth doing properly: capture state before the DOM change,
`Flip.from` after, and let it handle the rest. Don't hand-animate this.

**Reactive visuals, without audio analysis**
Since FFT is off the table, drive "reactive" effects from what we *can* read:
- `player.getCurrentState()` gives position in ms. Poll at ~1s, interpolate
  with `requestAnimationFrame` between polls for smooth progress.
- Pulse/bounce effects run on a fixed tempo rather than detected beats. For an
  indie-game aesthetic this reads as stylized, not broken — a steady
  8-bit-style bob doesn't claim to be beat-matched.
- **Only if `audio-analysis` returns 200 for us:** fetch beat timestamps once
  per track, build a GSAP timeline seeded with them, and scrub it against
  playback position. This is better than live FFT would have been — it's
  precomputed, zero CPU, and survives tab throttling. Treat it as a bonus,
  not a dependency.

**Pixel/canvas interactive layer**
Scope it to one well-executed element (the deck, the tonearm, a single
mascot-ish sprite). A cohesive small set beats a scattered large one. Canvas
only if we exceed ~50 animated nodes; below that, SVG + GSAP is simpler to
debug and gets us accessibility for free.

---

## Tier 3 — Conditional, decide later

**Lenis** — cheap to add, but if we use ScrollTrigger it must be driven from
`gsap.ticker` or scroll position and animation desync. Only worth it if we
actually build a long scrolling "world." Not for a single-screen player.

**Rive *or* Lottie — pick one, never both.** Two animation runtimes for
decorative content is pure bundle waste. Rive wins if the mascot reacts to
state (playing/paused/skipped); Lottie wins if the animations are fire-and-
forget loops. If Rive, prefer it and drop Lottie entirely. If Lottie, use
`dotlottie` rather than the full `lottie-web`.

---

## Tier 4 — Cut

**React Three Fiber.** A spinning vinyl with a tonearm is a CSS 3D transform
problem, not a WebGL one. R3F + three costs us a large bundle, a second
rendering model to reason about, and SSR friction, to render something
`transform: rotateX()` already does. Revisit only if we commit to a genuinely
dimensional scene (a room, a camera that moves).

**AudioWorklet.** Nothing to process. Remove from the roadmap.

---

## Build order

1. Spotify auth + SDK init + playback state machine (incl. no-Premium path)
2. `next/image` config + album art rendering
3. Palette route + CSS variable theming
4. GSAP setup + vinyl spin bound to playback state
5. Flip transition between playlist and now-playing
6. Progress interpolation + tempo-driven visual pulse
7. Pixel/SVG character layer
8. *(gated)* beat-timeline scrubbing if `audio-analysis` is available
9. *(optional)* Lenis, Rive

## Open questions

- [ ] Does our Spotify app have `audio-analysis` access? (one curl, do first)
- [ ] What does a non-Premium visitor see? Needs a design answer, not a fallback.
- [ ] Mobile: is the player a first-class target or desktop-first?
  SDK reliability on mobile browsers is poor enough that this changes scope.