"use client";

import React from "react";
import Image from "next/image";

export default function TheLetterPolaroids() {
  return (
    <div className="relative self-center sm:self-auto shrink-0 flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
      {/* Polaroid 1: Hamster Smirk Photo (Tilted Left) */}
      <div
        data-cursor="polaroid"
        className="kitty-polaroid-lift group relative w-24 sm:w-28 bg-white p-2 pb-4 border-2 border-[#FFCCD8] shadow-[0_6px_16px_rgba(255,140,175,0.22),0_2px_4px_rgba(136,19,55,0.06)] -rotate-6 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_12px_24px_rgba(255,140,175,0.35)] transition-all duration-300 ease-out rounded-2xl cursor-pointer"
      >
        {/* Mint washi tape tab */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-9 h-3.5 bg-[#B8E6D0]/90 rounded-xs rotate-1 border border-black/10 pointer-events-none shadow-2xs"
          style={{
            clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#FFD0DC] bg-[#FFF8FA]">
          <img
            src="/hampter/Hamster smirk.jpeg"
            alt="Partner in crime"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <p className="font-letter-handwritten text-center text-[#7A1E42] text-sm sm:text-base font-bold mt-1.5 leading-none">
          maahi outside ✦
        </p>
      </div>

      {/* Polaroid 2: Devious Hamster Doodle (Tilted Right, with Satin Bow & Cherries) */}
      <div
        data-cursor="polaroid"
        className="kitty-polaroid-lift group relative w-28 sm:w-32 bg-white p-2 pb-4 border-2 border-[#FFCCD8] shadow-[0_8px_20px_rgba(255,140,175,0.25),0_2px_4px_rgba(136,19,55,0.06)] rotate-4 hover:rotate-0 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_14px_28px_rgba(255,140,175,0.38)] transition-all duration-300 ease-out rounded-2xl cursor-pointer"
      >
        {/* Butter yellow washi tape tab */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-11 h-3.5 bg-[#FFEAA7]/90 rounded-xs -rotate-2 border border-black/10 pointer-events-none shadow-2xs"
          style={{
            clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#FFD0DC] bg-[#FFF8FA]">
          <img
            src="/hampter/devious hamster doodle.jpeg"
            alt="Cute hamster doodle"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <p className="font-letter-handwritten text-center text-[#7A1E42] text-sm sm:text-base font-bold mt-1.5 leading-none">
          maahi inside ♡
        </p>

        {/* Satin bow accent */}
        <div className="kitty-sticker-wiggle absolute -top-3.5 -right-3.5 w-8 h-8 pointer-events-auto cursor-pointer" aria-hidden="true">
          <Image
            src="/images/elements/bow_satin.webp"
            alt="Satin bow"
            width={32}
            height={32}
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>

        {/* Cherries sticker accent */}
        <div className="kitty-sticker-wiggle absolute -bottom-2.5 -left-2.5 w-7 h-7 pointer-events-auto cursor-pointer" aria-hidden="true">
          <Image
            src="/images/elements/cherries.webp"
            alt="Sweet cherries"
            width={28}
            height={28}
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>
      </div>
    </div>
  );
}
