import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * ═══════════════════════════════════════════════════════
 * STICKER PROCESSOR & SLICER
 * ═══════════════════════════════════════════════════════
 * Slices home_stickers.jpeg sheet and cuts out namaste ji.jpeg.
 * Preserves die-cut borders & internal whites via edge flood-fill.
 * Eliminates corner intruders from adjacent stickers via connected component filtering.
 */

function colorDist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Edge flood-fill to make background transparent from borders inward.
 * Preserves all internal white/light pixels.
 * Also removes disconnected corner intruder islands from adjacent stickers.
 */
function floodFillBackground(rgbaData, width, height, isBgPixelFn, soften = true) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qHead = 0, qTail = 0;

  // Seed with all 4 outer borders
  for (let x = 0; x < width; x++) {
    if (isBgPixelFn(x, 0)) { visited[0 * width + x] = 1; queue[qTail++] = x; queue[qTail++] = 0; }
    if (isBgPixelFn(x, height - 1)) { visited[(height - 1) * width + x] = 1; queue[qTail++] = x; queue[qTail++] = height - 1; }
  }
  for (let y = 0; y < height; y++) {
    if (!visited[y * width] && isBgPixelFn(0, y)) { visited[y * width] = 1; queue[qTail++] = 0; queue[qTail++] = y; }
    if (!visited[y * width + width - 1] && isBgPixelFn(width - 1, y)) { visited[y * width + width - 1] = 1; queue[qTail++] = width - 1; queue[qTail++] = y; }
  }

  // 4-way BFS flood fill
  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    const nbs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of nbs) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && isBgPixelFn(nx, ny)) {
          visited[nIdx] = 1;
          queue[qTail++] = nx;
          queue[qTail++] = ny;
        }
      }
    }
  }

  // Set alpha = 0 for all flooded background pixels
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      rgbaData[i * 4 + 3] = 0;
    }
  }

  // ─── REMOVE ADJACENT STICKER INTRUDERS (ISLAND REMOVAL) ───
  // Find connected components among foreground pixels (alpha > 0)
  const fgVisited = new Uint8Array(width * height);
  const fgComponents = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (rgbaData[idx * 4 + 3] > 0 && !fgVisited[idx]) {
        let bHead = 0, bTail = 0;
        queue[bTail++] = x;
        queue[bTail++] = y;
        fgVisited[idx] = 1;

        let compArea = 0;
        let compMinX = x, compMaxX = x, compMinY = y, compMaxY = y;
        const compPixels = [];

        while (bHead < bTail) {
          const bx = queue[bHead++];
          const by = queue[bHead++];
          const pIdx = by * width + bx;
          compPixels.push(pIdx);
          compArea++;

          if (bx < compMinX) compMinX = bx;
          if (bx > compMaxX) compMaxX = bx;
          if (by < compMinY) compMinY = by;
          if (by > compMaxY) compMaxY = by;

          const nbs = [
            [bx + 1, by], [bx - 1, by], [bx, by + 1], [bx, by - 1],
            [bx + 1, by + 1], [bx - 1, by - 1], [bx + 1, by - 1], [bx - 1, by + 1]
          ];
          for (const [nx, ny] of nbs) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (rgbaData[nIdx * 4 + 3] > 0 && !fgVisited[nIdx]) {
                fgVisited[nIdx] = 1;
                queue[bTail++] = nx;
                queue[bTail++] = ny;
              }
            }
          }
        }

        fgComponents.push({
          area: compArea,
          pixels: compPixels,
          minX: compMinX,
          maxX: compMaxX,
          minY: compMinY,
          maxY: compMaxY,
          centerX: (compMinX + compMaxX) / 2,
          centerY: (compMinY + compMaxY) / 2
        });
      }
    }
  }

  // If multiple foreground components exist:
  // The primary sticker is the largest one near the crop center.
  // Any secondary component whose area is small (or located along the edges) is an adjacent sticker intruder.
  if (fgComponents.length > 1) {
    fgComponents.sort((a, b) => b.area - a.area);
    const primary = fgComponents[0];

    for (let c = 1; c < fgComponents.length; c++) {
      const comp = fgComponents[c];
      // If it touches the crop border or is far from center and much smaller than primary
      const touchesBorder = comp.minX === 0 || comp.maxX === width - 1 || comp.minY === 0 || comp.maxY === height - 1;
      const isMuchSmaller = comp.area < primary.area * 0.35;
      if (touchesBorder || isMuchSmaller) {
        for (const pIdx of comp.pixels) {
          rgbaData[pIdx * 4 + 3] = 0;
        }
      }
    }
  }

  // 1px edge softening on boundary
  if (soften) {
    const softenedAlpha = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) softenedAlpha[i] = rgbaData[i * 4 + 3];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (rgbaData[idx * 4 + 3] === 255) {
          let bgN = 0;
          const nbs = [
            idx - 1, idx + 1, idx - width, idx + width,
            idx - width - 1, idx - width + 1, idx + width - 1, idx + width + 1
          ];
          for (const n of nbs) {
            if (rgbaData[n * 4 + 3] === 0) bgN++;
          }
          if (bgN > 0) {
            softenedAlpha[idx] = Math.round(255 * (1 - (bgN / 12)));
          }
        }
      }
    }
    for (let i = 0; i < width * height; i++) rgbaData[i * 4 + 3] = softenedAlpha[i];
  }

  return rgbaData;
}

// Sticker specifications on home_stickers.jpeg (736 x 1308)
const SHEET_STICKERS = [
  {
    name: "snoopy-sleeping",
    category: "snoopy",
    bbox: { x1: 220, y1: 15, x2: 530, y2: 145 },
    notes: "clean — Snoopy sleeping with die-cut border preserved"
  },
  {
    name: "red-ribbon-bow",
    category: "bows-hearts",
    bbox: { x1: 15, y1: 25, x2: 225, y2: 205 },
    notes: "clean — dark red satin ribbon bow"
  },
  {
    name: "cherries",
    category: "food",
    bbox: { x1: 505, y1: 80, x2: 730, y2: 345 },
    notes: "clean — pair of red cherries with green leaves & die-cut border"
  },
  {
    name: "vintage-canon-camera",
    category: "misc",
    bbox: { x1: 235, y1: 165, x2: 495, y2: 365 },
    notes: "clean — Canon AE-1 vintage SLR camera with die-cut border"
  },
  {
    name: "full-moon",
    category: "misc",
    bbox: { x1: 30, y1: 205, x2: 195, y2: 360 },
    notes: "clean — circular full moon sticker with die-cut border"
  },
  {
    name: "red-star-large",
    category: "misc",
    bbox: { x1: 160, y1: 340, x2: 290, y2: 465 },
    notes: "clean — large red star sticker with die-cut border"
  },
  {
    name: "headphones-with-bows",
    category: "misc",
    bbox: { x1: 335, y1: 350, x2: 615, y2: 605 },
    notes: "clean — black headphones with red ribbon bows"
  },
  {
    name: "electric-guitar",
    category: "misc",
    bbox: { x1: 545, y1: 400, x2: 725, y2: 865 },
    notes: "clean — black & white electric guitar with die-cut border"
  },
  {
    name: "vinyl-record",
    category: "misc",
    bbox: { x1: 0, y1: 410, x2: 185, y2: 595 },
    notes: "clean — classic black vinyl record with red center label"
  },
  {
    name: "red-star-small",
    category: "misc",
    bbox: { x1: 230, y1: 465, x2: 330, y2: 560 },
    notes: "clean — small red star sticker with die-cut border"
  },
  {
    name: "bunny-headphones",
    category: "misc",
    bbox: { x1: 50, y1: 600, x2: 225, y2: 845 },
    notes: "clean — Miffy style plush bunny wearing black headphones"
  },
  {
    name: "hello-kitty-peeking",
    category: "hello-kitty",
    bbox: { x1: 240, y1: 605, x2: 525, y2: 835 },
    notes: "clean — Hello Kitty peeking with paws, pink bow & die-cut border"
  },
  {
    name: "billiard-ball-7",
    category: "misc",
    bbox: { x1: 270, y1: 840, x2: 485, y2: 1050 },
    notes: "clean — burgundy billiard ball with number 7"
  },
  {
    name: "fingerprint-heart",
    category: "bows-hearts",
    bbox: { x1: 15, y1: 865, x2: 270, y2: 1085 },
    notes: "clean — red textured fingerprint heart"
  },
  {
    name: "coca-cola-can",
    category: "food",
    bbox: { x1: 570, y1: 870, x2: 710, y2: 1115 },
    notes: "clean — red Coca-Cola soda can with die-cut border"
  },
  {
    name: "spiderman-mask",
    category: "misc",
    bbox: { x1: 295, y1: 1080, x2: 515, y2: 1305 },
    notes: "clean — Spider-Man round mask logo with die-cut border"
  },
  {
    name: "red-lipstick-kiss",
    category: "misc",
    bbox: { x1: 40, y1: 1115, x2: 225, y2: 1270 },
    notes: "clean — red lipstick kiss mark"
  }
];

async function processSheetStickers() {
  const sheetPath = "assets-src/home_stickers.jpeg";
  const sheetImg = sharp(sheetPath);
  const metadata = await sheetImg.metadata();
  const W = metadata.width, H = metadata.height;
  const results = [];

  for (const st of SHEET_STICKERS) {
    const pad = 10;
    const cropX = Math.max(0, st.bbox.x1 - pad);
    const cropY = Math.max(0, st.bbox.y1 - pad);
    const cropW = Math.min(W - cropX, (st.bbox.x2 - st.bbox.x1 + 1) + pad * 2);
    const cropH = Math.min(H - cropY, (st.bbox.y2 - st.bbox.y1 + 1) + pad * 2);

    const cropped = await sharp(sheetPath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Background on sheet is near-pure white (tolerance ~18)
    const isBg = (x, y) => {
      const idx = (y * cropped.info.width + x) * 4;
      const r = cropped.data[idx], g = cropped.data[idx + 1], b = cropped.data[idx + 2];
      return r >= 244 && g >= 244 && b >= 244;
    };

    const processed = floodFillBackground(cropped.data, cropped.info.width, cropped.info.height, isBg, true);

    const outDir = path.join("public/stickers", st.category);
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${st.name}.webp`);

    // Trim transparent edges, longest side <= 512px, webp quality 85
    await sharp(processed, {
      raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 }
    })
      .trim()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(outPath);

    const stat = await fs.stat(outPath);
    results.push({
      path: outPath.replace(/\\/g, "/"),
      category: st.category,
      sizeKB: (stat.size / 1024).toFixed(1),
      notes: st.notes
    });
  }

  return results;
}

async function processShinchan() {
  const srcPath = "assets-src/namaste ji.jpeg";
  const img = sharp(srcPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const results = [];

  const outDir = "public/stickers/shinchan";
  await fs.mkdir(outDir, { recursive: true });

  const isFloor = (r, g, b) => {
    return b >= 140 && b <= 210 && g >= 120 && g <= 180 && r >= 130 && r <= 190 && Math.abs(r - g) < 35;
  };

  // 1. Shin-chan with "Namaste ji" text & pink bow
  {
    const minX = 80, maxX = 415, minY = 110, maxY = 570;
    const cw = maxX - minX + 1, ch = maxY - minY + 1;

    const cropRgba = Buffer.alloc(cw * ch * 4);
    for (let cy = 0; cy < ch; cy++) {
      for (let cx = 0; cx < cw; cx++) {
        const sx = minX + cx, sy = minY + cy;
        const sIdx = (sy * W + sx) * 3;
        const dIdx = (cy * cw + cx) * 4;
        cropRgba[dIdx] = data[sIdx];
        cropRgba[dIdx + 1] = data[sIdx + 1];
        cropRgba[dIdx + 2] = data[sIdx + 2];
        cropRgba[dIdx + 3] = 255;
      }
    }

    const isTopWallOrDoor = (sx, sy, r, g, b) => {
      if (sy < 165 && sx < 200) return true; // eliminate door frame peg & corner
      if (sy < 135) return true; // wall above hair
      return false;
    };

    const isBg = (cx, cy) => {
      const idx = (cy * cw + cx) * 4;
      const r = cropRgba[idx], g = cropRgba[idx + 1], b = cropRgba[idx + 2];
      const sx = minX + cx, sy = minY + cy;
      return isFloor(r, g, b) || isTopWallOrDoor(sx, sy, r, g, b);
    };

    const processed = floodFillBackground(cropRgba, cw, ch, isBg, true);

    // Also clear isolated floor color inside letter counters (like loop of 'e')
    for (let i = 0; i < cw * ch; i++) {
      const r = processed[i * 4], g = processed[i * 4 + 1], b = processed[i * 4 + 2];
      if (isFloor(r, g, b)) {
        processed[i * 4 + 3] = 0;
      }
    }

    const outPath = path.join(outDir, "shinchan-namaste-ji.webp");
    await sharp(processed, { raw: { width: cw, height: ch, channels: 4 } })
      .trim()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(outPath);

    const stat = await fs.stat(outPath);
    results.push({
      path: outPath.replace(/\\/g, "/"),
      category: "shinchan",
      sizeKB: (stat.size / 1024).toFixed(1),
      notes: "clean — Shin-chan character with pink ribbon bow & 'Namaste ji' text"
    });
  }

  // 2. Shin-chan character only
  {
    const minX = 125, maxX = 415, minY = 110, maxY = 475;
    const cw = maxX - minX + 1, ch = maxY - minY + 1;

    const cropRgba = Buffer.alloc(cw * ch * 4);
    for (let cy = 0; cy < ch; cy++) {
      for (let cx = 0; cx < cw; cx++) {
        const sx = minX + cx, sy = minY + cy;
        const sIdx = (sy * W + sx) * 3;
        const dIdx = (cy * cw + cx) * 4;
        cropRgba[dIdx] = data[sIdx];
        cropRgba[dIdx + 1] = data[sIdx + 1];
        cropRgba[dIdx + 2] = data[sIdx + 2];
        cropRgba[dIdx + 3] = 255;
      }
    }

    const isTopWallOrDoor = (sx, sy) => {
      if (sy < 165 && sx < 200) return true;
      if (sy < 135) return true;
      return false;
    };

    const isBg = (cx, cy) => {
      const idx = (cy * cw + cx) * 4;
      const r = cropRgba[idx], g = cropRgba[idx + 1], b = cropRgba[idx + 2];
      const sx = minX + cx, sy = minY + cy;
      return isFloor(r, g, b) || isTopWallOrDoor(sx, sy);
    };

    const processed = floodFillBackground(cropRgba, cw, ch, isBg, true);

    const outPath = path.join(outDir, "shinchan-namaste.webp");
    await sharp(processed, { raw: { width: cw, height: ch, channels: 4 } })
      .trim()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(outPath);

    const stat = await fs.stat(outPath);
    results.push({
      path: outPath.replace(/\\/g, "/"),
      category: "shinchan",
      sizeKB: (stat.size / 1024).toFixed(1),
      notes: "clean — Shin-chan character alone without text or bow"
    });
  }

  return results;
}

/**
 * Generate a review contact sheet: assets-src/sticker-review.png
 * Showing every output on a checkerboard background with its filename underneath.
 */
async function generateReviewContactSheet(allOutputs) {
  const cols = 4;
  const rows = Math.ceil(allOutputs.length / cols);
  const cellW = 280;
  const cellH = 280;
  const imgBoxSize = 220;
  const sheetW = cols * cellW + 40;
  const sheetH = rows * cellH + 60;

  // Create checkerboard pattern RGBA buffer
  const bgData = Buffer.alloc(sheetW * sheetH * 4);
  const checkSize = 16;
  for (let y = 0; y < sheetH; y++) {
    for (let x = 0; x < sheetW; x++) {
      const isDark = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
      const val = isDark ? 232 : 255;
      const idx = (y * sheetW + x) * 4;
      bgData[idx] = val;
      bgData[idx + 1] = val;
      bgData[idx + 2] = val;
      bgData[idx + 3] = 255;
    }
  }

  const composites = [];

  for (let i = 0; i < allOutputs.length; i++) {
    const item = allOutputs[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellLeft = 20 + col * cellW;
    const cellTop = 30 + row * cellH;

    // Load sticker image, resize to fit within imgBoxSize
    const stickerBuffer = await sharp(item.path)
      .resize({ width: imgBoxSize, height: imgBoxSize, fit: "inside" })
      .toBuffer({ resolveWithObject: true });

    const imgLeft = cellLeft + Math.floor((cellW - stickerBuffer.info.width) / 2);
    const imgTop = cellTop + Math.floor((imgBoxSize - stickerBuffer.info.height) / 2);

    composites.push({
      input: stickerBuffer.data,
      left: imgLeft,
      top: imgTop
    });

    // Render filename caption via SVG text overlay
    const filename = path.basename(item.path);
    const svgLabel = `
      <svg width="${cellW}" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="4" width="${cellW - 20}" height="28" rx="6" fill="#20233F" opacity="0.88" />
        <text x="${cellW / 2}" y="22" font-family="monospace" font-size="11" font-weight="bold" fill="#FFEAA7" text-anchor="middle" dominant-baseline="middle">
          ${filename}
        </text>
      </svg>
    `;

    composites.push({
      input: Buffer.from(svgLabel),
      left: cellLeft,
      top: cellTop + imgBoxSize + 6
    });
  }

  const contactPath = "assets-src/sticker-review.png";
  await sharp(bgData, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .composite(composites)
    .png()
    .toFile(contactPath);

  console.log(`Generated review contact sheet at ${contactPath} (${sheetW}x${sheetH})`);
}

async function main() {
  console.log("=== Slicing home_stickers.jpeg ===");
  const sheetResults = await processSheetStickers();

  console.log("=== Processing namaste ji.jpeg ===");
  const shinchanResults = await processShinchan();

  const allResults = [...sheetResults, ...shinchanResults];

  console.log("=== Generating Contact Sheet ===");
  await generateReviewContactSheet(allResults);

  console.log("\n=== COMPLETED ALL STICKERS ===");
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
