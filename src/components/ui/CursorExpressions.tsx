import React, { useEffect, useRef } from "react";
import {
  KITTY_ASSET_FRAMES,
  KittyAssetFrame,
  KittyExpression,
  isInstantExpressionSwap,
  CURSOR_DISPLAY_WIDTH,
  CURSOR_DISPLAY_HEIGHT,
} from "./cursorUtils";

interface CursorExpressionsProps {
  activeExpression: KittyExpression;
  activeCoreFrame: KittyAssetFrame;
  isPressed: boolean;
  isHover: boolean;
  isMusic: boolean;
  isMusicPlaying: boolean;
}

export function CursorExpressions({
  activeExpression,
  activeCoreFrame,
  isPressed,
  isHover,
  isMusic,
  isMusicPlaying,
}: CursorExpressionsProps) {
  const prevExpressionRef = useRef<KittyExpression>(activeExpression);
  const prevCoreFrameRef = useRef<KittyAssetFrame>(activeCoreFrame);

  // Determine if the transition into this active state is an instant swap (blink, squeeze, wink)
  const isInstant = isInstantExpressionSwap(
    prevExpressionRef.current,
    activeExpression
  );

  useEffect(() => {
    prevExpressionRef.current = activeExpression;
    prevCoreFrameRef.current = activeCoreFrame;
  }, [activeExpression, activeCoreFrame]);

  // Preload all frames on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    KITTY_ASSET_FRAMES.forEach((frame) => {
      const img = new window.Image();
      img.src = `/hampter/cursor/kitty_${frame}.webp`;
    });
  }, []);

  return (
    <div
      style={{
        width: `${CURSOR_DISPLAY_WIDTH}px`,
        height: `${CURSOR_DISPLAY_HEIGHT}px`,
      }}
      className="relative select-none pointer-events-none"
    >
      {/* 1. Expression Frames Stack (WebP + PNG fallback) */}
      {KITTY_ASSET_FRAMES.map((frame) => {
        const isCurrent = activeCoreFrame === frame;
        return (
          <picture
            key={frame}
            className={`absolute inset-0 w-full h-full pointer-events-none ${
              isCurrent ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{
              transition: isInstant ? "none" : "opacity 80ms ease-in-out",
            }}
          >
            <source
              srcSet={`/hampter/cursor/kitty_${frame}.webp`}
              type="image/webp"
            />
            <img
              src={`/hampter/cursor/kitty_${frame}.png`}
              alt=""
              width={CURSOR_DISPLAY_WIDTH}
              height={CURSOR_DISPLAY_HEIGHT}
              className="w-full h-full object-contain pointer-events-none"
              loading="eager"
              decoding="async"
            />
          </picture>
        );
      })}

      {/* 2. Rosy Cheek Blush Layer (Fades in on hover, press, and music sway) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ease-out z-20 ${
          isPressed
            ? "opacity-100"
            : isHover
            ? "opacity-85"
            : isMusic && isMusicPlaying
            ? "opacity-75"
            : "opacity-0"
        }`}
      >
        {/* Left Cheek Blush (anchored under left eye) */}
        <div className="absolute left-[18%] top-[66%] w-[16%] h-[12%] rounded-full bg-[#FF7597]/55 blur-[0.5px]" />
        {/* Right Cheek Blush (anchored under right eye) */}
        <div className="absolute right-[18%] top-[66%] w-[16%] h-[12%] rounded-full bg-[#FF7597]/55 blur-[0.5px]" />
      </div>
    </div>
  );
}
