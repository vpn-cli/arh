"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { sfx } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import HeroStickerBomb from "./HeroStickerBomb";

export default function TheAdventureHero() {
  const [avatarBooped, setAvatarBooped] = useState(false);
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const [isMascotTapped, setIsMascotTapped] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const handleScrollToPhase1 = () => {
    sfx.select();
    const phase1 = document.getElementById("phase-01-terminal");
    if (phase1) {
      phase1.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  const handleAvatarClick = () => {
    sfx.pop();
    setAvatarBooped(true);
    setTimeout(() => setAvatarBooped(false), 600);

    // Touch devices / clicks: show "aur bhai" for 2s, then revert
    setIsMascotTapped(true);
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setIsMascotTapped(false);
    }, 2000);
  };

  const showGreeting = isMascotHovered || isMascotTapped;
  const bubbleText = showGreeting ? "aur bhai" : "psst… scroll ↓";

  return (
    <section
      data-testid="the-adventure-hero"
      aria-label="Main World Introduction"
      className="w-full h-screen h-[100svh] min-h-[620px] flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-6 snap-start select-none"
    >
      {/* ═══ SCATTERED STICKER PACK (BEHIND CONTENT Z-10) ═══ */}
      <HeroStickerBomb />

      {/* ═══ HERO CONTENT (VERTICALLY & HORIZONTALLY CENTERED) ═══ */}
      <div className="w-full max-w-lg flex flex-col items-center text-center relative z-20">
        {/* Guide Avatar with Pink Radial Glow, Peeking Hamster, Stickers & Speech Bubble */}
        <div className="relative flex flex-col items-center justify-center mb-2.5 sm:mb-3">
          {/* Soft pink radial glow behind the mascot */}
          <div
            aria-hidden="true"
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 143, 179, 0.45) 0%, rgba(255, 182, 193, 0.20) 55%, transparent 75%)",
            }}
          />


          {/* Sticker 2: Satin bow near top-left of Kitty */}
          <div
            className="absolute top-1 -left-5 sm:-left-7 w-8 h-8 sm:w-9 sm:h-9 rotate-12 z-20 pointer-events-none select-none hero-sticker-wiggle"
            style={{ ["--sticker-rot" as string]: "12deg" }}
            aria-hidden="true"
          >
            <Image
              src="/images/elements/bow_satin.webp"
              alt=""
              width={36}
              height={36}
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          {/* Sticker 3: Sparkle / star near bottom-right of Kitty */}
          <div
            className="absolute bottom-2 -right-6 sm:-right-8 w-7 h-7 sm:w-8 sm:h-8 -rotate-6 z-20 pointer-events-none select-none hero-sticker-wiggle"
            style={{ ["--sticker-rot" as string]: "-6deg" }}
            aria-hidden="true"
          >
            <Image
              src="/images/elements/star_top_right.webp"
              alt=""
              width={32}
              height={32}
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          {/* Sticker 4: Sweet cherries near top-right of Kitty */}
          <div
            className="absolute top-6 -right-7 sm:-right-9 w-7 h-7 sm:w-8 sm:h-8 rotate-6 z-20 pointer-events-none select-none hero-sticker-wiggle"
            style={{ ["--sticker-rot" as string]: "6deg" }}
            aria-hidden="true"
          >
            <Image
              src="/images/elements/cherries.webp"
              alt=""
              width={32}
              height={32}
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          {/* Speech Bubble: EXACTLY ONE bubble exists. Swaps between "psst… scroll ↓" and "aur bhai" */}
          <div
            aria-hidden="true"
            data-testid="mascot-speech-bubble"
            className={`absolute -top-3.5 sm:-top-4 -right-10 sm:-right-14 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] rounded-xl px-2.5 py-1 text-[9px] sm:text-[10px] font-retro text-[#3A2440] font-bold tracking-wider select-none pointer-events-none rotate-3 motion-safe:animate-bounce-soft z-30 transition-transform duration-150 ease-out ${
              showGreeting ? "scale-105" : "scale-100"
            }`}
          >
            <span key={bubbleText} className="inline-block bubble-squish-in">
              {bubbleText}
            </span>
            {/* Cute speech bubble pointer tail */}
            <div
              className="absolute -bottom-1.5 left-3 w-2.5 h-2.5 bg-[#FFFDF8] border-r-2 border-b-2 border-[#3A2440] rotate-45"
              aria-hidden="true"
            />
          </div>

          {/* Mascot Button (Single button, no tooltip/title attribute, no secondary bubble) */}
          <button
            id="guide-cat-avatar"
            type="button"
            onClick={handleAvatarClick}
            onMouseEnter={() => {
              sfx.hover();
              setIsMascotHovered(true);
            }}
            onMouseLeave={() => setIsMascotHovered(false)}
            onFocus={() => setIsMascotHovered(true)}
            onBlur={() => setIsMascotHovered(false)}
            className={`relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 select-none cursor-pointer transition-transform duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-3xl group z-10 ${
              avatarBooped
                ? "scale-110 -rotate-6"
                : "hover:scale-105 hover:rotate-2 hero-float-anim"
            }`}
            aria-label="Boop Hello Kitty guide avatar"
          >
            <Image
              src="/images/portals/hk-main.webp"
              alt="Guide"
              width={224}
              height={224}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(58,36,64,0.18)] drop-shadow-[0_4px_12px_rgba(255,143,179,0.35)] select-none pointer-events-none transition-transform duration-300"
              priority
            />
          </button>
        </div>

        {/* Title "THE ADVENTURE" — Sticker style with white outline + offset shadow + bow perched on "A" */}
        <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wider mb-2.5 sm:mb-3 leading-tight adventure-title-sticker select-none">
          <span>THE </span>
          <span className="relative inline-block">
            <span className="relative z-0">A</span>
            {/* Bow perched atop the "A" */}
            <span
              className="absolute -top-3 sm:-top-4.5 -left-1 sm:-left-2 w-6 h-6 sm:w-7 sm:h-7 -rotate-12 pointer-events-none select-none z-10 drop-shadow-xs"
              aria-hidden="true"
            >
              <Image
                src="/images/elements/bow_satin.webp"
                alt=""
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </span>
          </span>
          <span>DVENTURE</span>
        </h1>

        {/* Subtitle Description Card — Exactly preserved */}
        <div className="relative max-w-lg bg-[#FFFDF8] px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl border-2 border-[#3A2440] shadow-[4px_4px_0_#3A2440] mb-4 sm:mb-5">
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#FFB6C1]/80 border border-black/10 rounded-xs rotate-1 pointer-events-none shadow-2xs"
            style={{
              clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
            }}
            aria-hidden="true"
          />
          <p className="font-baloo text-sm sm:text-base text-[#3A2440] font-semibold leading-relaxed">
            welcome to the main storyline. scroll down to relive our questionable decisions, crack unhinged puzzles, and pretend you&apos;re surprised.
          </p>
        </div>

        {/* Pixel "▶ CONTINUE" Pill — Replaces pink triangle, gentle pulse */}
        <button
          id="hero-down-indicator"
          type="button"
          onClick={handleScrollToPhase1}
          data-cursor="pointer"
          aria-label="Continue to Phase 01: The Terminal"
          className="group min-h-[44px] px-5 py-2.5 bg-[#FFFDF8] hover:bg-[#FFEAA7] active:bg-[#FFD868] text-[#3A2440] font-retro text-xs sm:text-sm tracking-wider font-bold rounded-full border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center gap-2 motion-safe:animate-pulse"
        >
          <span className="text-[#FF8FB3] group-hover:text-[#9B2C61] transition-colors" aria-hidden="true">
            ▶
          </span>
          <span>CONTINUE</span>
        </button>
      </div>
    </section>
  );
}
