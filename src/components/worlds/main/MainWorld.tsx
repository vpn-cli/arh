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
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export default function MainWorld() {
  const { goHome, mainWorldScrollY, setMainWorldScrollY } = useGameState();
  const heroRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [avatarBooped, setAvatarBooped] = React.useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("kitty_terminal_unlocked") === "true") {
        setIsUnlocked(true);
      }
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

    // Smoothly scroll to the top hero cat on mount
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      setMainWorldScrollY(window.scrollY);
    };
  }, [setMainWorldScrollY]);

  // Entrance animations for hero respecting reduced motion
  useEffect(() => {
    if (!heroRef.current) return;

    if (prefersReducedMotion) {
      gsap.set(heroRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    // Smooth entrance transition for the guide cat mascot
    if (catRef.current) {
      gsap.fromTo(
        catRef.current,
        { opacity: 0, scale: 0.85, y: -16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.75, ease: "back.out(1.4)" }
      );
    }

    const otherChildren = Array.from(heroRef.current.children).filter(
      (el) => el !== catRef.current
    );

    gsap.fromTo(
      otherChildren,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.15, ease: "power2.out" }
    );
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#FAF5E9] text-[#2D1B36] overflow-x-hidden selection:bg-[#FF8FB3]/40"
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

      {/* ═══ CONTENT FLOW ═══ */}
      <main className="relative z-10 w-full flex flex-col items-center pt-24 sm:pt-32 pb-36">
        {/* 1. HERO SECTION */}
        <div
          ref={heroRef}
          className="w-full max-w-2xl px-4 flex flex-col items-center text-center mb-8 sm:mb-12 relative z-10"
        >
          {/* Guide Avatar — Enlarge sticker, frame-free with cute interactive boop */}
          <button
            ref={catRef}
            id="guide-cat-avatar"
            type="button"
            onClick={() => {
              sfx.pop();
              setAvatarBooped(true);
              setTimeout(() => setAvatarBooped(false), 600);
            }}
            onMouseEnter={() => sfx.hover()}
            className={`relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 mb-4 select-none cursor-pointer transition-transform duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-3xl group ${
              avatarBooped
                ? "scale-110 -rotate-6"
                : "hover:scale-105 hover:rotate-2 motion-safe:animate-float"
            }`}
            aria-label="Boop Hello Kitty guide avatar"
            title="Click to boop!"
          >
            <Image
              src="/images/portals/hk-main.webp"
              alt="Guide"
              width={224}
              height={224}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(58,36,64,0.18)] drop-shadow-[0_4px_12px_rgba(255,143,179,0.35)] select-none pointer-events-none transition-transform duration-300"
              priority
            />
            {/* Cute mini speech tag floating above on hover or click */}
            <div
              aria-hidden="true"
              className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] rounded-full text-[10px] sm:text-xs font-retro text-[#3A2440] font-bold tracking-wider pointer-events-none transition-all duration-300 ${
                avatarBooped
                  ? "scale-125 -top-6 opacity-100"
                  : "opacity-0 group-hover:opacity-100 -top-2"
              }`}
            >
              {avatarBooped ? "BOOP! 🌸" : "heyy! ✨"}
            </div>
          </button>

          {/* Title */}
          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2D1B36] tracking-wider mb-3 leading-tight drop-shadow-[0_2px_0_rgba(255,143,179,0.3)]">
            THE ADVENTURE
          </h1>

          {/* Subtitle Card */}
          <div className="relative max-w-lg bg-[#FFFDF8] px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl border-2 border-[#3A2440] shadow-[4px_4px_0_#3A2440] mb-6">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#FFB6C1]/80 border border-black/10 rounded-xs rotate-1 pointer-events-none" />
            <p className="font-baloo text-sm sm:text-base text-[#3A2440] font-semibold leading-relaxed">
              welcome to the main storyline. scroll down to relive our questionable decisions, crack unhinged puzzles, and pretend you&apos;re surprised.
            </p>
          </div>

          {/* Down Indicator with Smooth Scroll Navigation */}
          <button
            type="button"
            onClick={() => document.getElementById("kitty-terminal")?.scrollIntoView({ behavior: "smooth" })}
            aria-label="Scroll down to storyline phases"
            className="min-h-[44px] min-w-[44px] p-2 rounded-full motion-safe:animate-bounce opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center justify-center"
          >
            <span aria-hidden="true" className="text-[#FF8FB3] text-xl font-pixel">▼</span>
          </button>
        </div>

        {/* 2. THE STORY PHASES */}
        <div id="kitty-terminal" className="w-full relative flex flex-col items-center gap-6 sm:gap-10 px-4 z-10 scroll-mt-24">
          {/* Phase 01: ASCII Kitty Terminal */}
          <div className="w-full">
            <AsciiSection onUnlock={handleUnlock} onReset={handleReset} isUnlocked={isUnlocked} />
          </div>

          {!isUnlocked ? (
            /* Locked Storyline Gate */
            <div className="w-full max-w-xl mx-auto my-6 p-6 sm:p-8 bg-[#FFFDF8] border-2 border-dashed border-[#3A2440]/35 rounded-2xl text-center flex flex-col items-center gap-3 animate-fade-in shadow-[4px_4px_0_#3A2440]/15">
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
              <div id="phase-02-vault" className="w-full relative z-[50]">
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
            </>
          )}
        </div>

        {/* 3. RETURN TO HUB */}
        {isUnlocked && (
          <div className="mt-16 sm:mt-20 text-center relative z-20 flex flex-col items-center gap-3">
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
