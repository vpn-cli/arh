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
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#FF8FB3", "#FFEAA7", "#FFB6C1", "#FFF0F5"],
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => {
      if (letterRef.current) {
        letterRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 400);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-12 sm:my-16 px-4 relative z-10 flex flex-col items-center">
      {/* Milestone tag */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#9B2C61] font-bold bg-[#FFF0F5] px-3 py-1 rounded-full border border-[#FF8FB3]/40 shadow-xs">
          PHASE 04 ✦ THE LETTER
        </span>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-pixel text-2xl sm:text-3xl text-[#2D1B36] tracking-wider mb-1">
          ONE LAST THING
        </h2>
        <p className="font-baloo text-xs sm:text-sm text-[#6E5D78] font-semibold tracking-wide">
          the obligatory sentimental section (no roasting allowed)
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
        className={`relative w-full max-w-md mx-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-2xl ${
          !isOpen ? "h-[220px] cursor-pointer hover:scale-102 active:scale-98" : ""
        }`}
        onClick={handleOpen}
      >
        {/* Unopened Envelope State */}
        <div
          className={`absolute inset-0 bg-[#FFEBF2] border-3 border-[#3A2440] shadow-[6px_6px_0_#3A2440] rounded-2xl transition-all duration-500 z-20 flex flex-col items-center justify-center overflow-hidden ${
            isOpen ? "opacity-0 pointer-events-none scale-95 translate-y-6" : "opacity-100"
          }`}
        >
          {/* Envelope Flap Polygon */}
          <div
            className="absolute top-0 left-0 w-full h-1/2 border-b-2 border-[#3A2440]/20 bg-[#FFD4E2] origin-top opacity-60 pointer-events-none"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            aria-hidden="true"
          />

          {/* Wax Ribbon Seal */}
          <div className="w-16 h-16 rounded-full bg-[#FF6584] border-3 border-[#FFFDF8] flex items-center justify-center shadow-[0_4px_10px_rgba(58,36,64,0.2)] z-10 relative group" aria-hidden="true">
            <span className="text-white text-2xl group-hover:scale-120 transition-transform select-none">
              🎀
            </span>
          </div>

          <p className="font-retro text-[#2D1B36] text-[10px] sm:text-xs tracking-wider mt-6 uppercase font-bold bg-[#FFFDF8] px-4 py-2 rounded-full border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440]">
            BREAK THE SEAL (NO CRYING) ✦
          </p>
        </div>

        {/* Opened Letter Paper State */}
        <div
          className={`bg-[#FFFDF8] border-3 border-[#3A2440] shadow-[8px_8px_0_#3A2440] p-6 sm:p-10 transition-all duration-700 origin-top z-10 relative rounded-2xl ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "absolute inset-x-0 top-0 opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap');
            .font-handwriting {
              font-family: 'Caveat', cursive;
            }
          `}</style>

          {/* Washi tape pinning the letter */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#FFEAA7] border border-black/10 -rotate-1 shadow-xs pointer-events-none" />

          {/* Letter Body */}
          <div className="font-handwriting text-[#2D1B36] space-y-4 text-2xl sm:text-3xl leading-relaxed mt-2 relative z-10">
            <p className="font-bold text-3xl sm:text-4xl text-[#9B2C61]">
              Dear Arhana,
            </p>
            <p className="pl-2">
              Happy birthday! I wanted to make something special that could capture all the chaos, the memes, and the late-night conversations we&apos;ve shared.
            </p>
            <p className="pl-2">
              This little corner of the internet is for you. A place where the hamsters run free, the music is always exactly your vibe, and the memories are safely stored.
            </p>
            <p className="pl-2">
              Thank you for being the incredible, unique, and wonderful person that you are. Here&apos;s to surviving another year and making the next one even better.
            </p>
            <p className="pt-4 font-bold text-2xl sm:text-3xl text-[#9B2C61] pl-2">
              Love,
              <br />
              <span className="text-xl tracking-wider mt-1 block opacity-90">
                Your Bestie 🎀
              </span>
            </p>
          </div>

          {/* Tiny hamster doodle sticker in the corner */}
          <div aria-hidden="true" className="absolute bottom-5 right-5 opacity-70 w-14 h-14 rotate-6 pointer-events-none">
            <img
              src="/hampter/devious hamster doodle.jpeg"
              alt=""
              className="w-full h-full object-cover mix-blend-multiply rounded-full border border-black/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
