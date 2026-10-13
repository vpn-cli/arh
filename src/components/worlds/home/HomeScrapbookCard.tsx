"use client";

import React, { forwardRef } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════
   HOME SCRAPBOOK CARD
   
   Handcrafted scrapbook/collage cardstock with washi tape,
   polaroid photo badge, warm craft textures, and tactile
   paper drop shadows. Replaces futuristic neon styling.
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
  imageSrc: string;
  reaction: string;
}

export const SCRAPBOOK_PORTALS: ScrapbookPortal[] = [
  {
    id: "main",
    title: "MAIN WORLD",
    subtitle: "THE ADVENTURE",
    description: "a door opens, confetti falls, something's waiting on the other side",
    bgCard: "bg-[#FFFDF5] hover:bg-[#FFF9EA]",
    borderColor: "border-[#E8DEC5] hover:border-[#DFCFA8]",
    washiClass: "washi-tape--yellow",
    washiPos: "-top-3 left-8 sm:left-12 -rotate-2",
    tiltClass: "-rotate-[1.2deg]",
    subtitleColor: "text-[#A66E2E]",
    tagBg: "bg-[#FFEAA7] group-hover:bg-[#FFDF7D]",
    tagText: "text-[#63430A]",
    tagBorder: "border-[#E5B25D]",
    tagLabel: "EXPLORE ✦",
    imageSrc: "/images/portals/hk-main.webp",
    reaction: "let's gooo!",
  },
  {
    id: "music",
    title: "MUSIC WORLD",
    subtitle: "THE VIBES",
    description: "melodies folded into punkrose cranes, just press play, close your eyes",
    bgCard: "bg-[#FFF5F8] hover:bg-[#FFEFF4]",
    borderColor: "border-[#F3CDD8] hover:border-[#E8B8C6]",
    washiClass: "washi-tape--pink",
    washiPos: "-top-3 right-8 sm:right-14 rotate-2",
    tiltClass: "rotate-[1.4deg]",
    subtitleColor: "text-[#C24075]",
    tagBg: "bg-[#FFD4E2] group-hover:bg-[#FFBFD5]",
    tagText: "text-[#7A1E42]",
    tagBorder: "border-[#FF8FB3]",
    tagLabel: "LISTEN ♫",
    imageSrc: "/images/portals/hk-music.webp",
    reaction: " A7x probs",
  },
  {
    id: "scrapbook",
    title: "SCRAPBOOK",
    subtitle: "THE MEMORIES",
    description: "frames that whisper, bloopers to remember, pages that feel warm",
    bgCard: "bg-[#F3FAF6] hover:bg-[#EBF7F0]",
    borderColor: "border-[#CCE2D5] hover:border-[#B5D6C1]",
    washiClass: "washi-tape--blue",
    washiPos: "-top-3 left-12 sm:left-20 -rotate-1",
    tiltClass: "-rotate-[0.9deg]",
    subtitleColor: "text-[#267C65]",
    tagBg: "bg-[#C8EADE] group-hover:bg-[#B3E2D1]",
    tagText: "text-[#145240]",
    tagBorder: "border-[#7BC4A8]",
    tagLabel: "PEEK 👀",
    imageSrc: "/images/portals/hk-scrapbook.webp",
    reaction: "blackmail material",
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
          className={`washi-tape ${portal.washiClass} absolute ${portal.washiPos} w-24 sm:w-28 h-5 sm:h-6 border border-black/10 z-20 shadow-xs pointer-events-none`}
        />

        {/* Tactile Craft Paper Cardstock */}
        <div
          className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${portal.bgCard
            } ${portal.borderColor} ${portal.tiltClass} motion-safe:group-hover:rotate-0 motion-safe:group-hover:-translate-y-1.5 ${isHovered
              ? "shadow-[0_16px_36px_rgba(0,0,0,0.45),0_4px_10px_rgba(0,0,0,0.25)] scale-[1.01]"
              : "shadow-[0_8px_24px_rgba(0,0,0,0.32),0_2px_6px_rgba(0,0,0,0.18)]"
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
          {/* Warm paper sheen & vintage edge shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-black/[0.04] pointer-events-none" />

          {/* Inner cardstock border for layered craft look */}
          <div className="absolute inset-[3px] rounded-lg sm:rounded-xl border border-dashed border-black/[0.06] pointer-events-none" />

          {/* Card Content Row */}
          <div className="relative flex items-center gap-4 sm:gap-6 px-5 sm:px-7 py-4 sm:py-5">
            {/* Polaroid photo / stamp badge */}
            <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl border border-black/10 shadow-[2px_3px_6px_rgba(0,0,0,0.12)] rotate-[-3deg] motion-safe:group-hover:rotate-1 motion-safe:group-hover:scale-105 transition-transform duration-300">
              <Image
                src={portal.imageSrc}
                alt={portal.title}
                width={80}
                height={80}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              {/* Tiny tape strip on polaroid */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#FFEAA7]/60 rounded-sm rotate-1 border border-black/[0.06] pointer-events-none" />
            </div>

            {/* Typography */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-pixel text-xl sm:text-2xl md:text-3xl font-extrabold text-[#241B2F] tracking-wide transition-colors duration-200">
                  {portal.title}
                </h2>
                <span
                  className="text-xs opacity-0 -translate-x-1.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 font-baloo font-bold select-none text-[#FF8FB3]"
                >
                  ✦
                </span>
              </div>
              <p
                className={`font-retro text-[9px] sm:text-[10px] tracking-[2.5px] uppercase font-bold ${portal.subtitleColor}`}
              >
                {portal.subtitle}
              </p>
              <p className="font-baloo text-xs sm:text-sm text-[#5C4D6B]/80 font-semibold tracking-wide hidden sm:block mt-1 line-clamp-1 italic">
                {portal.description}
              </p>
            </div>

            {/* Craft Pill Badge / Action Tag */}
            <div
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border font-retro text-[9px] sm:text-[10px] tracking-wider font-bold shadow-xs transition-all duration-300 group-hover:scale-105 flex items-center gap-1.5 ${portal.tagBg} ${portal.tagText} ${portal.tagBorder}`}
            >
              <span>{portal.tagLabel}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }
);
