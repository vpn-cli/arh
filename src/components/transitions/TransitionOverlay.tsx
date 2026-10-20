"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { WorldId } from "@/lib/gameState";
import { isTestMetricsEnabled } from "@/lib/paintSignal";

declare global {
  interface Window {
    __activeTl?: unknown;
  }
}

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
    video: "/transitions/world-main-2500ms.mp4",
    poster: "/transitions/world-main-2500ms.webp",
  },
  music: {
    video: "/transitions/world-music-2500ms.mp4",
    poster: "/transitions/world-music-2500ms.webp",
  },
};

export function getTransitionClip(from: WorldId, to: WorldId): TransitionClip | null {
  if (from === "home" && (to === "main" || to === "music")) {
    return TRANSITION_CLIPS[to] ?? null;
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
  onFadeStart?: () => void;
  onFadeComplete?: () => void;
  pointerOrigin?: { x: number; y: number } | null;
  worldContainerRef?: React.RefObject<HTMLDivElement | null>;
  outgoingContainerRef?: React.RefObject<HTMLDivElement | null>;
  transitionStartTime?: number | null;
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
  outgoingContainerRef,
  transitionStartTime,
}: TransitionOverlayProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const transitionIdRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isExitStartedRef = useRef(false);
  const transitionStartTimeRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFadeStartRef = useRef(onFadeStart);
  const onFadeCompleteRef = useRef(onFadeComplete);
  const pointerOriginRef = useRef(pointerOrigin);
  pointerOriginRef.current = pointerOrigin;

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

  const crossfadeRaf1Ref = useRef<number | null>(null);
  const crossfadeRaf2Ref = useRef<number | null>(null);
  const crossfadeCeilingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Teardown video memory only if token matches current transition
  const cleanupVideo = useCallback((id: number) => {
    if (id !== transitionIdRef.current) {
      return;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  }, []);

  // Cleanup helper for GSAP and video memory
  const cleanupTransition = useCallback((id?: number) => {
    if (id !== undefined && id !== transitionIdRef.current) {
      return;
    }
    if (crossfadeRaf1Ref.current) {
      cancelAnimationFrame(crossfadeRaf1Ref.current);
      crossfadeRaf1Ref.current = null;
    }
    if (crossfadeRaf2Ref.current) {
      cancelAnimationFrame(crossfadeRaf2Ref.current);
      crossfadeRaf2Ref.current = null;
    }
    if (crossfadeCeilingTimerRef.current) {
      clearTimeout(crossfadeCeilingTimerRef.current);
      crossfadeCeilingTimerRef.current = null;
    }
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__activeTl = null;
        window.__activeTlCount = Math.max(0, (window.__activeTlCount || 1) - 1);
      }
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__activeSafetyTimers = Math.max(0, (window.__activeSafetyTimers || 1) - 1);
      }
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
    if (outgoingContainerRef?.current) {
      gsap.killTweensOf(outgoingContainerRef.current);
      outgoingContainerRef.current.style.willChange = "";
      gsap.set(outgoingContainerRef.current, { clearProps: "all" });
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    isExitStartedRef.current = false;
  }, [worldContainerRef, outgoingContainerRef]);

  // Clean up on component unmount: unconditionally frees video memory regardless of token
  useEffect(() => {
    return () => {
      cleanupTransition();
    };
  }, [cleanupTransition]);

  const checkAndResumeRef = useRef<() => void>(() => {});

  const startCrossfade = useCallback(() => {
    if (isExitStartedRef.current) return;
    isExitStartedRef.current = true;

    if (crossfadeRaf1Ref.current) {
      cancelAnimationFrame(crossfadeRaf1Ref.current);
      crossfadeRaf1Ref.current = null;
    }
    if (crossfadeRaf2Ref.current) {
      cancelAnimationFrame(crossfadeRaf2Ref.current);
      crossfadeRaf2Ref.current = null;
    }
    if (crossfadeCeilingTimerRef.current) {
      clearTimeout(crossfadeCeilingTimerRef.current);
      crossfadeCeilingTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__activeSafetyTimers = Math.max(0, (window.__activeSafetyTimers || 1) - 1);
      }
    }

    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      window.__fadeStartTime = performance.now();
    }
    onFadeStartRef.current?.();

    const outgoingEl = outgoingContainerRef?.current;
    if (outgoingEl) {
      gsap.to(outgoingEl, {
        opacity: 0,
        duration: 0.3,
        ease: "power1.inOut",
        onComplete: () => {
          if (typeof window !== "undefined" && isTestMetricsEnabled()) {
            window.__fadeEndTime = performance.now();
          }
          if (outgoingContainerRef?.current) {
            outgoingContainerRef.current.style.willChange = "";
            gsap.set(outgoingContainerRef.current, { clearProps: "all" });
          }
          onFadeCompleteRef.current?.();
        },
      });
    } else {
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__fadeEndTime = performance.now();
      }
      onFadeCompleteRef.current?.();
    }
  }, [outgoingContainerRef]);

  // Check and resume hold
  const checkAndResume = useCallback(() => {
    if (!isTransitioning || isExitStartedRef.current) return;

    if (!clip) {
      // Crossfade transition: wait two requestAnimationFrame ticks after target paint signal
      if (!isTargetPainted) return;
      if (crossfadeRaf1Ref.current !== null || crossfadeRaf2Ref.current !== null) return;

      crossfadeRaf1Ref.current = requestAnimationFrame(() => {
        crossfadeRaf1Ref.current = null;
        crossfadeRaf2Ref.current = requestAnimationFrame(() => {
          crossfadeRaf2Ref.current = null;
          startCrossfade();
        });
      });
      return;
    }

    if (!isTargetPainted) return;

    const now = performance.now();
    const effectiveStart = transitionStartTime ?? transitionStartTimeRef.current;
    const elapsed = effectiveStart !== null ? now - effectiveStart : 0;

    // Standard motion: resume only when BOTH paint arrived AND elapsed >= 2100ms from transition start
    // Reduced motion: resume when paint arrived AND enter fade has completed (elapsed >= 300ms)
    const isTimeReady = prefersReducedMotion ? elapsed >= 300 : elapsed >= 2100;

    if (isTimeReady) {
      isExitStartedRef.current = true;
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__fadeStartTime = performance.now();
      }
      onFadeStartRef.current?.();
      if (tlRef.current) {
        tlRef.current.play();
      }
    } else {
      const targetDuration = prefersReducedMotion ? 300 : 2100;
      const remainingMs = Math.max(0, targetDuration - elapsed);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        checkAndResumeRef.current();
      }, remainingMs);
    }
  }, [isTransitioning, isTargetPainted, prefersReducedMotion, clip, outgoingContainerRef, transitionStartTime, startCrossfade]);

  useEffect(() => {
    checkAndResumeRef.current = checkAndResume;
  }, [checkAndResume]);

  // Listen for paint signal to evaluate hold release
  useEffect(() => {
    if (!isTransitioning || isExitStartedRef.current) return;
    checkAndResume();
  }, [isTransitioning, isTargetPainted, checkAndResume]);

  // Main transition orchestration: GSAP timeline and imperative video setup
  useEffect(() => {
    if (!isTransitioning) {
      cleanupTransition(transitionIdRef.current);
      return;
    }

    // Reset fallback state at start of every transition (Requirement C)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset poster fallback state at start of new transition
    setIsFallback(false);

    // Increment transition token (Requirement B)
    transitionIdRef.current += 1;
    const thisTransitionId = transitionIdRef.current;

    // Initialize timestamps
    transitionStartTimeRef.current = transitionStartTime ?? performance.now();
    isExitStartedRef.current = false;
    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      if (!window.__transitionOverlayStartTime) {
        window.__transitionOverlayStartTime = transitionStartTimeRef.current;
      }
      window.__fadeStartTime = null;
      window.__fadeEndTime = null;
    }

    if (!clip) {
      // ══════ CROSSFADE TIMELINE (NO clip, NO poster, NO iris) ══════
      // Outgoing world sits at opacity 1 until hub settles (paint signal + double rAF) or 600ms ceiling after click.
      const outgoingEl = outgoingContainerRef?.current;

      const clickTime = transitionStartTime ?? transitionStartTimeRef.current ?? performance.now();
      const elapsed = performance.now() - clickTime;
      const remainingTo600 = Math.max(0, 600 - elapsed);

      crossfadeCeilingTimerRef.current = setTimeout(() => {
        startCrossfade();
      }, remainingTo600);

      fallbackTimerRef.current = setTimeout(() => {
        if (thisTransitionId !== transitionIdRef.current) return;
        if (isExitStartedRef.current) return;
        if (typeof window !== "undefined" && isTestMetricsEnabled() && !window.__fadeStartTime) {
          window.__fadeStartTime = performance.now();
        }
        if (typeof window !== "undefined" && isTestMetricsEnabled() && !window.__fadeEndTime) {
          window.__fadeEndTime = performance.now();
        }
        cleanupTransition(thisTransitionId);
        onFadeStartRef.current?.();
        onFadeCompleteRef.current?.();
      }, 4000);

      return () => {
        if (crossfadeCeilingTimerRef.current) {
          clearTimeout(crossfadeCeilingTimerRef.current);
          crossfadeCeilingTimerRef.current = null;
        }
        if (crossfadeRaf1Ref.current) {
          cancelAnimationFrame(crossfadeRaf1Ref.current);
          crossfadeRaf1Ref.current = null;
        }
        if (crossfadeRaf2Ref.current) {
          cancelAnimationFrame(crossfadeRaf2Ref.current);
          crossfadeRaf2Ref.current = null;
        }
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        if (outgoingEl) {
          gsap.killTweensOf(outgoingEl);
        }
      };
    }

    const overlayEl = overlayRef.current;
    const worldEl = worldContainerRef?.current;

    // Calculate iris center (default to viewport center for keyboard/ESC)
    const originX = pointerOriginRef.current?.x ?? (typeof window !== "undefined" ? Math.round(window.innerWidth / 2) : 0);
    const originY = pointerOriginRef.current?.y ?? (typeof window !== "undefined" ? Math.round(window.innerHeight / 2) : 0);

    // Video setup with token check and error handling (Requirements A, B, C, D)
    if (videoRef.current && !prefersReducedMotion && clip) {
      const el = videoRef.current;
      el.setAttribute("src", clip.video);
      el.src = clip.video;
      el.load();
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise !== undefined && typeof playPromise.catch === "function") {
        playPromise.catch((err: unknown) => {
          // If a newer transition has already started, ignore stale play rejection
          if (thisTransitionId !== transitionIdRef.current) return;

          const error = err as Error | undefined;
          const errorName = error?.name || "UnknownError";

          // Requirement A:
          // only NotAllowedError -> poster fallback.
          // AbortError -> ignore (log at debug level), do NOT set fallback state.
          // Any other error -> poster fallback + console.warn with error.name.
          if (errorName === "AbortError") {
            if (process.env.NODE_ENV !== "production") {
              console.debug("Transition video play aborted:", err);
            }
            return;
          }

          if (errorName === "NotAllowedError") {
            setIsFallback(true);
            return;
          }

          setIsFallback(true);
          console.warn(`Transition video failed (${errorName}), falling back to poster:`, err);
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
      worldEl.style.willChange = "transform";
    }

    // Build single GSAP timeline
    const tl = gsap.timeline({
      paused: false,
    });
    tlRef.current = tl;

    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      window.__activeTl = tl;
      window.__activeTlCount = (window.__activeTlCount || 0) + 1;
    }

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
      const outgoingEl = outgoingContainerRef?.current;
      if (outgoingEl) {
        tl.fromTo(
          outgoingEl,
          { opacity: 1 },
          { opacity: 0, duration: 0.3, ease: "power1.inOut" },
          0
        );
      }

      // Pause at exit label after 300ms enter
      tl.addLabel("exit", 0.3);
      tl.call(() => {
        if (outgoingEl) {
          gsap.set(outgoingEl, { clearProps: "opacity" });
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
          { opacity: 0, immediateRender: false },
          { opacity: 1, duration: 0.3, ease: "power1.inOut" },
          "exit"
        );
      }
    } else {
      // ══════ FULL GSAP IRIS CHOREOGRAPHY TIMELINE ══════
      // 1. ENTER (0 -> 0.5s):
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
            duration: 0.5,
            ease: "power3.inOut",
          },
          0
        );
      }

      // Outgoing world animates scale 1 -> 0.96 and opacity 1 -> 0.6
      const outgoingEl = outgoingContainerRef?.current;
      if (outgoingEl) {
        tl.fromTo(
          outgoingEl,
          {
            scale: 1,
            opacity: 1,
            transformOrigin: `${originX}px ${originY}px`,
          },
          {
            scale: 0.96,
            opacity: 0.6,
            duration: 0.5,
            ease: "power2.in",
          },
          0
        );
      }

      // At 0.5s: iris fully covers screen. Clear outgoing world scale/opacity before hold
      tl.addLabel("exit", 0.5);
      tl.call(() => {
        if (outgoingEl) {
          gsap.set(outgoingEl, { clearProps: "transformOrigin,scale,opacity" });
        }
      }, undefined, 0.5);

      // Pause at exit label until BOTH paint signal arrives AND elapsed >= 2100ms
      if (typeof tl.addPause === "function") {
        tl.addPause("exit");
      }

      // 2. EXIT (0.4s):
      // Overlay scale 1 -> 1.06, opacity 1 -> 0, ease "power2.out"
      if (overlayEl) {
        tl.to(
          overlayEl,
          {
            scale: 1.06,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out",
          },
          "exit"
        );
      }

      // Incoming world scales 1.03 -> 1, NO opacity tween
      if (worldEl) {
        tl.fromTo(
          worldEl,
          {
            scale: 1.03,
            immediateRender: false,
          },
          {
            scale: 1,
            duration: 0.4,
            ease: "expo.out",
          },
          "exit"
        );
      }
    }

    // 3. COMPLETION:
    tl.call(() => {
      if (thisTransitionId !== transitionIdRef.current) return;
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__fadeEndTime = performance.now();
      }
      // Clear GSAP inline styles and will-change
      if (overlayEl) {
        gsap.set(overlayEl, { clearProps: "all" });
        overlayEl.style.willChange = "";
        overlayEl.style.opacity = "0";
        overlayEl.style.display = "none";
      }
      if (worldEl) {
        worldEl.style.willChange = "";
        gsap.set(worldEl, { clearProps: "all" });
      }
      if (outgoingContainerRef?.current) {
        outgoingContainerRef.current.style.willChange = "";
        gsap.set(outgoingContainerRef.current, { clearProps: "all" });
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
        if (typeof window !== "undefined" && isTestMetricsEnabled()) {
          window.__activeSafetyTimers = Math.max(0, (window.__activeSafetyTimers || 1) - 1);
        }
      }
      cleanupVideo(thisTransitionId);
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__activeTl = null;
        window.__activeTlCount = Math.max(0, (window.__activeTlCount || 1) - 1);
      }
      onFadeCompleteRef.current?.();
    });

    // 4. HARD SAFETY CAP (4000ms):
    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      window.__activeSafetyTimers = (window.__activeSafetyTimers || 0) + 1;
    }
    fallbackTimerRef.current = setTimeout(() => {
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__activeSafetyTimers = Math.max(0, (window.__activeSafetyTimers || 1) - 1);
      }
      if (thisTransitionId !== transitionIdRef.current) return;
      if (isExitStartedRef.current) return;
      if (typeof window !== "undefined" && isTestMetricsEnabled() && !window.__fadeStartTime) {
        window.__fadeStartTime = performance.now();
      }
      cleanupTransition(thisTransitionId);
      onFadeStartRef.current?.();
      onFadeCompleteRef.current?.();
    }, 4000);

    return () => {
      // Stale cleanup guard: do not touch video on re-render / double-invoke if transition is active
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
        if (typeof window !== "undefined" && isTestMetricsEnabled()) {
          window.__activeTl = null;
          window.__activeTlCount = Math.max(0, (window.__activeTlCount || 1) - 1);
        }
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
        if (typeof window !== "undefined" && isTestMetricsEnabled()) {
          window.__activeSafetyTimers = Math.max(0, (window.__activeSafetyTimers || 1) - 1);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Pointer origin is snapshotted via pointerOriginRef at transition start; we do not restart active transition timelines on subsequent pointer events
  }, [
    isTransitioning,
    clip,
    worldContainerRef,
    outgoingContainerRef,
    prefersReducedMotion,
    cleanupTransition,
    cleanupVideo,
  ]);

  if (!isTransitioning) return null;

  if (!clip) {
    return (
      <div
        ref={overlayRef}
        data-testid="world-transition-overlay"
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          display: isTransitioning ? "block" : "none",
          opacity: 0,
        }}
      />
    );
  }

  const originX = pointerOrigin?.x ?? (typeof window !== "undefined" ? Math.round(window.innerWidth / 2) : 0);
  const originY = pointerOrigin?.y ?? (typeof window !== "undefined" ? Math.round(window.innerHeight / 2) : 0);

  return (
    <div
      ref={overlayRef}
      data-testid="world-transition-overlay"
      data-fallback={isFallback ? "true" : "false"}
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
            data-testid="world-transition-poster"
            data-visible={isFallback || prefersReducedMotion ? "true" : "false"}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{
              display: isFallback || prefersReducedMotion ? "block" : "none",
            }}
          />

          {/* Single reused video element */}
          {!prefersReducedMotion && (
            <video
              ref={setVideoRef}
              data-testid="world-transition-video"
              data-visible={!isFallback ? "true" : "false"}
              muted
              playsInline
              poster={clip.poster}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                display: isFallback ? "none" : "block",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default TransitionOverlay;

