"use client";

import React, { useState, useEffect, useRef } from "react";
import { sfx } from "@/lib/audio";

interface NavItem {
  id: string;
  label: string;
  status: "active" | "locked" | "mystery";
  tooltip?: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "home", status: "active" },
  { id: "memories", label: "memories", status: "locked", tooltip: "locked: opens after cake" },
  { id: "surprises", label: "surprises", status: "locked", tooltip: "under construction <3" },
  { id: "letter", label: "letter", status: "locked", tooltip: "sealed with wax" },
  { id: "mystery", label: "???", status: "mystery", tooltip: "shhh..." },
];

export default function LandingNavigation() {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundbars, setSoundbars] = useState([3, 7, 5, 8, 4, 6, 2]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Equalizer animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSoundbars(
        Array.from({ length: 7 }, () => Math.floor(Math.random() * 8 + 2))
      );
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleSong = () => {
    if (!isPlaying) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const melody = [
            { f: 261.63, t: 0.0 },
            { f: 261.63, t: 0.2 },
            { f: 293.66, t: 0.4 },
            { f: 261.63, t: 0.6 },
            { f: 349.23, t: 0.8 },
            { f: 329.63, t: 1.0 },
          ];

          melody.forEach(({ f, t }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, ctx.currentTime + t);
            gain.gain.setValueAtTime(0.05, ctx.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(
              0.0001,
              ctx.currentTime + t + 0.35
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + t);
            osc.stop(ctx.currentTime + t + 0.4);
          });
        }
      } catch (err) {
        console.log("Audio requires interaction:", err);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <header className="w-full bg-[#100F1F]/90 backdrop-blur-md border-b-2 border-[#2E2A52] px-3 sm:px-6 py-2 select-none z-30 sticky top-0 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      <div className="w-full max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left — Pixel heart logo */}
        <div className="flex items-center gap-2">
          <span 
            className="text-[#FF8FB3] text-xl font-bold hover:scale-110 transition-transform cursor-pointer drop-shadow-[0_2px_0_#100E1C]"
            onMouseEnter={() => sfx.hover()}
          >
            ♡
          </span>
          <span className="font-retro text-[8px] text-[#D2CBE6] hidden sm:inline tracking-wide drop-shadow-[0_1px_0_#000]">
            BIRTHDAY_OS
          </span>
        </div>

        {/* Center — Navigation */}
        <nav
          aria-label="Main Navigation"
          className="flex flex-wrap items-center gap-3 sm:gap-6"
        >
          {navItems.map((item) => {
            const isActive = item.status === "active";
            const isMystery = item.status === "mystery";
            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    sfx.pop();
                    if (!isActive) {
                      sfx.error();
                      setActiveTooltip(item.tooltip || "Coming soon!");
                      setTimeout(() => setActiveTooltip(null), 2500);
                    }
                  }}
                  onMouseEnter={() => sfx.hover()}
                  className={`
                    text-xs sm:text-[10px] font-retro tracking-[2px] transition-colors cursor-pointer pb-0.5
                    ${isActive
                      ? "text-[#FFD166] font-bold border-b-2 border-[#FFD166] drop-shadow-[0_1px_0_#000]"
                      : isMystery
                        ? "text-[#FF8FB3] hover:text-[#FFD6DD]"
                        : "text-[#8C7A99] hover:text-[#D2CBE6]"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </button>

                {activeTooltip && activeTooltip === item.tooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-[#280E1C] text-[#FFD6DD] text-[8px] font-retro tracking-widest whitespace-nowrap border border-[#FF5C77]/60 shadow-[3px_3px_0_rgba(16,14,28,0.8)] z-40">
                    {item.tooltip}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right — Music player */}
        <button
          onClick={() => {
            sfx.select();
            toggleSong();
          }}
          onMouseEnter={() => sfx.hover()}
          className="relative group px-3 py-1.5 bg-gradient-to-b from-[#1C1A33] to-[#121124] border border-[#383359] shadow-[0_2px_0_#100E1C] active:translate-y-[2px] active:shadow-none flex items-center gap-2 rounded-sm"
          aria-label={isPlaying ? "Pause music" : "Play song for you"}
        >
          <span className="text-[#FFD166] text-[10px] drop-shadow-[0_1px_0_#000]">{isPlaying ? "❚❚" : "▶"}</span>
          <span className="font-retro text-[8px] text-[#FFEBB3] tracking-widest hidden sm:inline drop-shadow-[0_1px_0_#000]">
            AUDIO
          </span>
          <div className="flex items-end gap-[1px] h-2.5 ml-1 opacity-80">
            {soundbars.map((h, i) => (
              <span
                key={i}
                className={`w-[2px] transition-all duration-150 ${isPlaying ? "bg-[#FF8FB3]" : "bg-[#524B7A]"}`}
                style={{ height: isPlaying ? `${Math.max(2, h * 1.5)}px` : "2px" }}
              />
            ))}
          </div>
        </button>
      </div>
    </header>
  );
}
