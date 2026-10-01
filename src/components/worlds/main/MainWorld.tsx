"use client";

import React, { useEffect, useRef } from "react";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AsciiSection from "./AsciiSection";
import BirthdayVault from "./BirthdayVault";
import TheEdit from "./TheEdit";
import TheLetter from "./TheLetter";

gsap.registerPlugin(ScrollTrigger);

export default function MainWorld() {
  const { goHome, mainWorldScrollY, setMainWorldScrollY } = useGameState();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount, save on unmount
  useEffect(() => {
    if (mainWorldScrollY > 0) {
      window.scrollTo({ top: mainWorldScrollY, behavior: "instant" });
    }

    return () => {
      setMainWorldScrollY(window.scrollY);
    };
  }, [mainWorldScrollY, setMainWorldScrollY]);

  // Entrance animations for hero
  useEffect(() => {
    if (!heroRef.current) return;

    gsap.fromTo(
      heroRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "back.out(1.2)" }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-[#0C0A15] text-[#FFEBB3] overflow-hidden selection:bg-[#FF8FB3]/40">

      {/* ═══ WORLD AMBIENCE & BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base dark purple background */}
        <div className="absolute inset-0 bg-[#161324]" />

        {/* Animated gradient blobs for richness */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF8FB3]/10 blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFD166]/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

        {/* User-Uploaded ASCII Pattern Background */}
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-screen"
          style={{
            backgroundImage: `url('/ref/download (9).jpeg')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            filter: "invert(1) contrast(1.5)",
          }}
        />

        {/* Ambient floating pixel motifs */}
        <div className="absolute top-[15%] left-[5%] text-4xl opacity-20 animate-float" style={{ animationDelay: '0s' }}>🌸</div>
        <div className="absolute top-[45%] right-[8%] text-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute top-[75%] left-[12%] text-4xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>🎀</div>
        <div className="absolute top-[25%] right-[15%] text-2xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>✨</div>
        <div className="absolute top-[65%] right-[25%] text-5xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>☁️</div>
        <div className="absolute top-[85%] right-[10%] text-3xl opacity-20 animate-float" style={{ animationDelay: '2.5s' }}>💖</div>
      </div>

      {/* ═══ NAVIGATION / HEADER ═══ */}
      <div className="fixed top-0 left-0 w-full p-4 sm:p-6 z-50 flex justify-between items-start pointer-events-none">
        <button
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="pointer-events-auto group px-4 py-2 bg-[#1C1A33]/80 backdrop-blur-md border border-[#383359] rounded-sm flex items-center gap-2 hover:bg-[#2E2A52] transition-colors"
        >
          <span className="text-[#FFD166] text-xs font-pixel mt-1 group-hover:-translate-x-1 transition-transform">◀</span>
          <span className="font-retro text-[8px] sm:text-[10px] text-[#D2CBE6] tracking-[2px] uppercase group-hover:text-white transition-colors">
            HOME WORLD
          </span>
        </button>

        <div className="px-3 py-1.5 bg-[#E5B25D]/10 border border-[#E5B25D]/30 rounded-sm">
          <span className="font-retro text-[8px] text-[#FFD166] tracking-[2px]">MAIN WORLD</span>
        </div>
      </div>

      {/* ═══ CONTENT FLOW ═══ */}
      <main className="relative z-10 w-full flex flex-col items-center pt-32 sm:pt-48 pb-48">

        {/* Floating decorative elements in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-8 h-8 rounded-full bg-[#FF8FB3]/20 blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[40%] right-[15%] w-12 h-12 rounded-full bg-[#FFD166]/20 blur-xl animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute top-[60%] left-[20%] w-16 h-16 rounded-full bg-[#B9D7C0]/20 blur-xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-[80%] right-[10%] w-10 h-10 rounded-full bg-[#E5B25D]/20 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />

          {/* Tiny pixel stars */}
          <div className="absolute top-[25%] right-[20%] text-[#FFD166] text-[10px] animate-firefly">✦</div>
          <div className="absolute top-[45%] left-[25%] text-[#FF8FB3] text-[12px] animate-firefly" style={{ animationDelay: '1s' }}>✦</div>
          <div className="absolute top-[75%] left-[15%] text-[#B9D7C0] text-[8px] animate-firefly" style={{ animationDelay: '2s' }}>✦</div>
          
          {/* Pixelated Aesthetic Elements */}
          <div className="absolute top-[18%] left-[8%] font-pixel text-5xl text-[#FF8FB3]/30 -rotate-12 animate-float pointer-events-none drop-shadow-md">♥</div>
          <div className="absolute top-[35%] right-[12%] font-pixel text-6xl text-[#FFD166]/20 rotate-12 animate-float pointer-events-none drop-shadow-md" style={{animationDelay: '1.2s'}}>★</div>
          <div className="absolute top-[55%] left-[10%] font-pixel text-4xl text-[#B9D7C0]/30 -rotate-6 animate-float pointer-events-none drop-shadow-md" style={{animationDelay: '0.8s'}}>✿</div>
          <div className="absolute top-[70%] right-[8%] font-pixel text-5xl text-[#FF8FB3]/30 rotate-45 animate-bounce-soft pointer-events-none drop-shadow-md" style={{animationDelay: '2.1s'}}>◆</div>
          <div className="absolute top-[85%] left-[18%] font-pixel text-4xl text-[#FFD166]/20 rotate-12 animate-float pointer-events-none drop-shadow-md" style={{animationDelay: '0.4s'}}>✦</div>
        </div>

        {/* 1. HERO SECTION */}
        <div ref={heroRef} className="w-full max-w-4xl px-4 flex flex-col items-center text-center mb-16 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-10 rounded-full border-4 border-[#FFD166]/50 shadow-[0_0_30px_rgba(255,209,102,0.3)] overflow-hidden bg-[#1C1A33] animate-float relative group">
            <img src="/hampter/YAAAA hamster.jpeg" alt="Guide" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] pointer-events-none" />
          </div>
          <h1 className="font-pixel text-4xl sm:text-6xl md:text-7xl font-bold text-[#FFD166] tracking-wider drop-shadow-[4px_4px_0_#100E1C,0_0_20px_rgba(255,209,102,0.3)] mb-6">
            THE ADVENTURE
          </h1>
          <p className="font-retro text-xs sm:text-sm text-[#D2CBE6] tracking-[3px] max-w-xl leading-relaxed bg-[#1C1A33]/50 p-6 rounded-xl border border-[#383359] backdrop-blur-sm shadow-xl relative">
            welcome to the main narrative. scroll down to explore memories, memes, and a few surprises along the way.
            <span className="absolute -top-4 -right-4 font-pixel text-3xl text-[#FF8FB3] rotate-12">♥</span>
          </p>
          <div className="mt-16 animate-bounce-soft opacity-70">
            <span className="text-[#524B7A] text-2xl font-pixel drop-shadow-[0_2px_0_#100E1C]">▼</span>
          </div>
        </div>

        {/* Central dashed line connecting the worlds */}
        <div className="absolute top-[20%] bottom-[20%] left-1/2 -translate-x-1/2 border-l-4 border-dashed border-[#FF8FB3]/10 z-0 pointer-events-none" />

        <div className="w-full relative flex flex-col items-center gap-16 md:gap-24 px-4 z-10 pb-16">
          {/* 2. ASCII SECTION */}
          <div className="w-full">
            <AsciiSection />
          </div>

          {/* 3. OPTIONAL BIRTHDAY VAULT */}
          <div className="w-full relative z-[50]">
            <BirthdayVault />
          </div>

          {/* 4. THE EDIT */}
          <div className="w-full relative z-20">
            <TheEdit />
          </div>

          {/* 5. THE LETTER */}
          <div className="w-full">
            <TheLetter />
          </div>
        </div>

        {/* BOTTOM NAVIGATION */}
        <div className="mt-24 text-center relative z-20">
          <p className="font-retro text-[8px] text-[#524B7A] tracking-[2px] mb-6">
            END OF TRANSMISSION
          </p>
          <button
            onClick={() => {
              sfx.select();
              goHome();
            }}
            className="group relative px-8 py-4 bg-transparent border-2 border-[#383359] text-[#8C7A99] font-retro text-[10px] tracking-[2px] overflow-hidden transition-colors hover:border-[#FFD166]"
          >
            <div className="absolute inset-0 bg-[#FFD166] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 group-hover:text-[#100E1C] transition-colors duration-300 font-bold">RETURN TO HUB</span>
          </button>
        </div>
      </main>

    </div>
  );
}
