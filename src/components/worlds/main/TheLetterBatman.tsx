"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { sfx } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CUTE_GIGGLES = ["hehe! ♡", "hehe~ 🦇", "he-he! ✨", "hehe! 💖"];

export default function TheLetterBatman() {
  const [isPatted, setIsPatted] = useState(false);
  const [cloudText, setCloudText] = useState("pat me");
  const giggleIndexRef = useRef(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleSqueak = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation();

      // Trigger cute "hehe" audio
      try {
        sfx.batmanSqueak();
      } catch {
        /* audio fallback */
      }

      // Cycle cute giggles
      const nextGiggle = CUTE_GIGGLES[giggleIndexRef.current % CUTE_GIGGLES.length];
      giggleIndexRef.current += 1;
      setCloudText(nextGiggle);

      // Trigger squish & puff animation
      setIsPatted(true);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        setIsPatted(false);
        setCloudText("pat me");
      }, 1600);
    },
    []
  );

  return (
    <div className="relative shrink-0 select-none">
      <style>{`
        @keyframes cloudBob {
          0%, 100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -4px);
          }
        }
        .animate-cloud-bob {
          animation: cloudBob 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-cloud-bob {
            animation: none !important;
          }
        }
      `}</style>

      {/* ═══ TEXT CLOUD BOX: SAYS "pat me" (CHANGES TO "hehe! ♡" ON TAP) ═══ */}
      <div
        role="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleSqueak}
        className="absolute -top-11 sm:-top-12 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer z-30 select-none motion-safe:animate-cloud-bob"
      >
        <div className="relative flex items-center justify-center">
          {/* Fluffy cartoon cloud shape */}
          <svg
            width="100"
            height="50"
            viewBox="0 0 100 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`drop-shadow-[0_2px_8px_rgba(255,140,175,0.4)] transition-transform duration-300 ${
              isPatted ? "scale-110" : "hover:scale-105"
            }`}
          >
            {/* Cloud puff dots pointing down to Batman */}
            <circle cx="50" cy="42" r="3" fill="#FFFDF8" stroke="#FF8FB3" strokeWidth="1.6" />
            <circle cx="48" cy="47" r="1.6" fill="#FFFDF8" stroke="#FF8FB3" strokeWidth="1.2" />
            {/* Fluffy cartoon cloud body */}
            <path
              d="M 23,34
                 C 12,34 7,26 12,17
                 C 10,9 21,5 29,10
                 C 35,3 49,3 56,8
                 C 65,2 78,7 80,15
                 C 91,17 91,29 82,34
                 C 77,39 69,37 62,35
                 C 55,40 43,40 37,35
                 C 31,38 27,36 23,34 Z"
              fill="#FFFDF8"
              stroke="#FF8FB3"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
          {/* Text inside the cloud box */}
          <span
            className={`absolute inset-0 flex items-center justify-center -translate-y-1 font-letter-handwritten font-bold tracking-wide transition-all duration-300 ${
              isPatted
                ? "text-[#FF4F9A] text-sm sm:text-base scale-110"
                : "text-[#881337] text-xs sm:text-sm scale-100"
            }`}
          >
            {cloudText}
          </span>
        </div>
      </div>

      {/* ═══ INTERACTIVE BATMAN BUTTON ═══ */}
      <button
        type="button"
        role="button"
        aria-label="Batman sticker - pat me"
        title="Pat me!"
        data-cursor="pointer"
        onClick={handleSqueak}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSqueak(e);
          }
        }}
        className={`relative block p-0 border-0 bg-transparent cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7597] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          prefersReducedMotion
            ? ""
            : isPatted
            ? "scale-x-125 scale-y-75 rotate-6 translate-y-1"
            : "-rotate-3 hover:rotate-3 hover:scale-110 active:scale-95"
        }`}
      >
        <Image
          src="/images/batman.webp"
          alt="Batman sticker"
          width={88}
          height={88}
          priority={false}
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] select-none pointer-events-none"
        />
      </button>
    </div>
  );
}
