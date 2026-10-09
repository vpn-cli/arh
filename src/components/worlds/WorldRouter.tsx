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

interface WorldLoadingPlaceholderProps {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
}

function WorldLoadingPlaceholder({
  title,
  subtitle,
  emoji,
  color,
}: WorldLoadingPlaceholderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-[#0C0A15] overflow-hidden select-none"
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3 text-center max-w-xs">
        {/* Animated icon */}
        <div className="relative w-14 h-14 flex items-center justify-center rounded-lg bg-[#1C1A33] border-2 border-[#2E2A52] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          <span className="text-2xl animate-bounce">{emoji}</span>
        </div>

        {/* Title */}
        <div
          className="font-pixel text-xs sm:text-sm font-bold tracking-widest drop-shadow-[0_2px_0_#100E1C]"
          style={{ color }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <p className="font-retro text-[8px] sm:text-[9px] text-[#8C7A99] tracking-[2px]">
          {subtitle}
        </p>

        {/* Cute pulsing dots */}
        <div className="flex gap-2 mt-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                animationDelay: `${i * 150}ms`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const MainWorld = dynamic(() => import("./main/MainWorld"), {
  ssr: false,
  loading: () => (
    <WorldLoadingPlaceholder
      title="LOADING MAIN WORLD..."
      subtitle="the birthday adventure awaits..."
      emoji="🌟"
      color="#FFD166"
    />
  ),
});

const MusicWorld = dynamic(() => import("./music/MusicWorld"), {
  ssr: false,
  loading: () => (
    <WorldLoadingPlaceholder
      title="LOADING MUSIC WORLD..."
      subtitle="setting up the tunes..."
      emoji="🎵"
      color="#FF8FB3"
    />
  ),
});

const ScrapbookWorld = dynamic(() => import("./scrapbook/ScrapbookWorld"), {
  ssr: false,
  loading: () => (
    <WorldLoadingPlaceholder
      title="LOADING SCRAPBOOK..."
      subtitle="fetching photos & stickers..."
      emoji="📸"
      color="#B9D7C0"
    />
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
          ${isTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}
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
