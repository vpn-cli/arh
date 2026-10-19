"use client";

import { HERO_STICKERS } from "@/components/worlds/main/heroStickers";

/* ═══════════════════════════════════════════════════════
   TRANSITION PRELOADER
   Warms world transition clips & posters when Hub is idle.
   Skips on saveData or 2G network connections.
   Uses hidden video elements so browser media subsystem caches
   the range-request byte chunks for immediate playback.
   Decodes Main World's above-the-fold images (main_world.webp +
   20 hero stickers + mascot accents) in parallel during idle.
   ═══════════════════════════════════════════════════════ */

let isPreloaded = false;
const hiddenVideos: HTMLVideoElement[] = [];

export const MAIN_ABOVE_FOLD_IMAGES = [
  "/images/main_world.webp",
  "/images/portals/hk-main.webp",
  "/images/elements/bow_satin.webp",
  "/images/elements/star_top_right.webp",
  "/images/elements/cherries.webp",
  ...HERO_STICKERS.map((s) => s.src),
];

export async function decodeMainAboveTheFoldImages() {
  if (typeof window === "undefined" || !("Image" in window)) return;

  await Promise.all(
    MAIN_ABOVE_FOLD_IMAGES.map(async (src) => {
      try {
        const img = new Image();
        img.src = src;
        if ("decode" in img) {
          await img.decode();
        }
      } catch {
        // ignore individual decode errors
      }
    })
  );
}

export function preloadWorldTransitions() {
  if (isPreloaded || typeof window === "undefined") return;

  // Check network conditions: skip on saveData or 2g
  interface NetworkInfo {
    saveData?: boolean;
    effectiveType?: string;
  }
  const nav = typeof navigator !== "undefined"
    ? (navigator as unknown as { connection?: NetworkInfo; mozConnection?: NetworkInfo; webkitConnection?: NetworkInfo })
    : null;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
  if (conn?.saveData || conn?.effectiveType === "2g") {
    return;
  }

  const runPreload = () => {
    if (isPreloaded) return;
    isPreloaded = true;

    const clips = [
      {
        video: "/transitions/world-main-2500ms.mp4",
        poster: "/transitions/world-main-2500ms.webp",
      },
      {
        video: "/transitions/world-music-2500ms.mp4",
        poster: "/transitions/world-music-2500ms.webp",
      },
    ];

    // 1. Preload transition clips into media cache
    clips.forEach(({ video, poster }) => {
      const img = new Image();
      img.src = poster;

      try {
        const v = document.createElement("video");
        v.preload = "auto";
        v.muted = true;
        v.playsInline = true;
        v.src = video;
        v.load();
        hiddenVideos.push(v);
      } catch {
        // ignore preload errors
      }
    });

    // 2. Decode Main World's above-the-fold images in parallel during idle
    decodeMainAboveTheFoldImages().catch(() => {});
  };

  const win = typeof window !== "undefined"
    ? (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    : null;
  if (win?.requestIdleCallback) {
    win.requestIdleCallback(runPreload, { timeout: 2000 });
  } else {
    setTimeout(runPreload, 800);
  }
}

export function resetPreloaderForTesting() {
  isPreloaded = false;
  hiddenVideos.forEach((v) => {
    v.pause();
    v.removeAttribute("src");
    v.load();
  });
  hiddenVideos.length = 0;
}
