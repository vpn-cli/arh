"use client";

import React from "react";
import Image from "next/image";
import { LETTER_CLIMAX, LETTER_OUTRO_LINES } from "./theLetterContent";

export default function TheLetterBirthdaySticker() {
  return (
    <div
      data-cursor="peel"
      className="mt-9 p-6 sm:p-8 bg-gradient-to-br from-[#FFF0F5] via-[#FFE8F2] to-[#FFF9E6] border-2 sm:border-3 border-dashed border-[#FF7597] text-center shadow-[0_10px_30px_rgba(255,117,151,0.28),0_4px_12px_rgba(136,19,55,0.08)] relative group rotate-[-0.3deg] rounded-3xl"
    >
      {/* Washi tapes on top corners of the sticker */}
      <div
        className="absolute -top-2 left-6 w-14 h-4 bg-[#FFEAA7]/95 rounded-xs -rotate-3 border border-black/10 pointer-events-none shadow-xs"
        style={{
          clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -top-2 right-6 w-14 h-4 bg-[#B8E6D0]/95 rounded-xs rotate-3 border border-black/10 pointer-events-none shadow-xs"
        style={{
          clipPath: "polygon(0% 0%, 95% 0%, 100% 50%, 95% 100%, 0% 100%, 5% 50%)",
        }}
        aria-hidden="true"
      />

      {/* Cute corner accents */}
      <div className="absolute top-2.5 left-3.5 text-lg opacity-85 select-none" aria-hidden="true">
        ✨
      </div>
      <div className="absolute top-2.5 right-3.5 text-lg opacity-85 select-none" aria-hidden="true">
        ✨
      </div>
      <div className="absolute bottom-2.5 left-3.5 text-lg opacity-85 select-none" aria-hidden="true">
        🌸
      </div>
      <div className="absolute bottom-2.5 right-3.5 text-lg opacity-85 select-none" aria-hidden="true">
        🌸
      </div>

      {/* Climax text in Pacifico / Fredoka with deep rose text */}
      <p className="font-letter-title text-2xl sm:text-3xl md:text-4xl text-[#881337] tracking-wide flex items-center justify-center gap-2.5 sm:gap-3.5 drop-shadow-[0_1px_1px_rgba(255,143,179,0.3)]">
        <Image
          src="/images/cake.webp"
          alt="Birthday cake"
          width={48}
          height={48}
          className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain drop-shadow-[0_3px_6px_rgba(255,105,150,0.3)] -rotate-6 hover:rotate-0 transition-transform duration-200"
        />
        <span>✦ {LETTER_CLIMAX} ✦</span>
        <Image
          src="/images/cake.webp"
          alt="Birthday cake"
          width={48}
          height={48}
          className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain drop-shadow-[0_3px_6px_rgba(255,105,150,0.3)] rotate-6 hover:rotate-0 transition-transform duration-200"
        />
      </p>

      {/* Outro lines in Caveat */}
      <p className="font-letter-handwritten text-[#881337] text-xl sm:text-2xl md:text-[27px] mt-3.5 font-bold leading-snug">
        {LETTER_OUTRO_LINES[0]}
        <br />
        {LETTER_OUTRO_LINES[1]}
      </p>
    </div>
  );
}
