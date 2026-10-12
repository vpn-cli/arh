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
   handcrafted scrapbook collage spread. Explorable
   destinations: Main, Music, Scrapbook.
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
      className="relative min-h-[100dvh] h-[100dvh] w-full overflow-hidden flex flex-col"
    >
      {/* Ambient scrapbook background with main page character sketches */}
      <div className="fixed inset-0 -z-10 bg-home-bg overflow-hidden pointer-events-none">
        {/* Handcrafted character line-art mat (Pucca, Kitty, Snoopy, Miffy) */}
        <Image
          src="/main page bg.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center pointer-events-none transition-opacity duration-700 ${
            bgLoaded ? "opacity-35" : "opacity-0"
          }`}
          onLoad={() => setBgLoaded(true)}
        />

        {/* Cozy vignette deepening edges while keeping center art visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, var(--color-home-bg) 95%)",
          }}
        />

        {/* Subtle graph-paper grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,235,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,235,179,0.3) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Warm ambient scrapbook glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-home-gold-bright/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-music-pink/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[350px] h-[350px] bg-scrapbook-mint/10 rounded-full blur-[90px] pointer-events-none" />
      </div>

      {/* Floating ambient sparkles */}
      <div className="fixed inset-0 pointer-events-none -z-5 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-home-cream animate-pulse"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 17 + 5) % 90}%`,
              left: `${(i * 23 + 8) % 90}%`,
              opacity: 0.15 + (i % 4) * 0.1,
              animationDuration: `${2 + (i % 3) * 1.2}s`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating aesthetic stickers dispersed randomly in a collage */}
      <HomeFloatingElements />

      {/* Scrollable content container for short viewports (<680px) */}
      <div className="relative z-10 w-full h-full overflow-y-auto flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-3xl flex flex-col items-center my-auto">
          {/* HEADER — Hamster + Title */}
          <div
            ref={titleRef}
            className="flex flex-col items-center gap-4 mb-7 sm:mb-10 relative z-10 opacity-0"
          >
            {/* Mascot with speech bubble */}
            <HomeMascot ref={hamsterRef} reaction={hoveredData?.reaction} />

            {/* Title */}
            <div className="text-center">
              <h1
                className={`font-pixel text-2xl sm:text-3xl md:text-4xl font-bold text-home-gold-bright tracking-wider drop-shadow-[0_3px_0_var(--color-home-shadow)] leading-tight ${
                  !prefersReducedMotion ? "animate-title-wobble" : ""
                }`}
                style={{
                  textShadow:
                    "0 0 20px color-mix(in srgb, var(--color-home-gold-bright) 35%, transparent), 0 3px 0 var(--color-home-shadow)",
                }}
              >
                CHOOSE YOUR WORLD
              </h1>
              <div className="h-[2px] w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-home-gold/50 to-transparent mt-3 mb-2" />
              <p className="font-baloo text-base sm:text-lg text-home-muted-2 font-semibold tracking-wide mt-2">
                explore at your own pace ✦ no rush
              </p>
            </div>
          </div>

          {/* WORLD PORTALS — Handcrafted Scrapbook & Collage Cards */}
          <div className="w-full max-w-3xl flex flex-col gap-4 sm:gap-5 relative z-10">
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
