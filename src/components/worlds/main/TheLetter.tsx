"use client";

import React, { useState, useRef } from "react";
import { sfx } from "@/lib/audio";
import confetti from "canvas-confetti";

export default function TheLetter() {
  const [isOpen, setIsOpen] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (isOpen) return;
    sfx.pop();
    setIsOpen(true);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#FF8FB3", "#FFEAA7", "#FFB6C1", "#FFF0F5", "#C8EADE"],
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => {
      if (letterRef.current) {
        letterRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 450);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.paper();
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 sm:my-16 px-4 relative z-10 flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
        .font-letter-script {
          font-family: 'Caveat', cursive;
        }
        .font-letter-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .parchment-lines {
          background-image: repeating-linear-gradient(
            transparent,
            transparent 31px,
            rgba(255, 143, 179, 0.18) 31px,
            rgba(255, 143, 179, 0.18) 32px
          );
        }
      `}</style>

      {/* Milestone tag */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#9B2C61] font-bold bg-[#FFF0F5] px-3.5 py-1 rounded-full border border-[#FF8FB3]/50 shadow-xs flex items-center gap-1.5">
          <span>💌</span>
          <span>PHASE 04 ✦ THE LETTER</span>
        </span>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-pixel text-2xl sm:text-3xl text-[#2D1B36] tracking-wider mb-1.5 drop-shadow-[0_2px_0_rgba(255,143,179,0.25)]">
          ONE LAST THING
        </h2>
        <p className="font-baloo text-xs sm:text-sm text-[#6E5D78] font-semibold tracking-wide">
          the obligatory sentimental section (no roasting allowed 🌸)
        </p>
      </div>

      {/* Envelope / Letter Container */}
      <div
        ref={letterRef}
        role={!isOpen ? "button" : undefined}
        tabIndex={!isOpen ? 0 : undefined}
        aria-expanded={isOpen}
        aria-label="Open birthday letter"
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`relative w-full max-w-lg mx-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-3xl ${
          !isOpen
            ? "h-[250px] sm:h-[270px] cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
            : "min-h-[500px]"
        }`}
        onClick={handleOpen}
      >
        {/* ═══ UNOPENED LUXURY ENVELOPE ═══ */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-[#FFF5F8] via-[#FFEBF2] to-[#FFDDE8] border-3 border-[#3A2440] shadow-[8px_8px_0_#3A2440] rounded-3xl transition-all duration-600 z-20 flex flex-col items-center justify-between p-5 overflow-hidden group select-none ${
            isOpen
              ? "opacity-0 pointer-events-none scale-90 translate-y-8"
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* Subtle paper grain */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3A2440_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Decorative Fold / Flap Visual */}
          <div
            className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#FFD1DF] to-[#FFBFD3] border-b-2 border-[#3A2440]/25 origin-top transition-transform duration-300 group-hover:brightness-105"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            aria-hidden="true"
          />

          {/* Airmail / Stamp Header Line */}
          <div className="w-full flex justify-between items-start z-10 pointer-events-none">
            {/* Vintage Postmark Stamp */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-[#FF8FB3]/50 text-[9px] font-retro text-[#9B2C61] tracking-wider">
              <span>✈ PAR AVION</span>
              <span>•</span>
              <span>SPECIAL DELIVERY</span>
            </div>

            {/* Postage Stamp Sticker */}
            <div className="w-12 h-14 bg-white p-1 rounded-md border-2 border-dashed border-[#FF8FB3] shadow-xs rotate-3 flex flex-col items-center justify-center text-center">
              <span className="text-base">🎀</span>
              <span className="font-pixel text-[7px] text-[#9B2C61] font-bold mt-0.5">2026</span>
            </div>
          </div>

          {/* Center: Deluxe 3D Wax Seal with Ribbon & Glow */}
          <div className="relative my-auto flex flex-col items-center z-10">
            {/* Silk ribbon tails */}
            <div
              className="absolute -top-4 w-6 h-14 bg-[#FF6584] opacity-80 -rotate-12 rounded-b-sm shadow-sm"
              aria-hidden="true"
            />
            <div
              className="absolute -top-4 w-6 h-14 bg-[#FF7B98] opacity-80 rotate-12 rounded-b-sm shadow-sm"
              aria-hidden="true"
            />

            {/* Ornate Wax Seal Medallion */}
            <div
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#FF6B8B] via-[#E83562] to-[#B01740] border-3 border-[#FFFDF8] flex items-center justify-center shadow-[0_8px_22px_rgba(176,23,64,0.4),0_2px_4px_rgba(0,0,0,0.2)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative cursor-pointer"
              aria-hidden="true"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
                <span className="text-white text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  💌
                </span>
              </div>
            </div>

            {/* Recipient calligraphy label */}
            <p className="font-letter-serif italic text-[#3A2440] text-sm sm:text-base font-semibold mt-2.5 tracking-wide">
              For: Arhana ✦
            </p>
          </div>

          {/* Bottom Action Pill */}
          <div className="z-10 w-full flex justify-center">
            <span className="font-pixel text-[#3A2440] text-[10px] sm:text-xs tracking-wider font-bold bg-[#FFFDF8] px-5 py-2 rounded-full border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0_#3A2440] group-active:translate-y-[2px] group-active:shadow-none transition-all flex items-center gap-2">
              <span>BREAK THE SEAL</span>
              <span className="text-[#FF4F9A]">✦</span>
            </span>
          </div>
        </div>

        {/* ═══ OPENED DELUXE STATIONERY LETTER ═══ */}
        <div
          className={`bg-[#FFFDF8] border-3 border-[#3A2440] shadow-[10px_10px_0_#3A2440] p-6 sm:p-10 transition-all duration-700 origin-top z-10 relative rounded-3xl overflow-hidden ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "absolute inset-x-0 top-0 opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {/* Lined stationery paper texture */}
          <div className="absolute inset-0 parchment-lines opacity-75 pointer-events-none" />

          {/* Delicate corner floral decorations */}
          <div aria-hidden="true" className="absolute top-2 left-3 text-lg opacity-40 select-none pointer-events-none">✿</div>
          <div aria-hidden="true" className="absolute top-2 right-3 text-lg opacity-40 select-none pointer-events-none">✿</div>
          <div aria-hidden="true" className="absolute bottom-3 left-4 text-sm opacity-35 select-none pointer-events-none">✦</div>

          {/* Washi tape pinning the letter to the desk */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#FFEAA7] border border-black/15 -rotate-1 shadow-xs pointer-events-none flex items-center justify-center">
            <div className="w-full h-full border-x-4 border-dotted border-white/70 opacity-60" />
          </div>

          {/* Letter Body Header */}
          <div className="relative z-10 mt-3 mb-6">
            <div className="flex items-center justify-between border-b-2 border-[#FFD0DC]/60 pb-3">
              <div>
                <p className="font-letter-serif italic text-xs text-[#9B2C61] tracking-wider uppercase font-semibold">
                  A Birthday Note ✦ October 2026
                </p>
                <h3 className="font-letter-script text-4xl sm:text-5xl font-bold text-[#881337] mt-1 tracking-wide leading-tight">
                  Dear Arhana,
                </h3>
              </div>
              <div className="text-3xl select-none animate-bounce-soft" aria-hidden="true">
                🎂
              </div>
            </div>
          </div>

          {/* Letter Prose / Poetry */}
          <div className="font-letter-script text-[#2D1B36] space-y-4 text-2xl sm:text-3xl leading-relaxed relative z-10 pl-1">
            <p className="leading-snug">
              Happy birthday! I wanted to make something special that could capture all the chaos, the memes, and the late-night conversations we&apos;ve shared.
            </p>
            <p className="leading-snug">
              This little corner of the internet is for you. A place where the hamsters run free, the music is always exactly your vibe, and the memories are safely stored.
            </p>
            <p className="leading-snug">
              Thank you for being the incredible, unique, and wonderful person that you are. Here&apos;s to surviving another year and making the next one even better.
            </p>

            {/* Sign-off */}
            <div className="pt-6 font-bold text-[#881337] flex items-end justify-between">
              <div>
                <span className="block text-2xl sm:text-3xl">Love,</span>
                <span className="block text-3xl sm:text-4xl text-[#9B2C61] mt-1 tracking-wide">
                  Your Bestie 🎀
                </span>
              </div>

              {/* Tiny Hamster Doodle Sticker */}
              <div
                aria-hidden="true"
                className="relative w-16 h-16 sm:w-20 sm:h-20 rotate-6 select-none group/doodle"
              >
                <div className="absolute inset-0 bg-[#FFFDF8] rounded-2xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] overflow-hidden p-1">
                  <img
                    src="/hampter/devious hamster doodle.jpeg"
                    alt="Cute hamster doodle"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="absolute -top-2 -right-2 text-xs opacity-0 group-hover/doodle:opacity-100 transition-opacity">✨</span>
              </div>
            </div>
          </div>

          {/* Re-fold Button */}
          <div className="mt-8 pt-4 border-t border-[#FFD0DC]/60 flex justify-center relative z-10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 bg-[#FFF0F5] hover:bg-[#FFE4EE] text-[#881337] border-2 border-[#3A2440] rounded-full font-retro text-[9px] sm:text-[10px] font-bold tracking-widest shadow-[2px_2px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>↺</span>
              <span>FOLD LETTER BACK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
