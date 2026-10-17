"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { HERO_STICKERS } from "./heroStickers";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { getStickerStyle } from "./stickerStyles";
import {
  computeStickerLayout,
  GridLayoutResult,
  BoundingBox,
} from "./stickerGrid";

interface HeroStickerBombProps {
  centerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function HeroStickerBomb({ centerRef }: HeroStickerBombProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Layout result calculated via deterministic seeded jittered grid
  const [layout, setLayout] = useState<GridLayoutResult>(() =>
    computeStickerLayout(1440, 900, null, HERO_STICKERS)
  );

  // Parallax tracking refs
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const isMovingRef = useRef(false);
  const parallaxRefs = useRef<Array<HTMLDivElement | null>>([]);

  const measureAndLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width =
      containerRect.width ||
      (typeof window !== "undefined" ? window.innerWidth : 1440) ||
      1440;
    const height =
      containerRect.height ||
      (typeof window !== "undefined" ? window.innerHeight : 900) ||
      900;

    const centerEl =
      centerRef?.current ||
      (typeof document !== "undefined"
        ? document.getElementById("hero-center-content")
        : null);

    let relCenter: BoundingBox | null = null;
    if (centerEl) {
      const centerBounding = centerEl.getBoundingClientRect();
      if (centerBounding.width > 0 && centerBounding.height > 0) {
        relCenter = {
          left: centerBounding.left - containerRect.left,
          top: centerBounding.top - containerRect.top,
          right: centerBounding.right - containerRect.left,
          bottom: centerBounding.bottom - containerRect.top,
          width: centerBounding.width,
          height: centerBounding.height,
        };
      }
    }

    const nextLayout = computeStickerLayout(width, height, relCenter, HERO_STICKERS);
    setLayout(nextLayout);
  }, [centerRef]);

  // Recalculate on mount and resize with debounced 150ms ResizeObserver
  useEffect(() => {
    measureAndLayout();

    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        measureAndLayout();
      }, 150);
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        debouncedUpdate();
      });

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      const centerEl =
        centerRef?.current || document.getElementById("hero-center-content");
      if (centerEl) {
        observer.observe(centerEl);
      }
    }

    window.addEventListener("resize", debouncedUpdate, { passive: true });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener("resize", debouncedUpdate);
    };
  }, [centerRef, measureAndLayout]);

  // Mouse parallax on outer wrapper (fine pointer only, idle-sleeping rAF loop, max 6px drift)
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

        const maxDrift = 6;
        for (let i = 0; i < layout.placedStickers.length; i++) {
          const item = layout.placedStickers[i];
          if (!item.visible) continue;
          const el = parallaxRefs.current[i];
          if (el) {
            const depth = item.sticker.depth;
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
  }, [prefersReducedMotion, layout.placedStickers]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-testid="hero-sticker-bomb"
      className="absolute inset-0 pointer-events-none overflow-hidden z-10"
    >
      {layout.placedStickers.map((placed, index) => {
        if (!placed.visible) return null;

        const sticker = placed.sticker;
        const stickerStyle = getStickerStyle(sticker.depth);

        return (
          <div
            key={placed.id}
            data-testid={`hero-sticker-${placed.id}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 select-none hero-sticker-pos ${
              prefersReducedMotion ? "" : "hero-sticker-pop"
            }`}
            style={{
              left: `${placed.x}px`,
              top: `${placed.y}px`,
              width: `${placed.size}px`,
              height: `${placed.size}px`,
              ["--st-x" as string]: `${placed.x}px`,
              ["--st-y" as string]: `${placed.y}px`,
              ["--st-size" as string]: `${placed.size}px`,
              ["--sticker-rot" as string]: `${placed.rotation}deg`,
              animationDelay: prefersReducedMotion ? "0ms" : `${index * 30}ms`,
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
                  ["--sticker-rot" as string]: `${placed.rotation}deg`,
                }}
                title={sticker.name}
              >
                {/* ── 3. <img> / Image: FILTERS & BLEND ONLY ── */}
                <Image
                  src={sticker.src}
                  alt=""
                  priority
                  width={placed.size}
                  height={placed.size}
                  className="w-full h-full object-contain pointer-events-none select-none hero-sticker-pack-filter"
                  style={stickerStyle}
                />

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
  );
}
