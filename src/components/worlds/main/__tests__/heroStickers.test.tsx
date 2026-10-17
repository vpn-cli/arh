import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import HeroStickerBomb from "../HeroStickerBomb";
import { HERO_STICKERS } from "../heroStickers";
import {
  TIER_MULTIPLIERS,
  getStickerTier,
  getStickerStyle,
} from "../stickerStyles";

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

  it("enforces a wide clear zone with no stickers in the center column (x between 15% and 84%)", () => {
    for (const sticker of HERO_STICKERS) {
      const isLeft = sticker.x <= 15;
      const isRight = sticker.x >= 85;
      expect(isLeft || isRight).toBe(true);
    }
  });

  it("gives Shin-chan a featured spot with namaste ji speech bubble and emoji", () => {
    const shinchan = HERO_STICKERS.find((s) => s.id === "shinchan-featured");
    expect(shinchan).toBeDefined();
    expect(shinchan?.size).toBeGreaterThanOrEqual(120);
    expect(shinchan?.hasSpeechBubble).toBe(true);
    expect(shinchan?.bubbleText).toBe("namaste ji");
    expect(shinchan?.bubbleEmoji).toBe("🙏");
    expect(shinchan?.x).toBeLessThan(30); // Left zone
    expect(shinchan?.y).toBeGreaterThan(65); // Lower zone
  });

  it("configures exactly 10 visible stickers on tablet", () => {
    const tabletStickers = HERO_STICKERS.filter((s) => !s.hideOnTablet);
    expect(tabletStickers).toHaveLength(10);
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

describe("HeroStickerBomb Component", () => {
  it("renders with aria-hidden, pointer-events-none container, and peel cursors", () => {
    render(<HeroStickerBomb />);

    const container = screen.getByTestId("hero-sticker-bomb");
    expect(container.getAttribute("aria-hidden")).toBe("true");
    expect(container.className).toContain("pointer-events-none");

    const peelElements = container.querySelectorAll('[data-cursor="peel"]');
    expect(peelElements.length).toBe(19);

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

  it("applies Preset A locked-in tier styling with size multipliers, opacity, and blur", () => {
    render(<HeroStickerBomb />);

    // Test a BACK sticker (e.g. vinyl-record: depth 0.3)
    const vinylContainer = screen.getByTestId("hero-sticker-vinyl-record");
    const vinylImg = vinylContainer.querySelector("img");
    expect(vinylImg?.style.opacity).toBe("0.45");
    expect(vinylImg?.style.filter).toContain("blur(1px)");
    expect(vinylImg?.style.filter).toContain("drop-shadow(-3px 0 0");
    expect(vinylImg?.style.filter).toContain("saturate(0.6)");

    // Test a MID sticker (e.g. bunny-headphones: depth 0.6)
    const bunnyContainer = screen.getByTestId("hero-sticker-bunny-headphones");
    const bunnyImg = bunnyContainer.querySelector("img");
    expect(bunnyImg?.style.opacity).toBe("0.65");
    expect(bunnyImg?.style.filter).not.toContain("blur");
    expect(bunnyImg?.style.filter).toContain("saturate(0.75)");

    // Test a FRONT sticker (e.g. shinchan-featured: depth 0.9)
    const shinchanContainer = screen.getByTestId("hero-sticker-shinchan-featured");
    const shinchanImg = shinchanContainer.querySelector("img");
    expect(shinchanImg?.style.opacity).toBe("0.8");
    expect(shinchanImg?.style.filter).not.toContain("blur");
    expect(shinchanImg?.style.filter).toContain("saturate(0.75)");
  });

  it("verifies tier multiplier constants", () => {
    expect(TIER_MULTIPLIERS.back.sizeMultiplier).toBe(0.6);
    expect(TIER_MULTIPLIERS.back.opacity).toBe(0.45);
    expect(TIER_MULTIPLIERS.back.blurPx).toBe(1.0);
    expect(TIER_MULTIPLIERS.back.saturate).toBe(0.6);
    expect(TIER_MULTIPLIERS.back.floatDistance).toBe(2);

    expect(TIER_MULTIPLIERS.mid.sizeMultiplier).toBe(0.8);
    expect(TIER_MULTIPLIERS.mid.opacity).toBe(0.65);
    expect(TIER_MULTIPLIERS.mid.blurPx).toBe(0);
    expect(TIER_MULTIPLIERS.mid.saturate).toBe(0.75);
    expect(TIER_MULTIPLIERS.mid.floatDistance).toBe(3);

    expect(TIER_MULTIPLIERS.front.sizeMultiplier).toBe(0.9);
    expect(TIER_MULTIPLIERS.front.opacity).toBe(0.8);
    expect(TIER_MULTIPLIERS.front.blurPx).toBe(0);
    expect(TIER_MULTIPLIERS.front.saturate).toBe(0.75);
    expect(TIER_MULTIPLIERS.front.floatDistance).toBe(4);
  });
});
