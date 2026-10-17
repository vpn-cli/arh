"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { HERO_STICKERS, HeroStickerItem } from "./heroStickers";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function HeroStickerBomb() {
  const prefersReducedMotion = usePrefersReducedMotion();

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
        );
      })}
    </div>
  );
}
