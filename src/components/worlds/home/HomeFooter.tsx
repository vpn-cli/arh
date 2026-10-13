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
        particleCount: 50,
        spread: 70,
        origin: { y: 0.88 },
        colors: ["#FF8FB3", "#FFEAA7", "#DDEBF7", "#C8B8F1", "#B9D7C0", "#FFB6C1"],
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
    <footer className="mt-6 sm:mt-10 flex flex-col items-center gap-3 relative z-10 text-center select-none pb-4">
      {/* Kawaii high-contrast interactive love note badge */}
      <button
        type="button"
        onClick={handleLoveClick}
        className="group relative flex items-center gap-2.5 px-5 py-2.5 min-h-[44px] rounded-full bg-[#FFFDF8] hover:bg-white active:bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[2px_2px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2"
        aria-label="Handcrafted with love"
      >
        <span className="text-sm transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 select-none">
          🎀
        </span>
        <span className="font-baloo text-xs sm:text-[13px] text-[#2D1B36] font-bold tracking-wide">
          made with love
        </span>
        <span
          className={`text-sm text-[#FF4F9A] transition-transform duration-300 select-none ${clicked
              ? "scale-150 rotate-12"
              : "group-hover:scale-125 group-hover:rotate-6"
            }`}
        >
          ♥
        </span>
      </button>
    </footer>
  );
}
