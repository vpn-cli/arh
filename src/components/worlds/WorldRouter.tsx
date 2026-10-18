"use client";

import React, { useEffect, useState } from "react";
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
  useEffect(() => {
    let a1 = 0;
    let a2 = 0;
    a1 = requestAnimationFrame(() => {
      a2 = requestAnimationFrame(() => {
        if (typeof window !== "undefined") {
          window.__targetPaintedTime = performance.now();
        }
        onPainted();
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
  const [stagedWorld, setStagedWorld] = useState<WorldId>(currentWorld);
  const [isTargetPainted, setIsTargetPainted] = useState(false);

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

  // Mount timing:
  // When target is "home", mount at 1800ms so the hub's card entrance animations
  // synchronize with the reveal dissolve at 2.7s-3.0s.
  // Other worlds mount at t=0 behind the opaque transition overlay.
  useEffect(() => {
    if (!isTransitioning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize staged world when transitioning completes
      setStagedWorld(currentWorld);
      setIsTargetPainted(false);
      return;
    }

    const target = transitionTarget || currentWorld;
    setIsTargetPainted(false);
    if (typeof window !== "undefined") {
      if (!window.__transitionOverlayStartTime) {
        window.__transitionOverlayStartTime = performance.now();
      }
      window.__targetPaintedTime = null;
    }

    if (target === "home") {
      const timer = setTimeout(() => {
        setStagedWorld("home");
        if (typeof window !== "undefined") {
          window.__targetMountTime = performance.now();
        }
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setStagedWorld(target);
      if (typeof window !== "undefined") {
        window.__targetMountTime = performance.now();
      }
    }
  }, [isTransitioning, currentWorld, transitionTarget]);

  // Listen for paint signal from target world (two rAFs after mount effect)
  useEffect(() => {
    if (!isTransitioning) return;

    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const handlePaintSignal = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (typeof window !== "undefined" && !window.__targetPaintedTime) {
        window.__targetPaintedTime = performance.now();
      }
      setIsTargetPainted(true);
    };

    window.addEventListener(TARGET_WORLD_PAINTED_EVENT, handlePaintSignal);

    // Fallback: if paint signal not received within 4000ms of transition start, trigger anyway
    fallbackTimer = setTimeout(handlePaintSignal, 4000);

    return () => {
      window.removeEventListener(TARGET_WORLD_PAINTED_EVENT, handlePaintSignal);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isTransitioning]);

  const fromWorld = previousWorld || currentWorld;
  const toWorld = transitionTarget || currentWorld;

  return (
    <div className="relative w-full min-h-screen">
      {/* Cinematic Transition Overlay with video clip & companion poster */}
      <TransitionOverlay
        fromWorld={fromWorld}
        toWorld={toWorld}
        isTransitioning={isTransitioning}
        isTargetPainted={isTargetPainted}
        onFadeStart={revealWorld}
        onFadeComplete={completeTransition}
      />

      {/* World content - rendered behind overlay */}
      <div className="w-full min-h-screen">
        {stagedWorld === "home" && (
          <>
            <HomeWorld onPortalIntent={preloadWorld} />
            {isTransitioning && toWorld === "home" && (
              <HomeWorldPaintSignal onPainted={() => setIsTargetPainted(true)} />
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
