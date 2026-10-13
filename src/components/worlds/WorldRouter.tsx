"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useGameState } from "@/lib/gameState";
import HomeWorld from "./HomeWorld";

/* ═══════════════════════════════════════════════════════
   WORLD ROUTER — Renders the current world with
   transition effects. This replaces file-based routing
   to maintain the single-page game feel.
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
  const { currentWorld, isTransitioning } = useGameState();

  return (
    <div className="relative w-full min-h-screen">
      {/* Transition overlay — cinematic fade */}
      <div
        className={`
          fixed inset-0 z-[100] bg-[#0C0A15] pointer-events-none
          transition-opacity duration-500 ease-in-out
          ${isTransitioning ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* World content */}
      <div
        className={`
          transition-all duration-300 ease-out
          ${isTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100"}
        `}
      >
        {currentWorld === "home" && <HomeWorld onPortalIntent={preloadWorld} />}
        {currentWorld === "main" && <MainWorld />}
        {currentWorld === "music" && <MusicWorld />}
        {currentWorld === "scrapbook" && <ScrapbookWorld />}
      </div>
    </div>
  );
}
