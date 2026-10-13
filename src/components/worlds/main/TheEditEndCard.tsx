"use client";

import React from "react";

interface TheEditEndCardProps {
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function TheEditEndCard({ onPlayAgain, onExit }: TheEditEndCardProps) {
  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3.5 text-center p-4 animate-fade-in select-none">
      {/* Cute Floating Celebration Icon */}
      <div className="text-4xl sm:text-5xl animate-bounce-soft">
        🎀
      </div>

      {/* Pill Badge */}
      <span className="font-retro text-[8px] sm:text-[9px] uppercase tracking-[3px] text-[#FF8FB3] font-bold bg-[#FFF5F8]/10 px-3 py-1 rounded-full border border-[#FF8FB3]/40 shadow-sm">
        ✦ MEMORY COMPLETE ✦
      </span>

      {/* Title */}
      <h3 className="font-pixel text-xl sm:text-2xl md:text-3xl text-[#FFEAA7] font-bold tracking-wider">
        THAT&apos;S A WRAP! ✨
      </h3>

      <p className="font-baloo text-xs sm:text-sm text-[#FFD0DC] max-w-sm">
        best video edit in the entire universe tbh 💖
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-2">
        {/* Cute Replay Button */}
        <button
          type="button"
          onClick={onPlayAgain}
          className="group px-6 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-[#FF8FB3] to-[#FF4F9A] hover:from-[#FF7396] hover:to-[#FF2A85] text-white font-retro text-xs tracking-wider font-bold rounded-2xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4 fill-white group-hover:-rotate-45 transition-transform" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
          <span>REPLAY VIDEO 💖</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 sm:py-3 bg-[#FFFDF8] hover:bg-[#FFEAA7] text-[#2D1B36] font-retro text-xs tracking-wider font-bold rounded-2xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          CLOSE 🎀
        </button>
      </div>
    </div>
  );
}
