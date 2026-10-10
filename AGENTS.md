<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

PERFORMANCE RULES
- No new features, state or JSX in SpotifyPlayerUI.tsx. New features get their
  own component or hook file, and own their own state.
- No component file over 400 lines.
- Playback position never goes in React state.
- An effect must not depend on a value that the effect itself updates.
- Position or animate with transform and opacity only. No blur or will-change
  on elements that are off screen.
- Never claim a performance result that was not measured on a production
  build.
- No arbitrary text-[Npx] sizes in Music World. Use defined type tokens
  (caption, meta, body, title, heading, display).
<!-- END:nextjs-agent-rules -->
