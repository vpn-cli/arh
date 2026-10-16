import React from "react";

interface CursorBadgesProps {
  isText: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  isPuzzle: boolean;
  isPolaroid: boolean;
  isZoomOut: boolean;
  isHover: boolean;
  isIdleSleep: boolean;
  prefersReducedMotion: boolean;
}

export function CursorBadges({
  isText,
  isDisabled,
  isLoading,
  isPuzzle,
  isPolaroid,
  isZoomOut,
  isHover,
  isIdleSleep,
  prefersReducedMotion,
}: CursorBadgesProps) {
  return (
    <>
      {/* 1. Text Input State: Blinking Pastel Pink Caret */}
      {isText && (
        <div
          className={`absolute -right-2 top-0.5 w-[2.5px] h-6 bg-[#FF7597] rounded-full shadow-[0_0_4px_#FF8FB3] ${
            !prefersReducedMotion ? "animate-kitty-caret" : ""
          }`}
        />
      )}

      {/* 2. Disabled / Locked State: Crisp Inline SVG Lock Badge */}
      {isDisabled && (
        <div className="absolute -bottom-1 -right-1.5 w-4 h-4 bg-[#FFF9E6] border border-[#20233F] rounded-full flex items-center justify-center shadow-xs">
          <svg width="8" height="9" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="5" width="8" height="6" rx="1.5" fill="#E5B25D" stroke="#20233F" strokeWidth="1.2" />
            <path
              d="M2.5 5V3.5C2.5 2.11929 3.61929 1 5 1C6.38071 1 7.5 2.11929 7.5 3.5V5"
              stroke="#20233F"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="5" cy="8" r="0.8" fill="#20233F" />
          </svg>
        </div>
      )}

      {/* 3. Loading State: Crisp Inline SVG Star Sparkle */}
      {isLoading && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 animate-spin text-[#FF8FB3]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
          </svg>
        </div>
      )}

      {/* 4. Main World Puzzle State: Cute Alert "!" Bubble over Kitty's bow */}
      {isPuzzle && (
        <div className="absolute -top-2 -right-1 w-4 h-4 bg-[#FFEAA7] border border-[#20233F] rounded-full flex items-center justify-center shadow-xs text-[9px] font-pixel font-bold text-[#20233F] animate-bounce">
          !
        </div>
      )}

      {/* 5. Scrapbook Polaroid State: Camera Flash Sparkle */}
      {isPolaroid && (
        <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-[#FF7597] animate-pulse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
          </svg>
        </div>
      )}

      {/* 6. Scrapbook Zoom-Out State: Minus / Shrink Badge */}
      {isZoomOut && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFF9E6] border border-[#20233F] rounded-full flex items-center justify-center shadow-xs">
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#20233F" strokeWidth="2" strokeLinecap="round">
            <circle cx="5" cy="5" r="4" />
            <line x1="8" y1="8" x2="11" y2="11" />
            <line x1="3" y1="5" x2="7" y2="5" />
          </svg>
        </div>
      )}

      {/* 7. Hover Sparkle (Top-left ear star, subtle micro-cue) */}
      {isHover && !prefersReducedMotion && (
        <div className="absolute -top-1.5 -left-1 w-3 h-3 text-[#FF7597] animate-pulse pointer-events-none">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 9.5L24 12L14 14.5L12 24L10 14.5L0 12L10 9.5L12 0Z" />
          </svg>
        </div>
      )}

      {/* 8. Idle Sleep: Floating "z z z" */}
      {isIdleSleep && !prefersReducedMotion && (
        <div className="absolute -top-3.5 right-0 pointer-events-none flex flex-col items-center select-none">
          <span className="text-[9px] font-pixel font-bold text-[#C8B8F1] animate-kitty-zzz-1">z</span>
          <span className="text-[7px] font-pixel font-bold text-[#FF8FB3] -mt-1 ml-2.5 animate-kitty-zzz-2">z</span>
        </div>
      )}
    </>
  );
}
