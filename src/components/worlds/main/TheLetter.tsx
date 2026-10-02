"use client";

import React, { useState, useRef } from "react";
import { sfx } from "@/lib/audio";
import Image from "next/image";

export default function TheLetter() {
  const [isOpen, setIsOpen] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (isOpen) return;
    sfx.pop();
    setIsOpen(true);
    
    // Auto-scroll slightly to bring letter into full view after a delay
    setTimeout(() => {
      if (letterRef.current) {
        letterRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-32 mb-48 px-4 relative z-10 flex flex-col items-center">
      <div className="text-center mb-16">
        <span className="text-4xl mb-4 block animate-bounce-soft">✉️</span>
        <h2 className="font-pixel text-2xl text-[#B9D7C0] tracking-wider mb-2">
          ONE LAST THING
        </h2>
        <p className="font-retro text-[9px] text-[#8C7A99] tracking-[2px]">
          a letter just for you
        </p>
      </div>

      {/* The Envelope / Letter Container */}
      <div 
        ref={letterRef}
        className={`relative w-full max-w-lg mx-auto transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${!isOpen ? 'h-[250px] cursor-pointer hover:scale-105 active:scale-95' : ''}`}
        onClick={handleOpen}
      >
        {/* Unopened Envelope state */}
        <div className={`absolute inset-0 bg-[#FFD6E7] border-4 border-[#FF8FB3] shadow-[8px_8px_0_rgba(255,143,179,0.5)] rounded-lg transition-all duration-700 z-20 flex flex-col items-center justify-center overflow-hidden ${isOpen ? 'opacity-0 pointer-events-none scale-95 translate-y-10' : 'opacity-100'}`}>
          {/* Cute envelope flap details */}
          <div className="absolute top-0 left-0 w-full h-1/2 border-b-4 border-[#FF8FB3] bg-[#FFB6C1] origin-top opacity-50" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
          
          <div className="w-20 h-20 rounded-full bg-[#FF4F9A] border-4 border-[#FFF0F5] flex items-center justify-center shadow-lg animate-pulse-soft z-10 relative group">
            <span className="text-white text-3xl group-hover:scale-125 transition-transform">🎀</span>
          </div>
          <p className="font-retro text-[#9B2C61] text-[10px] sm:text-xs tracking-widest mt-8 uppercase font-bold bg-[#FFF0F5] px-4 py-1 rounded-full border-2 border-[#FF8FB3]">
            Click to break seal
          </p>
        </div>

        {/* Opened Letter state */}
        <div 
          className={`
            bg-[#FFF0F5] border-2 border-[#FFB6C1] shadow-[0_20px_40px_rgba(255,182,193,0.4)] 
            p-8 sm:p-12 transition-all duration-1000 delay-300 origin-top z-10 relative rounded-xl
            bg-[radial-gradient(#FFB6C1_1px,transparent_1px)] bg-[size:20px_20px]
            ${isOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'absolute inset-x-0 top-0 opacity-0 scale-y-0 -translate-y-10 pointer-events-none'}
          `}
        >
          
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap');
            .font-handwriting {
              font-family: 'Caveat', cursive;
            }
          `}</style>
          
          {/* Tape / Pins */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-[#FFD166]/80 backdrop-blur-sm -rotate-3 shadow-md rounded-sm border border-[#FFD166]" />
          <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#FF4F9A] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] border-2 border-[#FFF0F5]" />
          
          {/* Floating cute stickers */}
          <div className="absolute top-8 left-6 text-3xl -rotate-12 opacity-80">🌸</div>
          <div className="absolute bottom-12 left-8 text-2xl rotate-12 opacity-70">✨</div>
          
          <div className="font-handwriting text-[#3A2440] space-y-6 text-2xl sm:text-3xl leading-relaxed mt-4 relative z-10">
            <p className="font-bold text-3xl sm:text-4xl text-[#9B2C61] mb-6">
              Dear Arhana,
            </p>
            <p className="pl-4">
              Happy birthday! I wanted to make something special that could capture all the chaos, the memes, and the late-night conversations we've shared.
            </p>
            <p className="pl-4">
              This little corner of the internet is for you. A place where the hamsters run free, the music is always exactly your vibe, and the memories are safely stored.
            </p>
            <p className="pl-4">
              Thank you for being the incredible, unique, and wonderful person that you are. Here's to surviving another year and making the next one even better.
            </p>
            <p className="pt-8 font-bold text-3xl text-[#9B2C61] pl-4">
              Love,
              <br />
              <span className="text-xl tracking-widest mt-2 block opacity-80">Your Bestie 🎀</span>
            </p>
          </div>

          {/* Tiny hamster doodle at the bottom */}
          <div className="absolute bottom-6 right-6 opacity-60 w-16 h-16 rotate-12">
            <img 
              src="/hampter/devious hamster doodle.jpeg" 
              alt="doodle" 
              className="w-full h-full object-cover mix-blend-multiply rounded-full" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
