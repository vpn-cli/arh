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
          className="pointer-events-auto group px-4 py-2 bg-[#FFFFFF]/90 backdrop-blur-md border-2 border-[#FF87BE] rounded-full flex items-center gap-2 hover:bg-[#FFE4E1] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337]"
          aria-label="Return to Home World"
        >
          <span className="text-[#881337] text-xs font-pixel mt-0.5 group-hover:-translate-x-1 transition-transform">◀</span>
          <span className="font-pixel text-xs text-[#7A2871] font-bold tracking-wider uppercase group-hover:text-[#881337] transition-colors">
            Home World
          </span>
        </button>

        <div className="px-4 py-2 bg-[#FFFFFF]/90 border-2 border-[#FF87BE] rounded-full shadow-sm flex items-center gap-2">
          <span className="font-pixel text-xs text-[#881337] font-bold tracking-wider uppercase">Music World</span>
          <span className="font-pixel text-sm text-[#881337]">♪</span>
        </div>
      </div>

      {/* Main Content Flow */}
      <main ref={containerRef} className="relative z-10 w-full min-h-[100dvh] pt-16 pb-4 px-3 sm:px-5">
        <SpotifyPlayerUI />
      </main>
    </div>
  );
}
