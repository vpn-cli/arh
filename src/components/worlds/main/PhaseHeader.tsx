"use client";

import React from "react";
import BowKnot from "./BowKnot";

interface PhaseHeaderProps {
  phase?: string;
  pill?: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function PhaseHeader({
  phase,
  pill,
  title,
  subtitle,
  icon,
  className = "",
}: PhaseHeaderProps) {
  // Extract only the phase identifier (e.g. "PHASE 01") for the clean pill style
  const rawPhase = phase || pill || "";
  const match = rawPhase.match(/PHASE\s+\d+/i);
  const pillText = match ? match[0].toUpperCase() : rawPhase;

  return (
    <div className={`flex flex-col items-center text-center relative z-20 mb-8 sm:mb-10 ${className}`}>
      {/* Label Pill with bow knot intersecting the ribbon */}
      <div className="relative inline-flex flex-col items-center mb-3">
        {/* Bow knot sitting on the dashed ribbon at the pill */}
        <div
          data-testid="phase-header-bow"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-10"
        >
          <BowKnot size={28} />
        </div>

        <span
          data-testid="phase-header-pill"
          className="font-retro text-[9px] sm:text-[10px] uppercase tracking-[3px] text-[#9B2C61] font-bold bg-[#FFF0F5] px-4 py-1.5 rounded-full border border-[#FF8FB3]/50 shadow-xs inline-flex items-center gap-1.5 relative z-0"
        >
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{pillText}</span>
        </span>
      </div>

      {/* Big Title */}
      <h2
        data-testid="phase-header-title"
        className="font-pixel text-2xl sm:text-3xl md:text-4xl text-[#2D1B36] font-bold tracking-wider mb-2 leading-tight drop-shadow-[0_2px_0_rgba(255,143,179,0.25)]"
      >
        {title}
      </h2>

      {/* One-Line Subtitle */}
      <p
        data-testid="phase-header-subtitle"
        className="font-baloo text-xs sm:text-sm md:text-base text-[#6E5D78] font-semibold tracking-wide max-w-lg px-4 leading-relaxed"
      >
        {subtitle}
      </p>
    </div>
  );
}
