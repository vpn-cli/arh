"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { sfx } from "@/lib/audio";
import gsap from "gsap";

export interface HomeMascotProps {
  reaction?: string;
  className?: string;
}

const BOOP_REACTIONS = [
  "boop! 🌸",
  "hehe that tickles! ✨",
  "where to next? 👀",
  "bestie vibe check 10/10 🎀",
  "nom nom strawberries 🍓",
  "pick a world! ♫",
];

export const HomeMascot = forwardRef<HTMLDivElement, HomeMascotProps>(
  function HomeMascot({ reaction, className = "" }, ref) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const bobRef = useRef<HTMLDivElement>(null);
    const [boopCount, setBoopCount] = useState(0);
    const [isBooped, setIsBooped] = useState(false);
    const [sparkleActive, setSparkleActive] = useState(false);

    // Hamster idle breathing / bobbing animation
    useEffect(() => {
      if (prefersReducedMotion || !bobRef.current) return;
      const anim = gsap.to(bobRef.current, {
        y: -6,
        rotation: 1.5,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        anim.kill();
      };
    }, [prefersReducedMotion]);

    const handleBoop = () => {
      sfx.pop();
      setBoopCount((prev) => prev + 1);
      setIsBooped(true);
      setSparkleActive(true);

      setTimeout(() => setIsBooped(false), 500);
      setTimeout(() => setSparkleActive(false), 800);
    };

    const currentReaction =
      boopCount > 0
        ? BOOP_REACTIONS[(boopCount - 1) % BOOP_REACTIONS.length]
        : reaction || "where to?";

    return (
      <div ref={ref} className={`relative flex flex-col items-center select-none ${className}`}>
        {/* Floating speech bubble */}
        <div
          className={`mb-2 whitespace-nowrap transition-all duration-300 pointer-events-none ${
            !prefersReducedMotion ? "-rotate-1 hover:rotate-0" : ""
          } ${isBooped ? "scale-110 -translate-y-1" : "scale-100"}`}
        >
          <div className="relative px-4 py-1.5 bg-[#FFFDF8] border-2 border-[#3A2440] rounded-2xl shadow-[3px_3px_0_#3A2440]">
            <span className="font-retro text-xs sm:text-[13px] text-[#3A2440] font-bold tracking-wider">
              {currentReaction}
            </span>
            {/* Speech pointer */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#FFFDF8] border-b-2 border-r-2 border-[#3A2440]" />
          </div>
        </div>

        {/* Mascot avatar button with click boop, hover tilt, and sparkle particle */}
        <button
          type="button"
          onClick={handleBoop}
          onMouseEnter={() => sfx.hover()}
          className="group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-full"
          aria-label="Boop Hello Kitty guide mascot"
          title="Click to boop!"
        >
          <div ref={bobRef} className="flex items-center justify-center">
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 select-none pointer-events-none transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 ${
                isBooped ? "scale-125 -rotate-6" : ""
              }`}
            >
              <Image
                src="/images/portals/hk-mascot.webp"
                alt="Hello Kitty guide mascot"
                width={112}
                height={112}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_22px_rgba(58,36,64,0.22)] drop-shadow-[0_2px_8px_rgba(255,143,179,0.4)]"
                priority
              />
            </div>
          </div>

          {/* Floating heart / sparkle effect on boop */}
          {sparkleActive && (
            <div
              aria-hidden="true"
              className="absolute -top-4 -right-2 text-base text-[#FF4F9A] pointer-events-none animate-bounce"
            >
              💖
            </div>
          )}
        </button>
      </div>
    );
  }
);

HomeMascot.displayName = "HomeMascot";

export default HomeMascot;
