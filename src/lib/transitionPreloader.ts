"use client";

/* ═══════════════════════════════════════════════════════
   TRANSITION PRELOADER
   Warms world transition clips & posters when Hub is idle.
   Skips on saveData or 2G network connections.
   Uses hidden video elements so browser media subsystem caches
   the range-request byte chunks for immediate playback.
   ═══════════════════════════════════════════════════════ */

let isPreloaded = false;
const hiddenVideos: HTMLVideoElement[] = [];

export function preloadWorldTransitions() {
  if (isPreloaded || typeof window === "undefined") return;

  // Check network conditions: skip on saveData or 2g
  const nav = navigator as any;
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
  if (conn?.saveData || conn?.effectiveType === "2g") {
    return;
  }

  const runPreload = () => {
    if (isPreloaded) return;
    isPreloaded = true;

    const clips = [
      {
        video: "/transitions/world-main-3s.mp4",
        poster: "/transitions/world-main-3s.webp",
      },
      {
        video: "/transitions/world-music-3s.mp4",
        poster: "/transitions/world-music-3s.webp",
      },
      {
        video: "/transitions/world-scrapbook-3s.mp4",
        poster: "/transitions/world-scrapbook-3s.webp",
      },
    ];

    clips.forEach(({ video, poster }) => {
      // 1. Warm poster image in browser image cache
      const img = new Image();
      img.src = poster;

      // 2. Warm video in media player cache using a detached video element with preload="auto"
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
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 3000 });
  } else {
    setTimeout(runPreload, 1200);
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
