"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { HERO_STICKERS, HeroStickerItem } from "./heroStickers";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function HeroStickerBomb() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetPos = useRef({ x: 0.5, y: 0.5 });
  const currentPos = useRef({ x: 0.5, y: 0.5 });
  const rafId = useRef<number | null>(null);

  // Desktop Mouse Parallax (smooth rAF lerp, paused when tab is hidden or reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Check for desktop fine pointer
    const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isDesktopPointer) return;

    let isTabVisible = document.visibilityState === "visible";

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === "visible";
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current.x = e.clientX / window.innerWidth;
      targetPos.current.y = e.clientY / window.innerHeight;
    };

    const animateParallax = () => {
      if (isTabVisible) {
        // Smooth lerp (0.08)
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

        // Normalized delta from screen center (-1 to +1)
        const deltaX = (currentPos.current.x - 0.5) * 2;
        const deltaY = (currentPos.current.y - 0.5) * 2;

        // Apply drift opposite to cursor (max 12px for depth 1.0)
        parallaxRefs.current.forEach((el, idx) => {
          if (!el) return;
          const sticker = HERO_STICKERS[idx];
          const depth = sticker?.depth ?? 0.5;
          const moveX = -deltaX * 12 * depth;
          const moveY = -deltaY * 12 * depth;
          el.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
        });
      }

      rafId.current = requestAnimationFrame(animateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    rafId.current = requestAnimationFrame(animateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      data-testid="hero-sticker-bomb"
      className="absolute inset-0 pointer-events-none overflow-hidden z-10"
    >
      {HERO_STICKERS.map((sticker: HeroStickerItem, index: number) => {
        const isMobileOnlyHidden = !sticker.showOnMobile;
        const isTabletHidden = sticker.hideOnTablet;

        // Responsive visibility classes
        let visibilityClass = "block";
        if (isMobileOnlyHidden && isTabletHidden) {
          visibilityClass = "hidden lg:block";
        } else if (isMobileOnlyHidden) {
          visibilityClass = "hidden md:block";
        } else if (isTabletHidden) {
          visibilityClass = "block md:hidden lg:block";
        }

        const desktopX = sticker.x;
        const desktopY = sticker.y;
        const mobileX = sticker.mobileX ?? sticker.x;
        const mobileY = sticker.mobileY ?? sticker.y;

        const desktopSize = sticker.size;
        const tabletSize = Math.round(sticker.size * 0.8);
        const mobileSize = sticker.mobileSize ?? Math.min(sticker.size, 64);

        return (
          <div
            key={sticker.id}
            data-testid={`hero-sticker-${sticker.id}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 select-none hero-sticker-pos ${visibilityClass}`}
            style={{
              ["--st-x" as string]: `${desktopX}%`,
              ["--st-y" as string]: `${desktopY}%`,
              ["--st-tab-x" as string]: `${sticker.tabletX ?? desktopX}%`,
              ["--st-tab-y" as string]: `${sticker.tabletY ?? desktopY}%`,
              ["--st-size" as string]: `${desktopSize}px`,
              ["--st-tab-size" as string]: `${tabletSize}px`,
              ["--st-mob-x" as string]: `${mobileX}%`,
              ["--st-mob-y" as string]: `${mobileY}%`,
              ["--st-mob-size" as string]: `${mobileSize}px`,
              ["--sticker-rot" as string]: `${sticker.rotation}deg`,
            }}
          >
            {/* Parallax Drift Container (Driven by smoothed rAF transform) */}
            <div
              ref={(el) => {
                parallaxRefs.current[index] = el;
              }}
              className="w-full h-full will-change-transform"
            >
              {/* Staggered Pop-In Container (Scale 0.6 -> 1 on load) */}
              <div
                className={`w-full h-full ${prefersReducedMotion ? "" : "hero-sticker-pop"}`}
                style={{
                  animationDelay: prefersReducedMotion ? "0ms" : `${index * 40}ms`,
                }}
              >
                {/* Idle Floating Bob Container (4-8px, ±2°, 5-9s randomized phase) */}
                <div
                  className={`w-full h-full ${prefersReducedMotion ? "" : "hero-sticker-float"}`}
                  style={{
                    ["--st-float-dur" as string]: sticker.floatDuration,
                    ["--st-float-delay" as string]: sticker.floatDelay,
                    ["--st-float-dist" as string]: `${sticker.floatDistance}px`,
                    ["--st-float-rot" as string]: `${sticker.floatRotation}deg`,
                  }}
                >
                  {/* Interactive Lift, Wiggle & Scale 1.08 on Hover */}
                  <div
                    data-cursor="peel"
                    tabIndex={-1}
                    className="relative w-full h-full pointer-events-auto cursor-pointer hero-sticker-item flex items-center justify-center"
                    style={{
                      transform: `rotate(${sticker.rotation}deg)`,
                    }}
                    title={sticker.name}
                  >
                    {/* Vinyl Die-Cut Wrapper (Stacked 3px white outline + pink drop shadow) */}
                    <div className="w-full h-full hero-sticker-pack-filter flex items-center justify-center">
                      <Image
                        src={sticker.src}
                        alt=""
                        priority
                        width={desktopSize}
                        height={desktopSize}
                        className={`w-full h-full object-contain pointer-events-none select-none ${
                          sticker.soften ? "hero-sticker-soften" : ""
                        }`}
                      />
                    </div>

                    {/* Featured Speech Bubble (Shin-chan "namaste ji" + emoji in separate span) */}
                    {sticker.hasSpeechBubble && sticker.bubbleText && (
                      <div
                        aria-hidden="true"
                        className="absolute -top-5.5 -right-6 sm:-top-7 sm:-right-8 bg-[#FFFDF8] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] rounded-xl px-2.5 py-1 text-[9px] sm:text-[10px] text-[#3A2440] font-bold tracking-wider select-none pointer-events-none -rotate-3 z-30 whitespace-nowrap motion-safe:animate-bounce-soft flex items-center gap-1"
                      >
                        <span className="font-retro">{sticker.bubbleText}</span>
                        {sticker.bubbleEmoji && (
                          <span
                            className="inline-block text-[11px] leading-none"
                            style={{
                              fontFamily:
                                '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
                            }}
                          >
                            {sticker.bubbleEmoji}
                          </span>
                        )}
                        {/* Speech bubble pointer tail */}
                        <div
                          className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-[#FFFDF8] border-r-2 border-b-2 border-[#3A2440] rotate-45"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
