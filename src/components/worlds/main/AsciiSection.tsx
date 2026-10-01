"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sfx } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger);

const ASCII_HAMSTER = `
   (\\__/)  
   (o^.^)  
  z(_(")(") 
`;

const TERMINAL_LINES = [
  "> INITIALIZING BIRTHDAY SEQUENCE...",
  "> LOADING MEMORIES...",
  "> BYPASSING SECURITY (hamster protocol)...",
  "> ACCESS GRANTED.",
  "> DEPLOYING ASCII CELEBRATION:",
];

export default function AsciiSection() {
  const [lines, setLines] = useState<string[]>([]);
  const [showArt, setShowArt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className="bg-[#0C0A15] border-2 border-[#383359] p-6 rounded-sm shadow-[8px_8px_0_rgba(28,26,51,0.8)] relative overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#383359]">
          <div className="w-3 h-3 rounded-full bg-[#FF8FB3]" />
          <div className="w-3 h-3 rounded-full bg-[#FFD166]" />
          <div className="w-3 h-3 rounded-full bg-[#B9D7C0]" />
          <span className="font-pixel text-[10px] text-[#8C7A99] ml-2">hampterOS v1.0.4</span>
        </div>

        {/* Terminal Content */}
        <div className="font-retro text-[10px] sm:text-xs text-[#B9D7C0] flex flex-col gap-2 min-h-[200px]">
          {lines.map((line, i) => (
            <div key={i} className="animate-slide-up origin-left">
              {line}
            </div>
          ))}
          {showArt && (
            <div className="mt-4 text-[#FFD166] whitespace-pre font-mono leading-none animate-pulse-glow">
              {ASCII_HAMSTER}
              <div className="mt-4 text-[#FF8FB3] font-pixel text-lg">HAPPY BIRTHDAY!</div>
            </div>
          )}
          {/* Blinking Cursor */}
          <div className="w-2 h-4 bg-[#B9D7C0] animate-blink mt-1" />
        </div>
        
        {/* Scanlines overlay */}
        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-10 mix-blend-overlay pointer-events-none" />
      </div>
    </div>
  );
}
