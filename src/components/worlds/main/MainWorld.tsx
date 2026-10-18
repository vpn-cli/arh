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
import ScrollRibbon from "./ScrollRibbon";
import PhaseTracker from "./PhaseTracker";
import PhaseSection from "./PhaseSection";
import TheAdventureHero from "./TheAdventureHero";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useNotifyWorldPainted } from "@/lib/paintSignal";

gsap.registerPlugin(ScrollTrigger);

export default function MainWorld() {
  const { goHome, setMainWorldScrollY } = useGameState();
  useNotifyWorldPainted("main");
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  useEffect(() => {
    // Always reboot terminal fresh whenever user lands on the page
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem("kitty_terminal_unlocked");
    } catch {}
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    try {
      sessionStorage.setItem("kitty_terminal_unlocked", "true");
    } catch {}
  };

  const handleReset = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem("kitty_terminal_unlocked");
    } catch {}
  };

  // Ensure on page load we smoothly transition to the cat mascot at the top, not the terminal
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Ensure on page load we are positioned at the top hero cat without fighting scroll
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    return () => {
      setMainWorldScrollY(window.scrollY);
    };
  }, [setMainWorldScrollY]);

  return (
    <div
      ref={containerRef}
      data-testid="main-world"
      className="relative w-full min-h-screen bg-[#FAF5E9] text-[#2D1B36] overflow-x-clip selection:bg-[#FF8FB3]/40"
    >
      {/* ═══ WORLD AMBIENCE & FIXED BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
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

        {/* Calmer soft radial cream glow behind center content column (no blur filter for performance) */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 50%, rgba(250, 245, 233, 0.82) 0%, rgba(250, 245, 233, 0.45) 55%, transparent 95%)",
          }}
        />

        {/* Ambient floating pixel motifs */}
        <div
          aria-hidden="true"
          className="absolute top-[15%] left-[6%] text-3xl opacity-30 motion-safe:animate-float"
          style={{ animationDelay: "0s" }}
        >
          🌸
        </div>
        <div
          aria-hidden="true"
          className="absolute top-[35%] right-[8%] text-3xl opacity-30 motion-safe:animate-float"
          style={{ animationDelay: "1s" }}
        >
          ⭐
        </div>
        <div
          aria-hidden="true"
          className="absolute top-[60%] left-[8%] text-3xl opacity-30 motion-safe:animate-float"
          style={{ animationDelay: "2s" }}
        >
          🎀
        </div>
        <div
          aria-hidden="true"
          className="absolute top-[80%] right-[10%] text-3xl opacity-30 motion-safe:animate-float"
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
          className="pointer-events-auto group min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] rounded-xl flex items-center gap-2 hover:bg-[#FFEAA7] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0_#3A2440] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer"
          aria-label="Return to Home World"
        >
          <span className="text-[#3A2440] text-xs font-pixel group-hover:-translate-x-1 transition-transform" aria-hidden="true">
            ◀
          </span>
          <span className="font-retro text-[10px] sm:text-[11px] text-[#3A2440] tracking-[2px] uppercase font-bold">
            HOME WORLD
          </span>
        </button>

        <div className="min-h-[44px] px-4 py-2 bg-[#FFF0F5] border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] rounded-xl flex items-center gap-1.5 pointer-events-auto">
          <span className="font-retro text-[10px] text-[#9B2C61] tracking-[2px] font-bold">
            MAIN WORLD 🎀
          </span>
        </div>
      </header>

      {/* ═══ PHASE NAVIGATION TRACKER (Fixed on Right Edge, Hidden on Mobile < 768px) ═══ */}
      <PhaseTracker isUnlocked={isUnlocked} />

      {/* ═══ CONTENT FLOW ═══ */}
      <main
        ref={mainRef}
        className="relative z-10 w-full flex flex-col items-center pb-8 sm:pb-12"
      >
        {/* Ribbon Thread Connecting Phases (Hidden on Mobile < 768px) */}
        <ScrollRibbon
          containerRef={mainRef}
          startElementId="hero-down-indicator"
          endElementId="end-of-transmission"
          className="hidden md:block"
        />

        {/* 1. HERO SECTION */}
        <TheAdventureHero />

        {/* 2. THE STORY PHASES */}
        <div id="kitty-terminal" className="w-full relative flex flex-col items-center z-10">
          {/* Phase 01: ASCII Kitty Terminal */}
          <PhaseSection id="phase-01-terminal">
            <AsciiSection onUnlock={handleUnlock} onReset={handleReset} isUnlocked={isUnlocked} />
          </PhaseSection>

          {!isUnlocked ? (
            /* Locked Storyline Gate */
            <div
              id="end-of-transmission"
              className="w-full max-w-xl mx-auto my-6 p-6 sm:p-8 bg-[#FFFDF8] border-2 border-dashed border-[#3A2440]/35 rounded-2xl text-center flex flex-col items-center gap-3 animate-fade-in shadow-[4px_4px_0_#3A2440]/15 relative z-10"
            >
              <span className="text-4xl animate-bounce-soft" aria-hidden="true">🔒</span>
              <h2 className="font-pixel text-lg sm:text-xl text-[#3A2440] font-bold tracking-wide">
                STORYLINE LOCKED ✦ CLEARANCE REQUIRED
              </h2>
              <p className="font-baloo text-xs sm:text-sm text-[#4A3855] max-w-md font-semibold leading-relaxed">
                answer the 3 clearance questions in kittyOS above to unlock the secret vault, memories &amp; letter.
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.select();
                  handleUnlock();
                }}
                className="mt-2 min-h-[44px] px-5 py-2.5 bg-[#FFEAA7] hover:bg-[#FFD868] text-[#3A2440] font-retro text-[10px] sm:text-xs tracking-wider font-bold rounded-xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>BYPASS &amp; SKIP TERMINAL</span>
                <span aria-hidden="true">⏩</span>
              </button>
            </div>
          ) : (
            <>
              {/* Phase 02: Mystery Birthday Chest */}
              <PhaseSection id="phase-02-vault" className="z-[50]">
                <BirthdayVault />
              </PhaseSection>

              {/* Phase 03: The Edit Cinema */}
              <PhaseSection id="phase-03-edit" className="z-20">
                <TheEdit />
              </PhaseSection>

              {/* Phase 04: The Letter */}
              <PhaseSection id="phase-04-letter" className="z-10 !pb-3 md:!pb-4">
                <TheLetter />
              </PhaseSection>
            </>
          )}
        </div>

        {/* 3. RETURN TO HUB */}
        {isUnlocked && (
          <div
            id="end-of-transmission"
            className="mt-6 sm:mt-8 text-center relative z-20 flex flex-col items-center gap-3"
          >
            <p className="font-retro text-[10px] sm:text-xs text-[#4A3855] tracking-[2px] font-bold uppercase">
              END OF TRANSMISSION ✦ THANKS FOR VISITING
            </p>
            <button
              type="button"
              onClick={() => {
                sfx.select();
                goHome();
              }}
              onMouseEnter={() => sfx.hover()}
              className="group min-h-[44px] px-7 py-3 bg-[#FFEAA7] hover:bg-[#FFD868] border-2 border-[#3A2440] text-[#3A2440] font-retro text-[11px] sm:text-xs tracking-[2px] font-bold rounded-xl shadow-[4px_4px_0_#3A2440] hover:shadow-[2px_2px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center gap-2"
            >
              <span aria-hidden="true">◀</span>
              <span>RETURN TO HUB</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
