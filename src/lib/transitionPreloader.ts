"use client";

import { HERO_STICKERS } from "@/components/worlds/main/heroStickers";
import { getStickerStyle } from "@/components/worlds/main/stickerStyles";

/* ═══════════════════════════════════════════════════════
   TRANSITION PRELOADER
   Warms world transition clips & posters when Hub is idle.
   Skips on saveData or 2G network connections.
   Uses hidden video elements so browser media subsystem caches
   the range-request byte chunks for immediate playback.
   Decodes Main World's above-the-fold images (main_world.webp +
   20 hero stickers + mascot accents) in parallel during idle.
   Pre-warms complex sticker & turbulence shaders spaced across
   idle intervals to avoid compositor stalls during transitions.
   ═══════════════════════════════════════════════════════ */

let isPreloaded = false;
let hasPrewarmedShaders = false;
const hiddenVideos: HTMLVideoElement[] = [];
const shaderPrewarmCleanups: Array<() => void> = [];

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

export function prewarmMainShaders(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};
  if (hasPrewarmedShaders) return () => {};
  hasPrewarmedShaders = true;

  const id = "__main_shader_prewarm";
  if (document.getElementById(id)) return () => {};

  const container = document.createElement("div");
  container.id = id;
  container.setAttribute("aria-hidden", "true");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:12px;height:12px;opacity:0.005;pointer-events:none;z-index:-9999;overflow:hidden;transform:translateZ(0);";

  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const cleanup = () => {
    timeouts.forEach(clearTimeout);
    timeouts.length = 0;
    try {
      container.remove();
    } catch {}
  };

  shaderPrewarmCleanups.push(cleanup);
  document.body.appendChild(container);

  const tasks: Array<() => void> = [
    // 1. Noise SVG filter
    () => {
      const img = document.createElement("img");
      img.src = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;
      img.style.cssText = "width:4px;height:4px;display:block;";
      container.appendChild(img);
    },
    // 2. Sticker depth 0.3 tier
    () => {
      const el = document.createElement("div");
      const s = getStickerStyle(0.3);
      el.style.cssText = `width:4px;height:4px;background:#fff;filter:${s.filter};display:block;`;
      container.appendChild(el);
    },
    // 3. Sticker depth 0.6 tier
    () => {
      const el = document.createElement("div");
      const s = getStickerStyle(0.6);
      el.style.cssText = `width:4px;height:4px;background:#fff;filter:${s.filter};display:block;`;
      container.appendChild(el);
    },
    // 4. Sticker depth 0.9 tier
    () => {
      const el = document.createElement("div");
      const s = getStickerStyle(0.9);
      el.style.cssText = `width:4px;height:4px;background:#fff;filter:${s.filter};display:block;`;
      container.appendChild(el);
    },
    // 5. Avatar dropshadow
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:#fff;filter:drop-shadow(0 12px 28px rgba(58,36,64,0.18)) drop-shadow(0 4px 12px rgba(255,143,179,0.35));display:block;";
      container.appendChild(el);
    },
    // 6. Title sticker dropshadow
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:#fff;filter:drop-shadow(4px 4px 0 #3A2440);display:block;";
      container.appendChild(el);
    },
    // 7. Music backdrop blur (PlayerHeader, FreeTierNotice, QueueModal)
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:block;";
      container.appendChild(el);
    },
    // 8. Music background blur orb (blur 100px)
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:#C2185B;filter:blur(100px);display:block;";
      container.appendChild(el);
    },
    // 9. Music floating notes & progress handle drop-shadow-md
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:#fff;filter:drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06));display:block;";
      container.appendChild(el);
    },
    // 10. Music vinyl sleeve drop-shadow-sm
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background:#fff;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.05));display:block;";
      container.appendChild(el);
    },
    // 11. Music retro dot radial gradient
    () => {
      const el = document.createElement("div");
      el.style.cssText =
        "width:4px;height:4px;background-image:radial-gradient(#3A2440 2px, transparent 2px);background-size:24px 24px;display:block;";
      container.appendChild(el);
    },
  ];

  // Space tasks across 100ms intervals so GPU shader compilation doesn't stutter the Hub or intro
  tasks.forEach((task, i) => {
    const t = setTimeout(() => {
      try {
        task();
      } catch {}
    }, (i + 1) * 100);
    timeouts.push(t);
  });

  // Auto-remove container after 3.0s once all shaders are compiled
  const autoRemoveTimer = setTimeout(() => {
    try {
      container.remove();
    } catch {}
  }, 3000);
  timeouts.push(autoRemoveTimer);

  return cleanup;
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

    // 3. Fallback: Pre-warm shaders during idle if ClickToEnter was skipped (e.g. spotify_auth return)
    if (!hasPrewarmedShaders) {
      prewarmMainShaders();
    }
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
  hasPrewarmedShaders = false;
  hiddenVideos.forEach((v) => {
    v.pause();
    v.removeAttribute("src");
    v.load();
  });
  hiddenVideos.length = 0;
  shaderPrewarmCleanups.forEach((c) => c());
  shaderPrewarmCleanups.length = 0;
}
