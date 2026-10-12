"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/audio";

export default function HomeFooter() {
  const [clicked, setClicked] = useState(false);

  const handleLoveClick = () => {
    sfx.pop();
    setClicked(true);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85 },
        colors: ["#FF8FB3", "#FFD98A", "#DDEBF7", "#C8B8F1", "#B9D7C0", "#FFFFFF"],
        ticks: 200,
        gravity: 0.8,
        scalar: 0.9,
      });
    } catch {
      // safe fallback if canvas context unavailable
    }

    setTimeout(() => {
      setClicked(false);
    }, 400);
  };

  return (
    <footer className="mt-8 sm:mt-12 flex flex-col items-center gap-3 relative z-10 text-center select-none pb-4">
      {/* Soft welcoming subtext */}
      <div className="flex items-center gap-2 text-home-muted-2/80">
        <span className="text-[10px] text-home-gold-bright/60 animate-pulse">✦</span>

        <span className="text-[10px] text-home-gold-bright/60 animate-pulse">✦</span>
      </div>

      {/* Kawaii interactive love note badge */}
      <button
        type="button"
        onClick={handleLoveClick}
        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10 hover:border-pink-300/40 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/50"
        aria-label="Made with love and care"
      >
        <span className="text-xs transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 select-none">
          🎀
        </span>
        <span className="font-baloo text-xs sm:text-[13px] text-home-cream/90 font-semibold tracking-wide">
          made with love and a lot of thought behind the scences
        </span>
        <span
          className={`text-xs text-pink-400 transition-transform duration-300 select-none ${clicked
            ? "scale-150 rotate-12"
            : "group-hover:scale-125 group-hover:rotate-6 group-hover:text-pink-300"
            }`}
        >
          ♥
        </span>
      </button>
    </footer>
  );
}
