"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCursor } from "@/context/CursorContext";
import { CursorMode, KITTY_CURSOR_HOTSPOT } from "./cursorUtils";
import { useOptionalGameState } from "@/lib/gameState";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { CursorParticles } from "./CursorParticles";
import { CursorBadges } from "./CursorBadges";
import { CursorExpressions } from "./CursorExpressions";
import { useKittyCursorPhysics } from "./useKittyCursorPhysics";

export default function HelloKittyCursor() {
  const { cursorMode: contextMode, programmaticMode } = useCursor();

  const gameState = useOptionalGameState();
  const isTransitioning = gameState?.isTransitioning ?? false;
  const isMusicWorld = gameState?.currentWorld === "music";
  const isScrapbookWorld = gameState?.currentWorld === "scrapbook";
  const isMusicPlaying = useSpotifyPlayerStore((s) => !s.isPaused && !!s.currentTrack);

  const activeMode: CursorMode = programmaticMode || contextMode;

  const [isWarping, setIsWarping] = useState(false);
  const [isLanding, setIsLanding] = useState(false);
  const prevTransitioning = useRef<boolean>(false);
  const warpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    kittyRef,
    glowRef,
    innerImgRef,
    isVisible,
    isPressed,
    isClickPopping,
    isIdleSleep,
    isWaking,
    particles,
    activeExpression,
    activeCoreFrame,
    isFinePointer,
    prefersReducedMotion,
  } = useKittyCursorPhysics({
    activeMode,
    isMusicWorld,
    isMusicPlaying,
    isScrapbookWorld,
    isWarping,
  });

  // World transition animations
  useEffect(() => {
    if (isTransitioning && !prevTransitioning.current) {
      setIsWarping(true);
      setIsLanding(false);
      if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
      warpTimeoutRef.current = setTimeout(() => setIsWarping(false), 750);
    } else if (!isTransitioning && prevTransitioning.current) {
      setIsWarping(false);
      if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
      if (!prefersReducedMotion) {
        setIsLanding(true);
        const timer = setTimeout(() => setIsLanding(false), 360);
        return () => clearTimeout(timer);
      }
    }
    prevTransitioning.current = isTransitioning;
  }, [isTransitioning, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (warpTimeoutRef.current) clearTimeout(warpTimeoutRef.current);
    };
  }, []);

  if (!isFinePointer || activeMode === "hidden") return null;

  const isHover = activeMode === "hover";
  const isText = activeMode === "text";
  const isDisabled = activeMode === "disabled";
  const isLoading = activeMode === "loading";
  const isDrag = activeMode === "drag";
  const isPuzzle = activeMode === "puzzle";
  const isMusic = activeMode === "music";
  const isPolaroid = activeMode === "polaroid";
  const isPeel = activeMode === "peel";
  const isZoomOut = activeMode === "zoom-out";

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`fixed inset-0 pointer-events-none z-[999999] overflow-hidden select-none transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* 1. LIGHT PARTICLES TRAIL */}
      {!prefersReducedMotion && <CursorParticles particles={particles} />}

      {/* 2. LERP GLOW RING */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        <div
          className={`w-9 h-9 -ml-1 -mt-1 rounded-full transition-all duration-300 pointer-events-none ${
            isWarping
              ? "bg-[#FFEAA7]/40 shadow-[0_0_24px_8px_rgba(255,234,167,0.7)] scale-150 border-2 border-[#FFD98A]"
              : isHover || isPuzzle || isPolaroid || isPeel || isMusic
              ? "bg-[#FF8FB3]/35 shadow-[0_0_16px_4px_rgba(255,143,179,0.5)] scale-125 border border-[#FF7597]/50"
              : isDisabled
              ? "bg-gray-400/20 scale-90 border border-gray-400/30"
              : isZoomOut
              ? "bg-[#B9D7C0]/35 scale-95 border border-[#B9D7C0]/50"
              : "bg-[#FFD0DC]/25 scale-100"
          } ${!prefersReducedMotion && (isHover || isPuzzle || isMusic) ? "animate-kitty-glow" : ""}`}
        />
      </div>

      {/* 3. ZERO-LATENCY HELLO KITTY HEAD (HOTSPOT LOCKED) */}
      <div
        ref={kittyRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* Transform Layer 1: Anchored at ear hotspot for hover scaling & flavor tilts */}
        <div
          style={{
            transformOrigin: `${KITTY_CURSOR_HOTSPOT.x}px ${KITTY_CURSOR_HOTSPOT.y}px`,
          }}
          className={`relative pointer-events-none transition-transform ${
            prefersReducedMotion ? "duration-0" : "duration-150 ease-out"
          } ${
            isHover || isMusic
              ? "scale-112 rotate-4"
              : isDrag
              ? "scale-110 -rotate-6"
              : isPuzzle
              ? "scale-110 rotate-3"
              : isPolaroid
              ? "scale-110 -rotate-3"
              : isZoomOut
              ? "scale-90 rotate-0"
              : isText
              ? "scale-75"
              : "scale-100 rotate-0"
          }`}
        >
          {/* Transform Layer 2: Anchored at bottom-center (50% 100%) for press squish, waking pop & landing bounce */}
          <div
            className={`relative pointer-events-none origin-bottom transition-transform ${
              prefersReducedMotion ? "duration-0" : "duration-100 ease-out"
            } ${
              isWarping
                ? "animate-kitty-warp"
                : isLanding
                ? "animate-kitty-landing"
                : isPressed
                ? "scale-x-[1.14] scale-y-[0.84]"
                : isClickPopping || isWaking
                ? "scale-112"
                : "scale-100"
            }`}
          >
            {/* Transform Layer 3: Inner Image wrapper receiving RAF velocity spring lean & music sway */}
            <div
              ref={innerImgRef}
              className={`relative drop-shadow-[0_2px_5px_rgba(58,36,64,0.35)] ${
                isPeel ? "rotate-[-4deg] drop-shadow-[0_4px_8px_rgba(58,36,64,0.4)]" : ""
              } ${
                !prefersReducedMotion &&
                !isHover &&
                !isPressed &&
                !isClickPopping &&
                !isWaking &&
                !isText &&
                !isDisabled &&
                !isWarping &&
                !isLanding &&
                !isPuzzle &&
                !isPeel &&
                !(isMusicWorld && isMusicPlaying)
                  ? "animate-kitty-bob"
                  : ""
              } ${!prefersReducedMotion && isDisabled ? "animate-kitty-shake" : ""}`}
            >
              {/* Layer 1 & 2: Stack of Expression Frames + Cheek Blush */}
              <CursorExpressions
                activeExpression={activeExpression}
                activeCoreFrame={activeCoreFrame}
                isPressed={isPressed}
                isHover={isHover}
                isMusic={isMusic}
                isMusicPlaying={isMusicPlaying}
              />

              {/* Layer 3 & 4: Badges, Caret, Sparkles, and Floating Zzz */}
              <CursorBadges
                isText={isText}
                isDisabled={isDisabled}
                isLoading={isLoading}
                isPuzzle={isPuzzle}
                isPolaroid={isPolaroid}
                isZoomOut={isZoomOut}
                isHover={isHover}
                isIdleSleep={isIdleSleep}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
