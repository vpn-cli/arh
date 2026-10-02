"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sfx } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger);

export default function Scrapbook() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const items = containerRef.current.querySelectorAll('.scrapbook-item');
    
    items.forEach((item, i) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 90%",
        onEnter: () => {
          gsap.fromTo(item, 
            { y: 50, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)", delay: i * 0.1 }
          );
        },
        once: true
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-5xl mx-auto my-24 relative z-10 px-4 min-h-[600px]">
      <div className="text-center mb-16 relative z-20">
        <h2 className="font-pixel text-4xl sm:text-5xl text-[#FFF9F4] tracking-widest drop-shadow-[4px_4px_0_#3A2440,0_0_15px_rgba(255,130,184,0.6)]" style={{ WebkitTextStroke: '2px #FF4F9A' }}>
          MEMORY SCRAPBOOK
        </h2>
        <p className="font-retro text-xs sm:text-sm text-[#3A2440] mt-4 font-bold bg-[#FFF0F5] inline-block px-4 py-2 rounded-xl border-4 border-[#FF82B8] shadow-[4px_4px_0_#FF4F9A]">
          pieces of us ✨
        </p>
      </div>

      <div className="relative w-full h-[600px] sm:h-[800px] bg-[#FFF0F5] border-4 border-[#FF82B8] rounded-3xl shadow-[12px_12px_0_#FF4F9A] overflow-hidden p-8 scrapbook-bg">
        {/* Background grid/dots */}
        <div className="absolute inset-0 opacity-40" 
             style={{ backgroundImage: 'radial-gradient(#FFB6C1 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

        {/* Polaroid 1 */}
        <div 
          className="scrapbook-item absolute top-[5%] left-[2%] sm:left-[5%] w-44 sm:w-64 bg-[#FCF8F2] p-3 sm:p-4 pb-12 sm:pb-16 shadow-[5px_5px_15px_rgba(0,0,0,0.15)] border border-[#E3D9C6] rotate-[-6deg] hover:rotate-[-2deg] transition-all hover:z-30 cursor-pointer hover:scale-105"
          onMouseEnter={() => sfx.hover()}
          onClick={() => sfx.select()}
        >
          {/* Washi Tape */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-8 bg-[#B9D7C0]/80 backdrop-blur-sm rotate-3 shadow-sm border border-[#B9D7C0]" />
          <div className="w-full aspect-square bg-[#FFD6E7] overflow-hidden relative shadow-inner">
             <img src="/hampter/YAAAA hamster.jpeg" alt="Memory" className="w-full h-full object-cover" />
          </div>
          <p className="font-handwriting text-2xl sm:text-3xl text-center mt-4 text-[#3A2440] font-bold">chaotic vibes</p>
          <div className="absolute bottom-2 right-2 text-3xl rotate-12 drop-shadow-sm">💖</div>
        </div>

        {/* Polaroid 2 */}
        <div 
          className="scrapbook-item absolute top-[20%] sm:top-[15%] right-[2%] sm:right-[10%] w-40 sm:w-56 bg-[#FCF8F2] p-3 sm:p-4 pb-12 sm:pb-16 shadow-[5px_5px_15px_rgba(0,0,0,0.15)] border border-[#E3D9C6] rotate-[8deg] hover:rotate-[4deg] transition-all hover:z-30 cursor-pointer hover:scale-105"
          onMouseEnter={() => sfx.hover()}
          onClick={() => sfx.select()}
        >
          <div className="absolute -top-4 right-4 w-16 h-8 bg-[#FFD166]/80 backdrop-blur-sm -rotate-12 shadow-sm border border-[#FFD166]" />
          <div className="w-full aspect-square bg-[#FFEBB3] overflow-hidden relative shadow-inner">
            <div className="w-full h-full flex items-center justify-center text-6xl">🐹</div>
          </div>
          <p className="font-handwriting text-2xl sm:text-3xl text-center mt-4 text-[#3A2440] font-bold">hampter</p>
          <div className="absolute -top-4 -left-4 text-4xl -rotate-12 drop-shadow-md">🌸</div>
        </div>

        {/* Sticky Note */}
        <div 
          className="scrapbook-item absolute bottom-[10%] sm:bottom-[15%] left-[10%] sm:left-[20%] w-48 sm:w-64 h-48 sm:h-64 bg-[#FFF9C4] shadow-[4px_8px_15px_rgba(0,0,0,0.1)] p-6 rotate-[-3deg] hover:rotate-0 transition-all hover:z-30 flex flex-col justify-center items-center text-center cursor-pointer hover:scale-105"
          onMouseEnter={() => sfx.hover()}
          onClick={() => sfx.select()}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF8FB3] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)] opacity-80" />
          <p className="font-handwriting text-2xl sm:text-3xl text-[#5D4037] leading-tight font-bold">
            never stop being this weird! 
          </p>
          <p className="font-handwriting text-xl sm:text-2xl text-[#5D4037] mt-4 font-bold">- me</p>
          <div className="absolute bottom-4 right-4 text-3xl drop-shadow-sm">🎀</div>
        </div>

        {/* Polaroid 3 */}
        <div 
          className="scrapbook-item absolute bottom-[5%] right-[5%] sm:right-[15%] w-48 sm:w-64 bg-[#FCF8F2] p-3 sm:p-4 pb-12 sm:pb-16 shadow-[5px_5px_15px_rgba(0,0,0,0.15)] border border-[#E3D9C6] rotate-[5deg] hover:rotate-[2deg] transition-all hover:z-30 cursor-pointer hover:scale-105"
          onMouseEnter={() => sfx.hover()}
          onClick={() => sfx.select()}
        >
          <div className="absolute -top-3 left-2 w-16 h-8 bg-[#FF8FB3]/80 backdrop-blur-sm -rotate-6 shadow-sm border border-[#FF8FB3]" />
          <div className="absolute -top-3 right-2 w-16 h-8 bg-[#FF8FB3]/80 backdrop-blur-sm rotate-6 shadow-sm border border-[#FF8FB3]" />
          <div className="w-full aspect-[4/3] bg-[#E3F2FD] overflow-hidden relative shadow-inner">
            <img src="/hampter/devious hamster doodle.jpeg" alt="Memory" className="w-full h-full object-cover" />
          </div>
          <p className="font-handwriting text-2xl sm:text-3xl text-center mt-4 text-[#3A2440] font-bold">the scheme.</p>
        </div>

        {/* Random scattered stickers */}
        <div className="scrapbook-item absolute top-[40%] left-[40%] sm:left-[45%] text-6xl rotate-[25deg] hover:scale-125 transition-transform cursor-pointer drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">✨</div>
        <div className="scrapbook-item absolute bottom-[40%] left-[5%] text-5xl -rotate-[15deg] hover:scale-125 transition-transform cursor-pointer drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">🍓</div>
        <div className="scrapbook-item absolute top-[15%] right-[40%] text-7xl rotate-[10deg] hover:scale-125 transition-transform cursor-pointer drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">☁️</div>
        <div className="scrapbook-item absolute bottom-[25%] right-[45%] text-6xl -rotate-[20deg] hover:scale-125 transition-transform cursor-pointer drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">🍰</div>
      </div>
    </div>
  );
}
