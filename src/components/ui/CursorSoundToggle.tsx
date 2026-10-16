"use client";

import React from "react";
import { useCursor } from "@/context/CursorContext";
import { sfx } from "@/lib/audio";

export function CursorSoundToggle() {
  const { soundEnabled, toggleSound } = useCursor();


  const handleToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      // Play a cute preview chime when turned on
      sfx.pop();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={soundEnabled ? "Mute cursor sound effects" : "Enable cursor sound effects"}
      title={soundEnabled ? "Cursor SFX: ON (Click to mute)" : "Cursor SFX: OFF (Click to enable)"}
      className={`pointer-events-auto shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-pixel font-bold shadow-md backdrop-blur-md border transition-all hover:scale-105 active:scale-95 cursor-pointer select-none ${
        soundEnabled
          ? "bg-[#FFF0F5] hover:bg-[#FFE4EE] text-[#881337] border-[#FF7597]"
          : "bg-white/90 hover:bg-white text-[#4B4E6A] border-[#FFD0DC]/80"
      }`}
    >
      {/* SVG Speaker Icon */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
        {soundEnabled ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <line x1="23" y1="9" x2="17" y2="15" />
        )}
      </svg>

      <span className="text-[10px] sm:text-[11px] tracking-wide">
        {soundEnabled ? "SFX ON" : "SFX OFF"}
      </span>

      <span
        className={`w-1.5 h-1.5 rounded-full ${
          soundEnabled ? "bg-[#FF7597] animate-pulse" : "bg-[#A09AD4]/60"
        }`}
      />
    </button>
  );
}
