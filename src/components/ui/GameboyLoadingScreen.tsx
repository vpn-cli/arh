"use client";

import React, { useState, useEffect } from "react";
import PixelWindow from "./PixelWindow";
import IndiePixelWindow from "./IndiePixelWindow";
import HelloKittyAlertModal from "./HelloKittyAlertModal";

interface GameboyLoadingScreenProps {
  onComplete: () => void;
}



import { sfx, getAudioContext } from "@/lib/audio";

export default function GameboyLoadingScreen({ onComplete }: GameboyLoadingScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = Continue, 1 = Start New Game
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [popupError, setPopupError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showKittyModal, setShowKittyModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parallax cursor tracking with smooth lerp damping.
  // The lerp writes --mx/--my straight to the DOM instead of setState:
  // this subtree is ~1700 SVG rects, and re-rendering it every frame was
  // the whole source of the lag. Layers read the vars via calc().
  const rootRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const targetOffsetRef = React.useRef({ x: 0, y: 0 });
  const currentOffsetRef = React.useRef({ x: 0, y: 0 });
  const animFrameRef = React.useRef<number | null>(null);
  const lastLeanRef = React.useRef(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => { });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const ny = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      targetOffsetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateParallax = () => {
      if (reduced) return;
      const current = currentOffsetRef.current;
      const target = targetOffsetRef.current;

      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      // $10M-quality Premium Camera Float
      const time = performance.now() * 0.001;
      const idleX = Math.sin(time * 0.4) * 0.03 + Math.sin(time * 0.25) * 0.015;
      const idleY = Math.cos(time * 0.3) * 0.03 + Math.sin(time * 0.2) * 0.015;

      const finalX = current.x + idleX;
      const finalY = current.y + idleY;

      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--mx", finalX.toFixed(4));
        el.style.setProperty("--my", finalY.toFixed(4));

        const lean = Math.round(finalX * 8) / 8;
        if (lean !== lastLeanRef.current) {
          lastLeanRef.current = lean;
          el.style.setProperty("--lean-x", String(lean));
        }
      }
      animFrameRef.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    if (!reduced) {
      animFrameRef.current = requestAnimationFrame(updateParallax);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const menuItems = ["CONTINUE", "START NEW GAME"];

  const handleSelect = () => {
    if (isTransitioning) return;
    if (selectedIndex === 0) {
      // "CONTINUE" clicked/pressed -> Trigger funny retro location error!
      sfx.error();
      setPopupError(true);
      setShakeKey((k) => k + 1);
      setShowKittyModal(true);
      return;
    }
    // "START NEW GAME" clicked/pressed -> Launch game!
    sfx.select();
    setIsTransitioning(true);

    // Mute and pause the landing video audio immediately upon entering the game
    try {
      const videos = document.querySelectorAll<HTMLVideoElement>("video");
      videos.forEach((v) => {
        v.muted = true;
        v.pause();
      });
    } catch {
      // ignore
    }

    setTimeout(onComplete, 700);
  };

  // One place covers arrow keys changing the row.
  const firstRenderRef = React.useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    sfx.move();
    if (selectedIndex === 1) {
      // Clear error when navigating to START NEW GAME
      setPopupError(false);
    }
  }, [selectedIndex]);

  // Keyboard navigation: forces arrow keys (and W/S) to toggle menu
  useEffect(() => {
    if (isTransitioning || showKittyModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ensure audio context is ready on user input
      getAudioContext();

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 1 ? 0 : 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, isTransitioning, showKittyModal]);

  const closeKittyModal = () => {
    setShowKittyModal(false);
    // Play a click or move sound when dismissing
    sfx.move();
  };

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-8 sm:p-12 transition-all duration-700 ease-in cursor-none [&_*]:cursor-none select-none ${isTransitioning ? "opacity-0 scale-105 blur-sm pointer-events-none" : "opacity-100 scale-100"
        }`}
      style={{ ["--mx" as string]: "0", ["--my" as string]: "0", cursor: "none" } as React.CSSProperties}
    >
      {/* Background Scene Container with Locked 16:9 Aspect Ratio */}
      <div className="absolute inset-0 -z-10 overflow-hidden flex items-center justify-center bg-[#8db356]">
        <div
          className="relative flex-shrink-0 select-none"
          style={{
            width: 'max(100vw, calc(100vh * 16 / 9))',
            height: 'max(100vh, calc(100vw * 9 / 16))',
          }}
          suppressHydrationWarning
        >
          {/* Base 16:9 Video (z-0) */}
          {isMounted && (
            <video
              ref={videoRef}
              src="/videos/real_vid.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none will-change-transform"
              style={{
                transform: "scale(1.02) translate3d(calc(var(--mx, 0) * -15px), calc(var(--my, 0) * -10px), 0)",
              }}
            />
          )}

          {/* Glowing Overlays to animate the baked-in painted butterflies */}
          <div className="absolute top-[41%] right-[24%] w-12 h-12 bg-[#ffe875]/40 rounded-full mix-blend-overlay blur-md animate-pulse z-[1] pointer-events-none" style={{ animationDuration: '0.4s' }} />
          <div className="absolute top-[39%] right-[8%] w-10 h-10 bg-[#ffe875]/50 rounded-full mix-blend-overlay blur-sm animate-pulse z-[1] pointer-events-none" style={{ animationDuration: '0.3s', animationDelay: '0.1s' }} />
          <div className="absolute top-[31%] left-[29%] w-10 h-10 bg-[#ffb975]/40 rounded-full mix-blend-overlay blur-md animate-pulse z-[1] pointer-events-none" style={{ animationDuration: '0.5s', animationDelay: '0.2s' }} />
          <div className="absolute bottom-[35%] left-[38%] w-8 h-8 bg-[#ffee75]/50 rounded-full mix-blend-overlay blur-sm animate-pulse z-[1] pointer-events-none" style={{ animationDuration: '0.35s' }} />

          {/* ═══ OPAQUE ROTATING COPYRIGHT BADGE (Covers Watermark) ═══ */}
          <div
            className="absolute z-[60] flex items-center justify-center pointer-events-none drop-shadow-xl will-change-transform"
            style={{
              right: '4.85%',
              bottom: '9.0%',
              width: '140px',
              height: '140px',
              transform: "translate3d(calc(var(--mx, 0) * -15px), calc(var(--my, 0) * -10px), 0)"
            }}
          >
            {/* Frosted Glass Background Plate (Blurs out the watermark naturally) */}
            <div className="absolute inset-0 bg-[#0C0A15]/70 backdrop-blur-lg rounded-full shadow-[inset_0_0_25px_rgba(0,0,0,0.9),0_4px_10px_rgba(0,0,0,0.3)] z-0" />

            {/* Rotating Text */}
            <svg
              className="w-[130px] h-[130px] absolute z-10 opacity-90"
              viewBox="0 0 100 100"
              style={{ animation: 'spin 15s linear infinite' }}
            >
              <defs>
                <path
                  id="circlePath"
                  d="M 50, 50
                     m -38, 0
                     a 38,38 0 1,1 76,0
                     a 38,38 0 1,1 -76,0"
                />
              </defs>
              <text className="font-retro text-[9px] fill-[#FFEBB3] tracking-[0.2em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <textPath href="#circlePath" startOffset="0%">
                  © VPN COPYRIGHT • VPN COPYRIGHT •
                </textPath>
              </text>
            </svg>

            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="text-[#FFEBB3] text-4xl font-retro leading-none mt-1 animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,1)] opacity-80">
                V
              </span>
            </div>
          </div>

          {/* Vignette to blend AI edges and make it feel more cinematic / indie */}
          <div className="absolute inset-0 pointer-events-none z-[2] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.5)_100%)]" />

          {/* IN-PLACE ANIMATIONS FOR PIXEL MEMES REMOVED FOR REAL VIDEO */}

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 3 (z-[22]): Foreground Blooming Flowers & Clovers
              (Removed per user request)
              ═══════════════════════════════════════════════════════ */}

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 4 (z-[28]): Atmospheric Effects, Butterflies & Pollen
              Drifting air parallax: x * -25px, y * -12px
              ═══════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden z-[28] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -25px), calc(var(--my, 0) * -12px), 0)",
            }}
          >
            {/* Background Petals (Tiny, sharp, slow) */}
            {[...Array(8)].map((_, i) => (
              <span key={`bg-petal-${i}`} className={`absolute w-[4px] h-[3px] bg-[#ffb7d5] rounded-full animate-petal-drift-bg delay-${i * 100}`} style={{ top: `${10 + i * 12}%`, left: `${-5 + (i % 3) * 10}%`, animationDelay: `${i * 1.5}s` }} />
            ))}

            {/* Midground Petals (Normal-sized, drifting across the scene) */}
            {[...Array(10)].map((_, i) => (
              <span key={`mid-petal-${i}`} className={`absolute w-[8px] h-[5px] bg-[#ff8eb4] rounded-[40%_60%_70%_30%] shadow-[0_0_4px_rgba(255,142,180,0.4)] animate-petal-drift`} style={{ top: `${5 + i * 9}%`, left: `${-10 + (i % 4) * 15}%`, animationDelay: `${i * 1.1 + 0.5}s` }} />
            ))}

            {/* Organic Wandering Butterflies - Removed to use pre-existing painted ones instead */}

            {/* Wind Gust Breeze Lines */}
            <div className="absolute top-[28%] left-0 w-64 sm:w-96 h-1 bg-gradient-to-r from-transparent via-white/50 via-yellow-100/40 to-transparent rounded-full animate-wind-gust" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[48%] left-0 w-72 sm:w-[28rem] h-1.5 bg-gradient-to-r from-transparent via-white/60 via-emerald-100/40 to-transparent rounded-full animate-wind-gust-fast" style={{ animationDelay: '2.8s' }} />
            <div className="absolute top-[68%] left-0 w-80 sm:w-[32rem] h-1 bg-gradient-to-r from-transparent via-yellow-100/50 via-white/40 to-transparent rounded-full animate-wind-gust" style={{ animationDelay: '5.2s' }} />

            {/* Dandelion Fluffs drifting across on the wind */}
            <span className="absolute top-[20%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float" style={{ animationDelay: '0s' }} />
            <span className="absolute top-[35%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] animate-dandelion-float" style={{ animationDelay: '3.8s' }} />
            <span className="absolute top-[50%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float" style={{ animationDelay: '7.5s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 5 & 6: Foreground Lens Framing & Side Grass
              (Removed per user request)
              ═══════════════════════════════════════════════════════ */}
        </div>
      </div>

      {/* ═══ EXTREME FOREGROUND CAMERA PETALS (z-[45]) ═══
          Blurred on purpose -- passing very close to the camera lens. */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-[45] will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mx, 0) * -85px), calc(var(--my, 0) * -40px), 0)",
        }}
      >
        {/* Foreground Petals (Large, fast, blurred) */}
        {[...Array(6)].map((_, i) => (
          <span key={`fg-petal-${i}`} className={`absolute w-[18px] h-[12px] bg-[#ffd6e6]/95 rounded-[50%_50%_30%_70%] shadow-[0_0_12px_rgba(255,255,255,0.6)] animate-petal-drift-fg blur-[4px]`} style={{ top: `${10 + i * 15}%`, left: `${-15 + (i % 2) * 20}%`, animationDelay: `${i * 1.8 + 0.2}s` }} />
        ))}

        {/* Flying Leaves */}
        <span className="gb-leaf gb-leaf--big animate-leaf-gust-fast" style={{ top: "12%", animationDelay: "0s" }} />
        <span className="gb-leaf animate-leaf-gust" style={{ top: "31%", animationDelay: "1.8s" }} />
        <span className="gb-leaf gb-leaf--small animate-leaf-gust-slow" style={{ top: "44%", animationDelay: "3.4s" }} />
      </div>

      {/* Animated Scanlines removed to preserve real video quality */}

      {/* Flying Nyan Cat across the sky (enlarged, natural rainbow without extra block) */}
      <div className="absolute top-6 sm:top-10 left-0 pointer-events-none z-10 animate-nyan-fly flex items-center">
        <img
          src="/images/nyan-cat.gif"
          alt="Nyan Cat"
          className="w-32 h-20 sm:w-48 sm:h-28 md:w-56 md:h-32 pixelated object-contain drop-shadow-xl"
        />
      </div>

      {/* Prominent Glowing Fireflies dancing across the meadow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {/* Left side fireflies */}
        <span className="absolute bottom-[26%] left-[14%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#eab308] animate-firefly-prominent" style={{ animationDelay: '0s' }} />
        <span className="absolute bottom-[38%] left-[22%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a,0_0_20px_#ca8a04] animate-firefly-prominent" style={{ animationDelay: '1.6s' }} />
        <span className="absolute bottom-[16%] left-[28%] w-3 h-3 bg-lime-200 rounded-full shadow-[0_0_12px_#a3e635,0_0_22px_#65a30d] animate-firefly-prominent" style={{ animationDelay: '3.2s' }} />

        {/* Center / Near Game Boy, Pokeballs, and Hello Kitty */}
        <span className="absolute bottom-[32%] left-[42%] w-3.5 h-3.5 bg-yellow-200 rounded-full shadow-[0_0_14px_#fde047,0_0_28px_#facc15] animate-firefly-prominent" style={{ animationDelay: '0.8s' }} />
        <span className="absolute bottom-[22%] left-[52%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent" style={{ animationDelay: '2.4s' }} />
        <span className="absolute bottom-[44%] left-[62%] w-3 h-3 bg-amber-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#d97706] animate-firefly-prominent" style={{ animationDelay: '4.0s' }} />

        {/* Right side fireflies */}
        <span className="absolute bottom-[28%] right-[22%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#ca8a04] animate-firefly-prominent" style={{ animationDelay: '1.2s' }} />
        <span className="absolute bottom-[40%] right-[14%] w-2.5 h-2.5 bg-lime-200 rounded-full shadow-[0_0_10px_#a3e635] animate-firefly-prominent" style={{ animationDelay: '2.8s' }} />
        <span className="absolute bottom-[18%] right-[8%] w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-[0_0_14px_#fde047,0_0_26px_#eab308] animate-firefly-prominent" style={{ animationDelay: '3.6s' }} />
        <span className="absolute bottom-[48%] right-[32%] w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent" style={{ animationDelay: '4.8s' }} />
      </div>

      {/* Title screen menu: Handcrafted Indie RPG Game Frame */}
      <div className="absolute top-8 sm:top-12 left-8 sm:left-12 origin-top-left z-50 flex flex-col items-start scale-95 sm:scale-100">
        <div className="absolute inset-0 bg-[#100f1f]/30 blur-[15px] rounded-lg -z-10" />
        <IndiePixelWindow title="MAIN MENU" className="min-w-[275px] sm:min-w-[315px] shadow-[0_15px_40px_rgba(0,0,0,0.8)] bg-[#100f1f]/95 backdrop-blur-sm">
          <div className="p-2 sm:p-2.5">
            <ul
              className="list-none m-0 p-0 flex flex-col gap-1.5 focus-visible:outline-none"
              role="listbox"
              aria-label="Main menu"
              aria-activedescendant={`gb-menu-${selectedIndex}`}
              tabIndex={0}
            >
              {menuItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <li
                    key={item}
                    id={`gb-menu-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedIndex(idx);
                      handleSelect();
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-2 select-none transition-all duration-150 ${isSelected
                      ? "bg-gradient-to-r from-[#FF8FB3]/25 via-[#FFD166]/15 to-transparent border-l-4 border-[#FF8FB3] border-t border-b border-r border-[#FF8FB3]/30 shadow-[inset_0_0_12px_rgba(255,143,179,0.15)]"
                      : "border-l-4 border-transparent hover:bg-[#252244]/70 border border-transparent"
                      }`}
                  >
                    {/* Animated 8-bit RPG Cursor */}
                    <div className="w-3.5 flex items-center justify-center flex-shrink-0">
                      {isSelected ? (
                        <span className="text-[#FF8FB3] text-[11px] font-bold drop-shadow-[0_0_6px_#FF8FB3] animate-pulse">
                          ▶
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-none bg-[#383359] group-hover:bg-[#FFD166]/60 transition-colors" />
                      )}
                    </div>

                    {/* Menu Item Label */}
                    <span
                      className={`text-[10px] sm:text-[11px] tracking-[1.2px] transition-colors ${isSelected
                        ? "text-[#FFF3D8] font-bold drop-shadow-[0_2px_0px_#100E21] drop-shadow-[0_0_8px_rgba(255,209,102,0.6)]"
                        : "text-[#D2CBE6] group-hover:text-[#FFF3D8] drop-shadow-[0_1px_0px_#0C0B17]"
                        }`}
                    >
                      {item}
                    </span>

                    {/* Trailing RPG Sparkle Pip */}
                    {isSelected && (
                      <span className="ml-auto text-[#FFD166] text-[8px] animate-bounce-soft">
                        ✦
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ═══ ORNATE FILIGREE DIVIDER ═══ */}
          <div className="flex items-center gap-2 px-4 py-0.5">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-[#E5B25D]/10" />
            <span className="text-[#FFE27A] text-[6px] opacity-80">◆</span>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#E5B25D]/50 to-[#E5B25D]/10" />
          </div>

          {/* ═══ 3D SHADED RPG CONTROLLER KEYS ═══ */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#100F1F]/60 select-none">
            {/* Move Keys */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ▲
              </span>
              <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ▼
              </span>
              <span className="text-[7px] text-[#FFD166] tracking-wider ml-1 drop-shadow-[0_1px_0px_#0A0912]">
                MOVE
              </span>
            </div>

            {/* Select Key */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center h-[19px] px-2 bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ENTER
              </span>
              <span className="text-[7px] text-[#FFD166] tracking-wider drop-shadow-[0_1px_0px_#0A0912]">
                SELECT
              </span>
            </div>
          </div>
        </IndiePixelWindow>

        {/* ═══ SMALL INDIE POPUP BOX (HINT & LOCATION ERROR) ═══ */}
        <div
          key={shakeKey}
          className={`relative mt-2.5 w-full max-w-[275px] sm:max-w-[315px] p-[2px] rounded-sm select-none transition-all duration-200 ${popupError
            ? "bg-[#FF5C77] animate-pixel-shake shadow-[0_0_14px_rgba(255,92,119,0.5),3px_3px_0px_#100E1C]"
            : "bg-gradient-to-r from-[#E5B25D] via-[#FFE27A] to-[#E5B25D] shadow-[3px_3px_0px_rgba(16,14,28,0.6)]"
            }`}
        >
          <div
            className={`relative px-3 py-2 flex items-center gap-2 rounded-[1px] ${popupError
              ? "bg-[#280E1C] border border-[#FF5C77]/60"
              : "bg-gradient-to-b from-[#1C1A33] via-[#16152B] to-[#121124] border border-[#383359]"
              }`}
          >
            {/* Top pointing speech pip */}
            <div
              className={`absolute -top-1.5 left-7 w-2.5 h-2.5 rotate-45 border-t border-l ${popupError
                ? "bg-[#280E1C] border-[#FF5C77]/60"
                : "bg-[#1C1A33] border-[#383359]"
                }`}
            />

            {/* Status Icon */}
            <span
              className={`text-[9px] flex-shrink-0 ${popupError ? "text-[#FF5C77] font-bold animate-pulse" : "text-[#FFD166]"
                }`}
            >
              {popupError ? "⚠" : "✦"}
            </span>

            {/* Message Text */}
            <span
              className={`font-retro text-[8px] leading-relaxed tracking-wider ${popupError
                ? "text-[#FFD6DD] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                : selectedIndex === 1
                  ? "text-[#FFEBB3] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  : "text-[#FFEBB3] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                }`}
            >
              {popupError
                ? "ERROR: player has changed location"
                : selectedIndex === 1
                  ? "PRESS ENTER TO BEGIN"
                  : "USE ARROW KEYS TO TOGGLE"}
            </span>
          </div>
        </div>
      </div>



      <HelloKittyAlertModal isOpen={showKittyModal} onClose={closeKittyModal} />
    </div>
  );
}
