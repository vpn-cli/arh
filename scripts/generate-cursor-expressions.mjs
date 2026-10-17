/**
 * ============================================================================
 * HELLO KITTY CURSOR FRAME GENERATOR
 * ============================================================================
 *
 * Generates:
 * 1. 32px wide (1x) native CSS cursor PNGs: `kitty_<name>_32.png` (32x23)
 * 2. 64px wide (2x) native CSS cursor PNGs: `kitty_<name>_64.png` (64x46)
 * 3. High-res 192x137 WebP + PNG fallbacks for DOM fallback mode: `kitty_<name>.png/.webp`
 *
 * Supported native frames:
 * - default, blink, squeeze, happy, sleepy, dizzy, locked
 *
 * Hotspot (ear apex):
 * - 1x (32px): (5, 1)
 * - 2x (64px): (10, 2)
 *
 * HOW TO RUN:
 *   node scripts/generate-cursor-expressions.mjs
 * ============================================================================
 */

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_PIN = "public/hampter/hello_kitty_pin.png";
const CUSTOM_SOURCE_DIR = "public/hampter/cursor/source";
const OUTPUT_DIR = "public/hampter/cursor";

const TARGET_W = 192;
const TARGET_H = Math.round(TARGET_W * (358 / 502)); // 137
const W_1X = 32;
const H_1X = Math.round(W_1X * (358 / 502)); // 23
const W_2X = 64;
const H_2X = Math.round(W_2X * (358 / 502)); // 46

const whiteEyelidPatch = `
  <ellipse cx="27.2" cy="43.8" rx="5.2" ry="4.8" fill="#FFFFFF" />
  <ellipse cx="68.4" cy="44.0" rx="5.2" ry="4.8" fill="#FFFFFF" />
`;

const LOCK_BADGE_SVG = `
  <defs>
    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-color="#20233F" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#badge-shadow)">
    <circle cx="160" cy="107" r="23" fill="#FFF9E6" stroke="#20233F" stroke-width="3.5" />
  </g>
  <rect x="149" y="106" width="22" height="17" rx="3.5" fill="#E5B25D" stroke="#20233F" stroke-width="2.8" />
  <path d="M 153.5 106 V 100 C 153.5 95.5 166.5 95.5 166.5 100 V 106" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" />
  <circle cx="160" cy="112.5" r="2.2" fill="#20233F" />
  <polygon points="158.8,112.5 161.2,112.5 160.8,117.5 159.2,117.5" fill="#20233F" />
`;

const EXPRESSIONS = {
  default: { eyes: "", overlay: "" },
  blink: {
    eyes: `
      ${whiteEyelidPatch}
      <line x1="22.5" y1="43.8" x2="32.0" y2="43.8" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
      <line x1="63.5" y1="44.0" x2="73.5" y2="44.0" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
    `,
    overlay: "",
  },
  happy: {
    eyes: `
      ${whiteEyelidPatch}
      <path d="M 22.5 46.5 Q 27.2 40.0 32.0 46.5" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" />
      <path d="M 63.5 46.7 Q 68.4 40.2 73.5 46.7" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" />
    `,
    overlay: "",
  },
  squeeze: {
    eyes: `
      ${whiteEyelidPatch}
      <path d="M 24.0 40.5 L 29.5 43.8 L 24.0 47.2" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 71.5 40.5 L 66.0 44.0 L 71.5 47.2" fill="none" stroke="#20233F" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
    `,
    overlay: "",
  },
  sleepy: {
    eyes: `
      ${whiteEyelidPatch}
      <path d="M 22.5 41.8 Q 27.2 47.8 32.0 41.8" fill="none" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
      <path d="M 63.5 42.0 Q 68.4 48.0 73.5 42.0" fill="none" stroke="#20233F" stroke-width="2.6" stroke-linecap="round" />
    `,
    overlay: "",
  },
  dizzy: {
    eyes: `
      ${whiteEyelidPatch}
      <path d="M 27.2 43.8 m -4.5 0 a 4.5 4.5 0 1 0 9 0 a 3 3 0 1 0 -6 0 a 1.5 1.5 0 1 0 3 0" fill="none" stroke="#20233F" stroke-width="2.0" stroke-linecap="round" />
      <path d="M 68.4 44.0 m -4.5 0 a 4.5 4.5 0 1 0 9 0 a 3 3 0 1 0 -6 0 a 1.5 1.5 0 1 0 3 0" fill="none" stroke="#20233F" stroke-width="2.0" stroke-linecap="round" />
    `,
    overlay: "",
  },
  peel: {
    eyes: `
      ${whiteEyelidPatch}
      <ellipse cx="29.2" cy="43.8" rx="3.0" ry="4.2" fill="#20233F" />
      <ellipse cx="70.4" cy="44.0" rx="3.0" ry="4.2" fill="#20233F" />
    `,
    overlay: "",
  },
  locked: {
    eyes: "",
    overlay: LOCK_BADGE_SVG,
  },
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

  const baseBuffer = await sharp(SOURCE_PIN)
    .trim()
    .resize(TARGET_W, TARGET_H, { fit: "fill" })
    .png()
    .toBuffer();

  for (const [name, config] of Object.entries(EXPRESSIONS)) {
    const customSourcePath = path.join(CUSTOM_SOURCE_DIR, `kitty_${name}.png`);
    const hasCustomSource = await fileExists(customSourcePath);

    let baseImgBuffer;

    if (hasCustomSource) {
      console.log(`[Custom Hand-Drawn Frame] Found ${customSourcePath} -> cropping & resizing`);
      baseImgBuffer = await sharp(customSourcePath)
        .trim()
        .resize(TARGET_W, TARGET_H, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    } else {
      let pipeline = sharp(baseBuffer);
      const composites = [];

      if (config.eyes) {
        composites.push({
          input: Buffer.from(`
            <svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 96 69" xmlns="http://www.w3.org/2000/svg">
              ${config.eyes}
            </svg>
          `),
          top: 0,
          left: 0,
        });
      }

      if (config.overlay) {
        composites.push({
          input: Buffer.from(`
            <svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 192 137" xmlns="http://www.w3.org/2000/svg">
              ${config.overlay}
            </svg>
          `),
          top: 0,
          left: 0,
        });
      }

      if (composites.length > 0) {
        pipeline = pipeline.composite(composites);
      }
      baseImgBuffer = await pipeline.png().toBuffer();
    }

    // 1. Export High-Res 192x137 (WebP + PNG)
    const png192Path = path.join(OUTPUT_DIR, `kitty_${name}.png`);
    const webp192Path = path.join(OUTPUT_DIR, `kitty_${name}.webp`);
    await sharp(baseImgBuffer).png({ quality: 95 }).toFile(png192Path);
    await sharp(baseImgBuffer).webp({ quality: 95, lossless: false }).toFile(webp192Path);

    // 2. Export 1x (32px wide) Native CSS Cursor PNG
    const png32Path = path.join(OUTPUT_DIR, `kitty_${name}_32.png`);
    await sharp(baseImgBuffer)
      .resize(W_1X, H_1X, { fit: "fill" })
      .png({ quality: 95 })
      .toFile(png32Path);

    // 3. Export 2x (64px wide) Native CSS Cursor PNG
    const png64Path = path.join(OUTPUT_DIR, `kitty_${name}_64.png`);
    await sharp(baseImgBuffer)
      .resize(W_2X, H_2X, { fit: "fill" })
      .png({ quality: 95 })
      .toFile(png64Path);

    console.log(`✓ Exported kitty_${name} (192x137, 64x46 [2x], 32x23 [1x])`);
  }
}

generate().catch((err) => {
  console.error("Error generating cursor expressions:", err);
  process.exit(1);
});
