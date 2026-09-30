"use client";

import React from "react";

interface IndiePixelWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onClose?: () => void;
}

export default function IndiePixelWindow({
  title = "MAIN MENU",
  children,
  className = "",
  contentClassName = "",
  onClose,
}: IndiePixelWindowProps) {
  return (
    <div
      className={`relative select-none font-retro ${className}`}
      style={{
        // Dual-tier stepped retro RPG drop shadow
        filter: "drop-shadow(4px 4px 0px rgba(16, 14, 28, 0.75)) drop-shadow(8px 8px 0px rgba(16, 14, 28, 0.35))",
      }}
    >
      {/* ═══ OUTER DARK CONTOUR & CORNER STEPPING ═══ */}
      <div className="relative p-[3px] bg-[#141224] rounded-sm">
        {/* ═══ INSET GOLDEN FILIGREE RIM ═══ */}
        <div className="relative p-[2px] bg-gradient-to-b from-[#E5B25D] via-[#8C6226] to-[#E5B25D] rounded-[1px]">
          {/* ═══ MAIN VELVET NIGHT BODY ═══ */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#1C1A33] via-[#16152B] to-[#121124] border border-[#2E2A52]">
            {/* Corner Jewel Stud: Top-Left */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E] z-20 pointer-events-none" />
            {/* Corner Jewel Stud: Top-Right */}
            <div className="absolute top-1 right-1 w-2 h-2 bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E] z-20 pointer-events-none" />
            {/* Corner Jewel Stud: Bottom-Left */}
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E] z-20 pointer-events-none" />
            {/* Corner Jewel Stud: Bottom-Right */}
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E] z-20 pointer-events-none" />

            {/* ═══ ORNATE TITLE CREST BAR ═══ */}
            {title && (
              <div className="relative flex items-center justify-center py-2 px-6 bg-gradient-to-r from-[#18162E] via-[#262347] to-[#18162E] border-b-2 border-[#100F1F]">
                {/* Golden filigree bottom highlight line */}
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-transparent" />

                <div className="flex items-center gap-2">
                  <span className="text-[#FFD166] text-[8px] animate-pulse">◆</span>
                  <span className="text-[#FFEBB3] text-[9px] tracking-[1.5px] font-bold drop-shadow-[0_2px_0px_#0C0B17]">
                    {title}
                  </span>
                  <span className="text-[#FFD166] text-[8px] animate-pulse">◆</span>
                </div>

                {/* Close Button */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#EBE4D8] border-t border-l border-white border-b border-r border-[#8A7F73] shadow-[1px_1px_0px_#0B0A14] flex items-center justify-center active:translate-y-[1px] active:shadow-none hover:bg-[#FFF]"
                  >
                    <span className="text-[#2A2338] text-[8px] font-bold leading-none -mt-[1px]">✕</span>
                  </button>
                )}
              </div>
            )}

            {/* ═══ WINDOW CONTENT ═══ */}
            <div className={`relative ${contentClassName}`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
