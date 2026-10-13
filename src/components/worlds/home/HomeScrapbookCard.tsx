"use client";

import React, { forwardRef } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════
   HOME SCRAPBOOK CARD
   
   Handcrafted scrapbook/collage cardstock with washi tape,
   polaroid photo badge, warm craft textures, and tactile
   paper drop shadows with human, sarcastic bestie descriptions.
   ═══════════════════════════════════════════════════════ */

export interface ScrapbookPortal {
  id: "main" | "music" | "scrapbook";
  title: string;
  subtitle: string;
  description: string;
  bgCard: string;
  borderColor: string;
  washiClass: string;
  washiPos: string;
  tiltClass: string;
  subtitleColor: string;
  tagBg: string;
  tagText: string;
  tagBorder: string;
  tagLabel: string;
  buttonBg: string;
  buttonText: string;
  imageSrc: string;
  reaction: string;
}

export const SCRAPBOOK_PORTALS: ScrapbookPortal[] = [
  {
    id: "main",
    title: "MAIN WORLD",
    subtitle: "VAULT",
    description: "no description, pehle istemaal karein phir vishwas karein",
    bgCard: "bg-[#FFFDF6] hover:bg-[#FFF9EA]",
    borderColor: "border-[#EADBBA] hover:border-[#DFCFA8]",
    washiClass: "washi-tape--yellow",
    washiPos: "-top-3 left-1/2 -translate-x-1/2 -rotate-2",
    tiltClass: "-rotate-1 md:-rotate-2",
    subtitleColor: "text-[#A66E2E]",
    tagBg: "bg-[#FFF2C2]",
    tagText: "text-[#63430A]",
    tagBorder: "border-[#E5B25D]/60",
    tagLabel: "EXPLORE ✦",
    buttonBg: "bg-[#FFEAA7] hover:bg-[#FFD868]",
    buttonText: "text-[#4A3510]",
    imageSrc: "/images/portals/hk-main.webp",
    reaction: "sabse pehle main accha ji 🌸",
  },
  {
    id: "music",
    title: "MUSIC WORLD",
    subtitle: "JAM",
    description: "better jam than TRAPS.",
    bgCard: "bg-[#FFF6F9] hover:bg-[#FFEFF4]",
    borderColor: "border-[#F3CDD8] hover:border-[#E8B8C6]",
    washiClass: "washi-tape--pink",
    washiPos: "-top-3 left-1/2 -translate-x-1/2 rotate-1",
    tiltClass: "rotate-0 md:rotate-[0.5deg]",
    subtitleColor: "text-[#C24075]",
    tagBg: "bg-[#FFE4EE]",
    tagText: "text-[#7A1E42]",
    tagBorder: "border-[#FF8FB3]/60",
    tagLabel: "LISTEN ♫",
    buttonBg: "bg-[#FFB6C1] hover:bg-[#FF94AD]",
    buttonText: "text-[#451828]",
    imageSrc: "/images/portals/hk-music.webp",
    reaction: "remember Co-Op aux? Ofc you don't ♫",
  },
  {
    id: "scrapbook",
    title: "SCRAPBOOK",
    subtitle: "AANKHON KI TRIPTI",
    description: "A curated unhinged well. I won't spoil.",
    bgCard: "bg-[#F3FAF6] hover:bg-[#EBF7F0]",
    borderColor: "border-[#CCE2D5] hover:border-[#B5D6C1]",
    washiClass: "washi-tape--blue",
    washiPos: "-top-3 left-1/2 -translate-x-1/2 -rotate-1",
    tiltClass: "rotate-1 md:rotate-2",
    subtitleColor: "text-[#267C65]",
    tagBg: "bg-[#D8F3E9]",
    tagText: "text-[#145240]",
    tagBorder: "border-[#7BC4A8]/60",
    tagLabel: "PEEK 👀",
    buttonBg: "bg-[#C8EADE] hover:bg-[#AEE2D0]",
    buttonText: "text-[#123E30]",
    imageSrc: "/images/portals/hk-scrapbook.webp",
    reaction: " bevkoof",
  },
];

interface HomeScrapbookCardProps {
  portal: ScrapbookPortal;
  isHovered: boolean;
  isTransitioning: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

export const HomeScrapbookCard = forwardRef<HTMLButtonElement, HomeScrapbookCardProps>(
  function HomeScrapbookCard(
    { portal, isHovered, isTransitioning, onClick, onHover, onLeave },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        disabled={isTransitioning}
        className={`group relative w-full text-left transition-all duration-300 ease-out focus-visible:outline-none ${isTransitioning ? "pointer-events-none" : ""
          }`}
        aria-label={`Enter ${portal.title}`}
      >
        {/* Cute pastel washi tape strip pinning the card */}
        <div
          aria-hidden="true"
          className={`washi-tape ${portal.washiClass} absolute ${portal.washiPos} w-28 sm:w-32 h-6 sm:h-7 border border-black/10 z-20 shadow-xs pointer-events-none`}
        />

        {/* Tactile Craft Paper Cardstock */}
        <div
          className={`relative flex flex-col items-center overflow-hidden rounded-2xl border-2 transition-all duration-300 ${portal.bgCard
            } ${portal.borderColor} ${portal.tiltClass} motion-safe:group-hover:rotate-0 motion-safe:group-hover:-translate-y-2 p-5 sm:p-6 ${isHovered
              ? "shadow-[0_20px_36px_rgba(58,36,64,0.18),0_4px_12px_rgba(58,36,64,0.1)] scale-[1.02]"
              : "shadow-[0_8px_20px_rgba(58,36,64,0.1),0_2px_6px_rgba(58,36,64,0.06)]"
            }`}
        >
          {/* Paper grain noise texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              backgroundSize: "150px 150px",
            }}
          />

          {/* Warm paper sheen & subtle vintage highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-black/[0.03] pointer-events-none" />

          {/* Inner dashed craft border */}
          <div className="absolute inset-[4px] rounded-xl border border-dashed border-[#3A2440]/10 pointer-events-none" />

          {/* Vertical Content Layout */}
          <div className="relative z-10 w-full flex flex-col items-center text-center">
            {/* 1. Polaroid Photo Stamp Badge */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3 flex items-center justify-center p-2.5 bg-white rounded-2xl border-2 border-[#3A2440]/10 shadow-[0_4px_12px_rgba(58,36,64,0.12)] rotate-[-2deg] motion-safe:group-hover:rotate-1 motion-safe:group-hover:scale-105 transition-transform duration-300">
              <Image
                src={portal.imageSrc}
                alt={portal.title}
                width={90}
                height={90}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              {/* Polaroid top tape strip */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#FFEAA7]/80 rounded-xs rotate-1 border border-black/[0.06] pointer-events-none" />
            </div>

            {/* 2. Subtitle Tag */}
            <div
              className={`px-3 py-0.5 rounded-full border text-[9px] font-retro tracking-[2px] uppercase font-bold mb-1.5 shadow-2xs ${portal.tagBg} ${portal.tagText} ${portal.tagBorder}`}
            >
              {portal.subtitle}
            </div>

            {/* 3. Main Title */}
            <h2 className="font-pixel text-lg sm:text-xl font-extrabold text-[#2D1B36] tracking-wide mb-1.5">
              {portal.title}
            </h2>

            {/* 4. Human & Sarcastic Description */}
            <p className="font-baloo text-xs sm:text-[13px] text-[#5C4D6B] font-medium leading-relaxed mb-4 line-clamp-3 px-1">
              {portal.description}
            </p>

            {/* 5. Tactile Action Stamp Button */}
            <div
              className={`w-full py-2.5 px-4 rounded-xl border-2 border-[#3A2440] font-retro text-[10px] sm:text-[11px] font-bold tracking-[2px] uppercase text-center shadow-[3px_3px_0_#3A2440] transition-all duration-200 group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[2px_2px_0_#3A2440] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex items-center justify-center gap-2 ${portal.buttonBg} ${portal.buttonText}`}
            >
              <span>{portal.tagLabel}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }
);

HomeScrapbookCard.displayName = "HomeScrapbookCard";
