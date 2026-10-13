"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sfx } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger);

const ASCII_FRAMES = [
  `
       /\\_ /\\    🎀
      ( o.o )
      > ^ <
     (__|__)
`,
  `
       /\\_ /\\    🎀
      ( -.- )
      > ^ <
     (__|__)
`,
];

const TERMINAL_LINES = [
  "> INITIALIZING BIRTHDAY SEQUENCE...",
  "> SCANNING FOR MATURITY... (ERROR: 0% FOUND)",
  "> BYPASSING SECURITY (kitty protocol: active)...",
  "> ACCESS GRANTED (because you're officially old now).",
  "> DEPLOYING MAXIMUM BIRTHDAY ENERGY:",
];

export default function AsciiSection() {
  const [lines, setLines] = useState<string[]>([]);
  const [showArt, setShowArt] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showArt) {
      interval = setInterval(() => {
        setFrameIndex((prev) => (prev === 0 ? 1 : 0));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [showArt]);

  useEffect(() => {
    if (!containerRef.current) return;

    const timeouts: NodeJS.Timeout[] = [];

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 75%",
      onEnter: () => {
        if (hasTriggeredRef.current) return;
        hasTriggeredRef.current = true;

        let delay = 0;
        setLines([]);

        TERMINAL_LINES.forEach((line, index) => {
          const t = setTimeout(() => {
            setLines((prev) => (prev.includes(line) ? prev : [...prev, line]));
            sfx.pop();

            if (index === TERMINAL_LINES.length - 1) {
              const artTimer = setTimeout(() => {
                setShowArt(true);
                sfx.select();
              }, 600);
              timeouts.push(artTimer);
            }
          }, delay);

          timeouts.push(t);
          delay += 500 + Math.random() * 300;
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto my-12 sm:my-16 px-4 relative z-10">
      {/* Milestone tag */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#8C5D76] font-bold bg-[#FFF0F5] px-3 py-1 rounded-full border border-[#FF8FB3]/40 shadow-xs">
          PHASE 01 ✦ KITTY TERMINAL
        </span>
      </div>

      {/* Retro Pastel Computer Chassis */}
      <div className="bg-[#FFF6F9] border-2 border-[#3A2440] p-4 sm:p-6 rounded-2xl shadow-[6px_6px_0_#3A2440] relative overflow-hidden group">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#3A2440]/15">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF8FB3] border border-[#3A2440]/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFE27A] border border-[#3A2440]/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#B9D7C0] border border-[#3A2440]/40" />
          </div>
          <span className="font-pixel text-[11px] text-[#3A2440] tracking-widest uppercase font-bold">
            kittyOS v1.0.4 🎀
          </span>
          <div className="w-12" />
        </div>

        {/* CRT Screen inside the chassis */}
        <div className="bg-[#211627] rounded-xl p-4 sm:p-6 border-2 border-[#3A2440] shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle scanline texture */}
          <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-15 pointer-events-none" />

          {/* Terminal log lines */}
          <div className="font-retro text-[10px] sm:text-xs text-[#FFE27A] flex flex-col gap-2 min-h-[160px] relative z-10">
            {lines.map((line, i) => (
              <div key={i} className="animate-slide-up origin-left tracking-wider">
                {line}
              </div>
            ))}

            {showArt && (
              <div className="mt-4 flex flex-col items-center animate-slide-up">
                <div className="text-[#FF9EBE] whitespace-pre font-mono leading-tight text-xl sm:text-2xl drop-shadow-[0_0_10px_rgba(255,158,190,0.5)]">
                  {ASCII_FRAMES[frameIndex]}
                </div>
                <div className="mt-3 text-[#FFE27A] font-pixel text-xl sm:text-2xl tracking-wider animate-pulse drop-shadow-[0_2px_0_#000]">
                  HAPPY BIRTHDAY!
                </div>
              </div>
            )}

            {/* Blinking cursor */}
            <div className="w-2.5 h-4 bg-[#FF8FB3] animate-blink mt-1 shadow-[0_0_8px_#FF8FB3]" />
          </div>
        </div>

        {/* Corner stickers */}
        <div className="absolute -bottom-2 -right-2 text-3xl rotate-12 drop-shadow-xs pointer-events-none">
          🌸
        </div>
        <div className="absolute -top-2 -left-2 text-3xl -rotate-12 drop-shadow-xs pointer-events-none">
          🎀
        </div>
      </div>
    </div>
  );
}
