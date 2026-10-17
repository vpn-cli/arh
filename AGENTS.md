<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Performance Rules
- No new features, state or JSX in SpotifyPlayerUI.tsx. New features get their own component or hook file, and own their own state.
- No component file over 400 lines.
- Playback position never goes in React state.
- An effect must not depend on a value that the effect itself updates.
- Position or animate with transform and opacity only. No blur or will-change on elements that are off screen.
- Never claim a performance result that was not measured on a production build.
- No arbitrary text-[Npx] sizes in Music World. Use defined type tokens (caption, meta, body, title, heading, display).

# World Rules
- **Home World Freeze Rule**: `src/components/worlds/HomeWorld.tsx` and `src/components/worlds/home/*` are strictly FROZEN. Do NOT modify, refactor, or edit any Home World content, copy, layout, or styles ever again.

# FROZEN — Do Not Modify: Main World "The Edit"
The following files comprise "The Edit" cinema video experience and are strictly **FROZEN**. Any modification, refactoring, re-encoding, media swapping, or styling change requires the owner's **explicit approval in the conversation first**.

### Frozen Files List:
1. `src/components/worlds/main/TheEdit.tsx`
2. `src/components/worlds/main/TheEditControls.tsx`
3. `src/components/worlds/main/TheEditTvHardware.tsx`
4. `src/components/worlds/main/TheEditEndCard.tsx`
5. `src/components/worlds/main/TheEditHelloKitty.tsx`
6. `src/components/worlds/main/fullscreenUtils.ts`
7. `src/components/worlds/main/__tests__/theEditFullscreen.test.tsx`
8. `public/videos/arh_vid_final.mp4` (SHA-256: `1c88b1bea228f2d005d1eb8d439737f37e3287a9c8ed0ff342895eebc2e967ae`)
9. `public/images/ar.jpeg` (SHA-256: `7451eee8d0665fb1da8689339f4574a01f33dc7fc28d9df031831547f9c4c10c`)

### Enforcement Rules:
- **No Unsolicited Modifications**: Any change requires explicit owner approval in the conversation first.
- **Global Changes Must Skip These Files**: Global updates across the project (custom cursors, CSS utilities/tokens, sound effects, audio systems, wide refactors, or automated lint cleanups) MUST skip these files. If a global change would affect The Edit, STOP and ask the owner before proceeding.
- **Automated Check**: Pre-commit hooks, pre-push hooks, and CI run `npm run check:frozen` to guarantee these files and checksums are never modified. The only bypass is setting `ALLOW_FROZEN=1` with explicit owner consent.
