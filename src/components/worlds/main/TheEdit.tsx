"use client";

import React, { useRef, useState } from "react";
import { sfx } from "@/lib/audio";
import IndiePixelWindow from "@/components/ui/IndiePixelWindow";

export default function TheEdit() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        sfx.pop();
      } else {
        videoRef.current.play();
        sfx.select();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-32 px-4 relative z-10">
      <div className="text-center mb-12">
        <h2 className="font-pixel text-3xl font-bold text-[#FF8FB3] tracking-wider mb-2 drop-shadow-[0_2px_0_#100E1C]">
          THE EDIT
        </h2>
        <p className="font-retro text-[10px] text-[#8C7A99] tracking-[2px]">
          a little cinematic moment
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Decorative Tape */}
        <div className="absolute -top-4 -left-6 w-32 h-8 bg-[#FFD166]/50 backdrop-blur-sm -rotate-6 z-20 shadow-sm mix-blend-overlay" />
        <div className="absolute -bottom-4 -right-6 w-24 h-8 bg-[#FF8FB3]/50 backdrop-blur-sm rotate-3 z-20 shadow-sm mix-blend-overlay" />
        
        {/* TV / CRT Casing */}
        <div className="bg-[#1C1A33] p-6 sm:p-8 rounded-2xl border-[8px] border-[#2E2A52] shadow-[20px_20px_0_rgba(12,10,21,0.9),inset_0_0_30px_rgba(0,0,0,0.9)] relative overflow-hidden group/tv hover:-translate-y-1 transition-transform duration-500">
          
          {/* Antenna / Details */}
          <div className="absolute -top-6 right-16 w-3 h-12 bg-[#524B7A] rounded-t-sm rotate-[25deg] origin-bottom shadow-[-5px_0_0_rgba(0,0,0,0.5)]" />
          <div className="absolute -top-8 right-24 w-2 h-16 bg-[#524B7A] rounded-t-sm -rotate-[20deg] origin-bottom shadow-[5px_0_0_rgba(0,0,0,0.5)]" />
          
          {/* Screen Bezel */}
          <div className="relative bg-[#0C0A15] p-3 rounded-xl border-[12px] border-[#100E1C] shadow-[inset_0_0_40px_rgba(0,0,0,1)]">
            
            {/* The Screen */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
              {/* Scanlines / CRT Effect */}
              <div className="absolute inset-0 z-20 pointer-events-none opacity-20 mix-blend-overlay bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')]" />
              <div className="absolute inset-0 z-20 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0.9)_100%)]" />
              
              <video 
                ref={videoRef}
                className={`w-full h-full object-cover relative z-10 transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-105 saturate-50 sepia-[0.3]'}`}
                loop
                playsInline
                poster="/images/loading_bg_pixel.jpg"
              >
                {/* Replace with actual edit video later */}
                <source src="/videos/real_vid.mp4" type="video/mp4" />
              </video>

              {/* Custom Play/Pause Overlay */}
              <div 
                className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={togglePlay} />
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#E5B25D]/90 border-4 border-[#1C1A33] flex items-center justify-center text-[#1C1A33] hover:scale-110 active:scale-95 transition-transform z-40 shadow-[0_0_40px_rgba(229,178,93,0.4)]"
                >
                  <span className={`text-4xl sm:text-6xl font-pixel ${isPlaying ? 'ml-0' : 'ml-2'} drop-shadow-[2px_2px_0_rgba(255,255,255,0.5)]`}>
                    {isPlaying ? "II" : "▶"}
                  </span>
                </button>
              </div>
            </div>
            
            {/* TV Controls (Decorative) */}
            <div className="absolute -right-5 sm:-right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 px-2 hidden sm:flex">
              <div className="w-6 h-6 rounded-full bg-[#383359] border-4 border-[#100E1C] shadow-[2px_2px_0_rgba(255,255,255,0.1)] group-hover/tv:rotate-45 transition-transform duration-700" />
              <div className="w-6 h-6 rounded-full bg-[#383359] border-4 border-[#100E1C] shadow-[2px_2px_0_rgba(255,255,255,0.1)] group-hover/tv:-rotate-90 transition-transform duration-1000" />
              
              <div className="mt-8 flex flex-col gap-2">
                <div className="w-3 h-10 rounded-sm bg-[#FF8FB3]/80 border-2 border-[#100E1C] shadow-[0_0_15px_rgba(255,143,179,0.3)] animate-pulse" />
                <div className="w-3 h-10 rounded-sm bg-[#B9D7C0]/60 border-2 border-[#100E1C]" />
              </div>
            </div>
          </div>
          
          {/* Post-it note */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-24 h-24 bg-[#FFD166] -rotate-12 shadow-md p-2 flex items-center justify-center pointer-events-none">
            <span className="font-retro text-[8px] text-black text-center opacity-80 leading-tight">
              DO NOT<br/>PRESS<br/>PAUSE
            </span>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#EBE4D8]/60 backdrop-blur-sm -rotate-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
