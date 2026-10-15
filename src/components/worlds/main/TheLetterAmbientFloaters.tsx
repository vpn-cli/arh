"use client";

import React from "react";

// Soft upward-floating kawaii particles (hearts, flowers, sparkles, bows)
const FLOATERS = [
  { char: "🌸", left: "6%", size: "18px", duration: "16s", delay: "0s" },
  { char: "💖", left: "16%", size: "15px", duration: "19s", delay: "3s" },
  { char: "✨", left: "26%", size: "16px", duration: "14s", delay: "6s" },
  { char: "🎀", left: "38%", size: "20px", duration: "21s", delay: "1.5s" },
  { char: "🌷", left: "50%", size: "17px", duration: "17s", delay: "5s" },
  { char: "♡", left: "62%", size: "16px", duration: "15s", delay: "2s" },
  { char: "🌸", left: "73%", size: "19px", duration: "20s", delay: "7s" },
  { char: "✨", left: "84%", size: "15px", duration: "13s", delay: "4s" },
  { char: "🎀", left: "93%", size: "18px", duration: "18s", delay: "8.5s" },
];

export default function TheLetterAmbientFloaters() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 floating-particles-layer"
      aria-hidden="true"
    >
      {FLOATERS.map((item, index) => (
        <span
          key={index}
          className="absolute bottom-[-30px] opacity-0 text-pink-400/70 dark:text-pink-300/60 transition-opacity motion-safe:animate-kawaii-float"
          style={{
            left: item.left,
            fontSize: item.size,
            animationDuration: item.duration,
            animationDelay: item.delay,
          }}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
}
