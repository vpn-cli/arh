"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AsciiSection from "./AsciiSection";
import BirthdayVault from "./BirthdayVault";
import TheEdit from "./TheEdit";
import TheLetter from "./TheLetter";

gsap.registerPlugin(ScrollTrigger);

export default function MainWorld() {
  const { goHome, mainWorldScrollY, setMainWorldScrollY } = useGameState();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount, save on unmount
  useEffect(() => {
    if (mainWorldScrollY > 0) {
      window.scrollTo({ top: mainWorldScrollY, behavior: "instant" });
    }

    return () => {
      setMainWorldScrollY(window.scrollY);
    };
  }, [mainWorldScrollY, setMainWorldScrollY]);

  // Entrance animations for hero
  useEffect(() => {
    if (!heroRef.current) return;

    gsap.fromTo(
      heroRef.current.children,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "back.out(1.2)" }
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#FAF5E9] text-[#2D1B36] overflow-x-hidden selection:bg-[#FF8FB3]/40"
    >
      {/* ═══ WORLD AMBIENCE & FIXED BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base cream tone */}
        <div className="absolute inset-0 bg-[#FAF5E9]" />

        {/* Main World aesthetic background image (viewport fixed) */}
        <Image
          src="/images/main_world.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center pointer-events-none select-none"
        />

        {/* Soft radial vignette keeping the center readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(250, 245, 233, 0.4) 30%, rgba(250, 245, 233, 0.8) 100%)",
          }}
        />

        {/* Ambient floating pixel motifs */}
        <div
          className="absolute top-[15%] left-[6%] text-3xl opacity-30 animate-float"
          style={{ animationDelay: "0s" }}
        >
          🌸
        </div>
        <div
          className="absolute top-[35%] right-[8%] text-3xl opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        >
          ⭐
        </div>
        <div
          className="absolute top-[60%] left-[8%] text-3xl opacity-30 animate-float"
          style={{ animationDelay: "2s" }}
        >
          🎀
        </div>
        <div
          className="absolute top-[80%] right-[10%] text-3xl opacity-30 animate-float"
          style={{ animationDelay: "1.5s" }}
        >
          ✨
        </div>
      </div>

      {/* ═══ NAVIGATION / HEADER ═══ */}
      <header className="fixed top-0 left-0 w-full p-4 sm:p-6 z-50 flex justify-between items-start pointer-events-none">
        <button
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="pointer-events-auto group px-4 py-2 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] rounded-xl flex items-center gap-2 hover:bg-[#FFEAA7] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_#3A2440] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
          aria-label="Return to Home World"
        >
          <span className="text-[#3A2440] text-xs font-pixel group-hover:-translate-x-1 transition-transform">
            ◀
          </span>
          <span className="font-retro text-[9px] sm:text-[10px] text-[#3A2440] tracking-[2px] uppercase font-bold">
            HOME WORLD
          </span>
        </button>

        <div className="px-3.5 py-1.5 bg-[#FFF0F5] border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] rounded-xl flex items-center gap-1.5">
          <span className="font-retro text-[9px] text-[#9B2C61] tracking-[2px] font-bold">
            MAIN WORLD 🎀
          </span>
        </div>
      </header>

      {/* ═══ CONTENT FLOW ═══ */}
      <main className="relative z-10 w-full flex flex-col items-center pt-24 sm:pt-32 pb-36">
        {/* 1. HERO SECTION */}
        <div
          ref={heroRef}
          className="w-full max-w-2xl px-4 flex flex-col items-center text-center mb-8 sm:mb-12 relative z-10"
        >
          {/* Guide Avatar in Polaroid Frame */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 p-2 bg-[#FFFDF8] rounded-2xl border-2 border-[#3A2440] shadow-[4px_4px_0_#3A2440] relative group animate-float">
            <Image
              src="/images/portals/hk-main.webp"
              alt="Guide"
              width={80}
              height={80}
              className="w-full h-full object-contain select-none pointer-events-none"
              priority
            />
            {/* Cute mini tape */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#FFEAA7] border border-black/10 rounded-xs -rotate-2" />
          </div>

          {/* Title */}
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#2D1B36] tracking-wider mb-3 drop-shadow-[0_2px_0_rgba(255,143,179,0.3)]">
            THE ADVENTURE
          </h1>

          {/* Subtitle Card */}
          <div className="relative max-w-lg bg-[#FFFDF8] px-6 py-4 rounded-2xl border-2 border-[#3A2440] shadow-[4px_4px_0_#3A2440] mb-6">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#FFB6C1]/80 border border-black/10 rounded-xs rotate-1 pointer-events-none" />
            <p className="font-baloo text-sm sm:text-base text-[#4A3B52] font-semibold leading-relaxed">
              welcome to the main storyline. scroll down to relive our questionable decisions, crack unhinged puzzles, and pretend you&apos;re surprised.
            </p>
          </div>

          {/* Down Indicator */}
          <div className="animate-bounce opacity-70">
            <span className="text-[#FF8FB3] text-xl font-pixel">▼</span>
          </div>
        </div>

        {/* 2. THE STORY PHASES */}
        <div className="w-full relative flex flex-col items-center gap-6 sm:gap-10 px-4 z-10">
          {/* Phase 01: ASCII Kitty Terminal */}
          <div className="w-full">
            <AsciiSection />
          </div>

          {/* Phase 02: Mystery Birthday Chest */}
          <div className="w-full relative z-[50]">
            <BirthdayVault />
          </div>

          {/* Phase 03: The Edit Cinema */}
          <div className="w-full relative z-20">
            <TheEdit />
          </div>

          {/* Phase 04: The Letter */}
          <div className="w-full">
            <TheLetter />
          </div>
        </div>

        {/* 3. RETURN TO HUB */}
        <div className="mt-16 sm:mt-20 text-center relative z-20 flex flex-col items-center gap-3">
          <p className="font-retro text-[9px] text-[#7A6388] tracking-[2px] font-bold uppercase">
            END OF TRANSMISSION ✦ THANKS FOR VISITING
          </p>
          <button
            onClick={() => {
              sfx.select();
              goHome();
            }}
            onMouseEnter={() => sfx.hover()}
            className="group px-7 py-3 bg-[#FFEAA7] hover:bg-[#FFD868] border-2 border-[#3A2440] text-[#3A2440] font-retro text-[10px] tracking-[2px] font-bold rounded-xl shadow-[4px_4px_0_#3A2440] hover:shadow-[2px_2px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
          >
            <span>◀</span>
            <span>RETURN TO HUB</span>
          </button>
        </div>
      </main>
    </div>
  );
}
