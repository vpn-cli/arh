export type StickerTier = "back" | "mid" | "front";

export interface HeroStickerItem {
  id: string;
  name: string;
  src: string;
  /** Desktop horizontal position percentage (0 to 100) */
  x: number;
  /** Desktop vertical position percentage (0 to 100) */
  y: number;
  /** Base desktop display size (px) before tier multiplier */
  size: number;
  /** Rotation angle in degrees (-15 to +15) */
  rotation: number;
  /** Visual weight category */
  weight?: "heavy" | "medium" | "light";
  /** Depth hierarchy tier (back, mid, front) */
  tier: StickerTier;
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
 *
 * Rules:
 * - Wide clear zone: No sticker within ~120px of the center column (x: 15%–85% on desktop is kept clear).
 * - Stickers pushed outward toward viewport perimeters and corners.
 * - BACK tier (0.2–0.4 depth): size ×0.6, opacity 0.45, blur(1px), saturate 0.6, float 2px.
 * - MID tier (0.5–0.7 depth): size ×0.8, opacity 0.65, no blur, saturate 0.75, float 3px.
 * - FRONT tier (0.8–1.0 depth, exactly 3 items: Shin-chan, Snoopy, Hello Kitty): size ×0.9, opacity 0.8, float 4px.
 * - Heavy/dark items (vinyl, moon, coca-cola, spiderman, billiard, camera, guitar, headphones) strictly in BACK or MID.
 * - Calmer motion: float amplitude 2-4px, durations 7-12s, rotation ±1°, parallax max drift 6px.
 */
export const HERO_STICKERS: HeroStickerItem[] = [
  // ─── ZONE 1: TOP-LEFT PERIMETER (CLEAR OF HOME PILL) ───
  {
    id: "cherries-top-left",
    name: "Cherries",
    src: "/stickers/food/cherries.webp",
    x: 6,
    y: 16,
    size: 86,
    rotation: 8,
    weight: "light",
    tier: "back",
    depth: 0.35,
    floatDuration: "8.4s",
    floatDelay: "-1.5s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    tabletX: 6,
    tabletY: 14,
    showOnMobile: true,
    mobileX: 12,
    mobileY: 13,
    mobileSize: 42,
  },
  {
    id: "vinyl-record",
    name: "Vinyl Record",
    src: "/stickers/misc/vinyl-record.webp",
    x: 14,
    y: 9,
    size: 58,
    rotation: -10,
    weight: "heavy",
    tier: "back",
    depth: 0.30,
    floatDuration: "11.0s",
    floatDelay: "-3.2s",
    floatDistance: 2,
    floatRotation: -0.5,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "red-star-small-1",
    name: "Red Star (Small)",
    src: "/stickers/misc/red-star-small.webp",
    x: 5,
    y: 28,
    size: 52,
    rotation: 12,
    weight: "light",
    tier: "back",
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

  // ─── ZONE 2: MID-LEFT PERIMETER ───
  {
    id: "bunny-headphones",
    name: "Bunny with Headphones",
    src: "/stickers/misc/bunny-headphones.webp",
    x: 6,
    y: 43,
    size: 104,
    rotation: -7,
    weight: "medium",
    tier: "mid",
    depth: 0.60,
    floatDuration: "10.2s",
    floatDelay: "-4.1s",
    floatDistance: 3,
    floatRotation: -0.8,
    soften: false,
    tabletX: 6,
    tabletY: 40,
  },
  {
    id: "canon-camera",
    name: "Vintage Canon Camera",
    src: "/stickers/misc/vintage-canon-camera.webp",
    x: 13,
    y: 56,
    size: 66,
    rotation: 6,
    weight: "heavy",
    tier: "back",
    depth: 0.35,
    floatDuration: "9.4s",
    floatDelay: "-2.3s",
    floatDistance: 2,
    floatRotation: 0.5,
    soften: true,
    tabletX: 6,
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
    x: 4,
    y: 65,
    size: 68,
    rotation: -12,
    weight: "light",
    tier: "back",
    depth: 0.30,
    floatDuration: "8.9s",
    floatDelay: "-5.0s",
    floatDistance: 2,
    floatRotation: -0.7,
    soften: false,
    tabletX: 14,
    tabletY: 13,
    showOnMobile: true,
    mobileX: 38,
    mobileY: 90,
    mobileSize: 38,
  },

  // ─── ZONE 3: LOWER-LEFT (SHIN-CHAN FRONT SPOT) ───
  {
    id: "shinchan-featured",
    name: "Shin-chan Namaste",
    src: "/stickers/shinchan/shinchan-namaste-ji.webp",
    x: 11,
    y: 78,
    size: 130,
    rotation: 4,
    weight: "medium",
    tier: "front",
    depth: 0.90,
    floatDuration: "8.5s",
    floatDelay: "-1.2s",
    floatDistance: 4,
    floatRotation: 0.8,
    soften: false,
    hasSpeechBubble: true,
    bubbleText: "namaste ji",
    bubbleEmoji: "🙏",
    tabletX: 11,
    tabletY: 82,
    showOnMobile: true,
    mobileX: 18,
    mobileY: 88,
    mobileSize: 76,
  },
  {
    id: "billiard-ball-7",
    name: "Billiard Ball 7",
    src: "/stickers/misc/billiard-ball-7.webp",
    x: 5,
    y: 76,
    size: 60,
    rotation: -5,
    weight: "heavy",
    tier: "back",
    depth: 0.30,
    floatDuration: "10.0s",
    floatDelay: "-3.7s",
    floatDistance: 2,
    floatRotation: -0.6,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "bow-accent-left",
    name: "Red Ribbon Bow (Accent)",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 4,
    y: 89,
    size: 62,
    rotation: -9,
    weight: "light",
    tier: "back",
    depth: 0.35,
    floatDuration: "8.0s",
    floatDelay: "-2.9s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    hideOnTablet: true,
  },

  // ─── ZONE 4: TOP-RIGHT PERIMETER (CLEAR OF MAIN WORLD PILL) ───
  {
    id: "full-moon",
    name: "Full Moon",
    src: "/stickers/misc/full-moon.webp",
    x: 85,
    y: 8,
    size: 62,
    rotation: 11,
    weight: "heavy",
    tier: "mid",
    depth: 0.55,
    floatDuration: "10.5s",
    floatDelay: "-2.1s",
    floatDistance: 3,
    floatRotation: 0.7,
    soften: true,
    tabletX: 86,
    tabletY: 10,
  },
  {
    id: "snoopy-sleeping",
    name: "Snoopy Sleeping",
    src: "/stickers/snoopy/snoopy-sleeping.webp",
    x: 89,
    y: 17,
    size: 112,
    rotation: -6,
    weight: "medium",
    tier: "front",
    depth: 0.85,
    floatDuration: "9.8s",
    floatDelay: "-4.8s",
    floatDistance: 4,
    floatRotation: -0.7,
    soften: false,
    tabletX: 91,
    tabletY: 16,
    showOnMobile: true,
    mobileX: 86,
    mobileY: 13,
    mobileSize: 44,
  },
  {
    id: "red-star-small-2",
    name: "Red Star (Small Accent)",
    src: "/stickers/misc/red-star-small.webp",
    x: 93,
    y: 28,
    size: 48,
    rotation: -14,
    weight: "light",
    tier: "back",
    depth: 0.25,
    floatDuration: "7.4s",
    floatDelay: "-0.5s",
    floatDistance: 2,
    floatRotation: -0.5,
    soften: false,
    hideOnTablet: true,
  },

  // ─── ZONE 5: MID-RIGHT PERIMETER (CLEAR OF NAV DOTS) ───
  {
    id: "hello-kitty-peeking",
    name: "Hello Kitty Peeking",
    src: "/stickers/hello-kitty/hello-kitty-peeking.webp",
    x: 91,
    y: 38,
    size: 100,
    rotation: 7,
    weight: "medium",
    tier: "front",
    depth: 0.85,
    floatDuration: "9.2s",
    floatDelay: "-3.6s",
    floatDistance: 4,
    floatRotation: 0.9,
    soften: false,
    tabletX: 93,
    tabletY: 38,
  },
  {
    id: "headphones-with-bows",
    name: "Headphones with Bows",
    src: "/stickers/misc/headphones-with-bows.webp",
    x: 89,
    y: 51,
    size: 88,
    rotation: -8,
    weight: "medium",
    tier: "mid",
    depth: 0.60,
    floatDuration: "8.2s",
    floatDelay: "-1.9s",
    floatDistance: 3,
    floatRotation: -0.7,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "spiderman-mask",
    name: "Spider-Man Mask",
    src: "/stickers/misc/spiderman-mask.webp",
    x: 93,
    y: 62,
    size: 70,
    rotation: 10,
    weight: "medium",
    tier: "mid",
    depth: 0.65,
    floatDuration: "10.6s",
    floatDelay: "-5.4s",
    floatDistance: 3,
    floatRotation: 0.8,
    soften: true,
    hideOnTablet: true,
  },
  {
    id: "coca-cola-can",
    name: "Coca-Cola Can",
    src: "/stickers/food/coca-cola-can.webp",
    x: 87,
    y: 64,
    size: 62,
    rotation: -11,
    weight: "heavy",
    tier: "mid",
    depth: 0.65,
    floatDuration: "8.8s",
    floatDelay: "-2.7s",
    floatDistance: 3,
    floatRotation: -0.6,
    soften: true,
    hideOnTablet: true,
  },

  // ─── ZONE 6: LOWER-RIGHT PERIMETER ───
  {
    id: "electric-guitar",
    name: "Electric Guitar",
    src: "/stickers/misc/electric-guitar.webp",
    x: 91,
    y: 75,
    size: 70,
    rotation: 13,
    weight: "heavy",
    tier: "mid",
    depth: 0.65,
    floatDuration: "11.2s",
    floatDelay: "-4.3s",
    floatDistance: 3,
    floatRotation: 0.9,
    soften: true,
    tabletX: 93,
    tabletY: 72,
  },
  {
    id: "red-ribbon-bow-main",
    name: "Red Ribbon Bow",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 86,
    y: 83,
    size: 78,
    rotation: -7,
    weight: "light",
    tier: "mid",
    depth: 0.50,
    floatDuration: "7.8s",
    floatDelay: "-1.1s",
    floatDistance: 3,
    floatRotation: -0.8,
    soften: false,
    tabletX: 86,
    tabletY: 82,
    showOnMobile: true,
    mobileX: 84,
    mobileY: 84,
    mobileSize: 44,
  },
  {
    id: "red-star-large-2",
    name: "Red Star (Large Accent)",
    src: "/stickers/misc/red-star-large.webp",
    x: 93,
    y: 90,
    size: 58,
    rotation: 9,
    weight: "light",
    tier: "back",
    depth: 0.30,
    floatDuration: "8.6s",
    floatDelay: "-3.8s",
    floatDistance: 2,
    floatRotation: 0.6,
    soften: false,
    hideOnTablet: true,
  },
];
