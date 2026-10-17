"use client";

import React from "react";
import Image from "next/image";
import TheLetterScrapbookBacking from "./TheLetterScrapbookBacking";
import TheLetterHeader from "./TheLetterHeader";
import TheLetterPoem from "./TheLetterPoem";
import TheLetterBirthdaySticker from "./TheLetterBirthdaySticker";
import TheLetterPolaroids from "./TheLetterPolaroids";

interface TheLetterStationeryProps {
  isOpen: boolean;
  onClose: (e: React.MouseEvent) => void;
}

export default function TheLetterStationery({
  isOpen,
  onClose,
}: TheLetterStationeryProps) {
  if (!isOpen) return null;

  return (
    <div
      className="transition-all duration-700 origin-top z-10 relative opacity-100 scale-100 translate-y-0 pointer-events-auto stationery-spring-in"
    >
      {/* ═══ 1. SCRAPBOOK ALBUM CARDSTOCK (Tilted Craft Backing Layer) ═══ */}
      <TheLetterScrapbookBacking />

      {/* ═══ 2. MAIN JOURNAL WRITING SHEET (Cute Japanese Pastel Stationery) ═══ */}
      <div
        className="relative z-10 bg-[#FFFDF8] border-2 sm:border-3 border-[#FF8FB3] shadow-[0_22px_50px_-10px_rgba(255,140,175,0.4),0_0_0_4px_#FFF0F5,0_4px_16px_rgba(136,19,55,0.08)] p-5 sm:p-9 md:p-11 rounded-[32px] sm:rounded-[40px] rotate-[0.3deg]"
      >
        {/* Scalloped Top Edge Decoration (Pastel Japanese Craft Edge) */}
        <div
          className="absolute -top-3 sm:-top-3.5 inset-x-6 sm:inset-x-12 h-6 flex justify-between items-center pointer-events-none select-none z-20 overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-[#FFFDF8] border-t-2 border-l border-r border-[#FF8FB3] shrink-0 -mx-0.5 shadow-2xs"
            />
          ))}
        </div>

        {/* Delicate inner dashed border line */}
        <div
          className="absolute inset-[8px] sm:inset-[12px] border-2 border-dashed border-[#FFB6C1]/50 rounded-[26px] sm:rounded-[32px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Inner cute textures & faint ruled-paper lines */}
        <div className="absolute inset-0 overflow-hidden rounded-[32px] sm:rounded-[40px] pointer-events-none">
          {/* Paper fiber grain */}
          <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#881337_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Faint pastel pink ruled lines */}
          <div className="absolute inset-0 stationery-vintage-lines opacity-80" />

          {/* Japanese pastel airmail candy stripe trim on inner top & bottom */}
          <div
            className="absolute top-4 inset-x-5 h-1.5 bg-[repeating-linear-gradient(45deg,#FF7597,#FF7597_8px,#FFFDF8_8px,#FFFDF8_12px,#B8E6D0_12px,#B8E6D0_20px,#FFFDF8_20px,#FFFDF8_24px,#C8B8F1_24px,#C8B8F1_32px,#FFFDF8_32px,#FFFDF8_36px,#FFEAA7_36px,#FFEAA7_44px,#FFFDF8_44px,#FFFDF8_48px)] opacity-75"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-4 inset-x-5 h-1.5 bg-[repeating-linear-gradient(45deg,#FF7597,#FF7597_8px,#FFFDF8_8px,#FFFDF8_12px,#B8E6D0_12px,#B8E6D0_20px,#FFFDF8_20px,#FFFDF8_24px,#C8B8F1_24px,#C8B8F1_32px,#FFFDF8_32px,#FFFDF8_36px,#FFEAA7_36px,#FFEAA7_44px,#FFFDF8_44px,#FFFDF8_48px)] opacity-75"
            aria-hidden="true"
          />
        </div>

        {/* Folded Dog-Ear Corner at Top-Right with Peek-a-boo Heart */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-12 sm:w-14 h-12 sm:h-14 pointer-events-none select-none z-20"
        >
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] sm:border-t-[48px] border-r-[40px] sm:border-r-[48px] border-t-[#FFE2EC] border-r-[#FFCCD8] shadow-[-2px_3px_6px_rgba(255,140,175,0.35)] rounded-bl-sm" />
          <div className="absolute top-2 right-2 text-xs text-[#FF6584] font-bold rotate-45 select-none opacity-90">
            ♡
          </div>
        </div>

        {/* Rose-Gold Paperclip on Top-Left */}
        <div
          aria-hidden="true"
          className="absolute -top-3 left-10 sm:left-14 z-30 pointer-events-none select-none flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(255,140,175,0.4)]"
        >
          <div className="w-5.5 h-9 rounded-full border-2 border-[#FF7597] bg-gradient-to-b from-[#FFF0F5] to-[#FFD5E5] flex items-center justify-center p-0.5">
            <div className="w-3 h-5.5 rounded-full border border-[#FF527B]" />
          </div>
        </div>

        {/* Washi Tape Strips on Corners with Serrated Ends */}
        <div
          aria-hidden="true"
          className="washi-tape washi-tape--yellow absolute -top-3.5 -left-3 sm:-left-4 w-22 sm:w-26 h-5 sm:h-6 border border-black/10 -rotate-12 z-20 shadow-xs pointer-events-none opacity-95"
          style={{
            clipPath:
              "polygon(0% 0%, 96% 0%, 100% 15%, 96% 30%, 100% 45%, 96% 60%, 100% 75%, 96% 90%, 100% 100%, 0% 100%, 4% 85%, 0% 70%, 4% 55%, 0% 40%, 4% 25%, 0% 10%)",
          }}
        />
        <div
          aria-hidden="true"
          className="washi-tape washi-tape--pink absolute -top-3 right-14 sm:right-20 w-18 sm:w-22 h-4 sm:h-5 border border-black/10 rotate-6 z-20 shadow-xs pointer-events-none opacity-90"
          style={{
            clipPath:
              "polygon(0% 0%, 96% 0%, 100% 15%, 96% 30%, 100% 45%, 96% 60%, 100% 75%, 96% 90%, 100% 100%, 0% 100%, 4% 85%, 0% 70%, 4% 55%, 0% 40%, 4% 25%, 0% 10%)",
          }}
        />

        {/* Hello Kitty sticker stuck on top of the pink washi tape */}
        <div
          aria-hidden="true"
          className="absolute -top-5 sm:-top-6 right-16 sm:right-24 w-9 sm:w-11 h-9 sm:h-11 rotate-12 z-30 pointer-events-none drop-shadow-md select-none transition-transform hover:scale-110"
        >
          <img
            src="/hampter/hello_kitty_pin.png"
            alt="Hello Kitty Sticker"
            className="w-full h-full object-contain"
          />
        </div>
        <div
          aria-hidden="true"
          className="washi-tape washi-tape--mint absolute -bottom-2 -left-2 w-16 sm:w-20 h-4 sm:h-5 border border-black/10 rotate-6 z-20 shadow-xs pointer-events-none opacity-90"
          style={{
            clipPath:
              "polygon(0% 0%, 96% 0%, 100% 15%, 96% 30%, 100% 45%, 96% 60%, 100% 75%, 96% 90%, 100% 100%, 0% 100%, 4% 85%, 0% 70%, 4% 55%, 0% 40%, 4% 25%, 0% 10%)",
          }}
        />

        {/* ═══ 3. COLLAGE HEADER SECTION ═══ */}
        <TheLetterHeader />

        {/* ═══ 4. POEM BODY WITH SLIDE-IN REVEAL ═══ */}
        <TheLetterPoem isOpen={isOpen} />

        {/* ═══ 5. CLIMAX BIRTHDAY STICKER CARD ═══ */}
        <TheLetterBirthdaySticker />

        {/* ═══ 6. SIGN-OFF & SCRAPBOOK POLAROID CLUSTER ═══ */}
        <div className="relative z-10 mt-9 pt-5 border-t-2 border-dashed border-[#FFD0DC] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="font-letter-handwritten">
                <span className="block text-2xl sm:text-3xl text-[#881337] font-bold">Love always,</span>
                <span className="block text-3xl sm:text-4xl text-[#9B2C61] font-bold tracking-wide mt-0.5">
                  Batman
                </span>
              </div>

              {/* Clipped out Batman sticker */}
              <div className="relative shrink-0 -rotate-3 hover:rotate-3 transition-transform duration-300">
                <Image
                  src="/images/batman.webp"
                  alt="Batman sticker"
                  width={88}
                  height={88}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:scale-105 transition-transform select-none"
                />
              </div>
            </div>

            {/* Cute handwritten P.S. note on a taped card */}
            <div
              className="mt-4 relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FFF0F5] to-[#FFE8F2] border border-[#FFB6C1] shadow-[0_4px_12px_rgba(255,182,193,0.3)] rotate-[-0.6deg] rounded-2xl"
            >
              <div
                className="absolute -top-2 left-4 w-10 h-3 bg-[#FFEAA7]/90 rounded-xs rotate-2 border border-black/10 pointer-events-none shadow-2xs"
                style={{
                  clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
                }}
                aria-hidden="true"
              />
              <span className="text-base" aria-hidden="true">
                🌸
              </span>
              <p className="font-letter-handwritten text-[#7A1E42] text-lg sm:text-xl font-bold leading-none">
                P.S. Tokyo may have you, but you can&apos;t escape me.
              </p>
            </div>
          </div>

          {/* Modular Scrapbook Polaroid Collage Cluster */}
          <TheLetterPolaroids />
        </div>

        {/* ═══ 7. CHUNKY 3D FOLD LETTER BACK BUTTON ═══ */}
        <div className="mt-8 pt-5 border-t-2 border-dashed border-[#FFD0DC] flex justify-center relative z-10">
          <button
            type="button"
            data-cursor="peel"
            onClick={onClose}
            className="px-7 sm:px-8 py-3 bg-gradient-to-r from-[#FFF0F5] to-[#FFE4EE] hover:from-[#FFE4EE] hover:to-[#FFD5E5] text-[#881337] border-2 border-[#881337] rounded-full font-letter-ui text-xs sm:text-sm font-bold tracking-wider shadow-[0_5px_0_#C48B22] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#C48B22] active:translate-y-1 active:shadow-[0_1px_0_#C48B22] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🎀</span>
            <span>FOLD LETTER BACK</span>
            <span>🎀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
