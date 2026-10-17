"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { HERO_STICKERS, HeroStickerItem } from "./heroStickers";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  getStickerStyle,
  getGrainOverlayStyle,
  StickerPreset,
  STICKER_PRESET_OPTIONS,
} from "./stickerStyles";

export default function HeroStickerBomb() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [preset, setPreset] = useState<StickerPreset>("a");

  // Parallax tracking refs
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const isMovingRef = useRef(false);
  const parallaxRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Dev-only query param detection (?stickers=a|b|c)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramVal = params.get("stickers")?.toLowerCase();
      if (paramVal === "a" || paramVal === "b" || paramVal === "c") {
        setPreset(paramVal);
      }
    }
  }, []);

  // Update URL search params when dev toggles preset
  const handleSelectPreset = (newPreset: StickerPreset) => {
    setPreset(newPreset);
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      const url = new URL(window.location.href);
      url.searchParams.set("stickers", newPreset);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Mouse parallax on outer wrapper (fine pointer only, idle-sleeping rAF loop)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const startLoop = () => {
      if (isMovingRef.current) return;
      isMovingRef.current = true;

      const step = () => {
        const dx = targetPos.current.x - currentPos.current.x;
        const dy = targetPos.current.y - currentPos.current.y;

        currentPos.current.x += dx * 0.08;
        currentPos.current.y += dy * 0.08;

        const maxDrift = 14;
        for (let i = 0; i < HERO_STICKERS.length; i++) {
          const el = parallaxRefs.current[i];
          if (el) {
            const depth = HERO_STICKERS[i].depth;
            const px = -currentPos.current.x * depth * maxDrift;
            const py = -currentPos.current.y * depth * maxDrift;
            el.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
          }
        }

        // Sleep when settled to keep CPU usage at 0%
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          isMovingRef.current = false;
          animFrameRef.current = null;
          return;
        }

        animFrameRef.current = requestAnimationFrame(step);
      };

      animFrameRef.current = requestAnimationFrame(step);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const ny = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      targetPos.current.x = Math.max(-1, Math.min(1, nx));
      targetPos.current.y = Math.max(-1, Math.min(1, ny));
      startLoop();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <>
      {/* ═══ HERO STICKER PACK CONTAINER (BEHIND CONTENT Z-10) ═══ */}
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

          const resolvedStyle = getStickerStyle(sticker.id, preset);

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
              {/* ── 1. OUTER WRAPPER: PARALLAX TRANSLATE ONLY ── */}
              <div
                ref={(el) => {
                  parallaxRefs.current[index] = el;
                }}
                className="w-full h-full hero-sticker-parallax will-change-transform"
              >
                {/* ── 2. MIDDLE WRAPPER: FLOAT ANIMATION + HOVER SCALE ── */}
                <div
                  data-cursor="peel"
                  tabIndex={-1}
                  className={`relative w-full h-full pointer-events-auto cursor-pointer hero-sticker-item ${
                    prefersReducedMotion ? "" : "hero-sticker-float"
                  } flex items-center justify-center`}
                  style={{
                    ["--st-float-dur" as string]: sticker.floatDuration,
                    ["--st-float-delay" as string]: sticker.floatDelay,
                    ["--st-float-dist" as string]: `${sticker.floatDistance}px`,
                    ["--st-float-rot" as string]: `${sticker.floatRotation}deg`,
                    ["--sticker-rot" as string]: `${sticker.rotation}deg`,
                  }}
                  title={sticker.name}
                >
                  {/* ── 3. <img> / Image: FILTERS & BLEND ONLY ── */}
                  <Image
                    src={sticker.src}
                    alt=""
                    priority
                    width={desktopSize}
                    height={desktopSize}
                    className="w-full h-full object-contain pointer-events-none select-none hero-sticker-pack-filter"
                    style={resolvedStyle.imgStyle}
                  />

                  {/* Preset C: Paper grain overlay clipped to sticker shape */}
                  {resolvedStyle.showGrainOverlay && (
                    <div
                      aria-hidden="true"
                      className="hero-sticker-grain-overlay pointer-events-none"
                      style={getGrainOverlayStyle(sticker.src)}
                    />
                  )}

                  {/* Featured Speech Bubble (Shin-chan "namaste ji" + emoji) */}
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
          );
        })}
      </div>

      {/* ═══ DEV-ONLY FLOATING PRESET SWITCHER (STRIPPED FROM PROD BUILDS) ═══ */}
      {process.env.NODE_ENV !== "production" && (
        <aside
          aria-label="Sticker Blending Preset Switcher (Dev Only)"
          data-testid="dev-sticker-switcher"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-1 select-none"
        >
          <div className="bg-[#FFFDF8]/95 backdrop-blur-md border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] rounded-full px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="font-retro text-[9px] uppercase tracking-wider text-[#9B2C61] font-bold px-1.5">
              Stickers:
            </span>
            {STICKER_PRESET_OPTIONS.map((option) => {
              const isActive = preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`preset-btn-${option.id}`}
                  onClick={() => handleSelectPreset(option.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-retro tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FF8FB3] text-[#2D1B36] font-bold shadow-[1px_1px_0_#3A2440] scale-105"
                      : "bg-transparent text-[#3A2440]/80 hover:bg-[#FFEAA7] hover:text-[#2D1B36]"
                  }`}
                  title={`${option.name}: ${option.description}`}
                  aria-pressed={isActive}
                >
                  <span className="font-bold mr-1">[{option.key}]</span>
                  <span>{option.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </>
  );
}
