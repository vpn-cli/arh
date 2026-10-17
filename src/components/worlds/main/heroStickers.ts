export type StickerTier = "back" | "mid" | "front";
export type StickerCategory = "character" | "star" | "bow" | "item";

export interface HeroStickerItem {
  id: string;
  name: string;
  src: string;
  /** Desktop horizontal position percentage (fallback) */
  x: number;
  /** Desktop vertical position percentage (fallback) */
  y: number;
  /** Base desktop display size (80–140px) before tier multipliers */
  size: number;
  /** Rotation angle in degrees (-15 to +15) */
  rotation: number;
  /** Visual weight category */
  weight?: "heavy" | "medium" | "light";
  /** Depth hierarchy tier (back, mid, front) */
  tier: StickerTier;
  /** Semantic type for variety distribution across grid */
  category: StickerCategory;
  /** Mouse parallax depth factor (0.2 to 1.0, drifts opposite cursor up to 6px) */
  depth: number;
  /** Idle floating cycle duration (7s to 12s) */
  floatDuration: string;
  /** Staggered randomized delay/phase so stickers never bob in sync */
  floatDelay: string;
  /** Vertical bob distance in pixels (2px BACK, 3px MID, 4px FRONT) */
  floatDistance: number;
  /** Subtle bob oscillation rotation in degrees (-1° to +1°) */
  floatRotation: number;
  /** Slightly soften heavy/dark stickers to fit pastel theme */
  soften?: boolean;
  /** Hide on tablet viewports (768–1023px) to maintain clean clearance */
  hideOnTablet?: boolean;
  /** Tablet-specific horizontal position percentage (0 to 100) */
  tabletX?: number;
  /** Tablet-specific vertical position percentage (0 to 100) */
  tabletY?: number;
  /** Show on mobile screens (<768px) around edges/corners */
  showOnMobile?: boolean;
  /** Mobile horizontal position percentage (0 to 100) */
  mobileX?: number;
  /** Mobile vertical position percentage (0 to 100) */
  mobileY?: number;
  /** Mobile display size (px, <= 64px, except Shin-chan) */
  mobileSize?: number;
  /** Renders speech bubble caption (Shin-chan) */
  hasSpeechBubble?: boolean;
  /** Speech bubble text (rendered with retro font) */
  bubbleText?: string;
  /** Optional emoji rendered in a separate span with an emoji font stack */
  bubbleEmoji?: string;
}

/**
 * Hero sticker pack scattered layout configuration.
 * Base sizes are strictly within 80–140px.
 * Tier multipliers scale: BACK ×0.85, MID ×1.0, FRONT ×1.15.
 */
export const HERO_STICKERS: HeroStickerItem[] = [
  // ─── FRONT TIER CHARACTERS (EXACTLY 3, DIFFERENT QUADRANTS) ───
  {
    id: "shinchan-featured",
    name: "Shin-chan Namaste",
    src: "/stickers/shinchan/shinchan-namaste-ji.webp",
    x: 18,
    y: 78,
    size: 130, // 130 × 1.15 = 149.5px
    rotation: 4,
    weight: "medium",
    tier: "front",
    category: "character",
    depth: 0.90,
    floatDuration: "8.5s",
    floatDelay: "-1.2s",
    floatDistance: 4,
    floatRotation: 0.8,
    soften: false,
    hasSpeechBubble: true,
    bubbleText: "namaste ji",
    bubbleEmoji: "🙏",
    tabletX: 14,
    tabletY: 82,
    showOnMobile: true,
    mobileX: 18,
    mobileY: 88,
    mobileSize: 76,
  },
  {
    id: "snoopy-sleeping",
    name: "Snoopy Sleeping",
    src: "/stickers/snoopy/snoopy-sleeping.webp",
    x: 82,
    y: 18,
    size: 115, // 115 × 1.15 = 132px
    rotation: -6,
    weight: "medium",
    tier: "front",
    category: "character",
    depth: 0.85,
    floatDuration: "9.8s",
    floatDelay: "-4.8s",
    floatDistance: 4,
    floatRotation: -0.7,
    soften: false,
    tabletX: 86,
    tabletY: 16,
    showOnMobile: true,
    mobileX: 86,
    mobileY: 13,
    mobileSize: 44,
  },
  {
    id: "hello-kitty-peeking",
    name: "Hello Kitty Peeking",
    src: "/stickers/hello-kitty/hello-kitty-peeking.webp",
    x: 82,
    y: 42,
    size: 110, // 110 × 1.15 = 126.5px
    rotation: 7,
    weight: "medium",
    tier: "front",
    category: "character",
    depth: 0.85,
    floatDuration: "9.2s",
    floatDelay: "-3.6s",
    floatDistance: 4,
    floatRotation: 0.9,
    soften: false,
    tabletX: 88,
    tabletY: 38,
  },

  // ─── MID TIER ITEMS (7 ITEMS: DEPTH 0.50–0.65, SIZE ×1.0) ───
  {
    id: "bunny-headphones",
    name: "Bunny with Headphones",
    src: "/stickers/misc/bunny-headphones.webp",
    x: 18,
    y: 44,
    size: 105, // 105 × 1.0 = 105px
    rotation: -7,
    weight: "medium",
    tier: "mid",
    category: "item",
    depth: 0.60,
    floatDuration: "10.2s",
    floatDelay: "-4.1s",
    floatDistance: 3,
    floatRotation: -0.8,
    soften: false,
    tabletX: 12,
    tabletY: 40,
  },
  {
    id: "headphones-with-bows",
    name: "Headphones with Bows",
    src: "/stickers/misc/headphones-with-bows.webp",
    x: 74,
    y: 50,
    size: 95, // 95 × 1.0 = 95px
    rotation: -8,
    weight: "medium",
    tier: "mid",
    category: "item",
    depth: 0.60,
    floatDuration: "8.2s",
    floatDelay: "-1.9s",
    floatDistance: 3,
    floatRotation: -0.7,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "red-ribbon-bow-main",
    name: "Red Ribbon Bow",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 78,
    y: 78,
    size: 90, // 90 × 1.0 = 90px
    rotation: -7,
    weight: "light",
    tier: "mid",
    category: "bow",
    depth: 0.50,
    floatDuration: "7.8s",
    floatDelay: "-1.1s",
    floatDistance: 3,
    floatRotation: -0.8,
    soften: false,
    tabletX: 84,
    tabletY: 82,
    showOnMobile: true,
    mobileX: 84,
    mobileY: 84,
    mobileSize: 44,
  },
  {
    id: "full-moon",
    name: "Full Moon",
    src: "/stickers/misc/full-moon.webp",
    x: 72,
    y: 12,
    size: 88, // 88 × 1.0 = 88px
    rotation: 11,
    weight: "heavy",
    tier: "mid",
    category: "item",
    depth: 0.55,
    floatDuration: "10.5s",
    floatDelay: "-2.1s",
    floatDistance: 3,
    floatRotation: 0.7,
    soften: true,
    tabletX: 82,
    tabletY: 10,
  },
  {
    id: "spiderman-mask",
    name: "Spider-Man Mask",
    src: "/stickers/misc/spiderman-mask.webp",
    x: 88,
    y: 62,
    size: 88, // 88 × 1.0 = 88px
    rotation: 10,
    weight: "medium",
    tier: "mid",
    category: "item",
    depth: 0.65,
    floatDuration: "10.6s",
    floatDelay: "-5.4s",
    floatDistance: 3,
    floatRotation: 0.8,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "electric-guitar",
    name: "Electric Guitar",
    src: "/stickers/misc/electric-guitar.webp",
    x: 84,
    y: 74,
    size: 85, // 85 × 1.0 = 85px
    rotation: 13,
    weight: "heavy",
    tier: "mid",
    category: "item",
    depth: 0.65,
    floatDuration: "11.2s",
    floatDelay: "-4.3s",
    floatDistance: 3,
    floatRotation: 0.9,
    soften: true,
    tabletX: 88,
    tabletY: 72,
  },
  {
    id: "coca-cola-can",
    name: "Coca-Cola Can",
    src: "/stickers/food/coca-cola-can.webp",
    x: 74,
    y: 64,
    size: 80, // 80 × 1.0 = 80px
    rotation: -11,
    weight: "heavy",
    tier: "mid",
    category: "item",
    depth: 0.65,
    floatDuration: "8.8s",
    floatDelay: "-2.7s",
    floatDistance: 3,
    floatRotation: -0.6,
    soften: true,
    hideOnTablet: true,
  },

  // ─── BACK TIER ITEMS (9 ITEMS: DEPTH 0.25–0.35, SIZE ×0.85, BLUR 0.6px) ───
  {
    id: "cherries-top-left",
    name: "Cherries",
    src: "/stickers/food/cherries.webp",
    x: 10,
    y: 18,
    size: 95, // 95 × 0.85 = 80.75px
    rotation: 8,
    weight: "light",
    tier: "back",
    category: "item",
    depth: 0.35,
    floatDuration: "8.4s",
    floatDelay: "-1.5s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    tabletX: 8,
    tabletY: 14,
    showOnMobile: true,
    mobileX: 12,
    mobileY: 13,
    mobileSize: 42,
  },
  {
    id: "canon-camera",
    name: "Vintage Canon Camera",
    src: "/stickers/misc/vintage-canon-camera.webp",
    x: 26,
    y: 54,
    size: 92, // 92 × 0.85 = 78.2px
    rotation: 6,
    weight: "heavy",
    tier: "back",
    category: "item",
    depth: 0.35,
    floatDuration: "9.4s",
    floatDelay: "-2.3s",
    floatDistance: 2,
    floatRotation: 0.5,
    soften: true,
    tabletX: 10,
    tabletY: 58,
    showOnMobile: true,
    mobileX: 63,
    mobileY: 90,
    mobileSize: 42,
  },
  {
    id: "red-star-large-1",
    name: "Red Star (Large)",
    src: "/stickers/misc/red-star-large.webp",
    x: 8,
    y: 62,
    size: 88, // 88 × 0.85 = 74.8px
    rotation: -12,
    weight: "light",
    tier: "back",
    category: "star",
    depth: 0.30,
    floatDuration: "8.9s",
    floatDelay: "-5.0s",
    floatDistance: 2,
    floatRotation: -0.7,
    soften: false,
    tabletX: 16,
    tabletY: 13,
    showOnMobile: true,
    mobileX: 38,
    mobileY: 90,
    mobileSize: 38,
  },
  {
    id: "red-star-large-2",
    name: "Red Star (Large Accent)",
    src: "/stickers/misc/red-star-large.webp",
    x: 88,
    y: 88,
    size: 88, // 88 × 0.85 = 74.8px
    rotation: 9,
    weight: "light",
    tier: "back",
    category: "star",
    depth: 0.30,
    floatDuration: "8.6s",
    floatDelay: "-3.8s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    hideOnTablet: true,
  },
  {
    id: "billiard-ball-7",
    name: "Billiard Ball 7",
    src: "/stickers/misc/billiard-ball-7.webp",
    x: 10,
    y: 72,
    size: 85, // 85 × 0.85 = 72.25px
    rotation: -5,
    weight: "heavy",
    tier: "back",
    category: "item",
    depth: 0.30,
    floatDuration: "10.0s",
    floatDelay: "-3.7s",
    floatDistance: 2,
    floatRotation: -0.6,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "vinyl-record",
    name: "Vinyl Record",
    src: "/stickers/misc/vinyl-record.webp",
    x: 24,
    y: 12,
    size: 85, // 85 × 0.85 = 72.25px
    rotation: -10,
    weight: "heavy",
    tier: "back",
    category: "item",
    depth: 0.30,
    floatDuration: "11.0s",
    floatDelay: "-3.2s",
    floatDistance: 2,
    floatRotation: -0.5,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "bow-accent-left",
    name: "Red Ribbon Bow (Accent)",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 6,
    y: 86,
    size: 82, // 82 × 0.85 = 69.7px
    rotation: -9,
    weight: "light",
    tier: "back",
    category: "bow",
    depth: 0.35,
    floatDuration: "8.0s",
    floatDelay: "-2.9s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    hideOnTablet: true,
  },
  {
    id: "red-star-small-1",
    name: "Red Star (Small)",
    src: "/stickers/misc/red-star-small.webp",
    x: 12,
    y: 30,
    size: 80, // 80 × 0.85 = 68px
    rotation: 12,
    weight: "light",
    tier: "back",
    category: "star",
    depth: 0.25,
    floatDuration: "7.6s",
    floatDelay: "-0.8s",
    floatDistance: 2,
    floatRotation: 0.7,
    soften: false,
    hideOnTablet: true,
    showOnMobile: true,
    mobileX: 48,
    mobileY: 84,
    mobileSize: 30,
  },
  {
    id: "red-star-small-2",
    name: "Red Star (Small Accent)",
    src: "/stickers/misc/red-star-small.webp",
    x: 86,
    y: 30,
    size: 80, // 80 × 0.85 = 68px
    rotation: -14,
    weight: "light",
    tier: "back",
    category: "star",
    depth: 0.25,
    floatDuration: "7.4s",
    floatDelay: "-0.5s",
    floatDistance: 2,
    floatRotation: -0.5,
    soften: false,
    hideOnTablet: true,
  },
];
