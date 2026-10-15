"use client";

import React from "react";

interface TheLetterEnvelopeProps {
  isOpen: boolean;
}

export default function TheLetterEnvelope({ isOpen }: TheLetterEnvelopeProps) {
  return (
    <div
      className={`absolute inset-x-0 top-0 h-[310px] sm:h-[350px] bg-gradient-to-b from-[#FFFDF8] via-[#FFEBF2] to-[#FFDDE8] border-3 border-[#FF7597]/70 shadow-[0_18px_45px_-10px_rgba(255,117,151,0.38),0_0_0_4px_#FFF0F5] rounded-[32px] sm:rounded-[40px] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 flex flex-col items-center justify-between p-5 sm:p-7 overflow-hidden group select-none motion-safe:animate-envelope-bob ${
        isOpen
          ? "opacity-0 pointer-events-none scale-95 -translate-y-6 invisible"
          : "opacity-100 scale-100 translate-y-0"
      }`}
    >
      {/* Subtle paper polka-dot grain */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#881337_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Pastel Japanese candy airmail chevron border trim along top and bottom */}
      <div
        className="absolute top-0 inset-x-0 h-2 sm:h-2.5 bg-[repeating-linear-gradient(45deg,#FF7597,#FF7597_10px,#FFFDF8_10px,#FFFDF8_15px,#B8E6D0_15px,#B8E6D0_25px,#FFFDF8_25px,#FFFDF8_30px,#C8B8F1_30px,#C8B8F1_40px,#FFFDF8_40px,#FFFDF8_45px,#FFEAA7_45px,#FFEAA7_55px,#FFFDF8_55px,#FFFDF8_60px)] opacity-90 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 inset-x-0 h-2 sm:h-2.5 bg-[repeating-linear-gradient(45deg,#FF7597,#FF7597_10px,#FFFDF8_10px,#FFFDF8_15px,#B8E6D0_15px,#B8E6D0_25px,#FFFDF8_25px,#FFFDF8_30px,#C8B8F1_30px,#C8B8F1_40px,#FFFDF8_40px,#FFFDF8_45px,#FFEAA7_45px,#FFEAA7_55px,#FFFDF8_55px,#FFFDF8_60px)] opacity-90 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Decorative Fold / Flap with soft blush gradient */}
      <div
        className="absolute top-2 inset-x-0 h-32 sm:h-40 bg-gradient-to-b from-[#FFD5E2] to-[#FFBFD3] border-b-2 border-[#FF7597]/40 origin-top transition-transform duration-300 group-hover:brightness-105 shadow-[0_6px_16px_rgba(255,117,151,0.22)]"
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        aria-hidden="true"
      />

      {/* Header: Airmail Stamp & Tokyo Postage */}
      <div className="w-full flex justify-between items-start z-10 pointer-events-none mt-1">
        {/* Postmark Stamp Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#FF8FB3]/70 text-[9px] sm:text-[10px] font-letter-ui font-semibold text-[#881337] tracking-wider shadow-2xs backdrop-blur-xs">
          <span>✈ PAR AVION</span>
          <span>•</span>
          <span>AIRMAIL TO JAPAN</span>
          <span>•</span>
          <span className="hidden sm:inline">🌸 航空便</span>
        </div>

        {/* Tokyo Airmail Postage Stamp */}
        <div className="w-13 h-16 sm:w-15 sm:h-18 bg-white p-1 rounded-md border-2 border-dashed border-[#FF7597] shadow-xs rotate-3 flex flex-col items-center justify-center text-center">
          <span className="text-lg sm:text-xl">🎀</span>
          <span className="font-letter-ui text-[8px] text-[#881337] font-bold mt-0.5">TOKYO</span>
          <span className="font-letter-ui text-[6px] text-[#FF7597] tracking-wider font-semibold">OCT 2026</span>
          <span className="font-letter-ui text-[6px] text-[#881337] font-bold">1ST CLASS</span>
        </div>
      </div>

      {/* Center: Deluxe 3D Wax Seal with Heart & Silk Ribbons */}
      <div className="relative my-auto flex flex-col items-center z-10">
        {/* Ribbon tails with soft pink satin */}
        <div
          className="absolute -top-3 w-6 h-12 bg-[#FF7597] opacity-90 -rotate-12 rounded-b-sm shadow-xs"
          aria-hidden="true"
        />
        <div
          className="absolute -top-3 w-6 h-12 bg-[#FF8FB3] opacity-90 rotate-12 rounded-b-sm shadow-xs"
          aria-hidden="true"
        />

        {/* Ornate Wax Seal Medallion with Heart */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#FF6B8B] via-[#E83562] to-[#9E143C] border-3 border-[#FFFDF8] flex items-center justify-center shadow-[0_8px_25px_rgba(232,53,98,0.5),0_2px_4px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative cursor-pointer"
          aria-hidden="true"
        >
          {/* Inner embossed wax ring with heart */}
          <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center bg-white/10">
            <span className="text-white text-2xl sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              💖
            </span>
          </div>
        </div>

        {/* Recipient calligraphy label */}
        <p className="font-letter-title text-[#881337] text-base sm:text-lg font-bold mt-3 tracking-wide text-center drop-shadow-[0_1px_1px_rgba(255,143,179,0.3)]">
          For: Maahi ✦ Tokyo, Japan
        </p>
        <span className="font-letter-handwritten text-[#9B2C61] text-sm sm:text-base font-bold -mt-0.5">
          (Special Airmail • Break Seal to Open ♡)
        </span>
      </div>

      {/* Bottom Action: Chunky 3D Pill Button */}
      <div className="z-10 w-full flex justify-center mb-1">
        <span className="font-letter-ui text-[#881337] text-xs sm:text-sm tracking-wider font-bold bg-[#FFEAA7] hover:bg-[#FFE082] px-7 py-2.5 sm:py-3 rounded-full border-2 border-[#881337] shadow-[0_5px_0_#C48B22] group-hover:translate-y-[-1px] group-hover:shadow-[0_6px_0_#C48B22] group-active:translate-y-[4px] group-active:shadow-[0_1px_0_#C48B22] transition-all flex items-center gap-2 cursor-pointer">
          <span>BREAK THE SEAL</span>
          <span className="text-[#FF4F9A]">✦</span>
        </span>
      </div>
    </div>
  );
}
