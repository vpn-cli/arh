"use client";

import React from "react";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import ThreeDScrapbook from "./ThreeDScrapbook";

export default function ScrapbookWorld() {
  const { goHome } = useGameState();

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#FFF4F6] text-[#20233F] selection:bg-[#FF8FB3] selection:text-[#20233F] flex flex-col justify-between overflow-hidden">
      {/* 
        🎀 HOW TO ADD A GIF BACKGROUND 🎀 
        1. Place your GIF (e.g., 'cute-bg.gif') in the 'public' folder.
        2. Uncomment the <img> tag below and change the src.
        3. That's it! It will loop automatically in the background.
      */}
      <img
        src="/background.jpeg"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
      />

      {/* Aesthetic Cozy Wallpaper Pattern with warm pastel dots & faint grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(#FFB6C1 2px, transparent 2px),
            linear-gradient(to right, rgba(255, 182, 193, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 182, 193, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 48px 48px, 48px 48px',
          opacity: 0.85
        }}
      />

      {/* Floating Sparkles ✨ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[#FFB6C1]/40 animate-pulse font-pixel"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              fontSize: `${10 + Math.random() * 20}px`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* Cozy Aesthetic Ambient Pastel Glows in Corners */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFE4A1]/35 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#DFD5F5]/45 rounded-full blur-[90px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#FFFFFF]/70 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Cute Desk Doodles / Stickers in Corners */}
      <div className="absolute top-6 right-8 pointer-events-none z-20 hidden md:flex items-center gap-3">
        <div className="px-3 py-1.5 bg-[#FFF3D8] border-2 border-[#FFB6C1] rounded-xl shadow-[3px_3px_0_#FFB6C1] rotate-[3deg] font-pixel text-xs text-[#FF8FB3] font-bold">
          ⭐ MEMORY CORNER
        </div>
        <div className="w-10 h-10 rounded-full bg-[#FFD0DC] border-2 border-[#FFB6C1] shadow-[2px_2px_0_#FFB6C1] flex items-center justify-center text-lg rotate-[-6deg]">
          🌸
        </div>
      </div>

      <div className="absolute bottom-6 left-8 pointer-events-none z-20 hidden md:flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#B8E6D0] border-2 border-[#FFB6C1] shadow-[2px_2px_0_#FFB6C1] flex items-center justify-center text-sm rotate-[-4deg]">
          ☕
        </div>
        <div className="px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#FFB6C1] rounded-xl shadow-[2px_2px_0_#FFB6C1] font-pixel text-[11px] text-[#FF8FB3] font-bold">
          FREN CONTRACT ✦ EST. 2024
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
          className="pointer-events-auto group px-4 py-2 bg-[#FFFFFF] rounded-2xl border-3 border-[#FFB6C1] shadow-[4px_4px_0_#FFB6C1] flex items-center gap-2 hover:bg-[#FFF3D8] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#FFB6C1] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"
        >
          <span className="text-[#FF8FB3] text-xs font-pixel mt-0.5 group-hover:-translate-x-1 transition-transform">◀</span>
          <span className="font-retro text-[8px] sm:text-[9px] text-[#FF8FB3] tracking-[2px] uppercase font-bold">
            HUB WORLD
          </span>
        </button>

        <div className="px-4 py-2 bg-[#FFFFFF] rounded-2xl border-3 border-[#FFB6C1] shadow-[4px_4px_0_#FFB6C1] flex items-center gap-2">
          <span className="font-retro text-[8px] sm:text-[9px] text-[#FF8FB3] tracking-[2px] font-bold">
            ✦ FAKE JAIN SHOTS ✦
          </span>
        </div>
      </header>

      {/* Main 3D Canvas Scene */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center">
        <ThreeDScrapbook />
      </main>

      {/* Bottom Subtle Navigation Tips */}
      <footer className="relative z-30 pb-3 text-center pointer-events-none">
        <p className="font-retro text-[7px] sm:text-[8px] text-[#FF8FB3] tracking-[2px]">
          [CLICK ANYWHERE ON PAGE TO FLIP ✦ CLICK PHOTO TO EXPAND]
        </p>
      </footer>
    </div>
  );
}
