"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGameState, WorldId } from "@/lib/gameState";
import HomeWorld from "./HomeWorld";
import { TransitionOverlay, getTransitionClip } from "../transitions/TransitionOverlay";
import { preloadWorldTransitions } from "@/lib/transitionPreloader";
import { TARGET_WORLD_PAINTED_EVENT, isTestMetricsEnabled } from "@/lib/paintSignal";
import { track } from "@vercel/analytics";
import { IsOutgoingWorldContext } from "@/context/OutgoingWorldContext";

export { IsOutgoingWorldContext };

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
    <div className="min-h-screen w-full bg-[#FFF4F6]" />
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
  const { currentWorld, previousWorld, isTransitioning, transitionTarget, completeTransition, revealWorld, transitionStartTime } = useGameState();
  const [clipStagedWorld, setClipStagedWorld] = useState<WorldId | null>(null);
  const [isTargetPainted, setIsTargetPainted] = useState(false);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const worldContainerRef = useRef<HTMLDivElement | null>(null);
  const outgoingContainerRef = useRef<HTMLDivElement | null>(null);
  const [prevTransitioning, setPrevTransitioning] = useState(false);
  const [pointerOrigin, setPointerOrigin] = useState<{ x: number; y: number } | null>(null);

  if (isTransitioning && !prevTransitioning) {
    setPrevTransitioning(true);
    setPointerOrigin(pointerPosRef.current ? { ...pointerPosRef.current } : null);
  } else if (!isTransitioning && prevTransitioning) {
    setPrevTransitioning(false);
    setPointerOrigin(null);
  }

  const fromWorld = previousWorld || currentWorld;
  const toWorld = transitionTarget || currentWorld;
  const clip = getTransitionClip(fromWorld, toWorld);
  const isClipHop = Boolean(clip);

  // Synchronous world mapping:
  // For clip hops: staging managed via clipStagedWorld (fromWorld for 0.6s, then toWorld)
  // For crossfade hops: target is toWorld (mounts at t=0), outgoing is fromWorld (in outgoingContainerRef)
  // When idle: target is currentWorld, outgoing is null
  let activeTarget: WorldId | null = currentWorld;
  let activeOutgoing: WorldId | null = null;

  if (isTransitioning) {
    if (isClipHop) {
      activeTarget = clipStagedWorld ?? fromWorld;
      activeOutgoing = null;
    } else {
      activeTarget = toWorld;
      activeOutgoing = fromWorld;
    }
  }

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

  useEffect(() => {
    try {
      track("world_view", { world: currentWorld });
    } catch {}
  }, [currentWorld]);

  // Mount timing choreography:
  // - Clip hops (hub->main, hub->music): Outgoing world remains mounted from 0s to 0.5s (while iris covers).
  //   Target world mounts at 0.5s (after iris covers screen).
  // - Crossfade hops (all world->hub, and hub->scrapbook):
  //   Target world mounts immediately at t=0.
  //   Outgoing world stays mounted in outgoingContainerRef at opacity 1 until paint signal.
  //   300ms crossfade starts only after target's paint signal arrives.
  useEffect(() => {
    if (!isTransitioning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset staged clip state when transitioning completes
      setClipStagedWorld(null);
      setIsTargetPainted(false);
      return;
    }

    setIsTargetPainted(false);

    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      if (!window.__transitionOverlayStartTime) {
        window.__transitionOverlayStartTime = performance.now();
      }
      window.__targetMountTime = performance.now();
    }

    if (isClipHop) {
      setClipStagedWorld(fromWorld);
      const timer = setTimeout(() => {
        setClipStagedWorld(toWorld);
        if (typeof window !== "undefined" && isTestMetricsEnabled()) {
          window.__targetMountTime = performance.now();
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      if (typeof window !== "undefined" && isTestMetricsEnabled()) {
        window.__targetMountTime = performance.now();
      }
    }
  }, [isTransitioning, fromWorld, toWorld, isClipHop]);

  // Stable callback for HomeWorld paint signal
  const handleHomeWorldPainted = useCallback(() => {
    if (typeof window !== "undefined" && isTestMetricsEnabled() && !window.__targetPaintedTime) {
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
      if (typeof window !== "undefined" && isTestMetricsEnabled() && !window.__targetPaintedTime) {
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

  const handleTransitionComplete = useCallback(() => {
    revealWorld();
    completeTransition();
  }, [revealWorld, completeTransition]);

  return (
    <div className="relative w-full min-h-screen">
      {/* Cinematic Transition Overlay with GSAP iris choreography & video clip */}
      <TransitionOverlay
        fromWorld={fromWorld}
        toWorld={toWorld}
        isTransitioning={isTransitioning}
        isTargetPainted={isTargetPainted}
        onFadeComplete={handleTransitionComplete}
        pointerOrigin={pointerOrigin}
        worldContainerRef={worldContainerRef}
        outgoingContainerRef={outgoingContainerRef}
        transitionStartTime={transitionStartTime}
      />

      {/* Target world content */}
      <div
        ref={worldContainerRef}
        data-testid="world-content-container"
        className="w-full min-h-screen"
      >
        {activeTarget === "home" && (
          <>
            <HomeWorld onPortalIntent={preloadWorld} />
            {isTransitioning && toWorld === "home" && (
              <HomeWorldPaintSignal onPainted={handleHomeWorldPainted} />
            )}
          </>
        )}
        {activeTarget === "main" && <MainWorld />}
        {activeTarget === "music" && <MusicWorld />}
        {activeTarget === "scrapbook" && <ScrapbookWorld />}
      </div>

      {/* Outgoing world container during crossfade hops */}
      {isTransitioning && activeOutgoing && (
        <div
          ref={outgoingContainerRef}
          data-testid="outgoing-world-container"
          className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
          style={{ opacity: 1 }}
        >
          <IsOutgoingWorldContext.Provider value={true}>
            {activeOutgoing === "home" && <HomeWorld onPortalIntent={preloadWorld} />}
            {activeOutgoing === "main" && <MainWorld />}
            {activeOutgoing === "music" && <MusicWorld />}
            {activeOutgoing === "scrapbook" && <ScrapbookWorld />}
          </IsOutgoingWorldContext.Provider>
        </div>
      )}
    </div>
  );
}
