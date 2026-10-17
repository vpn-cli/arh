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

  it("keeps heavier items (moon, vinyl, coca-cola, camera, guitar, ball) between 56px and 72px", () => {
    const heavyStickers = HERO_STICKERS.filter((s) => s.weight === "heavy");
    expect(heavyStickers.length).toBeGreaterThanOrEqual(5);
    for (const sticker of heavyStickers) {
      expect(sticker.size).toBeGreaterThanOrEqual(56);
      expect(sticker.size).toBeLessThanOrEqual(72);
    }
  });

  it("gives Shin-chan a featured spot with namaste ji speech bubble", () => {
    const shinchan = HERO_STICKERS.find((s) => s.id === "shinchan-featured");
    expect(shinchan).toBeDefined();
    expect(shinchan?.size).toBeGreaterThanOrEqual(120);
    expect(shinchan?.hasSpeechBubble).toBe(true);
    expect(shinchan?.bubbleText).toBe("namaste ji 🙏");
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
      expect(img?.className).toContain("hero-sticker-pack-filter");
    }
  });

  it("renders Shin-chan's speech bubble", () => {
    render(<HeroStickerBomb />);
    expect(screen.getByText("namaste ji 🙏")).toBeDefined();
  });
});
