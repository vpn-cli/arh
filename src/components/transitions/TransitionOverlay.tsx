"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { WorldId } from "@/lib/gameState";

/* ═══════════════════════════════════════════════════════
   TRANSITION SYSTEM
   - SiteLoadOverlay: 5.0s load sequence with poster on first paint
   - TransitionOverlay: 3.0s world transition with 300ms dissolve
   ═══════════════════════════════════════════════════════ */

export interface TransitionClip {
  video: string;
  poster: string;
}

export function getTransitionClip(from: WorldId, to: WorldId): TransitionClip | null {
  const worldKey = from === "home" ? to : from;
  if (worldKey === "main") {
    return {
      video: "/transitions/world-main-3s.mp4",
      poster: "/transitions/world-main-3s.webp",
    };
  }
  if (worldKey === "music") {
    return {
      video: "/transitions/world-music-3s.mp4",
      poster: "/transitions/world-music-3s.webp",
    };
  }
  if (worldKey === "scrapbook") {
    return {
      video: "/transitions/world-scrapbook-3s.mp4",
      poster: "/transitions/world-scrapbook-3s.webp",
    };
  }
  return null;
}

function getFirstPaintTime(): number {
  if (typeof performance === "undefined") return 0;
  try {
    const paintEntries = performance.getEntriesByType("paint");
    const fp = paintEntries.find(
      (e) => e.name === "first-paint" || e.name === "first-contentful-paint"
    );
    if (fp && typeof fp.startTime === "number") {
      return fp.startTime;
    }
  } catch {
    // Safari and unsupported environments fall back to 0 (navigation start)
  }
  return 0;
}

/* ═══════════════════════════════════════════════════════
   1. SITE LOAD OVERLAY (5.0s)
   ═══════════════════════════════════════════════════════ */

interface SiteLoadOverlayProps {
  onComplete: () => void;
}

export function SiteLoadOverlay({ onComplete }: SiteLoadOverlayProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Set video DOM properties synchronously on ref attachment for strict browser autoplay
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.defaultMuted = true;
    }
  }, []);

  useEffect(() => {
    // Check reduced motion
    try {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (media.matches) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Read media query preference on client mount
        setPrefersReducedMotion(true);
      }
    } catch {
      // ignore
    }

    // Try playing video if available
    if (videoRef.current && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay blocked: poster stays up
        });
      }
    }

    // Calculate elapsed time from first paint
    const elapsed = performance.now() - getFirstPaintTime();
    const remainingMs = Math.max(0, 5000 - elapsed);
    const fadeOutDelay = Math.max(0, remainingMs - 300);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, fadeOutDelay);

    const completeTimer = setTimeout(() => {
      // Cleanup video memory on unmount
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
      onCompleteRef.current?.();
    }, remainingMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, []);

  return (
    <div
      data-testid="site-load-overlay"
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-[#0C0A15] transition-opacity duration-300 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Poster image fallback / first-paint layer */}
      {/* eslint-disable-next-line @next/next/no-img-element -- Instant LCP poster rendered before framework hydration */}
      <img
        src="/transitions/load-cat-5s.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Video element - literal muted, autoPlay, playsInline in server HTML */}
      {!prefersReducedMotion && (
        <video
          ref={setVideoRef}
          data-testid="site-load-video"
          autoPlay
          muted
          playsInline
          poster="/transitions/load-cat-5s.webp"
          src="/transitions/load-cat-5s.mp4"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. WORLD TRANSITION OVERLAY (3.0s)
   ═══════════════════════════════════════════════════════ */

interface TransitionOverlayProps {
  fromWorld: WorldId;
  toWorld: WorldId;
  isTransitioning: boolean;
  isTargetPainted?: boolean;
  onFadeComplete?: () => void;
}

export function TransitionOverlay({
  fromWorld,
  toWorld,
  isTransitioning,
  isTargetPainted = false,
  onFadeComplete,
}: TransitionOverlayProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const clip = getTransitionClip(fromWorld, toWorld);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.defaultMuted = true;
    }
  }, []);

  useEffect(() => {
    try {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (media.matches) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Client preference check on mount
        setPrefersReducedMotion(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset transition state when transitioning ends
      setIsFadingOut(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
      return;
    }

    if (typeof window !== "undefined") {
      window.__fadeStartTime = null;
      window.__fadeEndTime = null;
    }

    if (videoRef.current && !prefersReducedMotion) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay blocked: poster stays up
        });
      }
    }

    // Fallback timer: if paint signal does not arrive within 4000ms, start fade-out anyway
    const fallbackFadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 4000);

    return () => {
      clearTimeout(fallbackFadeTimer);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, [isTransitioning, prefersReducedMotion]);

  // Start 300ms dissolve only when the target world has emitted its paint signal
  // AND the 3.0s clip has reached its 2.7s playback window (Math.max(2700, paintedTime)).
  useEffect(() => {
    if (!isTransitioning || !isTargetPainted || isFadingOut) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const triggerFade = () => {
      setIsFadingOut(true);
      if (typeof window !== "undefined") {
        window.__fadeStartTime = performance.now();
      }
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.__fadeEndTime = performance.now();
        }
        onFadeComplete?.();
      }, 300);
    };

    const elapsed = (typeof window !== "undefined" && window.__transitionOverlayStartTime)
      ? performance.now() - window.__transitionOverlayStartTime
      : 2700;
    const remainingTo2700 = Math.max(0, 2700 - elapsed);

    timer = setTimeout(triggerFade, remainingTo2700);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTransitioning, isTargetPainted, isFadingOut, onFadeComplete]);

  if (!clip && !isTransitioning) return null;

  return (
    <div
      data-testid="world-transition-overlay"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0C0A15] pointer-events-none transition-opacity duration-300 ease-out ${
        isTransitioning && !isFadingOut ? "opacity-100" : "opacity-0"
      }`}
      style={{
        transitionDuration: isFadingOut ? "300ms" : "150ms",
      }}
    >
      {clip && (
        <>
          {/* Companion poster */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Instant fallback poster before video decode */}
          <img
            src={clip.poster}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Single reused video element */}
          {!prefersReducedMotion && (
            <video
              ref={setVideoRef}
              data-testid="world-transition-video"
              autoPlay
              muted
              playsInline
              poster={clip.poster}
              src={clip.video}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </>
      )}
    </div>
  );
}

export default TransitionOverlay;
