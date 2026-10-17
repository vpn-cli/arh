import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import HeroStickerBomb from "../HeroStickerBomb";
import { HERO_STICKERS } from "../heroStickers";
import {
  TIER_MULTIPLIERS,
  getStickerStyle,
} from "../stickerStyles";
import {
  computeStickerLayout,
  areCellsAdjacent,
  BoundingBox,
} from "../stickerGrid";

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

describe("heroStickers config", () => {
  it("contains exactly 19 placed stickers", () => {
    expect(HERO_STICKERS).toHaveLength(19);
  });

  it("ensures all stickers have base sizes within 80px to 140px", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.size).toBeGreaterThanOrEqual(80);
      expect(sticker.size).toBeLessThanOrEqual(140);
    }
  });

  it("does not reference excluded stickers (lipstick kiss, fingerprint heart)", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.src).not.toContain("red-lipstick-kiss");
      expect(sticker.src).not.toContain("fingerprint-heart");
    }
  });

  it("ensures every sticker file exists in public/stickers/**", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.src.startsWith("/stickers/")).toBe(true);
      const relativePath = sticker.src.replace(/^\//, "");
      const fullPath = path.join(process.cwd(), "public", relativePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it("keeps all sticker rotations within -15° to +15°", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.rotation).toBeGreaterThanOrEqual(-15);
      expect(sticker.rotation).toBeLessThanOrEqual(15);
    }
  });

  it("assigns calmer motion parameters (7-12s duration, 2-4px amplitude, +-1 deg rotation)", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.depth).toBeGreaterThanOrEqual(0.2);
      expect(sticker.depth).toBeLessThanOrEqual(1.0);

      const durationSec = parseFloat(sticker.floatDuration);
      expect(durationSec).toBeGreaterThanOrEqual(7.0);
      expect(durationSec).toBeLessThanOrEqual(12.0);

      expect(sticker.floatDistance).toBeGreaterThanOrEqual(2);
      expect(sticker.floatDistance).toBeLessThanOrEqual(4);

      expect(sticker.floatRotation).toBeGreaterThanOrEqual(-1.0);
      expect(sticker.floatRotation).toBeLessThanOrEqual(1.0);
    }
  });

  it("configures depth tiers correctly and restricts FRONT to exactly 3 characters", () => {
    const frontStickers = HERO_STICKERS.filter((s) => s.tier === "front");
    expect(frontStickers).toHaveLength(3);
    const frontIds = frontStickers.map((s) => s.id).sort();
    expect(frontIds).toEqual(["hello-kitty-peeking", "shinchan-featured", "snoopy-sleeping"].sort());

    for (const s of frontStickers) {
      expect(s.depth).toBeGreaterThanOrEqual(0.8);
      expect(s.floatDistance).toBe(4);
    }

    const heavyDarkIds = [
      "vinyl-record",
      "full-moon",
      "coca-cola-can",
      "spiderman-mask",
      "billiard-ball-7",
      "canon-camera",
      "electric-guitar",
      "headphones-with-bows",
    ];

    for (const id of heavyDarkIds) {
      const sticker = HERO_STICKERS.find((s) => s.id === id);
      expect(sticker?.tier).not.toBe("front");
      expect(sticker?.tier === "back" || sticker?.tier === "mid").toBe(true);
    }
  });

  it("gives Shin-chan a featured spot with namaste ji speech bubble and emoji", () => {
    const shinchan = HERO_STICKERS.find((s) => s.id === "shinchan-featured");
    expect(shinchan).toBeDefined();
    expect(shinchan?.size).toBeGreaterThanOrEqual(120);
    expect(shinchan?.hasSpeechBubble).toBe(true);
    expect(shinchan?.bubbleText).toBe("namaste ji");
    expect(shinchan?.bubbleEmoji).toBe("🙏");
  });

  it("configures exactly 7 stickers on mobile (6 small ones <= 64px + Shin-chan)", () => {
    const mobileStickers = HERO_STICKERS.filter((s) => s.showOnMobile);
    expect(mobileStickers).toHaveLength(7);

    const nonShinchan = mobileStickers.filter((s) => s.id !== "shinchan-featured");
    expect(nonShinchan).toHaveLength(6);
    for (const s of nonShinchan) {
      const mobSize = s.mobileSize ?? s.size;
      expect(mobSize).toBeLessThanOrEqual(64);
    }
  });
});

describe("stickerGrid jittered-grid layout engine", () => {
  it("uses 6x4 grid on desktop (>=1280px) and creates deterministic output", () => {
    const res1 = computeStickerLayout(1920, 1080, null, HERO_STICKERS, 0x4d61616869);
    const res2 = computeStickerLayout(1920, 1080, null, HERO_STICKERS, 0x4d61616869);

    expect(res1.cols).toBe(6);
    expect(res1.rows).toBe(4);
    expect(res1.totalCells).toBe(24);
    expect(res1.placedStickers).toEqual(res2.placedStickers);
  });

  it("uses 5x4 grid on compact desktop (1024-1279px)", () => {
    const res = computeStickerLayout(1150, 750, null, HERO_STICKERS);
    expect(res.cols).toBe(5);
    expect(res.rows).toBe(4);
    expect(res.totalCells).toBe(20);
  });

  it("uses 4x4 grid on tablet (768-1023px) with sizes scaled by 0.8", () => {
    const res = computeStickerLayout(820, 1000, null, HERO_STICKERS);
    expect(res.cols).toBe(4);
    expect(res.rows).toBe(4);
    expect(res.totalCells).toBe(16);

    const desktopRes = computeStickerLayout(1920, 1080, null, HERO_STICKERS);
    const deskShin = desktopRes.placedStickers.find((s) => s.id === "shinchan-featured");
    const tabShin = res.placedStickers.find((s) => s.id === "shinchan-featured");

    expect(tabShin?.size).toBe(Math.round((deskShin?.size ?? 150) * 0.8));
  });

  it("falls back to mobile corner/edge placement under 768px", () => {
    const res = computeStickerLayout(375, 812, null, HERO_STICKERS);
    expect(res.cols).toBe(0);
    expect(res.rows).toBe(0);
    expect(res.placedStickers.length).toBe(7);

    for (const item of res.placedStickers) {
      expect(item.visible).toBe(true);
      if (item.id !== "shinchan-featured") {
        expect(item.size).toBeLessThanOrEqual(64);
      }
    }
  });

  it("places the 3 FRONT characters in different quadrants", () => {
    const res = computeStickerLayout(1920, 1080, null, HERO_STICKERS);
    const shinchan = res.placedStickers.find((s) => s.id === "shinchan-featured");
    const snoopy = res.placedStickers.find((s) => s.id === "snoopy-sleeping");
    const helloKitty = res.placedStickers.find((s) => s.id === "hello-kitty-peeking");

    expect(shinchan?.visible).toBe(true);
    expect(snoopy?.visible).toBe(true);
    expect(helloKitty?.visible).toBe(true);

    const getQuadrant = (x: number, y: number, w: number, h: number) => {
      const isLeft = x < w / 2;
      const isTop = y < h / 2;
      return `${isTop ? "top" : "bottom"}-${isLeft ? "left" : "right"}`;
    };

    const qShin = getQuadrant(shinchan!.x, shinchan!.y, 1920, 1080);
    const qSnoop = getQuadrant(snoopy!.x, snoopy!.y, 1920, 1080);
    const qKitty = getQuadrant(helloKitty!.x, helloKitty!.y, 1920, 1080);

    expect(new Set([qShin, qSnoop, qKitty]).size).toBe(3);
  });

  it("ensures no two stars or bows occupy adjacent grid cells", () => {
    const res = computeStickerLayout(1920, 1080, null, HERO_STICKERS);

    const starPlaced = res.placedStickers.filter(
      (s) => s.visible && s.sticker.category === "star" && s.cellCol !== undefined && s.cellRow !== undefined
    );
    for (let i = 0; i < starPlaced.length; i++) {
      for (let j = i + 1; j < starPlaced.length; j++) {
        const c1 = { col: starPlaced[i].cellCol!, row: starPlaced[i].cellRow! } as any;
        const c2 = { col: starPlaced[j].cellCol!, row: starPlaced[j].cellRow! } as any;
        expect(areCellsAdjacent(c1, c2)).toBe(false);
      }
    }

    const bowPlaced = res.placedStickers.filter(
      (s) => s.visible && s.sticker.category === "bow" && s.cellCol !== undefined && s.cellRow !== undefined
    );
    for (let i = 0; i < bowPlaced.length; i++) {
      for (let j = i + 1; j < bowPlaced.length; j++) {
        const c1 = { col: bowPlaced[i].cellCol!, row: bowPlaced[i].cellRow! } as any;
        const c2 = { col: bowPlaced[j].cellCol!, row: bowPlaced[j].cellRow! } as any;
        expect(areCellsAdjacent(c1, c2)).toBe(false);
      }
    }
  });

  it("populates the 15-35% and 65-85% bands (no empty vertical strips)", () => {
    const res = computeStickerLayout(1920, 1080, null, HERO_STICKERS);

    const leftBand = res.placedStickers.filter(
      (s) => s.visible && s.x >= 1920 * 0.15 && s.x <= 1920 * 0.35
    );
    const rightBand = res.placedStickers.filter(
      (s) => s.visible && s.x >= 1920 * 0.65 && s.x <= 1920 * 0.85
    );

    expect(leftBand.length).toBeGreaterThan(0);
    expect(rightBand.length).toBeGreaterThan(0);
  });

  it("keeps Shin-chan's speech bubble inside viewport boundaries", () => {
    const res = computeStickerLayout(1920, 1080, null, HERO_STICKERS);
    const shinchan = res.placedStickers.find((s) => s.id === "shinchan-featured")!;

    const bubbleTop = shinchan.y - shinchan.size / 2 - 28;
    const bubbleRight = shinchan.x + shinchan.size / 2 + 32;

    expect(bubbleTop).toBeGreaterThanOrEqual(0);
    expect(bubbleRight).toBeLessThanOrEqual(1920);
    expect(shinchan.x - shinchan.size / 2).toBeGreaterThanOrEqual(0);
    expect(shinchan.y + shinchan.size / 2).toBeLessThanOrEqual(1080);
  });

  it("marks center block cells as blocked and avoids collision with center block", () => {
    const centerRect: BoundingBox = {
      left: 704,
      top: 250,
      right: 1216,
      bottom: 750,
      width: 512,
      height: 500,
    };
    const res = computeStickerLayout(1920, 1080, centerRect, HERO_STICKERS);
    expect(res.blockedCells.length).toBeGreaterThan(0);

    // Verify no visible sticker collides with centerRect + 40px
    const centerPadded: BoundingBox = {
      left: centerRect.left - 40,
      top: centerRect.top - 40,
      right: centerRect.right + 40,
      bottom: centerRect.bottom + 40,
      width: centerRect.width + 80,
      height: centerRect.height + 80,
    };

    for (const placed of res.placedStickers) {
      if (!placed.visible) continue;
      const stickerBox: BoundingBox = {
        left: placed.x - placed.size / 2,
        top: placed.y - placed.size / 2,
        right: placed.x + placed.size / 2,
        bottom: placed.y + placed.size / 2,
        width: placed.size,
        height: placed.size,
      };

      const intersectsCenter = !(
        stickerBox.right <= centerPadded.left ||
        stickerBox.left >= centerPadded.right ||
        stickerBox.bottom <= centerPadded.top ||
        stickerBox.top >= centerPadded.bottom
      );
      expect(intersectsCenter).toBe(false);
    }
  });
});

describe("HeroStickerBomb Component", () => {
  it("renders with aria-hidden, pointer-events-none container, and peel cursors", () => {
    render(<HeroStickerBomb />);

    const container = screen.getByTestId("hero-sticker-bomb");
    expect(container.getAttribute("aria-hidden")).toBe("true");
    expect(container.className).toContain("pointer-events-none");

    const peelElements = container.querySelectorAll('[data-cursor="peel"]');
    expect(peelElements.length).toBeGreaterThan(12);

    for (const el of peelElements) {
      expect(el.className).toContain("pointer-events-auto");
      const img = el.querySelector("img");
      expect(img).toBeDefined();
      expect(img?.getAttribute("alt")).toBe("");
      expect(el.querySelector(".hero-sticker-pack-filter")).toBeDefined();
    }
  });

  it("renders Shin-chan's speech bubble with separate emoji span", () => {
    render(<HeroStickerBomb />);
    expect(screen.getByText("namaste ji")).toBeDefined();
    expect(screen.getByText("🙏")).toBeDefined();
  });

  it("applies Preset A locked-in tier styling with updated multipliers", () => {
    render(<HeroStickerBomb />);

    // Test a BACK sticker (e.g. red-star-large-2: depth 0.3)
    const starContainer = screen.getByTestId("hero-sticker-red-star-large-2");
    const starImg = starContainer.querySelector("img");
    expect(starImg?.style.opacity).toBe("0.5");
    expect(starImg?.style.filter).toContain("blur(0.6px)");
    expect(starImg?.style.filter).toContain("drop-shadow(-3px 0 0");
    expect(starImg?.style.filter).toContain("saturate(0.6)");

    // Test a MID sticker (e.g. bunny-headphones: depth 0.6)
    const bunnyContainer = screen.getByTestId("hero-sticker-bunny-headphones");
    const bunnyImg = bunnyContainer.querySelector("img");
    expect(bunnyImg?.style.opacity).toBe("0.7");
    expect(bunnyImg?.style.filter).not.toContain("blur");
    expect(bunnyImg?.style.filter).toContain("saturate(0.75)");

    // Test a FRONT sticker (e.g. shinchan-featured: depth 0.9)
    const shinchanContainer = screen.getByTestId("hero-sticker-shinchan-featured");
    const shinchanImg = shinchanContainer.querySelector("img");
    expect(shinchanImg?.style.opacity).toBe("0.85");
    expect(shinchanImg?.style.filter).not.toContain("blur");
    expect(shinchanImg?.style.filter).toContain("saturate(0.8)");
  });

  it("verifies tier multiplier constants", () => {
    expect(TIER_MULTIPLIERS.back.sizeMultiplier).toBe(0.85);
    expect(TIER_MULTIPLIERS.back.opacity).toBe(0.5);
    expect(TIER_MULTIPLIERS.back.blurPx).toBe(0.6);
    expect(TIER_MULTIPLIERS.back.saturate).toBe(0.6);
    expect(TIER_MULTIPLIERS.back.floatDistance).toBe(2);

    expect(TIER_MULTIPLIERS.mid.sizeMultiplier).toBe(1.0);
    expect(TIER_MULTIPLIERS.mid.opacity).toBe(0.7);
    expect(TIER_MULTIPLIERS.mid.blurPx).toBe(0);
    expect(TIER_MULTIPLIERS.mid.saturate).toBe(0.75);
    expect(TIER_MULTIPLIERS.mid.floatDistance).toBe(3);

    expect(TIER_MULTIPLIERS.front.sizeMultiplier).toBe(1.15);
    expect(TIER_MULTIPLIERS.front.opacity).toBe(0.85);
    expect(TIER_MULTIPLIERS.front.blurPx).toBe(0);
    expect(TIER_MULTIPLIERS.front.saturate).toBe(0.8);
    expect(TIER_MULTIPLIERS.front.floatDistance).toBe(4);
  });
});
