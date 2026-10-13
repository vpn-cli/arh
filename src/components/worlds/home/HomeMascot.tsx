"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import gsap from "gsap";

export interface HomeMascotProps {
  reaction?: string;
  className?: string;
}

export const HomeMascot = forwardRef<HTMLDivElement, HomeMascotProps>(
  function HomeMascot({ reaction, className = "" }, ref) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const bobRef = useRef<HTMLDivElement>(null);

    // Hamster idle breathing / bobbing animation
    useEffect(() => {
      if (prefersReducedMotion || !bobRef.current) return;
      const anim = gsap.to(bobRef.current, {
        y: -4,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      return () => {
        anim.kill();
      };
    }, [prefersReducedMotion]);

    return (
      <div ref={ref} className={`relative ${className}`}>
        {/* Bobbing Hello Kitty mascot avatar — frame-free sticker */}
        <div ref={bobRef} className="flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 select-none pointer-events-none transition-transform duration-300">
            <Image
              src="/images/portals/hk-mascot.webp"
              alt="Hello Kitty guide"
              width={96}
              height={96}
              className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] drop-shadow-[0_0_14px_rgba(255,182,193,0.35)]"
              priority
            />
          </div>
        </div>

        {/* Hamster speech bubble */}
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-transform duration-300 ${
            !prefersReducedMotion ? "-rotate-2" : ""
          }`}
        >
          <div className="relative px-3.5 py-1.5 bg-home-surface border-2 border-home-border-soft rounded-2xl shadow-[3px_3px_0_var(--color-home-shadow)]">
            <span className="font-retro text-xs text-home-cream tracking-wider">
              {reaction || "where to?"}
            </span>
            {/* Speech pointer */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-home-surface border-b-2 border-r-2 border-home-border-soft" />
          </div>
        </div>
      </div>
    );
  }
);

HomeMascot.displayName = "HomeMascot";

export default HomeMascot;
