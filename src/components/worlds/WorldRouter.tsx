"use client";

import React from "react";
import { useGameState } from "@/lib/gameState";
import HomeWorld from "./HomeWorld";
import PlaceholderWorld from "./PlaceholderWorld";

import MainWorld from "./main/MainWorld";

/* ═══════════════════════════════════════════════════════
   WORLD ROUTER — Renders the current world with
   transition effects. This replaces file-based routing
   to maintain the single-page game feel.
   ═══════════════════════════════════════════════════════ */

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
        {currentWorld === "home" && <HomeWorld />}
        {currentWorld === "main" && <MainWorld />}
        {currentWorld === "music" && <PlaceholderWorld worldId="music" />}
        {currentWorld === "scrapbook" && <PlaceholderWorld worldId="scrapbook" />}
      </div>
    </div>
  );
}
