import { HeroStickerItem, StickerTier } from "./heroStickers";
import { TIER_MULTIPLIERS } from "./stickerStyles";

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface GridCell {
  col: number;
  row: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  quadrant: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  isCenterBlocked: boolean;
}

export interface PlacedSticker {
  id: string;
  sticker: HeroStickerItem;
  x: number; // center x (px)
  y: number; // center y (px)
  size: number; // display size (px)
  rotation: number; // rotation (deg)
  visible: boolean;
  tier: StickerTier;
  cellCol?: number;
  cellRow?: number;
}

/**
 * Deterministic PRNG using Mulberry32 algorithm.
 * Same seed = exactly the same sequence across all page loads and refreshes.
 */
export function createPRNG(seed = 0x4d61616869) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function intersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

export function computeOverlapFraction(a: BoundingBox, b: BoundingBox): number {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const overlapArea = overlapX * overlapY;
  if (overlapArea <= 0) return 0;
  const minArea = Math.min(a.width * a.height, b.width * b.height);
  return minArea > 0 ? overlapArea / minArea : 0;
}

export function areCellsAdjacent(c1: GridCell, c2: GridCell): boolean {
  return Math.abs(c1.col - c2.col) <= 1 && Math.abs(c1.row - c2.row) <= 1;
}

/**
 * Determines whether a grid cell belongs to the center block corridor.
 * Intermediate column bands (15–35% and 65–85%) that merely touch the outer padding edge
 * are kept available for placement; the collision pass handles precise nudging.
 */
export function isCellCenterBlocked(cellBox: BoundingBox, centerPadded: BoundingBox): boolean {
  if (!intersects(cellBox, centerPadded)) return false;

  const overlapX = Math.max(0, Math.min(cellBox.right, centerPadded.right) - Math.max(cellBox.left, centerPadded.left));
  const overlapY = Math.max(0, Math.min(cellBox.bottom, centerPadded.bottom) - Math.max(cellBox.top, centerPadded.top));

  const overlapFracX = overlapX / cellBox.width;
  const overlapFracY = overlapY / cellBox.height;

  const cx = cellBox.left + cellBox.width / 2;
  const cy = cellBox.top + cellBox.height / 2;

  const centerInside =
    cx >= centerPadded.left &&
    cx <= centerPadded.right &&
    cy >= centerPadded.top &&
    cy <= centerPadded.bottom;

  return centerInside || (overlapFracX >= 0.35 && overlapFracY >= 0.35);
}

export interface GridLayoutResult {
  cols: number;
  rows: number;
  totalCells: number;
  blockedCells: Array<{ col: number; row: number }>;
  availableCells: Array<{ col: number; row: number }>;
  placedStickers: PlacedSticker[];
  hiddenStickers: string[];
}

/**
 * Computes deterministic jittered-grid sticker placements across the viewport.
 */
export function computeStickerLayout(
  containerWidth: number,
  containerHeight: number,
  centerRect: BoundingBox | null,
  stickers: HeroStickerItem[],
  seed = 0x4d61616869
): GridLayoutResult {
  const prng = createPRNG(seed);

  // ─── 1. MOBILE RESPONSIVE FALLBACK (< 768px) ───
  if (containerWidth < 768) {
    const mobilePlaced: PlacedSticker[] = stickers
      .filter((s) => s.showOnMobile)
      .map((s) => {
        const mx = ((s.mobileX ?? s.x) / 100) * containerWidth;
        const my = ((s.mobileY ?? s.y) / 100) * containerHeight;
        const size = s.mobileSize ?? Math.min(s.size, 64);
        return {
          id: s.id,
          sticker: s,
          x: Math.round(mx),
          y: Math.round(my),
          size,
          rotation: s.rotation,
          visible: true,
          tier: s.tier,
        };
      });

    return {
      cols: 0,
      rows: 0,
      totalCells: 0,
      blockedCells: [],
      availableCells: [],
      placedStickers: mobilePlaced,
      hiddenStickers: [],
    };
  }

  // ─── 2. GRID DIMENSIONS ───
  let cols = 6;
  let rows = 4;
  let sizeScale = 1.0;

  if (containerWidth >= 1280) {
    cols = 6;
    rows = 4;
  } else if (containerWidth >= 1024) {
    cols = 5;
    rows = 4;
  } else {
    // 768px – 1023px (Tablet): 4×4 grid, sizes ×0.8
    cols = 4;
    rows = 4;
    sizeScale = 0.8;
  }

  const cellWidth = containerWidth / cols;
  const cellHeight = containerHeight / rows;

  // ─── 3. CENTER BLOCK + 40px CLEAR ZONE ───
  const centerPad = 40;
  let centerPadded: BoundingBox;
  if (centerRect && centerRect.width > 0 && centerRect.height > 0) {
    centerPadded = {
      left: Math.max(0, centerRect.left - centerPad),
      top: Math.max(0, centerRect.top - centerPad),
      right: Math.min(containerWidth, centerRect.right + centerPad),
      bottom: Math.min(containerHeight, centerRect.bottom + centerPad),
      width: 0,
      height: 0,
    };
  } else {
    // Default fallback center block (max-w-lg 512px centered, y roughly 22% to 78%)
    const defaultCenterW = Math.min(520, containerWidth * 0.45);
    const defaultLeft = (containerWidth - defaultCenterW) / 2;
    const defaultTop = containerHeight * 0.22;
    const defaultBottom = containerHeight * 0.78;
    centerPadded = {
      left: defaultLeft - centerPad,
      top: defaultTop - centerPad,
      right: defaultLeft + defaultCenterW + centerPad,
      bottom: defaultBottom + centerPad,
      width: defaultCenterW + centerPad * 2,
      height: defaultBottom - defaultTop + centerPad * 2,
    };
  }
  centerPadded.width = centerPadded.right - centerPadded.left;
  centerPadded.height = centerPadded.bottom - centerPadded.top;

  // ─── 4. BUILD CELLS & IDENTIFY CENTER BLOCKED CELLS ───
  const cells: GridCell[] = [];
  const blockedCells: Array<{ col: number; row: number }> = [];
  const availableCells: GridCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = c * cellWidth;
      const top = r * cellHeight;
      const right = left + cellWidth;
      const bottom = top + cellHeight;

      let quadrant: GridCell["quadrant"] = "top-left";
      if (c < cols / 2 && r < rows / 2) quadrant = "top-left";
      else if (c >= cols / 2 && r < rows / 2) quadrant = "top-right";
      else if (c < cols / 2 && r >= rows / 2) quadrant = "bottom-left";
      else quadrant = "bottom-right";

      const cellBox: BoundingBox = {
        left,
        top,
        right,
        bottom,
        width: cellWidth,
        height: cellHeight,
      };

      const overlapsCenter = isCellCenterBlocked(cellBox, centerPadded);
      const cell: GridCell = {
        col: c,
        row: r,
        left,
        top,
        right,
        bottom,
        width: cellWidth,
        height: cellHeight,
        quadrant,
        isCenterBlocked: overlapsCenter,
      };

      cells.push(cell);
      if (overlapsCenter) {
        blockedCells.push({ col: c, row: r });
      } else {
        availableCells.push(cell);
      }
    }
  }

  // ─── 5. UI OBSTACLE RECTS (NAV PILLS & NAV DOTS) ───
  const navPillLeft: BoundingBox = {
    left: 0,
    top: 0,
    right: 185,
    bottom: 68,
    width: 185,
    height: 68,
  };
  const navPillRight: BoundingBox = {
    left: containerWidth - 185,
    top: 0,
    right: containerWidth,
    bottom: 68,
    width: 185,
    height: 68,
  };
  const navDotsRight: BoundingBox = {
    left: containerWidth - 50,
    top: containerHeight * 0.35,
    right: containerWidth,
    bottom: containerHeight * 0.65,
    width: 50,
    height: containerHeight * 0.3,
  };

  // ─── 6. ASSIGN STICKERS TO AVAILABLE CELLS WITH VARIETY & QUADRANT SPREAD ───
  const freeCells = [...availableCells];

  function takeCell(predicate: (c: GridCell) => boolean): GridCell | undefined {
    const idx = freeCells.findIndex(predicate);
    if (idx !== -1) {
      return freeCells.splice(idx, 1)[0];
    }
    return undefined;
  }

  const assignedPairs: Array<{ sticker: HeroStickerItem; cell: GridCell }> = [];
  const placedStickers: PlacedSticker[] = [];
  const hiddenStickers: string[] = [];

  // A. Place 3 FRONT characters in DIFFERENT quadrants
  const shinchan = stickers.find((s) => s.id === "shinchan-featured");
  const snoopy = stickers.find((s) => s.id === "snoopy-sleeping");
  const helloKitty = stickers.find((s) => s.id === "hello-kitty-peeking");

  // Shin-chan in bottom-left
  if (shinchan) {
    const cell =
      takeCell((c) => c.quadrant === "bottom-left" && c.row === rows - 1) ||
      takeCell((c) => c.quadrant === "bottom-left") ||
      freeCells.shift();
    if (cell) assignedPairs.push({ sticker: shinchan, cell });
  }

  // Snoopy in top-right
  if (snoopy) {
    const cell =
      takeCell((c) => c.quadrant === "top-right" && c.row <= 1) ||
      takeCell((c) => c.quadrant === "top-right") ||
      freeCells.shift();
    if (cell) assignedPairs.push({ sticker: snoopy, cell });
  }

  // Hello Kitty in top-left (or bottom-right fallback)
  if (helloKitty) {
    const cell =
      takeCell((c) => c.quadrant === "top-left" && c.row === 1) ||
      takeCell((c) => c.quadrant === "bottom-right") ||
      takeCell((c) => c.quadrant === "top-left") ||
      freeCells.shift();
    if (cell) assignedPairs.push({ sticker: helloKitty, cell });
  }

  // B. Distribute Stars across non-adjacent cells
  const stars = stickers.filter((s) => s.category === "star");
  const starCells: GridCell[] = [];
  for (const star of stars) {
    const nonAdjacent = freeCells.filter(
      (c) => !starCells.some((sc) => areCellsAdjacent(c, sc))
    );
    let chosen: GridCell | undefined;
    if (nonAdjacent.length > 0) {
      nonAdjacent.sort((a, b) => {
        if (starCells.length === 0) return 0;
        const distA = Math.min(...starCells.map((sc) => Math.hypot(a.col - sc.col, a.row - sc.row)));
        const distB = Math.min(...starCells.map((sc) => Math.hypot(b.col - sc.col, b.row - sc.row)));
        return distB - distA;
      });
      chosen = nonAdjacent[0];
      const idx = freeCells.indexOf(chosen);
      freeCells.splice(idx, 1);
    } else {
      chosen = freeCells.shift();
    }

    if (chosen) {
      starCells.push(chosen);
      assignedPairs.push({ sticker: star, cell: chosen });
    }
  }

  // C. Distribute Bows across non-adjacent cells
  const bows = stickers.filter((s) => s.category === "bow");
  const bowCells: GridCell[] = [];
  for (const bow of bows) {
    const nonAdjacent = freeCells.filter(
      (c) => !bowCells.some((bc) => areCellsAdjacent(c, bc))
    );
    let chosen: GridCell | undefined;
    if (nonAdjacent.length > 0) {
      nonAdjacent.sort((a, b) => {
        if (bowCells.length === 0) return 0;
        const distA = Math.min(...bowCells.map((bc) => Math.hypot(a.col - bc.col, a.row - bc.row)));
        const distB = Math.min(...bowCells.map((bc) => Math.hypot(b.col - bc.col, b.row - bc.row)));
        return distB - distA;
      });
      chosen = nonAdjacent[0];
      const idx = freeCells.indexOf(chosen);
      freeCells.splice(idx, 1);
    } else {
      chosen = freeCells.shift();
    }

    if (chosen) {
      bowCells.push(chosen);
      assignedPairs.push({ sticker: bow, cell: chosen });
    }
  }

  // D. Distribute remaining stickers across remaining cells
  const remainingStickers = stickers.filter(
    (s) =>
      s.id !== "shinchan-featured" &&
      s.id !== "snoopy-sleeping" &&
      s.id !== "hello-kitty-peeking" &&
      s.category !== "star" &&
      s.category !== "bow"
  );

  // Deterministically sort freeCells by column interleaving to ensure edge and intermediate bands are populated
  freeCells.sort((a, b) => {
    const colOrder = [1, 4, 0, 5, 2, 3]; // priority: 15-35%, 65-85%, edges, center
    const orderA = colOrder.indexOf(a.col);
    const orderB = colOrder.indexOf(b.col);
    if (orderA !== orderB) return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
    return a.row - b.row;
  });

  for (const item of remainingStickers) {
    const cell = freeCells.shift();
    if (cell) {
      assignedPairs.push({ sticker: item, cell });
    } else {
      hiddenStickers.push(item.id);
      placedStickers.push({
        id: item.id,
        sticker: item,
        x: -9999,
        y: -9999,
        size: 0,
        rotation: 0,
        visible: false,
        tier: item.tier,
      });
    }
  }

  // ─── 7. JITTER, ROTATE, & COLLISION PASS ───
  for (const { sticker, cell } of assignedPairs) {
    const tier = sticker.tier;
    const tierCfg = TIER_MULTIPLIERS[tier];
    const finalSize = Math.round(sticker.size * tierCfg.sizeMultiplier * sizeScale);

    // Seeded jitter within cell (±25% of cell width & height)
    const jitterX = (prng() * 2 - 1) * 0.25 * cell.width;
    const jitterY = (prng() * 2 - 1) * 0.25 * cell.height;

    // Seeded rotation between -12° and +12°
    const rotation = Math.round((-12 + prng() * 24) * 10) / 10;

    let posX = (cell.col + 0.5) * cellWidth + jitterX;
    let posY = (cell.row + 0.5) * cellHeight + jitterY;

    // Shin-chan special clearance: keep speech bubble inside viewport
    if (sticker.id === "shinchan-featured") {
      const halfW = finalSize / 2;
      const halfH = finalSize / 2;
      // Speech bubble is -top-7 (-28px) and -right-8 (+32px)
      if (posY - halfH - 32 < 12) posY = halfH + 44;
      if (posY + halfH > containerHeight - 12) posY = containerHeight - halfH - 12;
      if (posX + halfW + 38 > containerWidth - 12) posX = containerWidth - halfW - 48;
      if (posX - halfW < 12) posX = halfW + 12;
    }

    // Collision check helper
    const testCollision = (cx: number, cy: number): boolean => {
      const box: BoundingBox = {
        left: cx - finalSize / 2,
        top: cy - finalSize / 2,
        right: cx + finalSize / 2,
        bottom: cy + finalSize / 2,
        width: finalSize,
        height: finalSize,
      };

      // Collision with center block (+40px)
      if (intersects(box, centerPadded)) return true;

      // Collision with nav pills
      if (intersects(box, navPillLeft) || intersects(box, navPillRight)) return true;

      // Collision with nav dots
      if (intersects(box, navDotsRight)) return true;

      // Check overlap with previously placed stickers (>15% overlap)
      for (const other of placedStickers) {
        if (!other.visible) continue;
        const otherBox: BoundingBox = {
          left: other.x - other.size / 2,
          top: other.y - other.size / 2,
          right: other.x + other.size / 2,
          bottom: other.y + other.size / 2,
          width: other.size,
          height: other.size,
        };
        if (computeOverlapFraction(box, otherBox) > 0.15) {
          return true;
        }
      }

      return false;
    };

    // If initial position collides, attempt nudging within cell
    let isColliding = testCollision(posX, posY);
    if (isColliding) {
      const nudgeOffsets: Array<[number, number]> = [
        [0, -20],
        [0, 20],
        [-25, 0],
        [25, 0],
        [-25, -20],
        [25, -20],
        [-25, 20],
        [25, 20],
        [-40, 0],
        [40, 0],
        [0, -40],
        [0, 40],
        [-50, 0],
        [50, 0],
      ];

      for (const [dx, dy] of nudgeOffsets) {
        const nudgedX = posX + dx;
        const nudgedY = posY + dy;
        // Verify nudged position remains inside cell bounds
        if (
          nudgedX >= cell.left &&
          nudgedX <= cell.right &&
          nudgedY >= cell.top &&
          nudgedY <= cell.bottom
        ) {
          if (!testCollision(nudgedX, nudgedY)) {
            posX = nudgedX;
            posY = nudgedY;
            isColliding = false;
            break;
          }
        }
      }
    }

    if (isColliding) {
      hiddenStickers.push(sticker.id);
      placedStickers.push({
        id: sticker.id,
        sticker,
        x: posX,
        y: posY,
        size: finalSize,
        rotation,
        visible: false,
        tier,
        cellCol: cell.col,
        cellRow: cell.row,
      });
    } else {
      placedStickers.push({
        id: sticker.id,
        sticker,
        x: Math.round(posX),
        y: Math.round(posY),
        size: finalSize,
        rotation,
        visible: true,
        tier,
        cellCol: cell.col,
        cellRow: cell.row,
      });
    }
  }

  return {
    cols,
    rows,
    totalCells: cols * rows,
    blockedCells,
    availableCells: availableCells.map((c) => ({ col: c.col, row: c.row })),
    placedStickers,
    hiddenStickers,
  };
}
