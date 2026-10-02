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
`
];

const TERMINAL_LINES = [
  "> INITIALIZING BIRTHDAY SEQUENCE...",
  "> LOADING MEMORIES...",
  "> BYPASSING SECURITY (kitty protocol)...",
  "> ACCESS GRANTED.",
  "> DEPLOYING ASCII CELEBRATION:",
];

export default function AsciiSection() {
  const [lines, setLines] = useState<string[]>([]);
  const [showArt, setShowArt] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showArt) {
      interval = setInterval(() => {
        setFrameIndex((prev) => (prev === 0 ? 1 : 0));
      }, 500); // Toggle frame every 500ms
    }
    return () => clearInterval(interval);
  }, [showArt]);

  useEffect(() => {
    if (!containerRef.current) return;

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 75%",
      onEnter: () => {
        let delay = 0;
        TERMINAL_LINES.forEach((line, index) => {
          setTimeout(() => {
            setLines((prev) => [...prev, line]);
            sfx.pop(); // Typewriter sound
            if (index === TERMINAL_LINES.length - 1) {
              setTimeout(() => {
                setShowArt(true);
                sfx.select();
              }, 800);
            }
          }, delay);
          delay += 600 + Math.random() * 400; // random typing delay
        });
      },
      once: true,
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto my-32 px-4 relative z-10">
      <div className="bg-[#1C1A33] border-[6px] border-[#FF8FB3] p-6 rounded-2xl shadow-[12px_12px_0_rgba(255,143,179,0.4)] relative overflow-hidden group">

        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b-4 border-dashed border-[#FF8FB3]/50">
          <div className="w-4 h-4 rounded-full bg-[#FF8FB3] shadow-[0_0_10px_#FF8FB3]" />
          <div className="w-4 h-4 rounded-full bg-[#FFD166] shadow-[0_0_10px_#FFD166]" />
          <div className="w-4 h-4 rounded-full bg-[#B9D7C0] shadow-[0_0_10px_#B9D7C0]" />
          <span className="font-pixel text-[12px] text-[#FF8FB3] ml-4 tracking-widest uppercase">kittyOS v1.0.4</span>
        </div>

        {/* Terminal Content */}
        <div className="font-retro text-[10px] sm:text-xs text-[#FFD166] flex flex-col gap-3 min-h-[250px] p-4">
          {lines.map((line, i) => (
            <div key={i} className="animate-slide-up origin-left drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
              {line}
            </div>
          ))}
          {showArt && (
            <div className="mt-8 flex flex-col items-center">
              <div className="text-[#FF8FB3] whitespace-pre font-mono leading-tight text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(255,143,179,0.8)]">
                {ASCII_FRAMES[frameIndex]}
              </div>
              <div className="mt-6 text-[#FFD166] font-pixel text-2xl sm:text-3xl animate-pulse drop-shadow-[0_4px_0_#100E1C]">
                HAPPY BIRTHDAY!
              </div>
            </div>
          )}
          {/* Blinking Cursor */}
          <div className="w-3 h-5 bg-[#FF8FB3] animate-blink mt-2 shadow-[0_0_10px_#FF8FB3]" />
        </div>

        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-20 mix-blend-overlay pointer-events-none" />

        {/* Decorative stickers */}
        <div className="absolute -bottom-4 -right-4 text-5xl rotate-12 drop-shadow-md group-hover:rotate-45 transition-transform duration-700">🌸</div>
        <div className="absolute -top-4 -left-4 text-5xl -rotate-12 drop-shadow-md group-hover:-rotate-45 transition-transform duration-700">🎀</div>
      </div>
    </div>
  );
}
