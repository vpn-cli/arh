import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import HeroStickerBomb from "../HeroStickerBomb";
import { HERO_STICKERS } from "../heroStickers";

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

  it("assigns valid depth (0.2 to 1.0) and idle float params (5-9s, 4-8px, +-2 deg) to every sticker", () => {
    for (const sticker of HERO_STICKERS) {
      expect(sticker.depth).toBeGreaterThanOrEqual(0.2);
      expect(sticker.depth).toBeLessThanOrEqual(1.0);

      const durationSec = parseFloat(sticker.floatDuration);
      expect(durationSec).toBeGreaterThanOrEqual(5.0);
      expect(durationSec).toBeLessThanOrEqual(9.0);

      expect(sticker.floatDistance).toBeGreaterThanOrEqual(4);
      expect(sticker.floatDistance).toBeLessThanOrEqual(8);

      expect(sticker.floatRotation).toBeGreaterThanOrEqual(-2.0);
      expect(sticker.floatRotation).toBeLessThanOrEqual(2.0);
    }
  });

  it("softens dark/heavy items to blend with pastel theme while keeping characters full color", () => {
    const softenedIds = [
      "vinyl-record",
      "canon-camera",
      "billiard-ball-7",
      "full-moon",
      "headphones-with-bows",
      "spiderman-mask",
      "coca-cola-can",
      "electric-guitar",
    ];

    for (const id of softenedIds) {
      const sticker = HERO_STICKERS.find((s) => s.id === id);
      expect(sticker?.soften).toBe(true);
    }

    // Hello Kitty, Snoopy, and Shin-chan must remain full color
    const fullColorIds = ["shinchan-featured", "snoopy-sleeping", "hello-kitty-peeking"];
    for (const id of fullColorIds) {
      const sticker = HERO_STICKERS.find((s) => s.id === id);
      expect(sticker?.soften).toBe(false);
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
});
