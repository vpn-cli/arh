"use client";

import React, { useState } from "react";
import Image from "next/image";
import { sfx } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function TheAdventureHero() {
  const [avatarBooped, setAvatarBooped] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

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
  };

  return (
    <section
      data-testid="the-adventure-hero"
      aria-label="Main World Introduction"
      className="w-full h-screen h-[100svh] min-h-[620px] max-h-[1050px] flex flex-col justify-between items-center relative overflow-hidden pt-16 sm:pt-20 pb-0 snap-start select-none"
    >
      {/* ═══ 3-COLUMN HERO CONTENT (VERTICALLY CENTERED) ═══ */}
      <div className="flex-1 w-full max-w-6xl px-4 sm:px-6 flex items-center justify-center md:justify-between gap-4 lg:gap-8 relative z-10 my-auto">
        {/* ─── LEFT COLUMN: 2 TILTED POLAROIDS (DESKTOP ONLY) ─── */}
        <aside
          aria-label="Left Scrapbook Polaroids"
          className="hidden md:flex flex-col items-center justify-center gap-6 lg:gap-7 shrink-0 w-36 sm:w-44 lg:w-48 select-none z-10"
        >
          {/* Polaroid 1: Evidence #1 (Tilted Left ~ -8°) */}
          <div
            data-cursor="polaroid"
            className="group relative w-36 sm:w-40 lg:w-44 bg-white p-2.5 pb-4 sm:p-3 sm:pb-5 rounded-xl border-2 border-[#3A2440]/15 shadow-[0_8px_20px_rgba(58,36,64,0.12),0_2px_4px_rgba(0,0,0,0.06)] -rotate-[8deg] hover:rotate-0 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(58,36,64,0.18)] transition-all duration-300 ease-out cursor-pointer"
          >
            {/* Mint washi tape tab on top */}
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-11 h-4 bg-[#B8E6D0]/90 rounded-xs -rotate-2 border border-black/10 pointer-events-none shadow-2xs"
              style={{
                clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
              }}
              aria-hidden="true"
            />
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#FFCCD8] bg-[#FFF8FA]">
              <img
                src="/hampter/Hamster smirk.jpeg"
                alt="Evidence #1 photo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
              />
            </div>
            <p className="font-letter-handwritten text-center text-[#7A1E42] text-base lg:text-lg font-bold mt-2 leading-none">
              evidence #1
            </p>
          </div>

          {/* Polaroid 2: Certified Menace (Tilted Right ~ +5°) */}
          <div
            data-cursor="polaroid"
            className="group relative w-36 sm:w-40 lg:w-44 bg-white p-2.5 pb-4 sm:p-3 sm:pb-5 rounded-xl border-2 border-[#3A2440]/15 shadow-[0_8px_20px_rgba(58,36,64,0.12),0_2px_4px_rgba(0,0,0,0.06)] rotate-[5deg] hover:rotate-0 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(58,36,64,0.18)] transition-all duration-300 ease-out cursor-pointer"
          >
            {/* Butter yellow washi tape tab on top */}
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-11 h-4 bg-[#FFEAA7]/90 rounded-xs rotate-3 border border-black/10 pointer-events-none shadow-2xs"
              style={{
                clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
              }}
              aria-hidden="true"
            />
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#FFCCD8] bg-[#FFF8FA]">
              <img
                src="/hampter/devious hamster doodle.jpeg"
                alt="Certified menace photo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
              />
            </div>
            <p className="font-letter-handwritten text-center text-[#7A1E42] text-base lg:text-lg font-bold mt-2 leading-none">
              certified menace
            </p>
          </div>
        </aside>

        {/* ─── CENTER STACK: MASCOT, STICKERS, SPEECH BUBBLE, TITLE, DESC & BUTTON ─── */}
        <div className="w-full max-w-lg flex flex-col items-center text-center relative z-20 shrink-0">
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

            {/* Sticker 1: Hamster peeking from behind Hello Kitty */}
            <div
              className="absolute -bottom-1 -left-7 sm:-left-9 w-12 h-12 sm:w-14 sm:h-14 -rotate-12 z-0 pointer-events-none select-none hero-sticker-wiggle"
              style={{ ["--sticker-rot" as string]: "-12deg" }}
              aria-hidden="true"
            >
              <Image
                src="/images/crop_hamp.png"
                alt=""
                width={56}
                height={56}
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>

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

            {/* Speech Bubble: "psst… scroll ↓" */}
            <div
              aria-hidden="true"
              className="absolute -top-3.5 sm:-top-4 -right-10 sm:-right-14 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] rounded-xl px-2.5 py-1 text-[9px] sm:text-[10px] font-retro text-[#3A2440] font-bold tracking-wider select-none pointer-events-none rotate-3 motion-safe:animate-bounce-soft z-30"
            >
              <span>psst… scroll ↓</span>
              {/* Cute speech bubble pointer tail */}
              <div
                className="absolute -bottom-1.5 left-3 w-2.5 h-2.5 bg-[#FFFDF8] border-r-2 border-b-2 border-[#3A2440] rotate-45"
                aria-hidden="true"
              />
            </div>

            {/* Mascot Button (Exact image, copy and interactive boop preserved) */}
            <button
              id="guide-cat-avatar"
              type="button"
              onClick={handleAvatarClick}
              onMouseEnter={() => sfx.hover()}
              className={`relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 select-none cursor-pointer transition-transform duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-3xl group z-10 ${
                avatarBooped
                  ? "scale-110 -rotate-6"
                  : "hover:scale-105 hover:rotate-2 hero-float-anim"
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

              {/* Dynamic hover / boop reaction tag */}
              <div
                aria-hidden="true"
                className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] rounded-full text-[9px] sm:text-[10px] font-retro text-[#3A2440] font-bold tracking-wider pointer-events-none transition-all duration-300 ${
                  avatarBooped
                    ? "scale-125 -top-6 opacity-100"
                    : "opacity-0 group-hover:opacity-100 -top-2"
                }`}
              >
                {avatarBooped ? "BOOP! 🌸" : "heyy! ✨"}
              </div>
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

        {/* ─── RIGHT COLUMN: PLAYER CARD & OVERLAPPING POLAROID (DESKTOP ONLY) ─── */}
        <aside
          aria-label="Right Scrapbook Elements"
          className="hidden md:flex flex-col items-center justify-center gap-4 lg:gap-5 shrink-0 w-44 sm:w-52 lg:w-56 select-none z-10"
        >
          {/* Player Card Sticker (Pixel / GameBoy style matching nav pills) */}
          <div
            className="relative w-full bg-[#FFFDF8] p-3 sm:p-4 rounded-2xl border-2 border-[#3A2440] shadow-[4px_4px_0_#3A2440] rotate-[3.5deg] hover:rotate-0 transition-transform duration-300 ease-out select-none cursor-default"
            aria-label="Player Card for Maahi"
          >
            {/* Pink washi tape on top */}
            <div
              className="absolute -top-2.5 left-5 w-12 h-4 bg-[#FFB6C1]/90 rounded-xs -rotate-2 border border-black/10 pointer-events-none shadow-2xs"
              style={{
                clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
              }}
              aria-hidden="true"
            />

            {/* Header row with GameBoy hearts */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-dashed border-[#FFCCD8]">
              <span className="font-retro text-[8.5px] lg:text-[9px] text-[#9B2C61] tracking-widest font-extrabold uppercase">
                ✦ PLAYER CARD ✦
              </span>
              <span className="text-[10px] text-[#FF4F9A]" aria-hidden="true">
                ♥♥♥
              </span>
            </div>

            {/* Player details */}
            <div className="space-y-1.5 text-left font-retro text-[8px] lg:text-[8.5px] leading-relaxed text-[#3A2440]">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[#881337] font-bold">PLAYER 1:</span>
                <span className="font-extrabold text-[#2D1B36]">MAAHI</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[#881337] font-bold">LEVEL:</span>
                {/* TODO: [age, ask me — leave a TODO placeholder "??"] */}
                <span className="font-extrabold text-[#9B2C61] animate-pulse">??</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[#881337] font-bold shrink-0">CLASS:</span>
                <span className="font-extrabold text-[#2D1B36] truncate">chaos gremlin</span>
              </div>
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-dashed border-[#FFCCD8]">
                <span className="text-[#881337] font-bold shrink-0">NEXT QUEST:</span>
                <span className="font-extrabold text-[#FF4F9A]">OKAYAMA ✈</span>
              </div>
            </div>
          </div>

          {/* Overlapping Polaroid (Tilted Left ~ -4.5°) */}
          <div
            data-cursor="polaroid"
            className="group relative -mt-3.5 sm:-mt-4 ml-4 sm:ml-6 w-36 sm:w-40 lg:w-44 bg-white p-2.5 pb-4 sm:p-3 sm:pb-5 rounded-xl border-2 border-[#3A2440]/15 shadow-[0_8px_20px_rgba(58,36,64,0.12),0_2px_4px_rgba(0,0,0,0.06)] -rotate-[4.5deg] hover:rotate-0 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(58,36,64,0.18)] transition-all duration-300 ease-out cursor-pointer z-10"
          >
            {/* Peach washi tape on top */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-11 h-3.5 bg-[#FFD0DC]/95 rounded-xs rotate-2 border border-black/10 pointer-events-none shadow-2xs"
              style={{
                clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
              }}
              aria-hidden="true"
            />
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-[#FFCCD8] bg-[#FFF8FA]">
              <img
                src="/hampter/YAAAA hamster.jpeg"
                alt="Partner in crime photo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
              />
            </div>
            <p className="font-letter-handwritten text-center text-[#7A1E42] text-base lg:text-lg font-bold mt-2 leading-none">
              partner in crime ♡
            </p>
          </div>
        </aside>
      </div>

      {/* ═══ BOTTOM FULL-WIDTH MARQUEE RIBBON (PINK WASHI TAPE BAND) ═══ */}
      <div
        aria-label="Birthday Marquee Announcement"
        className="w-full shrink-0 relative z-20 py-2 sm:py-2.5 bg-[#FF8FB3]/95 backdrop-blur-xs border-y-2 border-dashed border-[#881337]/35 shadow-[0_-2px_12px_rgba(255,143,179,0.25)] overflow-hidden flex items-center"
      >
        <div className="hero-marquee-track">
          <div className="flex shrink-0 items-center font-retro text-[9px] sm:text-[11px] text-[#5C1632] font-bold tracking-widest uppercase">
            <span>happy birthday maahi ✿ okayama bound ✿ level up ✿ certified menace ✿&nbsp;</span>
            <span>happy birthday maahi ✿ okayama bound ✿ level up ✿ certified menace ✿&nbsp;</span>
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center font-retro text-[9px] sm:text-[11px] text-[#5C1632] font-bold tracking-widest uppercase"
          >
            <span>happy birthday maahi ✿ okayama bound ✿ level up ✿ certified menace ✿&nbsp;</span>
            <span>happy birthday maahi ✿ okayama bound ✿ level up ✿ certified menace ✿&nbsp;</span>
          </div>
        </div>
      </div>
    </section>
  );
}
