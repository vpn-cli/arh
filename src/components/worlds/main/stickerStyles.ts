import type React from "react";

export type StickerPreset = "a" | "b" | "c";

/**
 * White-heavy stickers that should NEVER use mix-blend-mode: multiply
 * (because multiplying white makes it completely transparent against the paper background).
 */
export const WHITE_HEAVY_STICKER_IDS = new Set<string>([
  "hello-kitty-peeking",
  "snoopy-sleeping",
  "shinchan-featured",
  "bunny-headphones",
]);

/**
 * Dark and colored stickers explicitly targeted for multiply blending in Preset B.
 */
export const MULTIPLY_STICKER_IDS = new Set<string>([
  "vinyl-record",
  "full-moon",
  "cherries-top-left",
  "red-star-small-1",
  "red-star-large-1",
  "red-star-small-2",
  "red-star-large-2",
  "bow-accent-left",
  "red-ribbon-bow-main",
  "coca-cola-can",
  "spiderman-mask",
  "billiard-ball-7",
  "canon-camera",
  "electric-guitar",
  "headphones-with-bows",
]);

/**
 * Base color grade for all stickers across presets:
 * pulls deep crimson toward the dusty rose of the background.
 */
export const BASE_COLOR_GRADE_FILTER =
  "saturate(0.75) contrast(0.88) brightness(1.06) sepia(0.12) hue-rotate(-12deg)";

/**
 * Preset A white die-cut outline (stacked 3px drop-shadows) + warm pink shadow rgba(194,24,91,0.15) 0 4px 10px.
 */
export const DIE_CUT_OUTLINE_SHADOW =
  "drop-shadow(-3px 0 0 #FFFFFF) drop-shadow(3px 0 0 #FFFFFF) drop-shadow(0 -3px 0 #FFFFFF) drop-shadow(0 3px 0 #FFFFFF) drop-shadow(0 4px 10px rgba(194, 24, 91, 0.15))";

/**
 * Preset B softer shadow for dark/colored stickers without white outline.
 */
export const PRESET_B_SOFT_SHADOW =
  "drop-shadow(0 3px 6px rgba(194, 24, 91, 0.12))";

/**
 * Preset C subtle blur to soften crisp digital edges.
 */
export const PRESET_C_BLUR = "blur(0.3px)";

/**
 * High-resolution SVG feTurbulence grain pattern encoded as an inline data URI.
 */
export const WASHI_GRAIN_DATA_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

export interface StickerResolvedStyle {
  imgStyle: React.CSSProperties;
  showGrainOverlay: boolean;
}

/**
 * Computes the filter, blend mode, and opacity styles for a given sticker under the selected preset.
 */
export function getStickerStyle(
  stickerId: string,
  preset: StickerPreset
): StickerResolvedStyle {
  // Preset B: Printed on the paper
  if (preset === "b") {
    const isWhiteHeavy = WHITE_HEAVY_STICKER_IDS.has(stickerId);
    if (isWhiteHeavy) {
      // White-heavy stickers keep Preset A die-cut styling to prevent white turning see-through
      return {
        imgStyle: {
          filter: `${DIE_CUT_OUTLINE_SHADOW} ${BASE_COLOR_GRADE_FILTER}`,
          opacity: 0.88,
          mixBlendMode: "normal",
        },
        showGrainOverlay: false,
      };
    }

    // Dark/colored stickers use multiply blend, no white outline, and softer shadow
    return {
      imgStyle: {
        filter: `${PRESET_B_SOFT_SHADOW} ${BASE_COLOR_GRADE_FILTER}`,
        opacity: 0.88,
        mixBlendMode: "multiply",
      },
      showGrainOverlay: false,
    };
  }

  // Preset C: Washi grain
  if (preset === "c") {
    return {
      imgStyle: {
        filter: `${DIE_CUT_OUTLINE_SHADOW} ${BASE_COLOR_GRADE_FILTER} ${PRESET_C_BLUR}`,
        opacity: 0.88,
        mixBlendMode: "normal",
      },
      showGrainOverlay: true,
    };
  }

  // Preset A: Faded print (default)
  return {
    imgStyle: {
      filter: `${DIE_CUT_OUTLINE_SHADOW} ${BASE_COLOR_GRADE_FILTER}`,
      opacity: 0.88,
      mixBlendMode: "normal",
    },
    showGrainOverlay: false,
  };
}

/**
 * Returns the CSS properties for Preset C's masked paper grain overlay.
 */
export function getGrainOverlayStyle(stickerSrc: string): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: `url("${WASH_GRAIN_DATA_URI_SAFE(WASHI_GRAIN_DATA_URI)}")`,
    backgroundRepeat: "repeat",
    backgroundSize: "120px 120px",
    mixBlendMode: "overlay",
    opacity: 0.25,
    maskImage: `url(${stickerSrc})`,
    WebkitMaskImage: `url(${stickerSrc})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
}

function WASH_GRAIN_DATA_URI_SAFE(uri: string): string {
  return uri;
}

export interface PresetMeta {
  id: StickerPreset;
  key: string;
  name: string;
  shortLabel: string;
  description: string;
}

export const STICKER_PRESET_OPTIONS: PresetMeta[] = [
  {
    id: "a",
    key: "A",
    name: "Faded Print",
    shortLabel: "Faded",
    description: "Dusty rose grade, 3px white outline, warm pink shadow",
  },
  {
    id: "b",
    key: "B",
    name: "Printed on Paper",
    shortLabel: "Paper",
    description: "Multiply blend on dark stickers; die-cut on white stickers",
  },
  {
    id: "c",
    key: "C",
    name: "Washi Grain",
    shortLabel: "Washi",
    description: "Preset A + masked feTurbulence grain + 0.3px soft edge blur",
  },
];
