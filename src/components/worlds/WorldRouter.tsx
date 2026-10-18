"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGameState, WorldId } from "@/lib/gameState";
import HomeWorld from "./HomeWorld";
import { TransitionOverlay } from "../transitions/TransitionOverlay";
import { preloadWorldTransitions } from "@/lib/transitionPreloader";

/* ═══════════════════════════════════════════════════════
   WORLD ROUTER — Renders the current world with
   cinematic transition clips.
   ═══════════════════════════════════════════════════════ */

const MainWorld = dynamic(() => import("./main/MainWorld"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-[#0C0A15]" />
  ),
});

const MusicWorld = dynamic(() => import("./music/MusicWorld"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-[#0C0A15]" />
  ),
});

const ScrapbookWorld = dynamic(() => import("./scrapbook/ScrapbookWorld"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-[#0C0A15]" />
  ),
});

type PreloadableComponent = React.ComponentType<unknown> & { preload?: () => Promise<unknown> };

export function preloadWorld(worldId: string) {
  if (worldId === "main") {
    (MainWorld as unknown as PreloadableComponent).preload?.();
    return import("./main/MainWorld");
  } else if (worldId === "music") {
    (MusicWorld as unknown as PreloadableComponent).preload?.();
    return import("./music/MusicWorld");
  } else if (worldId === "scrapbook") {
    (ScrapbookWorld as unknown as PreloadableComponent).preload?.();
    return import("./scrapbook/ScrapbookWorld");
  }
}

import { TARGET_WORLD_PAINTED_EVENT } from "@/lib/paintSignal";

function HomeWorldPaintSignal({ onPainted }: { onPainted: () => void }) {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    let a1 = 0;
    let a2 = 0;
    a1 = requestAnimationFrame(() => {
      a2 = requestAnimationFrame(() => {
        if (!hasFiredRef.current) {
          hasFiredRef.current = true;
          onPainted();
        }
      });
    });
    return () => {
      if (a1) cancelAnimationFrame(a1);
      if (a2) cancelAnimationFrame(a2);
    };
  }, [onPainted]);
  return null;
}

export default function WorldRouter() {
  const { currentWorld, previousWorld, isTransitioning, transitionTarget, completeTransition, revealWorld } = useGameState();
  const [stagedWorld, setStagedWorld] = useState<WorldId | null>(currentWorld);
  const [isTargetPainted, setIsTargetPainted] = useState(false);
  const [pointerOrigin, setPointerOrigin] = useState<{ x: number; y: number } | null>(null);

  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const worldContainerRef = useRef<HTMLDivElement | null>(null);

  // Track pointerdown at document level without modifying HomeWorld
  // Keyboard / ESC triggers clear pointer position so they default to viewport center
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      pointerPosRef.current = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        pointerPosRef.current = null;
      }
    };
    window.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  // Snapshot pointer position at transition start
  useEffect(() => {
    if (isTransitioning) {
      setPointerOrigin(pointerPosRef.current ? { ...pointerPosRef.current } : null);
    }
  }, [isTransitioning]);

  // Warm world clips & posters when Hub is visible and idle
  useEffect(() => {
    if (currentWorld === "home" && !isTransitioning) {
      preloadWorldTransitions();
    }
  }, [currentWorld, isTransitioning]);

  // Preload target world JS chunk immediately when transition starts
  useEffect(() => {
    if (isTransitioning && transitionTarget) {
      preloadWorld(transitionTarget);
    }
  }, [isTransitioning, transitionTarget]);

  // Mount timing choreography:
  // - Outgoing world remains mounted from 0s to 0.6s (while iris covers the screen).
  // - Target worlds mount at 0.6s (after iris covers), except hub which mounts at 1.8s.
  useEffect(() => {
    if (!isTransitioning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize staged world when transitioning completes
      setStagedWorld(currentWorld);
      setIsTargetPainted(false);
      return;
    }

    const target = transitionTarget || currentWorld;
    const from = previousWorld || currentWorld;

    // Outgoing world stays mounted until 0.6s
    setStagedWorld(from);
    setIsTargetPainted(false);

    if (typeof window !== "undefined") {
      if (!window.__transitionOverlayStartTime) {
        window.__transitionOverlayStartTime = performance.now();
      }
      window.__targetPaintedTime = null;
      window.__targetMountTime = null;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (target === "home") {
      // Outgoing world unmounts at 0.6s (iris fully covers screen)
      timers.push(
        setTimeout(() => {
          setStagedWorld(null);
        }, 600)
      );

      // Hub mounts at 1.8s (1800ms)
      timers.push(
        setTimeout(() => {
          setStagedWorld("home");
          if (typeof window !== "undefined") {
            window.__targetMountTime = performance.now();
          }
        }, 1800)
      );
    } else {
      // Target world mounts at 0.6s (600ms)
      timers.push(
        setTimeout(() => {
          setStagedWorld(target);
          if (typeof window !== "undefined") {
            window.__targetMountTime = performance.now();
          }
        }, 600)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isTransitioning, currentWorld, previousWorld, transitionTarget]);

  // Stable callback for HomeWorld paint signal
  const handleHomeWorldPainted = useCallback(() => {
    if (typeof window !== "undefined" && !window.__targetPaintedTime) {
      window.__targetPaintedTime = performance.now();
    }
    setIsTargetPainted(true);
  }, []);

  // Listen for paint signal from target world (two rAFs after mount effect)
  useEffect(() => {
    if (!isTransitioning) return;

    const target = transitionTarget || currentWorld;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const handlePaintSignal = (e: Event) => {
      if (e instanceof CustomEvent && e.detail?.world && e.detail.world !== target) {
        // Discard paint signals from non-target worlds
        return;
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (typeof window !== "undefined" && !window.__targetPaintedTime) {
        window.__targetPaintedTime = performance.now();
      }
      setIsTargetPainted(true);
    };

    window.addEventListener(TARGET_WORLD_PAINTED_EVENT, handlePaintSignal);

    // Fallback: if paint signal not received within 4000ms of transition start, trigger anyway
    fallbackTimer = setTimeout(() => {
      handlePaintSignal(new CustomEvent(TARGET_WORLD_PAINTED_EVENT, { detail: { world: target } }));
    }, 4000);

    return () => {
      window.removeEventListener(TARGET_WORLD_PAINTED_EVENT, handlePaintSignal);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isTransitioning, transitionTarget, currentWorld]);

  const fromWorld = previousWorld || currentWorld;
  const toWorld = transitionTarget || currentWorld;

  return (
    <div className="relative w-full min-h-screen">
      {/* Cinematic Transition Overlay with GSAP iris choreography & video clip */}
      <TransitionOverlay
        fromWorld={fromWorld}
        toWorld={toWorld}
        isTransitioning={isTransitioning}
        isTargetPainted={isTargetPainted}
        onFadeStart={revealWorld}
        onFadeComplete={completeTransition}
        pointerOrigin={pointerOrigin}
        worldContainerRef={worldContainerRef}
      />

      {/* World content - rendered behind overlay */}
      <div ref={worldContainerRef} className="w-full min-h-screen">
        {stagedWorld === "home" && (
          <>
            <HomeWorld onPortalIntent={preloadWorld} />
            {isTransitioning && toWorld === "home" && (
              <HomeWorldPaintSignal onPainted={handleHomeWorldPainted} />
            )}
          </>
        )}
        {stagedWorld === "main" && <MainWorld />}
        {stagedWorld === "music" && <MusicWorld />}
        {stagedWorld === "scrapbook" && <ScrapbookWorld />}
      </div>
    </div>
  );
}
