"use client";

import React from "react";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import ThreeDScrapbook from "./ThreeDScrapbook";

export default function ScrapbookWorld() {
  const { goHome } = useGameState();

  return (
    <div className="relative w-full min-h-screen bg-[#FFF4F6] text-[#20233F] selection:bg-[#FF8FB3] selection:text-[#20233F] flex flex-col justify-between overflow-x-hidden">
      {/* Aesthetic Cozy Wallpaper Pattern with warm pastel dots & faint grid */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ 
          backgroundImage: `
            radial-gradient(#FFB6C1 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(32, 35, 63, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(32, 35, 63, 0.03) 1px, transparent 1px)
          `, 
          backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          opacity: 0.85
        }} 
      />

      {/* Cozy Aesthetic Ambient Pastel Glows in Corners */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFE4A1]/35 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#DFD5F5]/45 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#FFFFFF]/70 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Cute Desk Doodles / Stickers in Corners */}
      <div className="absolute top-6 right-8 pointer-events-none z-20 hidden md:flex items-center gap-3">
        <div className="px-3 py-1.5 bg-[#FFF3D8] border-2 border-[#20233F] shadow-[3px_3px_0_#20233F] rotate-[3deg] font-pixel text-xs text-[#20233F] font-bold">
          ⭐ MEMORY CORNER
        </div>
        <div className="w-8 h-8 rounded-full bg-[#FFD0DC] border-2 border-[#20233F] shadow-[2px_2px_0_#20233F] flex items-center justify-center text-sm rotate-[-6deg]">
          🌸
        </div>
      </div>

      <div className="absolute bottom-6 left-8 pointer-events-none z-20 hidden md:flex items-center gap-2">
        <div className="w-7 h-7 bg-[#B8E6D0] border-2 border-[#20233F] shadow-[2px_2px_0_#20233F] flex items-center justify-center text-xs rotate-[-4deg]">
          ☕
        </div>
        <div className="px-2.5 py-1 bg-[#FFFFFF] border-2 border-[#20233F] shadow-[2px_2px_0_#20233F] font-pixel text-[11px] text-[#4B4E6A] font-bold">
          COZY ALBUM ✦ EST. 2024
        </div>
      </div>

      {/* Top Floating Navigation Bar */}
      <header className="relative z-40 w-full p-4 sm:p-6 flex justify-between items-center pointer-events-none">
        <button
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="pointer-events-auto group px-4 py-2 bg-[#FFFFFF] border-3 border-[#20233F] shadow-[4px_4px_0_#20233F] flex items-center gap-2 hover:bg-[#FFF3D8] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#20233F] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
        >
          <span className="text-[#20233F] text-xs font-pixel mt-0.5 group-hover:-translate-x-1 transition-transform">◀</span>
          <span className="font-retro text-[8px] sm:text-[9px] text-[#20233F] tracking-[2px] uppercase font-bold">
            HUB WORLD
          </span>
        </button>

        <div className="px-4 py-2 bg-[#FFFFFF] border-3 border-[#20233F] shadow-[4px_4px_0_#20233F] flex items-center gap-2">
          <span className="font-retro text-[8px] sm:text-[9px] text-[#FF8FB3] tracking-[2px] font-bold">
            ✦ 3D SCRAPBOOK ✦
          </span>
        </div>
      </header>

      {/* Main 3D Canvas Scene */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center">
        <ThreeDScrapbook />
      </main>

      {/* Bottom Subtle Navigation Tips */}
      <footer className="relative z-30 pb-3 text-center pointer-events-none">
        <p className="font-retro text-[7px] sm:text-[8px] text-[#20233F]/70 tracking-[2px]">
          [CLICK ANYWHERE ON PAGE TO FLIP ✦ CLICK PHOTO TO EXPAND]
        </p>
      </footer>
    </div>
  );
}
