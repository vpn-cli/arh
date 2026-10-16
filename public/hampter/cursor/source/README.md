# Hello Kitty Custom Cursor Source Frames

Place your hand-drawn expression PNGs here. When you run `node scripts/generate-cursor-expressions.mjs`, the generator will detect them, trim any transparent padding, and automatically export them to `public/hampter/cursor/` at 96×69 px (for 40×29 px display on web) in both WebP and PNG formats.

## Expected File Names
- `kitty_default.png` — Standard open-eye resting state
- `kitty_blink.png` — Closed-eye blink frame
- `kitty_happy.png` — Happy "^ ^" celebration / music vibes
- `kitty_squeeze.png` — Squeeze "> <" on click press
- `kitty_sleepy.png` — Droopy eyes after 8s idle
- `kitty_dizzy.png` — Swirly "@ @" during loading warp
- `kitty_peel.png` — Side-eye / peel badge frame

## Canvas Tips
- Transparent background (PNG).
- Any resolution with ~1.39:1 aspect ratio (e.g. 502×358, 736×526, 1004×716).
- The ear apex at top-left will line up with hotspot `(6, 1)` on the 40px display.

## How to Re-generate
```bash
node scripts/generate-cursor-expressions.mjs
```
