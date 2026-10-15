"use client";

import React from "react";
import Image from "next/image";

export default function TheLetterScrapbookBacking() {
  return (
    <div
      className="absolute -inset-3 sm:-inset-5 bg-gradient-to-br from-[#FFF5F8] via-[#FFEDF4] to-[#FFE8F2] border-2 border-[#FFB6C1] -rotate-[1.2deg] shadow-[0_20px_50px_rgba(255,140,175,0.28),0_4px_16px_rgba(136,19,55,0.06)] pointer-events-none z-0 rounded-[36px]"
      aria-hidden="true"
    >
      {/* Background polka-dot pattern clipped to backing card radius */}
      <div className="absolute inset-0 overflow-hidden rounded-[34px] pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#881337_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Hand-drawn sketch inner dashed line */}
      <div className="absolute inset-2 border border-dashed border-[#FF8FB3]/40 rounded-[30px] pointer-events-none" />

      {/* Vintage pastel corner mounts */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#FF7597]/70 rounded-tl-sm" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#FF7597]/70 rounded-tr-sm" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#FF7597]/70 rounded-bl-sm" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#FF7597]/70 rounded-br-sm" />

      {/* Ephemera 1: Tokyo Boarding Ticket stub on top-left (with torn serrated edge) */}
      <div
        className="absolute -top-2 sm:-top-2.5 left-5 sm:left-10 px-3 py-1 bg-gradient-to-r from-[#FFF9E6] to-[#FFF3D1] border border-[#E8D4A2] -rotate-6 shadow-xs flex items-center gap-1.5 text-[8px] sm:text-[9px] font-letter-ui text-[#7A5A18] font-bold"
        style={{
          clipPath:
            "polygon(0% 0%, 97% 0%, 100% 15%, 97% 30%, 100% 45%, 97% 60%, 100% 75%, 97% 90%, 100% 100%, 0% 100%)",
        }}
      >
        <span>✈ TOKYO EXPRESS</span>
        <span>•</span>
        <span>PASSENGER: MAAHI</span>
        <span>🌸</span>
      </div>

      {/* Ephemera 2: Butterfly sticker peeking on right edge */}
      <div className="absolute top-1/4 -right-3 sm:-right-4 w-10 sm:w-12 h-10 sm:h-12 rotate-12 drop-shadow-sm">
        <Image
          src="/images/elements/butterfly.webp"
          alt="Butterfly sticker"
          width={48}
          height={48}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Ephemera 3: Flower blossom sticker peeking on left edge */}
      <div className="absolute top-1/2 -left-3 sm:-left-4 w-9 sm:w-11 h-9 sm:h-11 -rotate-12 drop-shadow-sm">
        <Image
          src="/images/elements/flower_blossom.webp"
          alt="Blossom sticker"
          width={44}
          height={44}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Hand-drawn ink doodles in the cardboard margin */}
      <div className="absolute bottom-2.5 left-8 font-letter-handwritten text-xs sm:text-sm text-[#FF7597] font-bold -rotate-3 select-none flex items-center gap-1.5">
        <span>✎ scrap spread no. 24</span>
        <span>•</span>
        <span>made with chaos & love ♡</span>
      </div>
    </div>
  );
}
