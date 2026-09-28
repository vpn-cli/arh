"use client";

import React, { useState, useEffect, useRef } from "react";

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
    <header className="w-full bg-bg-cream border-b-3 border-border px-3 sm:px-6 py-2 select-none z-30 sticky top-0 shadow-sm">
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        {/* Left — Pixel heart logo */}
        <div className="flex items-center gap-2">
          <span className="text-pink text-xl font-bold hover:scale-110 transition-transform cursor-pointer drop-shadow-[1px_1px_0_#3A2E50]">
            ♡
          </span>
          <span className="font-retro text-[8px] text-dark hidden sm:inline tracking-wide">
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
                    if (!isActive) {
                      setActiveTooltip(item.tooltip || "Coming soon!");
                      setTimeout(() => setActiveTooltip(null), 2500);
                    }
                  }}
                  className={`
                    text-xs sm:text-sm font-pixel tracking-wider lowercase transition-colors cursor-pointer pb-0.5
                    ${isActive
                      ? "text-dark font-bold border-b-2 border-pink"
                      : isMystery
                        ? "text-lavender hover:text-dark"
                        : "text-dark/50 hover:text-dark/80"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </button>

                {activeTooltip && activeTooltip === item.tooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-dark text-yellow-warm text-[10px] font-terminal whitespace-nowrap border border-yellow-warm shadow-[1px_1px_0_0_#000] z-40">
                    [ {item.tooltip} ]
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right — Music player */}
        <button
          onClick={toggleSong}
          className="pixel-btn pixel-btn--yellow flex items-center gap-2 px-2 py-1 text-[10px]"
          aria-label={isPlaying ? "Pause music" : "Play song for you"}
        >
          <span className="text-dark">{isPlaying ? "❚❚" : "►"}</span>
          <span className="font-pixel text-xs text-dark hidden sm:inline">
            a song for you
          </span>
          <div className="flex items-end gap-0.5 h-3 ml-1">
            {soundbars.map((h, i) => (
              <span
                key={i}
                className="w-0.5 bg-dark transition-all duration-150"
                style={{ height: isPlaying ? `${h * 1.3}px` : "3px" }}
              />
            ))}
          </div>
        </button>
      </div>
    </header>
  );
}
