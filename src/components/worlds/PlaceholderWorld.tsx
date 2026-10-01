"use client";

import React from "react";
import { useGameState, WorldId } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════
   PLACEHOLDER WORLD — Temporary shell for worlds that
   haven't been built yet (Main, Music, Scrapbook).
   
   These will be replaced in Phases 4, 9, and 10.
   ═══════════════════════════════════════════════════════ */

interface PlaceholderWorldProps {
  worldId: WorldId;
}

const WORLD_META: Record<string, { title: string; emoji: string; message: string; hamster: string; color: string }> = {
  main: {
    title: "MAIN WORLD",
    emoji: "🌟",
    message: "the birthday adventure awaits here...",
    hamster: "/hampter/devious hamster doodle.jpeg",
    color: "#FFD166",
  },
  music: {
    title: "MUSIC WORLD",
    emoji: "🎵",
    message: "your personal playlist is loading...",
    hamster: "/hampter/Hamster Stickers.jpeg",
    color: "#FF8FB3",
  },
  scrapbook: {
    title: "SCRAPBOOK",
    emoji: "📸",
    message: "memories are being developed...",
    hamster: "/hampter/so cuteee i love it frrr.jpeg",
    color: "#B9D7C0",
  },
};

export default function PlaceholderWorld({ worldId }: PlaceholderWorldProps) {
  const { goHome } = useGameState();
  const meta = WORLD_META[worldId] || WORLD_META.main;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-[#0C0A15]">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-10"
        style={{ backgroundColor: meta.color }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-md">
        {/* Hamster */}
        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[#2E2A52] shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#1C1A33] animate-chill-breathe">
          <Image
            src={meta.hamster}
            alt="hamster"
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <div>
          <span className="text-3xl mb-2 block">{meta.emoji}</span>
          <h1
            className="font-pixel text-2xl sm:text-3xl font-bold tracking-wider drop-shadow-[0_3px_0_#100E1C] mb-2"
            style={{ color: meta.color }}
          >
            {meta.title}
          </h1>
          <p className="font-retro text-[9px] text-[#8C7A99] tracking-[2px]">
            {meta.message}
          </p>
        </div>

        {/* Construction notice */}
        <div className="px-4 py-3 bg-[#1C1A33] border border-[#383359] rounded-sm shadow-[3px_3px_0_rgba(16,14,28,0.6)]">
          <p className="font-retro text-[8px] text-[#FFD166] tracking-wider mb-1">
            ⚠ UNDER CONSTRUCTION
          </p>
          <p className="font-retro text-[7px] text-[#524B7A] tracking-wider">
            this world is being built with extra care ♡
          </p>
        </div>

        {/* Back to Home button */}
        <button
          type="button"
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="group relative mt-4 px-6 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_4px_0_#523A12,0_10px_16px_rgba(0,0,0,0.5)] active:translate-y-[4px] active:shadow-[0_0_0_#523A12] transition-all duration-100 cursor-pointer"
          aria-label="Return to Home World"
        >
          <span className="font-retro font-bold text-xs text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors flex items-center gap-2">
            <span>◀</span>
            <span>BACK TO HOME</span>
          </span>
        </button>
      </div>
    </div>
  );
}
