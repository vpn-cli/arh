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

export function preloadWorld(worldId: string) {
  if (worldId === "main") {
    (MainWorld as any).preload?.();
    return import("./main/MainWorld");
  } else if (worldId === "music") {
    (MusicWorld as any).preload?.();
    return import("./music/MusicWorld");
  } else if (worldId === "scrapbook") {
    (ScrapbookWorld as any).preload?.();
    return import("./scrapbook/ScrapbookWorld");
  }
}

export default function WorldRouter() {
  const { currentWorld, previousWorld, isTransitioning, transitionTarget } = useGameState();
  const [stagedWorld, setStagedWorld] = useState<WorldId>(currentWorld);

  // Warm world clips & posters when Hub is visible and idle
  useEffect(() => {
    if (currentWorld === "home" && !isTransitioning) {
      preloadWorldTransitions();
    }
  }, [currentWorld, isTransitioning]);

  // Staged mount timing: keep previous world mounted during video playback,
  // then mount target world at 2.7s right before the 300ms overlay fade-out begins.
  useEffect(() => {
    if (!isTransitioning) {
      setStagedWorld(currentWorld);
      return;
    }

    setStagedWorld(previousWorld || currentWorld);
    const timer = setTimeout(() => {
      setStagedWorld(transitionTarget || currentWorld);
    }, 2700);
    return () => clearTimeout(timer);
  }, [isTransitioning, currentWorld, previousWorld, transitionTarget]);

  const fromWorld = previousWorld || currentWorld;
  const toWorld = transitionTarget || currentWorld;

  return (
    <div className="relative w-full min-h-screen">
      {/* Cinematic Transition Overlay with video clip & companion poster */}
      <TransitionOverlay
        fromWorld={fromWorld}
        toWorld={toWorld}
        isTransitioning={isTransitioning}
      />

      {/* World content - rendered behind overlay */}
      <div className="w-full min-h-screen">
        {stagedWorld === "home" && <HomeWorld onPortalIntent={preloadWorld} />}
        {stagedWorld === "main" && <MainWorld />}
        {stagedWorld === "music" && <MusicWorld />}
        {stagedWorld === "scrapbook" && <ScrapbookWorld />}
      </div>
    </div>
  );
}
