"use client";

import React from "react";

interface TheEditEndCardProps {
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function TheEditEndCard({ onPlayAgain, onExit }: TheEditEndCardProps) {
  return (
    <div className="absolute inset-0 z-40 bg-[#1D1124]/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      {/* Handcrafted Celebration Cardstock Frame */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FFFDF8] rounded-3xl border-3 border-[#3A2440] shadow-[8px_8px_0_#3A2440] p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Cute pastel washi tape pinning the card */}
        <div
          aria-hidden="true"
          className="washi-tape washi-tape--pink absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-6 sm:h-7 border border-black/10 -rotate-1 z-10 shadow-xs pointer-events-none"
        />

        {/* Inner dashed craft border */}
        <div className="absolute inset-[5px] rounded-2xl border border-dashed border-[#FF8FB3]/50 pointer-events-none" />

        {/* Paper texture grain */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-3xl bg-[radial-gradient(#3A2440_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Cute Celebration Header Badge */}
        <div className="relative z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF0F5] border border-[#FF8FB3]/60 text-[9px] sm:text-[10px] font-retro text-[#9B2C61] tracking-wider mb-3 shadow-2xs">
          <span>🎀</span>
          <span>MEMORY COMPLETE</span>
          <span>✦</span>
        </div>

        {/* Title */}
        <h3 className="relative z-10 font-pixel text-2xl sm:text-3xl font-extrabold text-[#2D1B36] tracking-wide mb-1.5">
          THAT&apos;S A WRAP! ✨
        </h3>

        {/* Sarcastic/Loving Bestie Subtitle */}
        <p className="relative z-10 font-baloo text-xs sm:text-sm text-[#6E5D78] font-semibold leading-relaxed mb-6 max-w-xs">
          (you liked it, I know)
        </p>

        {/* Action Buttons Row - Symmetrical Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 w-full">
          {/* Replay Button */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="group h-11 sm:h-12 px-3 sm:px-4 bg-gradient-to-r from-[#FF8FB3] to-[#FF4F9A] hover:from-[#FF7396] hover:to-[#FF2A85] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-white font-retro text-[10px] sm:text-xs tracking-wider font-bold rounded-2xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-white group-hover:-rotate-45 transition-transform" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            <span>REPLAY VIDEO</span>
          </button>

          {/* Close / Return Button */}
          <button
            type="button"
            onClick={onExit}
            className="group h-11 sm:h-12 px-3 sm:px-4 bg-[#FFFDF8] hover:bg-[#FFEAA7] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-[#2D1B36] font-retro text-[10px] sm:text-xs tracking-wider font-bold rounded-2xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
          >
            <span className="text-xs sm:text-sm shrink-0">📺</span>
            <span>BACK TO TV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
