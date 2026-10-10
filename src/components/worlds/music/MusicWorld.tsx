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
      color: ['var(--color-vibrant)', 'var(--color-muted)', 'var(--color-dark)', 'var(--color-vibrant)', 'var(--color-muted)'][Math.floor(Math.random() * 5)],
      size: `${1 + Math.random() * 3}rem`,
      rotation: `${Math.random() * 60 - 30}deg`, // slight tilt
      symbol: ['♪', '♫', '♬', '♩', '♭', '♮', '♯'][Math.floor(Math.random() * 7)]
    }));
    setNotes(generatedNotes);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[var(--color-light)] text-[var(--color-dark)] overflow-hidden selection:bg-[var(--color-muted)]/40">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft glowing orbs */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-[var(--color-muted)]/30 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-[var(--color-light)]/50 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
        
        {/* Retro dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(var(--color-muted) 2px, transparent 2px)",
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



      {/* Main Content Flow */}
      <main ref={containerRef} className="relative z-10 w-full h-[100dvh] overflow-hidden">
        <SpotifyPlayerUI onGoHome={() => {
          sfx.select();
          goHome();
        }} />
      </main>
    </div>
  );
}
