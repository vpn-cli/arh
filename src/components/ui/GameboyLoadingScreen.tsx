"use client";

import React, { useState, useEffect } from "react";
import PixelWindow from "./PixelWindow";

interface GameboyLoadingScreenProps {
  onComplete: () => void;
}

/* ═══════════════════════════════════════════════════════
   CHILL PIXEL FLOWERS (Feebly waving in the gentle breeze)
   ═══════════════════════════════════════════════════════ */

function DaisyFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 32" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M10 32 C10 22 9 16 10 9" stroke="#2e6d27" strokeWidth="2" strokeLinecap="square" />
      <path d="M9 22 C6 20 7 17 9 19" stroke="#48993f" strokeWidth="1.8" strokeLinecap="square" />
      <circle cx="10" cy="8" r="2.5" fill="#f8e71c" stroke="#d4b20a" strokeWidth="0.8" />
      <circle cx="6.5" cy="8" r="2.2" fill="#ffffff" />
      <circle cx="13.5" cy="8" r="2.2" fill="#ffffff" />
      <circle cx="10" cy="4.5" r="2.2" fill="#ffffff" />
      <circle cx="10" cy="11.5" r="2.2" fill="#ffffff" />
      <circle cx="7.5" cy="5.5" r="1.8" fill="#ffffff" />
      <circle cx="12.5" cy="5.5" r="1.8" fill="#ffffff" />
      <circle cx="7.5" cy="10.5" r="1.8" fill="#ffffff" />
      <circle cx="12.5" cy="10.5" r="1.8" fill="#ffffff" />
    </svg>
  );
}

function ButtercupFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 18 28" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M9 28 C9 20 8 15 9 8" stroke="#295c23" strokeWidth="1.8" strokeLinecap="square" />
      <path d="M9 19 C12 17 11 14 9 16" stroke="#3e8835" strokeWidth="1.8" strokeLinecap="square" />
      <circle cx="9" cy="7" r="4.2" fill="#ffd13b" stroke="#e0a300" strokeWidth="0.8" />
      <circle cx="9" cy="7" r="1.8" fill="#ff9f1c" />
    </svg>
  );
}

function PinkWildflower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 30" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M10 30 C10 21 11 15 10 8" stroke="#2e6d27" strokeWidth="1.8" strokeLinecap="square" />
      <circle cx="10" cy="7" r="4" fill="#ff9ebb" stroke="#e0698b" strokeWidth="0.8" />
      <circle cx="10" cy="7" r="1.8" fill="#fff0f5" />
    </svg>
  );
}

function CloverPlant({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 22 32" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M11 32 C11 23 10 16 11 11" stroke="#24541f" strokeWidth="2" strokeLinecap="square" />
      <circle cx="7.5" cy="9" r="3.2" fill="#4ea63f" />
      <circle cx="14.5" cy="9" r="3.2" fill="#4ea63f" />
      <circle cx="11" cy="5.5" r="3.2" fill="#5fc44d" />
    </svg>
  );
}

function BluebellFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 32" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M10 32 C10 20 9 14 11 8" stroke="#2a6627" strokeWidth="1.8" strokeLinecap="square" />
      <path d="M11 14 C14 12 13 9 11 11" stroke="#3d8434" strokeWidth="1.6" strokeLinecap="square" />
      {/* Nodding bell blossom */}
      <path d="M6 8 C6 4 14 4 14 8 L15 13 L13 14 L10 13 L7 14 L5 13 Z" fill="#7d8ff2" stroke="#485ac6" strokeWidth="0.8" />
      <circle cx="10" cy="9" r="1.5" fill="#b8c4ff" />
    </svg>
  );
}

function GoldenPoppyFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 22 30" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M11 30 C11 22 10 15 11 9" stroke="#255e20" strokeWidth="2" strokeLinecap="square" />
      <path d="M11 20 C8 18 8 15 11 17" stroke="#3b8733" strokeWidth="1.6" strokeLinecap="square" />
      <circle cx="11" cy="8" r="4.6" fill="#ff7f36" stroke="#d45011" strokeWidth="0.8" />
      <circle cx="11" cy="8" r="2.2" fill="#ffd13b" />
      <circle cx="11" cy="8" r="1" fill="#7c2d12" />
    </svg>
  );
}

function GrassTuft({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 80" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M30 80 C29 58 26 40 21 18" stroke="#0f2b0b" strokeWidth="9" strokeLinecap="square" />
      <path d="M30 80 C32 60 37 44 44 24" stroke="#163a11" strokeWidth="9" strokeLinecap="square" />
      <path d="M30 80 C28 62 20 48 8 32" stroke="#0c240a" strokeWidth="8" strokeLinecap="square" />
      <path d="M30 80 C33 64 44 52 56 40" stroke="#1b4715" strokeWidth="8" strokeLinecap="square" />
      <path d="M30 80 C30 66 30 50 31 30" stroke="#22571b" strokeWidth="7" strokeLinecap="square" />
      <path d="M30 80 C27 66 16 56 2 46" stroke="#123310" strokeWidth="7" strokeLinecap="square" />
      <path d="M30 80 C34 64 40 56 50 52" stroke="#2a6a21" strokeWidth="6" strokeLinecap="square" />
      <path d="M30 80 C26 68 20 60 12 56" stroke="#174012" strokeWidth="6" strokeLinecap="square" />
    </svg>
  );
}

function LushForegroundClover({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 50" fill="none" className={`pointer-events-none select-none pixelated ${className}`} style={style}>
      <path d="M20 50 C20 35 18 24 19 14" stroke="#1b4516" strokeWidth="3" strokeLinecap="square" />
      <path d="M19 32 C12 28 10 22 15 26" stroke="#286320" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M19 25 C26 21 28 15 23 19" stroke="#286320" strokeWidth="2.5" strokeLinecap="square" />
      {/* Big lush clover leaves */}
      <circle cx="11" cy="14" r="7" fill="#449e37" stroke="#1f5817" strokeWidth="1" />
      <circle cx="27" cy="14" r="7" fill="#449e37" stroke="#1f5817" strokeWidth="1" />
      <circle cx="19" cy="7" r="7.5" fill="#58b849" stroke="#286e1e" strokeWidth="1" />
      <circle cx="19" cy="11" r="3" fill="#75d665" />
    </svg>
  );
}

export default function GameboyLoadingScreen({ onComplete }: GameboyLoadingScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = New Game, 1 = Continue
  const [showPopup, setShowPopup] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Parallax cursor tracking with smooth lerp damping
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const targetOffsetRef = React.useRef({ x: 0, y: 0 });
  const currentOffsetRef = React.useRef({ x: 0, y: 0 });
  const animFrameRef = React.useRef<number | null>(null);

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

    const updateParallax = () => {
      const current = currentOffsetRef.current;
      const target = targetOffsetRef.current;
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      setMouseOffset({ x: current.x, y: current.y });
      animFrameRef.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const menuItems = ["START NEW GAME", "CONTINUE"];

  const handleSelect = (index: number) => {
    if (index === 0) {
      // Start New Game
      setIsTransitioning(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      // Continue
      setShowPopup(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (showPopup || isTransitioning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setSelectedIndex(0);
      } else if (e.key === "ArrowDown") {
        setSelectedIndex(1);
      } else if (e.key === "Enter") {
        handleSelect(selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, showPopup, isTransitioning]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-start p-8 sm:p-12 transition-opacity duration-1000 ${
        isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Scene Container with Locked 16:9 Aspect Ratio */}
      <div className="absolute inset-0 -z-10 overflow-hidden flex items-center justify-center bg-[#8db356]">
        <div 
          className="relative flex-shrink-0 select-none"
          style={{
            width: 'max(100vw, calc(100vh * 16 / 9))',
            height: 'max(100vh, calc(100vw * 9 / 16))',
          }}
        >
          {/* Base 16:9 Image (z-0) */}
          <img 
            src="/images/loading_bg.jpg" 
            alt="Retro Meadow" 
            className="w-full h-full object-fill pixelated pointer-events-none will-change-transform"
            style={{
              transform: `scale(1.06) translate3d(${mouseOffset.x * -4}px, ${mouseOffset.y * -2}px, 0)`,
            }}
          />

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 1 (z-[5]): Distant Hillside Wildflowers
              Very gentle parallax: x * -8px, y * -4px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[5] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -8}px, ${mouseOffset.y * -4}px, 0)`,
            }}
          >
            <ButtercupFlower className="absolute bottom-[28%] left-[23%] w-4 h-6 opacity-75 animate-flower-sway-slow" style={{ animationDelay: '0.8s' }} />
            <DaisyFlower className="absolute bottom-[26%] left-[32%] w-4 h-6 opacity-80 animate-flower-sway" style={{ animationDelay: '1.9s' }} />
            <PinkWildflower className="absolute bottom-[30%] left-[57%] w-4 h-6 opacity-75 animate-flower-sway-fast" style={{ animationDelay: '0.3s' }} />
            <BluebellFlower className="absolute bottom-[27%] left-[64%] w-4 h-6 opacity-80 animate-flower-sway" style={{ animationDelay: '1.4s' }} />
            <ButtercupFlower className="absolute bottom-[25%] left-[81%] w-4 h-6 opacity-75 animate-flower-sway-slow" style={{ animationDelay: '2.2s' }} />
            <PinkWildflower className="absolute bottom-[29%] left-[87%] w-4 h-6 opacity-70 animate-flower-sway" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              IN-PLACE ANIMATIONS FOR PIXEL MEMES (z-10)
              Subtle midground parallax: x * -12px, y * -6px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none z-10 will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -12}px, ${mouseOffset.y * -6}px, 0)`,
            }}
          >
            {/* 1. Grass Nyan Cat (Bottom Right): Animated pixel stars & rainbow sparkles */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '80.0%', top: '66.0%' }}
            >
              <span className="text-yellow-200 text-xs sm:text-sm animate-sparkle" style={{ animationDelay: '0s' }}>
                ✨
              </span>
              <span className="text-pink-300 text-[10px] animate-bounce-soft -mt-1" style={{ animationDelay: '0.4s' }}>
                ✦
              </span>
            </div>

            {/* 2. Pop Cat in the grass: Animated POP! speech bubble & mouth bounce */}
            <div 
              className="absolute flex flex-col items-center pointer-events-auto cursor-pointer group"
              style={{ left: '69.0%', top: '78.0%' }}
              title="Pop Cat!"
            >
              <span className="font-retro text-[8px] sm:text-[9px] text-white bg-black/80 px-2 py-0.5 border border-yellow-300/80 rounded shadow-md group-hover:scale-110 animate-bounce">
                POP!
              </span>
              <span className="text-yellow-300 text-xs animate-pulse -mt-1">
                ▼
              </span>
            </div>

            {/* 3. Smudge Cat at the Table: Steam rising from salad plate */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '74.5%', top: '46.0%', width: '8.5%' }}
            >
              <span className="text-yellow-300 font-retro text-[10px] sm:text-xs animate-bounce-soft drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ?_?
              </span>
              <div className="flex gap-1 -mt-0.5 opacity-75">
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '0s' }}>~</span>
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '0.6s' }}>~</span>
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '1.2s' }}>~</span>
              </div>
            </div>

            {/* 4. Hello Kitty in the Meadow: Floating sparkles & pulsing heart */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center animate-chill-breathe"
              style={{ left: '63.5%', top: '44.5%', width: '6.0%' }}
            >
              <span className="text-pink-300 text-sm sm:text-base animate-bounce-soft drop-shadow-[0_0_8px_rgba(255,143,179,0.8)]">
                💖
              </span>
              <span className="text-yellow-200 text-xs animate-sparkle -mt-1" style={{ animationDelay: '0.5s' }}>
                ✨
              </span>
            </div>

            {/* 5. Screaming Cat in the Mid-Ground: Soundwave scream */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '54.0%', top: '43.0%' }}
            >
              <span className="font-retro text-[8px] sm:text-[9px] text-white bg-black/70 px-1 py-0.5 border border-white/40 rounded shadow animate-pulse">
                AAA!
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 2 (z-[15]): Midground Meadow Flowers
              Moderate parallax: x * -22px, y * -11px
              Around Game Boy, Cartridge, Pokeballs, and Hello Kitty
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[15] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -22}px, ${mouseOffset.y * -11}px, 0)`,
            }}
          >
            <ButtercupFlower className="absolute bottom-[17%] left-[27%] w-6 h-9 animate-flower-sway-slow" style={{ animationDelay: '1.5s' }} />
            <DaisyFlower className="absolute bottom-[15%] left-[35%] w-7 h-10 animate-flower-sway" style={{ animationDelay: '0.4s' }} />
            <BluebellFlower className="absolute bottom-[14%] left-[43%] w-6 h-9 animate-flower-sway-slow" style={{ animationDelay: '1.8s' }} />
            <GoldenPoppyFlower className="absolute bottom-[17%] left-[51%] w-6 h-9 animate-flower-sway-fast" style={{ animationDelay: '2.4s' }} />
            <DaisyFlower className="absolute bottom-[13%] left-[61%] w-7 h-10 animate-flower-sway-slow" style={{ animationDelay: '0.9s' }} />
            <PinkWildflower className="absolute bottom-[16%] left-[71%] w-6 h-9 animate-flower-sway" style={{ animationDelay: '1.2s' }} />
            <ButtercupFlower className="absolute bottom-[15%] left-[83%] w-6 h-9 animate-flower-sway-fast" style={{ animationDelay: '0.6s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 3 (z-[22]): Foreground Blooming Flowers & Clovers
              Strong parallax: x * -44px, y * -20px
              Lower screen framing with swaying wildflowers
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[22] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -44}px, ${mouseOffset.y * -20}px, 0)`,
            }}
          >
            {/* Left lower meadow clovers & blossoms */}
            <CloverPlant className="absolute bottom-[3%] left-[4%] w-9 h-12 animate-flower-sway-slow" style={{ animationDelay: '0.2s' }} />
            <DaisyFlower className="absolute bottom-[2%] left-[9%] w-8 h-12 animate-flower-sway" style={{ animationDelay: '1.2s' }} />
            <ButtercupFlower className="absolute bottom-[5%] left-[15%] w-7 h-10 animate-flower-sway-fast" style={{ animationDelay: '0.6s' }} />
            <CloverPlant className="absolute bottom-[1%] left-[21%] w-10 h-13 animate-flower-sway" style={{ animationDelay: '2.1s' }} />

            {/* Center lower framing */}
            <GoldenPoppyFlower className="absolute bottom-[4%] left-[40%] w-8 h-11 animate-flower-sway-slow" style={{ animationDelay: '1.1s' }} />
            <PinkWildflower className="absolute bottom-[2%] left-[47%] w-8 h-11 animate-flower-sway-fast" style={{ animationDelay: '2.5s' }} />
            <BluebellFlower className="absolute bottom-[3%] left-[55%] w-7 h-10 animate-flower-sway" style={{ animationDelay: '0.7s' }} />

            {/* Right lower meadow */}
            <DaisyFlower className="absolute bottom-[2%] right-[12%] w-9 h-13 animate-flower-sway" style={{ animationDelay: '1.4s' }} />
            <PinkWildflower className="absolute bottom-[4%] right-[6%] w-7 h-11 animate-flower-sway-slow" style={{ animationDelay: '2.0s' }} />
            <CloverPlant className="absolute bottom-[1%] right-[2%] w-10 h-13 animate-flower-sway-fast" style={{ animationDelay: '0.7s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 4 (z-[28]): Atmospheric Petals, Dandelions & Pollen
              Drifting air parallax: x * -30px, y * -14px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[28] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -30}px, ${mouseOffset.y * -14}px, 0)`,
            }}
          >
            {/* Wind Gust Breeze Lines */}
            <div className="absolute top-[28%] left-0 w-64 sm:w-96 h-1 bg-gradient-to-r from-transparent via-white/50 via-yellow-100/40 to-transparent rounded-full animate-wind-gust blur-[0.5px]" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[48%] left-0 w-72 sm:w-[28rem] h-1.5 bg-gradient-to-r from-transparent via-white/60 via-emerald-100/40 to-transparent rounded-full animate-wind-gust-fast blur-[0.5px]" style={{ animationDelay: '2.8s' }} />
            <div className="absolute top-[68%] left-0 w-80 sm:w-[32rem] h-1 bg-gradient-to-r from-transparent via-yellow-100/50 via-white/40 to-transparent rounded-full animate-wind-gust blur-[0.5px]" style={{ animationDelay: '5.2s' }} />

            {/* Dandelion Fluffs drifting across on the wind */}
            <span className="absolute top-[20%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] blur-[0.3px] animate-dandelion-float" style={{ animationDelay: '0s' }} />
            <span className="absolute top-[35%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] blur-[0.3px] animate-dandelion-float" style={{ animationDelay: '3.8s' }} />
            <span className="absolute top-[50%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] blur-[0.3px] animate-dandelion-float" style={{ animationDelay: '7.5s' }} />
            <span className="absolute top-[65%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] blur-[0.3px] animate-dandelion-float" style={{ animationDelay: '11.2s' }} />
            <span className="absolute top-[80%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] blur-[0.3px] animate-dandelion-float" style={{ animationDelay: '14.5s' }} />

            {/* Golden Sunlit Pollen Motes */}
            <span className="absolute top-[24%] left-0 w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fde047,0_0_16px_#ca8a04] animate-pollen-swirl" style={{ animationDelay: '0.8s' }} />
            <span className="absolute top-[38%] left-0 w-2 h-2 bg-amber-200 rounded-full shadow-[0_0_8px_#fde047] animate-pollen-swirl" style={{ animationDelay: '2.5s' }} />
            <span className="absolute top-[46%] left-0 w-2.5 h-2.5 bg-yellow-200 rounded-full shadow-[0_0_10px_#fef08a] animate-pollen-swirl" style={{ animationDelay: '5.4s' }} />
            <span className="absolute top-[62%] left-0 w-3 h-3 bg-yellow-300 rounded-full shadow-[0_0_12px_#fde047,0_0_20px_#eab308] animate-pollen-swirl" style={{ animationDelay: '7.8s' }} />
            <span className="absolute top-[76%] left-0 w-2 h-2 bg-amber-300 rounded-full shadow-[0_0_8px_#fde047] animate-pollen-swirl" style={{ animationDelay: '4.1s' }} />

            {/* Wildflower & cherry petals fluttering across */}
            <span className="absolute top-[26%] left-0 w-3.5 h-2.5 bg-pink-200/90 rounded-[40%_60%_70%_30%] shadow-[0_0_6px_rgba(255,182,193,0.6)] animate-petal-drift" style={{ animationDelay: '1.2s' }} />
            <span className="absolute top-[42%] left-0 w-4 h-2.5 bg-yellow-200/95 rounded-[50%_50%_30%_70%] shadow-[0_0_6px_rgba(254,240,138,0.7)] animate-petal-drift" style={{ animationDelay: '5.0s' }} />
            <span className="absolute top-[56%] left-0 w-3 h-2 bg-white/95 rounded-[60%_40%_50%_50%] shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-petal-drift" style={{ animationDelay: '8.8s' }} />
            <span className="absolute top-[72%] left-0 w-3.5 h-2.5 bg-pink-300/85 rounded-[30%_70%_60%_40%] shadow-[0_0_6px_rgba(244,114,182,0.6)] animate-petal-drift" style={{ animationDelay: '12.4s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 5 (z-[35]): Extreme Foreground Lens Framing
              Dramatic parallax: x * -72px, y * -32px
              Lush oversized corner plants closest to the camera lens
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[35] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -72}px, ${mouseOffset.y * -32}px, 0)`,
            }}
          >
            {/* Left corner close-up framing */}
            <LushForegroundClover className="absolute -bottom-[2%] -left-[1%] w-14 h-18 sm:w-20 sm:h-24 opacity-95 animate-flower-sway-slow drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" style={{ animationDelay: '0.5s' }} />
            <DaisyFlower className="absolute -bottom-[1%] left-[3%] w-11 h-16 animate-flower-sway drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" style={{ animationDelay: '1.7s' }} />
            <GoldenPoppyFlower className="absolute -bottom-[2%] left-[7%] w-10 h-14 animate-flower-sway-fast drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" style={{ animationDelay: '0.9s' }} />

            {/* Right corner close-up framing */}
            <ButtercupFlower className="absolute -bottom-[1%] right-[6%] w-11 h-15 animate-flower-sway drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" style={{ animationDelay: '1.3s' }} />
            <LushForegroundClover className="absolute -bottom-[2%] -right-[1%] w-14 h-18 sm:w-20 sm:h-24 opacity-95 animate-flower-sway-fast drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" style={{ animationDelay: '2.1s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 6 (z-[40]): Side grass right against the lens
              Strongest parallax: x * -110px, y * -44px
              ═══════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden z-[40] will-change-transform"
            style={{
              transform: `translate3d(${mouseOffset.x * -110}px, ${mouseOffset.y * -44}px, 0)`,
            }}
          >
            {/* Left edge */}
            <GrassTuft className="absolute -bottom-[6%] -left-[6%] w-44 h-56 sm:w-60 sm:h-72 opacity-95 animate-flower-sway-slow drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]" style={{ animationDelay: '0.3s' }} />
            <GrassTuft className="absolute -bottom-[10%] left-[4%] w-36 h-48 sm:w-48 sm:h-60 opacity-90 animate-flower-sway drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" style={{ animationDelay: '1.6s' }} />
            <GrassTuft className="absolute -bottom-[14%] left-[13%] w-28 h-40 sm:w-36 sm:h-48 opacity-85 animate-flower-sway-fast drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]" style={{ animationDelay: '2.4s' }} />

            {/* Right edge */}
            <GrassTuft className="absolute -bottom-[6%] -right-[6%] w-44 h-56 sm:w-60 sm:h-72 opacity-95 animate-flower-sway-fast drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]" style={{ animationDelay: '0.9s' }} />
            <GrassTuft className="absolute -bottom-[10%] right-[4%] w-36 h-48 sm:w-48 sm:h-60 opacity-90 animate-flower-sway-slow drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" style={{ animationDelay: '2.0s' }} />
            <GrassTuft className="absolute -bottom-[14%] right-[13%] w-28 h-40 sm:w-36 sm:h-48 opacity-85 animate-flower-sway drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]" style={{ animationDelay: '1.1s' }} />
          </div>
        </div>
      </div>

      {/* Animated Scanlines / Screen Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-20 mix-blend-overlay -z-10" />

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

      {/* Top Left Menu Row: Menu Box + Hovering Arrow Navigation Hint */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 z-20">
        {/* Retro Menu Box */}
        <div className="relative border-4 border-white bg-black/65 backdrop-blur-xs p-5 sm:p-6 font-retro text-white text-sm sm:text-base leading-loose tracking-widest uppercase inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]">
          {menuItems.map((item, idx) => (
            <div 
              key={item} 
              className="flex items-center gap-4 cursor-pointer mb-4 last:mb-0 select-none group"
              onClick={() => {
                setSelectedIndex(idx);
                handleSelect(idx);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span 
                className={`transition-opacity duration-100 text-yellow-300 ${
                  selectedIndex === idx ? "opacity-100 animate-pulse" : "opacity-0"
                }`}
              >
                ▶
              </span>
              <span 
                className={`transition-colors duration-100 ${
                  selectedIndex === idx ? "text-yellow-200 font-bold" : "text-white/60 group-hover:text-white"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Hovering / Floating Navigation Hint beside the menu */}
        <div className="animate-retro-float flex items-center gap-2.5 px-3.5 py-2.5 bg-black/75 border-2 border-yellow-300 text-yellow-300 font-retro text-xs sm:text-sm tracking-wider uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,0.7)] backdrop-blur-xs rounded-sm select-none">
          <span className="text-yellow-400 text-sm animate-pulse">▲▼</span>
          <span className="text-white drop-shadow">USE ARROWS TO NAVIGATE</span>
          <span className="text-pink-300 text-[10px] bg-white/10 px-2 py-0.5 border border-white/20">ENTER ⏎</span>
        </div>
      </div>

      {/* Popup for "Continue" */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm">
          <div className="animate-slide-up">
            <PixelWindow title="OOPS" variant="pink">
              <div className="p-8 text-center flex flex-col items-center gap-6 min-w-[280px]">
                <span className="text-5xl animate-bounce-soft">🥺</span>
                <p className="font-pixel text-3xl text-dark font-bold leading-relaxed">
                  press new game <br/>
                  <span className="text-pink">bestie ♡</span>
                </p>
                <button 
                  className="pixel-btn pixel-btn--pink px-8 py-3 text-lg mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPopup(false);
                    setSelectedIndex(0); // Reset selection to New Game
                  }}
                >
                  OKAY
                </button>
              </div>
            </PixelWindow>
          </div>
        </div>
      )}
    </div>
  );
}
