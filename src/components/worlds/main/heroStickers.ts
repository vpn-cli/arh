export interface HeroStickerItem {
  id: string;
  name: string;
  src: string;
  /** Desktop horizontal position percentage (0 to 100) */
  x: number;
  /** Desktop vertical position percentage (0 to 100) */
  y: number;
  /** Base desktop display size (px) */
  size: number;
  /** Rotation angle in degrees (-15 to +15) */
  rotation: number;
  /** Visual weight category */
  weight?: "heavy" | "medium" | "light";
  /** Enables a gentle idle floating drift */
  float?: boolean;
  /** Staggered delay for floating drift */
  floatDelay?: string;
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
  /** Speech bubble text */
  bubbleText?: string;
}

/**
 * Hero sticker pack scattered layout configuration.
 *
 * Rules:
 * - Hand-tuned % coordinates for full 100vh x 100vw hero coverage.
 * - Minimum 48px padding around center column content (avatar, title, subtitle, continue).
 * - Kept clear of top pills (Home/Main), right nav dots, and bottom badge/dev indicator.
 * - Heavier/darker items (moon, vinyl, coca-cola, camera, guitar, ball) kept small (58-70px).
 * - Rotations strictly within -15° to +15°.
 */
export const HERO_STICKERS: HeroStickerItem[] = [
  // ─── ZONE 1: TOP-LEFT ───
  {
    id: "cherries-top-left",
    name: "Cherries",
    src: "/stickers/food/cherries.webp",
    x: 8,
    y: 18,
    size: 86,
    rotation: 8,
    weight: "light",
    float: true,
    floatDelay: "2.4s",
    tabletX: 8,
    tabletY: 15,
    showOnMobile: true,
    mobileX: 15,
    mobileY: 13,
    mobileSize: 44,
  },
  {
    id: "vinyl-record",
    name: "Vinyl Record",
    src: "/stickers/misc/vinyl-record.webp",
    x: 22,
    y: 13,
    size: 58,
    rotation: -10,
    weight: "heavy",
    hideOnTablet: true,
  },
  {
    id: "red-star-small-1",
    name: "Red Star (Small)",
    src: "/stickers/misc/red-star-small.webp",
    x: 16,
    y: 26,
    size: 52,
    rotation: 12,
    weight: "light",
    hideOnTablet: true,
    showOnMobile: true,
    mobileX: 48,
    mobileY: 82,
    mobileSize: 32,
  },

  // ─── ZONE 2: MID-LEFT ───
  {
    id: "bunny-headphones",
    name: "Bunny with Headphones",
    src: "/stickers/misc/bunny-headphones.webp",
    x: 10,
    y: 39,
    size: 104,
    rotation: -7,
    weight: "medium",
    float: true,
    floatDelay: "1.8s",
    tabletX: 6,
    tabletY: 38,
  },
  {
    id: "canon-camera",
    name: "Vintage Canon Camera",
    src: "/stickers/misc/vintage-canon-camera.webp",
    x: 21,
    y: 50,
    size: 66,
    rotation: 6,
    weight: "heavy",
    tabletX: 6,
    tabletY: 58,
    showOnMobile: true,
    mobileX: 63,
    mobileY: 90,
    mobileSize: 44,
  },
  {
    id: "red-star-large-1",
    name: "Red Star (Large)",
    src: "/stickers/misc/red-star-large.webp",
    x: 7,
    y: 57,
    size: 68,
    rotation: -12,
    weight: "light",
    tabletX: 18,
    tabletY: 13,
    showOnMobile: true,
    mobileX: 38,
    mobileY: 90,
    mobileSize: 40,
  },

  // ─── ZONE 3: LOWER-LEFT (SHIN-CHAN FEATURED SPOT) ───
  {
    id: "shinchan-featured",
    name: "Shin-chan Namaste",
    src: "/stickers/shinchan/shinchan-namaste-ji.webp",
    x: 14,
    y: 77,
    size: 130,
    rotation: 4,
    weight: "medium",
    float: true,
    floatDelay: "0.5s",
    hasSpeechBubble: true,
    bubbleText: "namaste ji 🙏",
    tabletX: 14,
    tabletY: 84,
    showOnMobile: true,
    mobileX: 18,
    mobileY: 88,
    mobileSize: 76,
  },
  {
    id: "billiard-ball-7",
    name: "Billiard Ball 7",
    src: "/stickers/misc/billiard-ball-7.webp",
    x: 21,
    y: 70,
    size: 60,
    rotation: -5,
    weight: "heavy",
    hideOnTablet: true,
  },
  {
    id: "bow-accent-left",
    name: "Red Ribbon Bow (Accent)",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 6,
    y: 84,
    size: 62,
    rotation: -9,
    weight: "light",
    hideOnTablet: true,
  },

  // ─── ZONE 4: TOP-RIGHT ───
  {
    id: "snoopy-sleeping",
    name: "Snoopy Sleeping",
    src: "/stickers/snoopy/snoopy-sleeping.webp",
    x: 88,
    y: 17,
    size: 112,
    rotation: -6,
    weight: "medium",
    float: true,
    floatDelay: "1.2s",
    tabletX: 91,
    tabletY: 15,
    showOnMobile: true,
    mobileX: 84,
    mobileY: 13,
    mobileSize: 46,
  },
  {
    id: "full-moon",
    name: "Full Moon",
    src: "/stickers/misc/full-moon.webp",
    x: 78,
    y: 14,
    size: 62,
    rotation: 11,
    weight: "heavy",
    float: true,
    floatDelay: "2.1s",
    tabletX: 80,
    tabletY: 12,
  },
  {
    id: "red-star-small-2",
    name: "Red Star (Small Accent)",
    src: "/stickers/misc/red-star-small.webp",
    x: 82,
    y: 25,
    size: 48,
    rotation: -14,
    weight: "light",
    hideOnTablet: true,
  },

  // ─── ZONE 5: MID-RIGHT ───
  {
    id: "hello-kitty-peeking",
    name: "Hello Kitty Peeking",
    src: "/stickers/hello-kitty/hello-kitty-peeking.webp",
    x: 88,
    y: 36,
    size: 100,
    rotation: 7,
    weight: "medium",
    float: true,
    floatDelay: "3.0s",
    tabletX: 94,
    tabletY: 38,
  },
  {
    id: "headphones-with-bows",
    name: "Headphones with Bows",
    src: "/stickers/misc/headphones-with-bows.webp",
    x: 79,
    y: 47,
    size: 88,
    rotation: -8,
    weight: "medium",
    hideOnTablet: true,
  },
  {
    id: "spiderman-mask",
    name: "Spider-Man Mask",
    src: "/stickers/misc/spiderman-mask.webp",
    x: 87.5,
    y: 56,
    size: 70,
    rotation: 10,
    weight: "medium",
    hideOnTablet: true,
  },
  {
    id: "coca-cola-can",
    name: "Coca-Cola Can",
    src: "/stickers/food/coca-cola-can.webp",
    x: 79,
    y: 60,
    size: 62,
    rotation: -11,
    weight: "heavy",
    hideOnTablet: true,
  },

  // ─── ZONE 6: LOWER-RIGHT ───
  {
    id: "electric-guitar",
    name: "Electric Guitar",
    src: "/stickers/misc/electric-guitar.webp",
    x: 88,
    y: 72,
    size: 70,
    rotation: 13,
    weight: "heavy",
    tabletX: 94,
    tabletY: 70,
  },
  {
    id: "red-ribbon-bow-main",
    name: "Red Ribbon Bow",
    src: "/stickers/bows-hearts/red-ribbon-bow.webp",
    x: 79,
    y: 76,
    size: 78,
    rotation: -7,
    weight: "light",
    tabletX: 86,
    tabletY: 82,
    showOnMobile: true,
    mobileX: 84,
    mobileY: 84,
    mobileSize: 46,
  },
  {
    id: "red-star-large-2",
    name: "Red Star (Large Accent)",
    src: "/stickers/misc/red-star-large.webp",
    x: 84,
    y: 86,
    size: 58,
    rotation: 9,
    weight: "light",
    hideOnTablet: true,
  },
];
