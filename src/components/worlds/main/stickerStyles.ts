import type React from "react";

export type StickerTier = "back" | "mid" | "front";

export interface TierMultipliers {
  /** Size scaling multiplier applied to desktop display size */
  sizeMultiplier: number;
  /** Rest-state sticker opacity (becomes 1.0 on hover) */
  opacity: number;
  /** Subtle edge blur in pixels to simulate wallpaper depth */
  blurPx: number;
  /** Saturation multiplier (lower for BACK tier to blend like wallpaper) */
  saturate: number;
  /** Calmed vertical float bob distance in pixels */
  floatDistance: number;
}

/**
 * Top-level depth tier multipliers for easy tweaking in one place:
 * - BACK  (depth 0.2–0.4): size ×0.6, opacity 0.45, blur(1px), saturate 0.6, float 2px
 * - MID   (depth 0.5–0.7): size ×0.8, opacity 0.65, no blur, saturate 0.75, float 3px
 * - FRONT (depth 0.8–1.0): size ×0.9, opacity 0.80, no blur, saturate 0.75, float 4px
 */
export const TIER_MULTIPLIERS: Record<StickerTier, TierMultipliers> = {
  back: {
    sizeMultiplier: 0.6,
    opacity: 0.45,
    blurPx: 1.0,
    saturate: 0.6,
    floatDistance: 2,
  },
  mid: {
    sizeMultiplier: 0.8,
    opacity: 0.65,
    blurPx: 0,
    saturate: 0.75,
    floatDistance: 3,
  },
  front: {
    sizeMultiplier: 0.9,
    opacity: 0.8,
    blurPx: 0,
    saturate: 0.75,
    floatDistance: 4,
  },
};

/**
 * Maps a sticker's depth value to its hierarchy tier.
 */
export function getStickerTier(depth: number): StickerTier {
  if (depth >= 0.8) return "front";
  if (depth >= 0.5) return "mid";
  return "back";
}

/**
 * Preset A — "Faded print"
 * 3px stacked white die-cut outline + warm pink shadow rgba(194, 24, 91, 0.15) 0 4px 10px.
 */
export const DIE_CUT_OUTLINE_SHADOW =
  "drop-shadow(-3px 0 0 #FFFFFF) drop-shadow(3px 0 0 #FFFFFF) drop-shadow(0 -3px 0 #FFFFFF) drop-shadow(0 3px 0 #FFFFFF) drop-shadow(0 4px 10px rgba(194, 24, 91, 0.15))";

/**
 * Base tone curve that pulls deep crimson toward the dusty rose background.
 */
export const BASE_TONE_FILTER =
  "contrast(0.88) brightness(1.06) sepia(0.12) hue-rotate(-12deg)";

/**
 * Resolves the locked-in Preset A style for a sticker based on its depth tier.
 */
export function getStickerStyle(depth: number): React.CSSProperties {
  const tier = getStickerTier(depth);
  const cfg = TIER_MULTIPLIERS[tier];

  const blurPart = cfg.blurPx > 0 ? ` blur(${cfg.blurPx}px)` : "";
  const filter = `${DIE_CUT_OUTLINE_SHADOW} saturate(${cfg.saturate}) ${BASE_TONE_FILTER}${blurPart}`;

  return {
    filter,
    opacity: cfg.opacity,
    mixBlendMode: "normal",
  };
}
