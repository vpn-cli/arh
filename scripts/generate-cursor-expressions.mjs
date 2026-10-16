/**
 * ============================================================================
 * HELLO KITTY CURSOR FRAME GENERATOR
 * ============================================================================
 *
 * HOW THIS SCRIPT WORKS:
 * 1. Checks `public/hampter/cursor/source/kitty_<name>.png` for hand-drawn PNGs.
 *    If present, it trims all transparent padding and resizes the artwork to
 *    the standard 96x69 px asset dimensions (3x resolution of the 40x29 px
 *    active cursor display).
 * 2. If a hand-drawn PNG is NOT provided for a given expression, it falls back
 *    to generating a tight-cropped SVG eye overlay atop the enamel base pin.
 * 3. Exports optimized WebP and PNG fallback files into `public/hampter/cursor/`.
 *
 * CANVAS & DRAWING SPECIFICATIONS:
 * - Recommended Canvas: Any resolution with ~1.39:1 aspect ratio (e.g. 502x358,
 *   736x526, or 1004x716) on a TRANSPARENT background.
 * - Ear Apex Alignment: Keep the tip of the left ear touching or closest to
 *   the top-left corner so the hotspot at (6, 1) on the 40px display lines up
 *   accurately with the user's click point.
 * - File Names in `public/hampter/cursor/source/`:
 *     - kitty_default.png  (standard open-eye idle)
 *     - kitty_blink.png    (closed-eye blink)
 *     - kitty_happy.png    (curved "^ ^" celebration / music vibes)
 *     - kitty_squeeze.png  (pressed "> <" active click)
 *     - kitty_sleepy.png   (droopy eyes after 8s idle)
 *     - kitty_dizzy.png    (swirly "@ @" during loading warp)
 *     - kitty_peel.png     (side-eye for sticker peeling)
 *
 * HOW TO RE-RUN:
 *   node scripts/generate-cursor-expressions.mjs
 * ============================================================================
 */

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_PIN = "public/hampter/hello_kitty_pin.png";
const CUSTOM_SOURCE_DIR = "public/hampter/cursor/source";
const OUTPUT_DIR = "public/hampter/cursor";

// Target width = 96. Target height = Math.round(96 * 358 / 502) = 69.
// Export at 96x69 px (tight crop to head, zero transparent padding).
const TARGET_W = 96;
const TARGET_H = 69;

// Scaled eye centers on 96x69 canvas for programmatic fallback:
// Left eye: cx = 27.2, cy = 43.8
// Right eye: cx = 68.4, cy = 44.0
const whiteEyelidPatch = `
  <ellipse cx="27.2" cy="43.8" rx="5.2" ry="4.8" fill="#FFFFFF" />
  <ellipse cx="68.4" cy="44.0" rx="5.2" ry="4.8" fill="#FFFFFF" />
`;

const FALLBACK_EXPRESSIONS = {
  default: "", // standard open eyes from base image
  blink: `
    ${whiteEyelidPatch}
    <line x1="22.5" y1="43.8" x2="32.0" y2="43.8" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
    <line x1="63.5" y1="44.0" x2="73.5" y2="44.0" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
  `,
  happy: `
    ${whiteEyelidPatch}
    <path d="M 22.5 46.5 Q 27.2 40.0 32.0 46.5" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" />
    <path d="M 63.5 46.7 Q 68.4 40.2 73.5 46.7" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" />
  `,
  squeeze: `
    ${whiteEyelidPatch}
    <path d="M 24.0 40.5 L 29.5 43.8 L 24.0 47.2" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 71.5 40.5 L 66.0 44.0 L 71.5 47.2" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
  `,
  sleepy: `
    ${whiteEyelidPatch}
    <path d="M 22.5 41.8 Q 27.2 47.8 32.0 41.8" fill="none" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
    <path d="M 63.5 42.0 Q 68.4 48.0 73.5 42.0" fill="none" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
  `,
  dizzy: `
    ${whiteEyelidPatch}
    <path d="M 27.2 43.8 m -4.5 0 a 4.5 4.5 0 1 0 9 0 a 3 3 0 1 0 -6 0 a 1.5 1.5 0 1 0 3 0" fill="none" stroke="#20233F" stroke-width="2.0" stroke-linecap="round" />
    <path d="M 68.4 44.0 m -4.5 0 a 4.5 4.5 0 1 0 9 0 a 3 3 0 1 0 -6 0 a 1.5 1.5 0 1 0 3 0" fill="none" stroke="#20233F" stroke-width="2.0" stroke-linecap="round" />
  `,
  peel: `
    ${whiteEyelidPatch}
    <ellipse cx="29.2" cy="43.8" rx="3.0" ry="4.2" fill="#20233F" />
    <ellipse cx="70.4" cy="44.0" rx="3.0" ry="4.2" fill="#20233F" />
  `,
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generate() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CUSTOM_SOURCE_DIR, { recursive: true });

  // 1. Prepare base buffer from the primary enamel pin
  const baseBuffer = await sharp(SOURCE_PIN)
    .trim()
    .resize(TARGET_W, TARGET_H, { fit: "fill" })
    .png()
    .toBuffer();

  for (const [name, svgContent] of Object.entries(FALLBACK_EXPRESSIONS)) {
    const customSourcePath = path.join(CUSTOM_SOURCE_DIR, `kitty_${name}.png`);
    const hasCustomSource = await fileExists(customSourcePath);

    let pipeline;

    if (hasCustomSource) {
      console.log(`[Custom Hand-Drawn Frame] Found ${customSourcePath} -> cropping & resizing`);
      pipeline = sharp(customSourcePath)
        .trim()
        .resize(TARGET_W, TARGET_H, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
    } else {
      // Programmatic SVG fallback composite over base trimmed enamel head
      pipeline = sharp(baseBuffer);
      if (svgContent) {
        const svgOverlay = Buffer.from(`
          <svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
            ${svgContent}
          </svg>
        `);

        pipeline = pipeline.composite([
          {
            input: svgOverlay,
            top: 0,
            left: 0,
          },
        ]);
      }
    }

    const pngOutPath = path.join(OUTPUT_DIR, `kitty_${name}.png`);
    const webpOutPath = path.join(OUTPUT_DIR, `kitty_${name}.webp`);

    await pipeline.clone().png({ quality: 95 }).toFile(pngOutPath);
    await pipeline.clone().webp({ quality: 95, lossless: false }).toFile(webpOutPath);

    console.log(`✓ Exported tight-cropped kitty_${name}.webp and .png (${TARGET_W}x${TARGET_H})`);
  }
}

generate().catch((err) => {
  console.error("Error generating cursor expressions:", err);
  process.exit(1);
});
