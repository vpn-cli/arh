"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGameState } from "@/lib/gameState";
import { sfx } from "@/lib/audio";
import gsap from "gsap";
import SpotifyPlayerUI from "./SpotifyPlayerUI";

export default function MusicWorld() {
  const { goHome } = useGameState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }

    // Generate random notes
    const generatedNotes = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${10 + Math.random() * 20}s`,
      color: ['#FF99B9', '#FFB6C1', '#FF69B4', '#FFF0F5', '#FF8FB3'][Math.floor(Math.random() * 5)],
      size: `${1 + Math.random() * 3}rem`,
      rotation: `${Math.random() * 60 - 30}deg`, // slight tilt
      symbol: ['♪', '♫', '♬', '♩', '♭', '♮', '♯'][Math.floor(Math.random() * 7)]
    }));
    setNotes(generatedNotes);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#FFF0F5] text-[#9B4F96] overflow-hidden selection:bg-[#FFB6C1]/40">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft glowing orbs */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-[#FFB6C1]/30 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-[#FFE4E1]/50 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
        
        {/* Retro dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(#FF99B9 2px, transparent 2px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Floating musical notes */}
        {notes.map((note) => (
          <div 
            key={note.id}
            className="absolute animate-float font-pixel opacity-40 drop-shadow-md select-none pointer-events-none"
            style={{
              top: note.top,
              left: note.left,
              animationDelay: note.delay,
              animationDuration: note.duration,
              color: note.color,
              fontSize: note.size,
              transform: `rotate(${note.rotation})`
            }}
          >
            {note.symbol}
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <div className="fixed top-0 left-0 w-full p-4 sm:p-6 z-50 flex justify-between items-start pointer-events-none">
        <button
          onClick={() => {
            sfx.select();
            goHome();
          }}
          onMouseEnter={() => sfx.hover()}
          className="pointer-events-auto group px-4 py-2 bg-[#FFFFFF]/80 backdrop-blur-md border-2 border-[#FFB6C1] rounded-full flex items-center gap-2 hover:bg-[#FFE4E1] transition-colors shadow-sm"
        >
          <span className="text-[#FF69B4] text-xs font-pixel mt-1 group-hover:-translate-x-1 transition-transform">◀</span>
          <span className="font-retro text-[8px] sm:text-[10px] text-[#9B4F96] tracking-[2px] uppercase group-hover:text-[#FF69B4] transition-colors">
            HOME WORLD
          </span>
        </button>

        <div className="px-4 py-2 bg-[#FFFFFF]/80 border-2 border-[#FFB6C1] rounded-full shadow-sm flex items-center gap-2">
          <span className="font-retro text-[8px] text-[#FF69B4] tracking-[2px]">MUSIC WORLD</span>
          <span className="font-pixel text-[10px] text-[#FF99B9]">♪</span>
        </div>
      </div>

      {/* Main Content Flow */}
      <main ref={containerRef} className="relative z-10 w-full flex flex-col items-center justify-center min-h-[100dvh] pt-16 pb-4 px-4">
        
        <div className="text-center mb-6 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl opacity-90 animate-bounce-soft drop-shadow-md font-pixel text-[#FFB6C1]">♫</div>
          <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl font-bold text-[#FF69B4] tracking-wider drop-shadow-[0_4px_0_#FFFFFF,0_0_20px_rgba(255,105,180,0.4)] mb-3 mt-4">
            SOUNDSCAPES
          </h1>
          <p className="font-retro text-[9px] sm:text-[11px] text-[#FF99B9] tracking-[4px] uppercase bg-[#FFFFFF]/50 py-1.5 px-6 rounded-full border-2 border-[#FFB6C1] backdrop-blur-sm shadow-sm inline-block font-bold">
            Vibes / Frequencies / Memories
          </p>
        </div>

        {/* Custom Retro Spotify Player UI */}
        <div className="w-full max-w-5xl bg-[#FFFFFF]/90 backdrop-blur-md border-4 border-[#FFB6C1] rounded-3xl shadow-[0_10px_30px_rgba(255,182,193,0.3)] overflow-hidden relative group">
          
          {/* Mac-OS Classic Style Header */}
          <div className="bg-[#FFF0F5] px-4 py-3 flex items-center justify-between border-b-4 border-[#FFE4E1]">
            <div className="flex gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFB6C1] shadow-inner" />
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF69B4] shadow-inner" />
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FF99B9] shadow-inner" />
            </div>
            <div className="font-retro text-[8px] sm:text-[10px] text-[#FF69B4] tracking-[2px] flex items-center gap-2 font-bold">
              <span className="text-[#FF69B4] text-sm animate-pulse">💕</span>
              KAWAII_PLAYER.EXE
            </div>
            <div className="w-12" /> {/* Flex spacer */}
          </div>

          <div className="p-4 sm:p-8 flex flex-col items-center">
            
            <SpotifyPlayerUI />

          </div>

          {/* Aesthetic tape decoration on corners */}
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
            <div className="absolute top-4 -right-6 w-24 h-4 bg-[#FFB6C1]/30 backdrop-blur-sm rotate-45 transform origin-center shadow-sm" />
          </div>
        </div>

      </main>
    </div>
  );
}
