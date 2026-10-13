"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import gsap from "gsap";
import HomeMascot from "./home/HomeMascot";
import HomeFooter from "./home/HomeFooter";
import HomeFloatingElements from "./home/HomeFloatingElements";
import {
  HomeScrapbookCard,
  SCRAPBOOK_PORTALS,
  ScrapbookPortal,
} from "./home/HomeScrapbookCard";

/* ═══════════════════════════════════════════════════════
   HOME WORLD — The Central Hub
   
   An indie-game world-selection screen styled as a warm,
   handcrafted scrapbook collage spread on a cozy craft desk.
   Explorable destinations: Main, Music, Scrapbook.
   ═══════════════════════════════════════════════════════ */

interface HomeWorldProps {
  onPortalIntent?: (portalId: ScrapbookPortal["id"]) => void;
}

const preloadedWorlds = new Set<string>();

export function preloadWorldModule(worldId: ScrapbookPortal["id"]) {
  if (typeof window === "undefined" || preloadedWorlds.has(worldId)) return;
  preloadedWorlds.add(worldId);

  if (worldId === "main") return import("./main/MainWorld");
  if (worldId === "music")
    return import("./music/MusicWorld").catch((err) =>
      console.warn("[home] music preload failed", err)
    );
  if (worldId === "scrapbook") return import("./scrapbook/ScrapbookWorld");
}

export default function HomeWorld({ onPortalIntent }: HomeWorldProps = {}) {
  const { goToWorld, isTransitioning } = useGameState();
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [, setEntranceComplete] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hamsterRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Entrance animation sequence
  useEffect(() => {
    if (prefersReducedMotion) {
      setEntranceComplete(true);
      if (titleRef.current) gsap.set(titleRef.current, { opacity: 1, y: 0 });
      if (hamsterRef.current)
        gsap.set(hamsterRef.current, { opacity: 1, scale: 1, rotation: 0 });
      gsap.set(portalRefs.current.filter(Boolean), {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const tl = gsap.timeline({ onComplete: () => setEntranceComplete(true) });

    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.4)" }
      );
    }
    if (hamsterRef.current) {
      tl.fromTo(
        hamsterRef.current,
        { opacity: 0, scale: 0.5, rotation: -15 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" },
        "-=0.3"
      );
    }
    const validPortals = portalRefs.current.filter(Boolean);
    if (validPortals.length > 0) {
      tl.fromTo(
        validPortals,
        { opacity: 0, y: 35, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.14,
          ease: "back.out(1.2)",
          onComplete: () => {
            gsap.set(validPortals, { clearProps: "transform" });
          },
        },
        "-=0.2"
      );
    }

    return () => {
      tl.kill();
    };
  }, [prefersReducedMotion]);

  const handlePortalHover = (portalId: ScrapbookPortal["id"]) => {
    setHoveredPortal(portalId);
    sfx.hover();
    preloadWorldModule(portalId);
    onPortalIntent?.(portalId);
  };

  const handlePortalClick = (portal: ScrapbookPortal) => {
    if (isTransitioning) return;
    sfx.select();
    goToWorld(portal.id);
  };

  const hoveredData = SCRAPBOOK_PORTALS.find((p) => p.id === hoveredPortal);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] h-[100dvh] w-full overflow-hidden flex flex-col bg-[#FAF6EE]"
    >
      {/* Ambient warm craft scrapbook background */}
      <div className="fixed inset-0 -z-10 bg-[#FAF6EE] overflow-hidden pointer-events-none">
        {/* Subtle warm dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#3A2440 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Handcrafted character lineup welcoming the user */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-48 sm:h-56 pointer-events-none opacity-85">
          <Image
            src="/main page bg.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className={`object-contain object-bottom pointer-events-none transition-opacity duration-700 ${bgLoaded ? "opacity-100" : "opacity-0"
              }`}
            onLoad={() => setBgLoaded(true)}
          />
        </div>

        {/* Warm ambient watercolor glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#FFEAA7]/25 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#FFB6C1]/20 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[350px] h-[350px] bg-[#C8EADE]/20 rounded-full blur-[90px] pointer-events-none" />
      </div>

      {/* Floating aesthetic stickers framing the desk spread */}
      <HomeFloatingElements />

      {/* Scrollable content container */}
      <div className="relative z-10 w-full h-full overflow-y-auto flex flex-col items-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-5xl flex flex-col items-center my-auto">
          {/* HEADER — Mascot + Title */}
          <div
            ref={titleRef}
            className="flex flex-col items-center gap-2 mb-6 sm:mb-8 relative z-10 opacity-0"
          >
            {/* Mascot with speech bubble */}
            <HomeMascot ref={hamsterRef} reaction={hoveredData?.reaction} />

            {/* Title */}
            <div className="text-center mt-1">
              <h1
                className={`font-pixel text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D1B36] tracking-wider leading-tight drop-shadow-[0_2px_0_rgba(255,143,179,0.3)] ${!prefersReducedMotion ? "animate-title-wobble" : ""
                  }`}
              >
                pick one at a time
              </h1>
              <div className="h-[2px] w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-[#FF8FB3]/40 to-transparent mt-2 mb-1.5" />
              <p className="font-baloo text-sm sm:text-base text-[#6E5D78] font-semibold tracking-wide">
                balle balle de shawa shawa, piyo piyo de kawa kawa
              </p>
            </div>
          </div>

          {/* WORLD PORTALS — Handcrafted 3-Column Postcards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 relative z-10 px-2 sm:px-4">
            {SCRAPBOOK_PORTALS.map((portal, idx) => (
              <HomeScrapbookCard
                key={portal.id}
                ref={(el) => {
                  portalRefs.current[idx] = el;
                }}
                portal={portal}
                isHovered={hoveredPortal === portal.id}
                isTransitioning={isTransitioning}
                onClick={() => handlePortalClick(portal)}
                onHover={() => handlePortalHover(portal.id)}
                onLeave={() => setHoveredPortal(null)}
              />
            ))}
          </div>

          {/* CUTE HANDCRAFTED FOOTER */}
          <HomeFooter />
        </div>
      </div>
    </div>
  );
}
