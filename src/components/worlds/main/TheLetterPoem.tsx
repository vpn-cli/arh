"use client";

import React from "react";
import { POEM_SECTIONS } from "./theLetterContent";

interface TheLetterPoemProps {
  isOpen: boolean;
}

export default function TheLetterPoem({ isOpen }: TheLetterPoemProps) {
  return (
    <div className="relative z-10 pl-3 sm:pl-7 pr-2 sm:pr-4 border-l-2 border-dashed border-[#FFB6C1] my-4">
      <div className="font-letter-handwritten text-[#7A1E42] space-y-7 sm:space-y-8 text-xl sm:text-2xl md:text-[26px] leading-[36px] sm:leading-[42px] font-semibold">
        {POEM_SECTIONS.map((section, idx) => (
          <React.Fragment key={section.id}>
            <div
              className={`relative group transition-all duration-500 ${
                isOpen ? "poem-line-enter" : "opacity-0"
              }`}
              style={{
                // Stagger each stanza by 80ms for an cascading fluid reveal
                animationDelay: isOpen ? `${idx * 0.08}s` : "0s",
              }}
            >
              <p>
                {section.lines.map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {line}
                    {lIdx < section.lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>

              {/* Collage marginalia sticker 1 (Year 3 chaos) */}
              {idx === 2 && (
                <div
                  className="hidden sm:inline-flex items-center gap-1 absolute -right-2 top-0 translate-x-full px-2.5 py-1 bg-gradient-to-r from-[#FFF0F5] to-[#FFE4EE] border border-[#FF8FB3]/70 rounded-full text-[11px] font-letter-handwritten font-bold text-[#881337] rotate-2 shadow-xs pointer-events-none"
                  aria-hidden="true"
                >
                  <span>☕</span>
                  <span>certified procrastinators</span>
                </div>
              )}

              {/* Collage marginalia sticker 2 (Accidental twinning) */}
              {section.id === "wardrobe-twinning" && (
                <div
                  className="hidden sm:inline-flex items-center gap-1 absolute -right-2 top-0 translate-x-full px-2.5 py-1 bg-gradient-to-r from-[#FFF0F5] to-[#FFE4EE] border border-[#FF8FB3]/70 rounded-full text-[11px] font-letter-handwritten font-bold text-[#881337] rotate-2 shadow-xs pointer-events-none"
                  aria-hidden="true"
                >
                  <span>accidental twinning club</span>
                </div>
              )}

              {/* Collage marginalia sticker 3 (Delayed train) */}
              {section.id === "railway-station-delayed" && (
                <div
                  className="hidden sm:inline-flex items-center gap-1 absolute -right-2 top-0 translate-x-full px-2.5 py-1 bg-gradient-to-r from-[#FFF9E6] to-[#FFF0D4] border border-[#E5B25D]/70 rounded-full text-[11px] font-letter-handwritten font-bold text-[#63430A] -rotate-2 shadow-xs pointer-events-none"
                  aria-hidden="true"
                >
                  <span>🚂</span>
                  <span>delayed train gang</span>
                </div>
              )}
            </div>

            {/* Hand-drawn sketchy doodle divider between major thematic shifts */}
            {(idx === 4 || idx === 7 || idx === 10) && (
              <div
                className="flex items-center justify-center gap-3 py-2 text-sm select-none"
                aria-hidden="true"
              >
                <span className="text-[#FF8FB3]">✦</span>
                <span className="text-base">🌸</span>
                <span className="text-[#FF7597]">♡</span>
                <span className="text-base">🌸</span>
                <span className="text-[#FF8FB3]">✦</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
