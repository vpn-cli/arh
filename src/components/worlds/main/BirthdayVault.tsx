"use client";

import React, { useState } from "react";
import ReactDOM from "react-dom";
import IndiePixelWindow from "@/components/ui/IndiePixelWindow";
import { sfx } from "@/lib/audio";
import gsap from "gsap";

export default function BirthdayVault() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    if (isOpen || isUnlocking) return;
    setIsUnlocking(true);
    sfx.select();
    
    // Simulate unlocking sequence
    setTimeout(() => {
      sfx.move();
    }, 400);
    setTimeout(() => {
      sfx.move();
    }, 800);
    setTimeout(() => {
      sfx.pop();
      setIsOpen(true);
      setIsUnlocking(false);
    }, 1200);
  };

  const handleClose = () => {
    sfx.hover();
    setIsOpen(false);
  };

  // Prevent background scrolling when vault modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalContent = isOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0C0A15]/90 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative w-full max-w-3xl animate-slide-up">
        <IndiePixelWindow title="THE VAULT IS OPEN" onClose={handleClose}>
          <div className="p-8 sm:p-12 bg-gradient-to-b from-[#1C1A33] to-[#100E1C] flex flex-col items-center text-center">
            <span className="text-6xl mb-6 animate-bounce-soft drop-shadow-[0_0_20px_rgba(255,209,102,0.5)]">🎂</span>
            <h2 className="font-pixel text-3xl sm:text-5xl font-bold text-[#FFD166] mb-4 drop-shadow-[0_4px_0_#100E1C]">
              HAPPY BIRTHDAY!
            </h2>
            <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#FF8FB3]/60 to-transparent mb-6" />
            <p className="font-retro text-xs sm:text-sm text-[#D2CBE6] tracking-[2px] leading-relaxed max-w-lg mb-8">
              You cracked the code! Wishing you the most incredible year ahead. Filled with joy, endless snacks, and exactly zero bugs in your code.
            </p>
            <button 
              onClick={handleClose}
              className="px-6 py-3 bg-[#FF8FB3] text-[#141224] font-retro font-bold text-sm tracking-widest rounded-sm shadow-[3px_3px_0_#C85A7F] active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFB6C1]"
            >
              RETURN TO ADVENTURE
            </button>
          </div>
        </IndiePixelWindow>
        
        {/* Celebration particles */}
        <div className="absolute -inset-10 pointer-events-none -z-10 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 rounded-full animate-firefly"
              style={{
                backgroundColor: ['#FFD166', '#FF8FB3', '#B9D7C0', '#C8B8F1'][i % 4],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full max-w-2xl mx-auto my-32 px-4 relative z-10 flex flex-col items-center">
      {/* The Vault Object in the flow */}
      <div 
        className="w-full max-w-md cursor-pointer group relative hover:-translate-y-2 transition-transform duration-500"
        onClick={handleOpen}
      >
        <IndiePixelWindow title="??? MYSTERY VAULT ???">
          <div className="p-10 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#100F1F] to-[#1C1A33] transition-colors group-hover:from-[#1A182E] group-hover:to-[#2E2A52] relative overflow-hidden">
            
            {/* Caution tape decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#FFD166,#FFD166_10px,#100E1C_10px,#100E1C_20px)] opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#FF8FB3,#FF8FB3_10px,#100E1C_10px,#100E1C_20px)] opacity-50" />

            <div className={`text-7xl mb-6 transition-transform duration-500 drop-shadow-[0_10px_0_rgba(0,0,0,0.5)] relative z-10 ${isUnlocking ? 'animate-pixel-shake' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
              🧰
            </div>
            
            <h3 className="font-pixel text-2xl text-[#FFD166] mb-3 tracking-widest drop-shadow-[2px_2px_0_#100E1C] relative z-10">
              {isUnlocking ? "UNLOCKING..." : "LOCKED VAULT"}
            </h3>
            
            <p className="font-retro text-[9px] text-[#B9D7C0] tracking-[2px] relative z-10 bg-[#100E1C]/80 px-4 py-2 rounded-sm border border-[#383359]">
              Requires birthday credentials.
            </p>
            
            {!isUnlocking && (
              <div className="mt-8 px-6 py-3 bg-[#E5B25D] border-b-4 border-r-4 border-[#C7913D] text-[#100E1C] font-retro text-[10px] font-bold tracking-widest uppercase group-hover:bg-[#FFD166] group-hover:translate-y-[2px] group-hover:border-b-2 group-hover:border-r-2 transition-all relative z-10 flex items-center gap-3">
                <span className="animate-pulse">▶</span>
                OVERRIDE PROTOCOL
              </div>
            )}
            
            {/* Ambient light ray behind box */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,209,102,0.1)_0%,transparent_70%)] pointer-events-none" />
          </div>
        </IndiePixelWindow>
      </div>

      {/* The Opened Vault Experience (Overlay via Portal) */}
      {mounted && typeof document !== 'undefined' 
        ? ReactDOM.createPortal(modalContent, document.body) 
        : modalContent}
    </div>
  );
}
