"use client";

import React from "react";

interface IndiePixelWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onClose?: () => void;
  variant?: "gold" | "pink";
}

export default function IndiePixelWindow({
  title = "MAIN MENU",
  children,
  className = "",
  contentClassName = "",
  onClose,
  variant = "gold",
}: IndiePixelWindowProps) {
  const isPink = variant === "pink";

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
        {/* ═══ INSET FILIGREE RIM ═══ */}
        <div
          className={`relative p-[2px] rounded-[1px] ${
            isPink
              ? "bg-gradient-to-b from-[#FF8FB3] via-[#A83854] to-[#FF8FB3]"
              : "bg-gradient-to-b from-[#E5B25D] via-[#8C6226] to-[#E5B25D]"
          }`}
        >
          {/* ═══ MAIN VELVET NIGHT BODY ═══ */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#1C1A33] via-[#16152B] to-[#121124] border border-[#2E2A52]">
            {/* Corner Jewel Stud: Top-Left */}
            <div
              className={`absolute top-1 left-1 w-2 h-2 z-20 pointer-events-none ${
                isPink
                  ? "bg-[#FFD0DC] border border-[#5C1D2E] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#A83854]"
                  : "bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E]"
              }`}
            />
            {/* Corner Jewel Stud: Top-Right */}
            <div
              className={`absolute top-1 right-1 w-2 h-2 z-20 pointer-events-none ${
                isPink
                  ? "bg-[#FFD0DC] border border-[#5C1D2E] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#A83854]"
                  : "bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E]"
              }`}
            />
            {/* Corner Jewel Stud: Bottom-Left */}
            <div
              className={`absolute bottom-1 left-1 w-2 h-2 z-20 pointer-events-none ${
                isPink
                  ? "bg-[#FFD0DC] border border-[#5C1D2E] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#A83854]"
                  : "bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E]"
              }`}
            />
            {/* Corner Jewel Stud: Bottom-Right */}
            <div
              className={`absolute bottom-1 right-1 w-2 h-2 z-20 pointer-events-none ${
                isPink
                  ? "bg-[#FFD0DC] border border-[#5C1D2E] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#A83854]"
                  : "bg-[#FFE27A] border border-[#523A12] shadow-[inset_1px_1px_0px_#FFFFFF,inset_-1px_-1px_0px_#B27B1E]"
              }`}
            />

            {/* ═══ ORNATE TITLE CREST BAR ═══ */}
            {title && (
              <div className="relative flex items-center justify-center py-2 px-6 bg-gradient-to-r from-[#18162E] via-[#262347] to-[#18162E] border-b-2 border-[#100F1F]">
                {/* Filigree bottom highlight line */}
                <div
                  className={`absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent to-transparent ${
                    isPink ? "via-[#FF8FB3]/50" : "via-[#E5B25D]/50"
                  }`}
                />

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[8px] animate-pulse ${
                      isPink ? "text-[#FF8FB3]" : "text-[#FFD166]"
                    }`}
                  >
                    ◆
                  </span>
                  <span
                    className={`text-[9px] tracking-[1.5px] font-bold drop-shadow-[0_2px_0px_#0C0B17] ${
                      isPink ? "text-[#FFD0DC]" : "text-[#FFEBB3]"
                    }`}
                  >
                    {title}
                  </span>
                  <span
                    className={`text-[8px] animate-pulse ${
                      isPink ? "text-[#FF8FB3]" : "text-[#FFD166]"
                    }`}
                  >
                    ◆
                  </span>
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
