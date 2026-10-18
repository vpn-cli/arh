"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
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

const TRANSITION_CLIPS: Record<string, TransitionClip> = {
  main: {
    video: "/transitions/world-main-3s.mp4",
    poster: "/transitions/world-main-3s.webp",
  },
  music: {
    video: "/transitions/world-music-3s.mp4",
    poster: "/transitions/world-music-3s.webp",
  },
  scrapbook: {
    video: "/transitions/world-scrapbook-3s.mp4",
    poster: "/transitions/world-scrapbook-3s.webp",
  },
};

export function getTransitionClip(from: WorldId, to: WorldId): TransitionClip | null {
  const worldKey = from === "home" ? to : from;
  return TRANSITION_CLIPS[worldKey] ?? null;
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
  onFadeStart?: () => void;
  onFadeComplete?: () => void;
  pointerOrigin?: { x: number; y: number } | null;
  worldContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function TransitionOverlay({
  fromWorld,
  toWorld,
  isTransitioning,
  isTargetPainted = false,
  onFadeStart,
  onFadeComplete,
  pointerOrigin,
  worldContainerRef,
}: TransitionOverlayProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isExitStartedRef = useRef(false);
  const transitionStartTimeRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFadeStartRef = useRef(onFadeStart);
  const onFadeCompleteRef = useRef(onFadeComplete);

  useEffect(() => {
    onFadeStartRef.current = onFadeStart;
    onFadeCompleteRef.current = onFadeComplete;
  });

  const clip = getTransitionClip(fromWorld, toWorld);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.defaultMuted = true;
    }
  }, []);

  // Check prefers-reduced-motion
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

  // Cleanup helper for GSAP and video memory
  const cleanupTransition = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (overlayRef.current) {
      overlayRef.current.style.willChange = "";
      overlayRef.current.style.display = "none";
      gsap.set(overlayRef.current, { clearProps: "all" });
    }
    if (worldContainerRef?.current) {
      worldContainerRef.current.style.willChange = "";
      gsap.set(worldContainerRef.current, { clearProps: "all" });
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    isExitStartedRef.current = false;
  }, [worldContainerRef]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupTransition();
    };
  }, [cleanupTransition]);

  const checkAndResumeRef = useRef<() => void>(() => {});

  // Check and resume hold
  const checkAndResume = useCallback(() => {
    if (!isTransitioning || isExitStartedRef.current) return;
    if (!isTargetPainted) return;

    const now = performance.now();
    const elapsed = transitionStartTimeRef.current !== null ? now - transitionStartTimeRef.current : 0;
    const clipTime = videoRef.current && !isNaN(videoRef.current.currentTime) ? videoRef.current.currentTime : 0;

    // Standard motion: resume only when BOTH paint arrived AND clip time >= 2.6s (or elapsed >= 2600ms)
    // Reduced motion: resume when paint arrived AND enter fade has completed (elapsed >= 300ms)
    const isTimeReady = prefersReducedMotion
      ? elapsed >= 300
      : (clipTime >= 2.6 || elapsed >= 2600);

    if (isTimeReady) {
      isExitStartedRef.current = true;
      if (typeof window !== "undefined") {
        window.__fadeStartTime = performance.now();
      }
      onFadeStartRef.current?.();
      if (tlRef.current) {
        tlRef.current.play();
      }
    } else {
      const targetDuration = prefersReducedMotion ? 300 : 2600;
      const remainingMs = Math.max(16, targetDuration - elapsed);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        checkAndResumeRef.current();
      }, remainingMs);
    }
  }, [isTransitioning, isTargetPainted, prefersReducedMotion]);

  useEffect(() => {
    checkAndResumeRef.current = checkAndResume;
  }, [checkAndResume]);

  // Listen for paint signal or time updates to evaluate hold release
  useEffect(() => {
    if (!isTransitioning || isExitStartedRef.current) return;
    checkAndResume();

    const videoEl = videoRef.current;
    if (videoEl && !prefersReducedMotion) {
      videoEl.addEventListener("timeupdate", checkAndResume);
      return () => {
        videoEl.removeEventListener("timeupdate", checkAndResume);
      };
    }
  }, [isTransitioning, isTargetPainted, checkAndResume, prefersReducedMotion]);

  // Main transition orchestration: GSAP timeline and imperative video setup
  useEffect(() => {
    if (!isTransitioning) {
      cleanupTransition();
      return;
    }

    // Initialize timestamps
    transitionStartTimeRef.current = performance.now();
    isExitStartedRef.current = false;
    if (typeof window !== "undefined") {
      window.__fadeStartTime = null;
      window.__fadeEndTime = null;
    }

    const overlayEl = overlayRef.current;
    const worldEl = worldContainerRef?.current;

    // Calculate iris center (default to viewport center for keyboard/ESC)
    const originX = pointerOrigin?.x ?? (typeof window !== "undefined" ? Math.round(window.innerWidth / 2) : 0);
    const originY = pointerOrigin?.y ?? (typeof window !== "undefined" ? Math.round(window.innerHeight / 2) : 0);

    // FIX (Video Bug): Imperatively assign src, load, and play on EVERY transition
    if (videoRef.current && !prefersReducedMotion && clip) {
      const el = videoRef.current;
      el.setAttribute("src", clip.video);
      el.src = clip.video;
      el.load();
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise !== undefined && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Transition video autoplay blocked/rejected, falling back to poster:", err);
          }
        });
      }
    }

    // Set will-change during transition only
    if (overlayEl) {
      overlayEl.style.willChange = prefersReducedMotion
        ? "opacity"
        : "transform, opacity, clip-path";
    }
    if (worldEl) {
      // eslint-disable-next-line react-hooks/immutability -- Mutating DOM node style for hardware acceleration
      worldEl.style.willChange = "transform, opacity";
    }

    // Build single GSAP timeline
    const tl = gsap.timeline({
      paused: false,
    });
    tlRef.current = tl;

    if (prefersReducedMotion) {
      // ══════ REDUCED MOTION TIMELINE (300ms in, hold on paint, 300ms out) ══════
      if (overlayEl) {
        tl.fromTo(
          overlayEl,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power1.inOut" },
          0
        );
      }
      if (worldEl) {
        tl.fromTo(
          worldEl,
          { opacity: 1 },
          { opacity: 0, duration: 0.3, ease: "power1.inOut" },
          0
        );
      }

      // Pause at exit label after 300ms enter
      tl.addLabel("exit", 0.3);
      tl.call(() => {
        if (worldEl) {
          gsap.set(worldEl, { clearProps: "opacity" });
        }
      }, undefined, 0.3);
      if (typeof tl.addPause === "function") {
        tl.addPause("exit");
      }

      // Exit (0.3s)
      if (overlayEl) {
        tl.to(
          overlayEl,
          { opacity: 0, duration: 0.3, ease: "power1.inOut" },
          "exit"
        );
      }
      if (worldEl) {
        tl.fromTo(
          worldEl,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power1.inOut" },
          "exit"
        );
      }
    } else {
      // ══════ FULL GSAP IRIS CHOREOGRAPHY TIMELINE ══════
      // 1. ENTER (0 -> 0.6s):
      // Overlay reveals via circular iris from pointer position
      if (overlayEl) {
        tl.fromTo(
          overlayEl,
          {
            clipPath: `circle(0% at ${originX}px ${originY}px)`,
            scale: 1,
            opacity: 1,
          },
          {
            clipPath: `circle(150% at ${originX}px ${originY}px)`,
            duration: 0.6,
            ease: "power3.inOut",
          },
          0
        );
      }

      // Outgoing world animates scale 1 -> 0.96 and opacity 1 -> 0.6
      if (worldEl) {
        tl.fromTo(
          worldEl,
          {
            scale: 1,
            opacity: 1,
            transformOrigin: `${originX}px ${originY}px`,
          },
          {
            scale: 0.96,
            opacity: 0.6,
            duration: 0.6,
            ease: "power2.in",
          },
          0
        );
      }

      // At 0.6s: iris fully covers screen. Clear outgoing world scale/opacity before hold
      tl.addLabel("exit", 0.6);
      tl.call(() => {
        if (worldEl) {
          gsap.set(worldEl, { clearProps: "transformOrigin,scale,opacity" });
        }
      }, undefined, 0.6);

      // Pause at exit label until BOTH paint signal arrives AND clip time >= 2.6s
      if (typeof tl.addPause === "function") {
        tl.addPause("exit");
      }

      // 2. EXIT (0.5s):
      // Overlay scale 1 -> 1.06, opacity 1 -> 0, ease "power2.out"
      if (overlayEl) {
        tl.to(
          overlayEl,
          {
            scale: 1.06,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
          },
          "exit"
        );
      }

      // Incoming world scale 1.03 -> 1, opacity 0 -> 1, ease "expo.out"
      if (worldEl) {
        tl.fromTo(
          worldEl,
          {
            scale: 1.03,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "expo.out",
          },
          "exit"
        );
      }
    }

    // 3. COMPLETION:
    tl.call(() => {
      if (typeof window !== "undefined") {
        window.__fadeEndTime = performance.now();
      }
      // Clear GSAP inline styles and will-change
      if (overlayEl) {
        overlayEl.style.willChange = "";
        overlayEl.style.display = "none";
        gsap.set(overlayEl, { clearProps: "all" });
      }
      if (worldEl) {
        worldEl.style.willChange = "";
        gsap.set(worldEl, { clearProps: "all" });
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
      onFadeCompleteRef.current?.();
    });

    // 4. HARD SAFETY CAP (4000ms):
    fallbackTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined" && !window.__fadeStartTime) {
        window.__fadeStartTime = performance.now();
      }
      cleanupTransition();
      onFadeStartRef.current?.();
      onFadeCompleteRef.current?.();
    }, 4000);

    return () => {
      cleanupTransition();
    };
  }, [
    isTransitioning,
    clip,
    pointerOrigin?.x,
    pointerOrigin?.y,
    worldContainerRef,
    prefersReducedMotion,
    cleanupTransition,
  ]);

  if (!isTransitioning || !clip) return null;

  const originX = pointerOrigin?.x ?? (typeof window !== "undefined" ? Math.round(window.innerWidth / 2) : 0);
  const originY = pointerOrigin?.y ?? (typeof window !== "undefined" ? Math.round(window.innerHeight / 2) : 0);

  return (
    <div
      ref={overlayRef}
      data-testid="world-transition-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0C0A15] pointer-events-none"
      style={{
        display: isTransitioning ? "flex" : "none",
        clipPath: prefersReducedMotion ? undefined : `circle(0% at ${originX}px ${originY}px)`,
        opacity: prefersReducedMotion ? 0 : 1,
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
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Single reused video element */}
          {!prefersReducedMotion && (
            <video
              ref={setVideoRef}
              data-testid="world-transition-video"
              muted
              playsInline
              poster={clip.poster}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}
        </>
      )}
    </div>
  );
}

export default TransitionOverlay;

