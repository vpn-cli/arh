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
        <div className={`absolute inset-0 bg-[#EBE4D8] border-2 border-[#C9BFA8] shadow-[8px_8px_0_rgba(12,10,21,0.5)] rounded-sm transition-all duration-700 z-20 flex flex-col items-center justify-center ${isOpen ? 'opacity-0 pointer-events-none scale-95 translate-y-10' : 'opacity-100'}`}>
          <div className="w-16 h-16 rounded-full bg-[#FF8FB3] border-2 border-[#D96B8F] flex items-center justify-center shadow-md animate-pulse">
            <span className="text-white text-xl">♥</span>
          </div>
          <p className="font-retro text-[#8A7F73] text-[10px] tracking-widest mt-6 uppercase">
            Click to break seal
          </p>
        </div>

        {/* Opened Letter state */}
        <div 
          className={`
            bg-[#FCF8F2] border border-[#E3D9C6] shadow-[0_20px_40px_rgba(0,0,0,0.4)] 
            p-8 sm:p-12 transition-all duration-1000 delay-300 origin-top z-10 relative
            ${isOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'absolute inset-x-0 top-0 opacity-0 scale-y-0 -translate-y-10 pointer-events-none'}
          `}
        >
          
          {/* Tape / Pins */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#FFD166]/60 backdrop-blur-sm -rotate-2 shadow-sm" />
          <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#FF8FB3] shadow-inner" />
          
          <div className="font-serif text-[#2A2338] space-y-6 text-lg sm:text-xl leading-relaxed">
            <p className="font-bold text-2xl text-[#1C1A33] mb-8 font-pixel">
              Dear Arhana,
            </p>
            <p>
              Happy birthday! I wanted to make something special that could capture all the chaos, the memes, and the late-night conversations we've shared.
            </p>
            <p>
              This little corner of the internet is for you. A place where the hamsters run free, the music is always exactly your vibe, and the memories are safely stored.
            </p>
            <p>
              Thank you for being the incredible, unique, and wonderful person that you are. Here's to surviving another year and making the next one even better.
            </p>
            <p className="pt-8 font-bold text-xl font-pixel">
              Love,
              <br />
              <span className="text-sm font-sans tracking-widest uppercase opacity-70 mt-2 block">[Your Name]</span>
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
