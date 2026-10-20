"use client";

import React, { useState, useEffect } from "react";
import IndiePixelWindow from "./IndiePixelWindow";
import HelloKittyPixel from "./HelloKittyPixel";
import { sfx, getAudioContext } from "@/lib/audio";
import { prewarmMainShaders } from "@/lib/transitionPreloader";

interface ClickToEnterScreenProps {
  onEnter: () => void;
}

export default function ClickToEnterScreen({ onEnter }: ClickToEnterScreenProps) {
  const [isEntering, setIsEntering] = useState(false);

  // Pre-warm shaders while user reads the static card
  useEffect(() => {
    prewarmMainShaders();
  }, []);

  const handleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);

    // 1. Resume / unlock browser audio context synchronously on user gesture
    getAudioContext();

    // 2. Play 8-bit chime fanfare
    try {
      sfx.select();
    } catch {
      // ignore
    }

    // 3. Smooth cinematic dissolve before unmounting
    setTimeout(() => {
      onEnter();
    }, 850);
  };

  // Keyboard shortcut: Space or Enter to trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEntering]);

  return (
    <div
      onClick={handleEnter}
      style={{
        zIndex: 9999,
        transition:
          "opacity 850ms cubic-bezier(0.22, 1, 0.36, 1), transform 850ms cubic-bezier(0.22, 1, 0.36, 1), filter 850ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-[#0C0A15] cursor-pointer select-none ${
        isEntering
          ? "opacity-0 scale-105 blur-md pointer-events-none"
          : "opacity-100 scale-100 blur-0"
      }`}
    >
      {/* Ambient Twinkling Starfield Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <span
            key={`star-${i}`}
            className="absolute rounded-full bg-[#FFEBB3] animate-pulse"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 19) % 95}%`,
              left: `${(i * 23) % 95}%`,
              opacity: 0.3 + (i % 5) * 0.15,
              animationDuration: `${1.5 + (i % 3) * 0.8}s`,
              animationDelay: `${(i * 0.2)}s`,
            }}
          />
        ))}

        {/* Ambient Warm Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FF8FB3]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FF8FB3]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Center Interactive Window */}
      <div
        style={{
          transition:
            "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className={`w-full max-w-md relative z-10 ${
          isEntering
            ? "opacity-0 -translate-y-4 scale-95"
            : "opacity-100 translate-y-0 scale-100"
        }`}
        onClick={(e) => {
          // Allow clicks on window to also trigger enter
          e.stopPropagation();
          handleEnter();
        }}
      >
        <IndiePixelWindow variant="pink" title="ARHANA'S CORNER ✦">
          <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-6 bg-[#100E1C]/90">
            {/* Cute Pixel Hello Kitty Mascot */}
            <div className="relative group cursor-pointer animate-chill-breathe">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 rounded-lg bg-[#1D1A33] border-2 border-[#FF8FB3]/40 shadow-[0_0_15px_rgba(255,143,179,0.25)]">
                <HelloKittyPixel className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
              <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
            </div>

            {/* Title & Tagline */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="font-retro text-base sm:text-lg text-[#FF8FB3] tracking-wider drop-shadow-[0_2px_0_#100E1C] leading-snug">
                WELCOME, ARHANA
              </h1>
              <p className="font-retro text-[10px] sm:text-[11px] text-[#D2CBE6] tracking-[2px] leading-relaxed">
                MEMORIES • SOUNDS • CHAOS
              </p>
            </div>

            {/* Click to Enter Primary Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEnter();
              }}
              onMouseEnter={() => {
                try {
                  sfx.move();
                } catch {}
              }}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-b from-[#FF8FB3] to-[#C24075] hover:brightness-105 rounded-sm shadow-[0_6px_0_#54122D,0_15px_20px_rgba(0,0,0,0.6)] active:translate-y-[6px] active:shadow-[0_0px_0_#54122D,0_5px_10px_rgba(0,0,0,0.6)] transition-all duration-100 cursor-pointer"
            >
              {/* Scanline Texture Overlay */}
              <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-20 mix-blend-overlay pointer-events-none" />
              <span className="font-retro font-bold text-sm sm:text-base text-[#141224] tracking-[3px] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] transition-colors flex items-center justify-center gap-2.5">
                <span>CLICK TO ENTER</span>
                <span className="inline-flex items-center justify-center leading-none -translate-y-[1px] animate-pulse">▶</span>
              </span>
            </button>

            {/* Audio & Immersion Notice */}
            <div className="flex items-center gap-2 text-[#A09AD4] text-[8px] sm:text-[9px] font-retro tracking-wider">
              <span className="animate-pulse text-[10px]">🎧</span>
              <span>HEADPHONES ON FOR BEST SOUND</span>
            </div>

            {/* Keyboard Hint */}
            <span className="text-[#8C7A99] font-retro text-[8px] tracking-[1.5px]">
              [ or tap anywhere / press enter ]
            </span>
          </div>
        </IndiePixelWindow>
      </div>
    </div>
  );
}
