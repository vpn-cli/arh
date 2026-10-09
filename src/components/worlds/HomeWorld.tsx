"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════
   HOME WORLD — The Central Hub
   
   An indie-game world-selection screen. The user sees
   three explorable destinations: Main, Music, Scrapbook.
   
   Design: Feels like a cozy pixel-art room / overworld map,
   NOT a conventional navbar or landing page.
   ═══════════════════════════════════════════════════════ */

interface WorldPortal {
  id: "main" | "music" | "scrapbook";
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  glowColor: string;
  hamsterSrc: string;
  hamsterReaction: string;
}

const PORTALS: WorldPortal[] = [
  {
    id: "main",
    title: "MAIN WORLD",
    subtitle: "THE ADVENTURE",
    emoji: "🌟",
    description: "birthday wishes, memes, a letter, and maybe some chaos...",
    color: "from-[#FFD166]/20 to-[#E5B25D]/10",
    hoverColor: "from-[#FFD166]/35 to-[#E5B25D]/20",
    borderColor: "border-[#E5B25D]/50",
    glowColor: "rgba(229,178,93,0.4)",
    hamsterSrc: "/hampter/devious hamster doodle.jpeg",
    hamsterReaction: "let's gooo!",
  },
  {
    id: "music",
    title: "MUSIC WORLD",
    subtitle: "THE VIBES",
    emoji: "🎵",
    description: "songs that remind me of you, a little playlist for your soul",
    color: "from-[#FF8FB3]/20 to-[#C8B8F1]/10",
    hoverColor: "from-[#FF8FB3]/35 to-[#C8B8F1]/20",
    borderColor: "border-[#FF8FB3]/50",
    glowColor: "rgba(255,143,179,0.4)",
    hamsterSrc: "/hampter/Hamster Stickers.jpeg",
    hamsterReaction: "bop bop bop~",
  },
  {
    id: "scrapbook",
    title: "SCRAPBOOK",
    subtitle: "THE MEMORIES",
    emoji: "📸",
    description: "photos, stickers, little moments we collected along the way",
    color: "from-[#B9D7C0]/20 to-[#A8D8EA]/10",
    hoverColor: "from-[#B9D7C0]/35 to-[#A8D8EA]/20",
    borderColor: "border-[#B9D7C0]/50",
    glowColor: "rgba(185,215,192,0.4)",
    hamsterSrc: "/hampter/so cuteee i love it frrr.jpeg",
    hamsterReaction: "memories!!",
  },
];

interface HomeWorldProps {
  onPortalIntent?: (portalId: WorldPortal["id"]) => void;
}

const preloadedWorlds = new Set<string>();

export function preloadWorldModule(worldId: WorldPortal["id"]) {
  if (typeof window === "undefined" || preloadedWorlds.has(worldId)) return;
  preloadedWorlds.add(worldId);

  if (worldId === "main") {
    return import("./main/MainWorld");
  } else if (worldId === "music") {
    return import("./music/MusicWorld");
  } else if (worldId === "scrapbook") {
    return import("./scrapbook/ScrapbookWorld");
  }
}

export default function HomeWorld({ onPortalIntent }: HomeWorldProps = {}) {
  const { goToWorld, isTransitioning } = useGameState();
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [entranceComplete, setEntranceComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hamsterRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Entrance animation sequence
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => setEntranceComplete(true),
    });

    // Title entrance
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.4)" }
      );
    }

    // Hamster entrance
    if (hamsterRef.current) {
      tl.fromTo(
        hamsterRef.current,
        { opacity: 0, scale: 0.5, rotation: -15 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" },
        "-=0.3"
      );
    }

    // Portal entrances (staggered)
    const validPortals = portalRefs.current.filter(Boolean);
    if (validPortals.length > 0) {
      tl.fromTo(
        validPortals,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: "back.out(1.2)",
        },
        "-=0.2"
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  // Hamster idle animation (gentle breathing)
  useEffect(() => {
    if (!hamsterRef.current) return;
    const anim = gsap.to(hamsterRef.current, {
      y: -4,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => { anim.kill(); };
  }, []);

  const handlePortalHover = (portalId: WorldPortal["id"]) => {
    setHoveredPortal(portalId);
    sfx.hover();
    preloadWorldModule(portalId);
    onPortalIntent?.(portalId);
  };

  const handlePortalClick = (portal: WorldPortal) => {
    if (isTransitioning) return;
    sfx.select();
    goToWorld(portal.id);
  };

  const hoveredData = PORTALS.find((p) => p.id === hoveredPortal);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-hidden"
    >
      {/* Ambient background - dark indie game room */}
      <div className="fixed inset-0 -z-10 bg-[#0C0A15]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,235,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,235,179,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Warm radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFD166]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FF8FB3]/4 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Floating ambient sparkles */}
      <div className="fixed inset-0 pointer-events-none -z-5 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-[#FFEBB3] animate-pulse"
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

      {/* HEADER — Hamster + Title */}
      <div ref={titleRef} className="flex flex-col items-center gap-4 mb-8 sm:mb-12 relative z-10 opacity-0">
        {/* Hamster mascot */}
        <div ref={hamsterRef} className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-[#E5B25D]/60 shadow-[0_0_20px_rgba(229,178,93,0.2),0_8px_24px_rgba(0,0,0,0.6)] bg-[#1C1A33]">
            <Image
              src="/hampter/YAAAA hamster.jpeg"
              alt="Your hamster guide"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          {/* Hamster speech bubble */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="relative px-3 py-1.5 bg-[#1C1A33] border border-[#383359] rounded-sm shadow-[3px_3px_0_rgba(16,14,28,0.8)]">
              <span className="font-retro text-[8px] text-[#FFEBB3] tracking-wider">
                {hoveredData ? hoveredData.hamsterReaction : "where to?"}
              </span>
              {/* Speech pointer */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#1C1A33] border-b border-r border-[#383359]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFD166] tracking-wider drop-shadow-[0_3px_0_#100E1C] leading-tight">
            CHOOSE YOUR WORLD
          </h1>
          <div className="h-[2px] w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-transparent mt-3 mb-2" />
          <p className="font-retro text-[9px] sm:text-[10px] text-[#8C7A99] tracking-[2px]">
            explore at your own pace ✦ no rush
          </p>
        </div>
      </div>

      {/* WORLD PORTALS — The three destinations */}
      <div className="w-full max-w-3xl flex flex-col gap-4 sm:gap-5 relative z-10">
        {PORTALS.map((portal, idx) => (
          <button
            key={portal.id}
            ref={(el) => { portalRefs.current[idx] = el; }}
            type="button"
            onClick={() => handlePortalClick(portal)}
            onMouseEnter={() => handlePortalHover(portal.id)}
            onMouseLeave={() => setHoveredPortal(null)}
            onFocus={() => handlePortalHover(portal.id)}
            onBlur={() => setHoveredPortal(null)}
            disabled={isTransitioning}
            className={`
              group relative w-full text-left transition-all duration-300 ease-out opacity-0
              ${isTransitioning ? "pointer-events-none" : ""}
            `}
            aria-label={`Enter ${portal.title}`}
          >
            {/* Portal container */}
            <div
              className={`
                relative overflow-hidden p-[2px] rounded-sm transition-all duration-300
                ${hoveredPortal === portal.id
                  ? "bg-gradient-to-r from-[#E5B25D] via-[#FFE27A] to-[#E5B25D] shadow-[0_0_30px_var(--glow)]"
                  : "bg-[#2E2A52]/60"
                }
              `}
              style={{ "--glow": portal.glowColor } as React.CSSProperties}
            >
              <div
                className={`
                  relative flex items-center gap-4 sm:gap-6 px-5 sm:px-7 py-5 sm:py-6
                  bg-gradient-to-r ${hoveredPortal === portal.id ? portal.hoverColor : portal.color}
                  bg-[#100F1F] backdrop-blur-sm
                  border border-[#2E2A52]/80
                  transition-all duration-300
                  group-hover:border-[#383359]
                `}
              >
                {/* Portal icon / hamster preview */}
                <div
                  className={`
                    relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-sm overflow-hidden
                    border-2 ${portal.borderColor}
                    shadow-[inset_0_0_12px_rgba(0,0,0,0.5)]
                    transition-all duration-300
                    group-hover:shadow-[inset_0_0_12px_rgba(0,0,0,0.3),0_0_16px_var(--glow)]
                    group-hover:scale-105
                  `}
                >
                  <Image
                    src={portal.hamsterSrc}
                    alt={portal.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Portal text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base sm:text-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 inline-block">
                      {portal.emoji}
                    </span>
                    <h2 className="font-pixel text-base sm:text-lg md:text-xl font-bold text-[#FFEBB3] tracking-wider drop-shadow-[0_2px_0_#100E1C] transition-colors duration-300 group-hover:text-[#FFD166]">
                      {portal.title}
                    </h2>
                  </div>
                  <p className="font-retro text-[7px] sm:text-[8px] text-[#8C7A99] tracking-[1.5px] mb-1.5 uppercase">
                    {portal.subtitle}
                  </p>
                  <p className="font-retro text-[8px] sm:text-[9px] text-[#D2CBE6]/70 tracking-wider leading-relaxed truncate">
                    {portal.description}
                  </p>
                </div>

                {/* Enter arrow */}
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 transition-all duration-300 group-hover:translate-x-1">
                  <span className="font-retro text-[#FFD166] text-sm sm:text-base drop-shadow-[0_0_6px_rgba(255,209,102,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,209,102,0.8)]">
                    ▶
                  </span>
                </div>

                {/* Ambient corner decorations */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FFE27A]/40 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#FFE27A]/40 pointer-events-none" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* FOOTER hint */}
      <div className="mt-8 sm:mt-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#2E2A52]" />
          <span className="font-retro text-[7px] text-[#524B7A] tracking-[2px]">
            CLICK A WORLD TO ENTER
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#2E2A52]" />
        </div>
        <p className="font-retro text-[7px] text-[#383359] tracking-wider">
          v1.0 ✦ made with way too much love
        </p>
      </div>
    </div>
  );
}
