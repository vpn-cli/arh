"use client";

import React from "react";
import { LETTER_PREAMBLE, LETTER_TITLE } from "./theLetterContent";

export default function TheLetterHeader() {
  return (
    <div className="relative z-10 mt-2 mb-6">
      {/* Top Banner Row: Airmail Badges & Tokyo Postage Stamp */}
      <div className="flex items-start justify-between border-b-2 border-dashed border-[#FFD0DC] pb-4 gap-3 sm:gap-4">
        <div>
          {/* Airmail Badge Pill */}
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FFF0F5] via-[#FFEBF2] to-[#FFF9E6] border border-[#FF8FB3]/60 text-[9px] sm:text-[10px] font-letter-ui font-semibold text-[#881337] tracking-wider mb-2.5 shadow-2xs">
            <span>✈ PAR AVION</span>
            <span>•</span>
            <span>AIRMAIL TO JAPAN</span>
            <span>•</span>
            <span className="hidden sm:inline">SPECIAL DELIVERY 🌸</span>
            <span className="sm:hidden">🌸</span>
          </div>

          {/* Salutation in Pacifico / Caveat */}
          <h3 className="font-letter-title text-4xl sm:text-5xl md:text-6xl text-[#881337] tracking-wide leading-tight flex items-center gap-2 drop-shadow-[0_1px_1px_rgba(255,143,179,0.3)]">
            <span>Dearest Maahi,</span>
            <span className="text-2xl sm:text-3xl text-[#FF7597] font-normal" aria-hidden="true">
              🌸
            </span>
          </h3>
        </div>

        {/* Tokyo Airmail Postage Stamp + Hand-Drawn Wavy Cancellation Mark */}
        <div className="relative flex items-center select-none shrink-0" aria-hidden="true">
          {/* Circular postmark stamp */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#9B2C61]/50 -rotate-12 flex flex-col items-center justify-center text-[7px] font-letter-ui text-[#9B2C61]/80 leading-tight bg-white/80 shadow-2xs">
            <span className="font-bold">TOKYO</span>
            <span className="text-[6px] tracking-wider font-bold">14 OCT</span>
            <span className="text-[8px] text-[#FF7597]">♡</span>
          </div>

          {/* Wavy ink cancellation lines */}
          <svg
            className="w-8 sm:w-10 h-6 text-[#9B2C61]/45 -ml-1 sm:-ml-2"
            viewBox="0 0 60 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M0 10 Q 15 5, 30 10 T 60 10" />
            <path d="M0 20 Q 15 15, 30 20 T 60 20" />
            <path d="M0 30 Q 15 25, 30 30 T 60 30" />
          </svg>

          {/* Perforated Cute Japanese Postage Stamp */}
          <div className="w-12 h-15 sm:w-14 sm:h-17 bg-gradient-to-b from-[#FFF5F8] to-[#FFE4EE] p-1 rounded-xs border-2 border-dashed border-[#FF8FB3] shadow-xs rotate-3 flex flex-col items-center justify-center text-center -ml-2">
            <span className="text-lg sm:text-xl">🎀</span>
            <span className="font-letter-ui text-[7px] text-[#881337] font-bold mt-0.5">日本郵便</span>
            <span className="font-letter-ui text-[5px] text-[#FF7597] tracking-widest font-semibold">1ST CLASS</span>
          </div>
        </div>
      </div>

      {/* Preamble on a cute hand-drawn pastel memo card */}
      <div
        className="relative my-4 p-4 sm:p-5 bg-gradient-to-r from-[#FFFDF8] via-[#FFF5F8] to-[#FFF9F2] border border-[#FFB6C1] shadow-[0_4px_14px_rgba(255,182,193,0.22)] rotate-[-0.3deg] rounded-2xl"
      >
        {/* Hand-torn washi tape strip on top */}
        <div
          className="absolute -top-2.5 left-6 w-14 h-4 bg-[#FFEAA7]/90 rounded-xs rotate-2 border border-black/10 pointer-events-none shadow-xs"
          style={{
            clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
          }}
          aria-hidden="true"
        />
        <p className="font-letter-handwritten text-[#7A1E42] text-xl sm:text-2xl md:text-[26px] leading-relaxed font-semibold">
          {LETTER_PREAMBLE}
        </p>
        {/* Little handwritten scribble annotation */}
        <span
          className="hidden sm:inline-block absolute -bottom-3 right-5 font-letter-handwritten text-sm text-[#FF6584] rotate-1 select-none font-bold"
          aria-hidden="true"
        >
          ⤷ (a small poem for you 🌸)
        </span>
      </div>

      {/* Main Poem Title Banner with Pacifico Font & Squiggle */}
      <div className="flex flex-col items-center justify-center my-6 sm:my-7">
        <div
          className="relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-9 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#FFF0F5] via-[#FFE4EE] to-[#FFF4CC] border-2 border-[#FF7597] shadow-[0_5px_0_#FFB6C1,0_8px_20px_rgba(255,117,151,0.25)] hover:scale-[1.02] transition-transform duration-200 rounded-full"
        >
          <span className="text-xl sm:text-2xl" aria-hidden="true">
            🎀
          </span>
          <h4 className="font-letter-title text-2xl sm:text-3xl md:text-4xl text-[#881337] tracking-wide">
            {LETTER_TITLE}
          </h4>
          <span className="text-xl sm:text-2xl" aria-hidden="true">
            🎀
          </span>
        </div>

        {/* Hand-drawn ink squiggle underline in soft rose */}
        <svg
          className="w-48 sm:w-56 h-3 text-[#FF7597]/75 mt-1.5"
          viewBox="0 0 200 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M 5 6 Q 25 1, 45 6 T 85 6 T 125 6 T 165 6 T 195 6" />
        </svg>
      </div>
    </div>
  );
}
