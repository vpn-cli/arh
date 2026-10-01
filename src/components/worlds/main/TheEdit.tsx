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

      <div className="relative mx-auto max-w-5xl mt-16">
        
        {/* High Quality Pixelated Hello Kitty Peeking & Holding */}
        <div className="absolute -top-[90px] sm:-top-[110px] left-1/2 -translate-x-1/2 flex flex-col items-center z-0 pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
          
          {/* Authentic Pixel Art Hello Kitty */}
          <svg width="144" height="96" viewBox="0 0 18 12" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_0_rgba(0,0,0,0.4)] transition-transform hover:scale-105">
            {[
              "  00          00  ",
              " 0110000000000110 ",
              "011111111111111110",
              "011111111111122110",
              "011111111111222210",
              "011111111111122110",
              "001110111101111100",
              "001110111101111100",
              "001111133111111100",
              "011111133111111110",
              " 0111111111111110 ",
              "  00000000000000  "
            ].map((row, y) => 
              row.split('').map((char, x) => 
                char !== ' ' ? (
                  <rect 
                    key={`hk-${x}-${y}`} 
                    x={x} y={y} width="1.05" height="1.05" 
                    fill={{'0':'#1A1A1A', '1':'#FFFFFF', '2':'#FF5C77', '3':'#FFD166'}[char]} 
                  />
                ) : null
              )
            )}
          </svg>

          {/* Cute Pixel Paws holding the frame */}
          <div className="absolute -bottom-2 sm:-bottom-4 -left-4 sm:-left-8 -rotate-12 z-20">
            <svg width="48" height="40" viewBox="0 0 6 5" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">
              {[
                " 0000 ",
                "011110",
                "011110",
                "010010",
                " 0000 "
              ].map((row, y) => 
                row.split('').map((char, x) => 
                  char !== ' ' ? (
                    <rect key={`pl-${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={{'0':'#1A1A1A', '1':'#FFFFFF'}[char]} />
                  ) : null
                )
              )}
            </svg>
          </div>
          <div className="absolute -bottom-2 sm:-bottom-4 -right-4 sm:-right-8 rotate-12 z-20">
            <svg width="48" height="40" viewBox="0 0 6 5" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] -scale-x-100">
              {[
                " 0000 ",
                "011110",
                "011110",
                "010010",
                " 0000 "
              ].map((row, y) => 
                row.split('').map((char, x) => 
                  char !== ' ' ? (
                    <rect key={`pr-${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={{'0':'#1A1A1A', '1':'#FFFFFF'}[char]} />
                  ) : null
                )
              )}
            </svg>
          </div>
        </div>

        {/* Decorative Stars */}
        <div className="absolute -left-12 top-1/4 text-4xl text-[#FFD166] animate-pulse">⭐</div>
        <div className="absolute -right-10 bottom-1/4 text-5xl text-[#FF8FB3] animate-bounce-soft">✨</div>

        {/* Cute Frame Container */}
        <div className="bg-[#FFF0F5] p-3 sm:p-5 rounded-[2rem] sm:rounded-[3rem] border-8 border-[#FFB6C1] shadow-[0_20px_50px_rgba(255,182,193,0.3),inset_0_0_20px_rgba(255,255,255,1)] relative z-10 hover:-translate-y-2 transition-transform duration-500">
          
          {/* Inner frame pattern */}
          <div className="absolute inset-0 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-dashed border-[#FFC0CB]/50 m-2 pointer-events-none" />

          {/* Screen Bezel */}
          <div className="relative bg-[#FF69B4] p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-[inset_0_5px_15px_rgba(0,0,0,0.4)]">
            
            {/* The Screen */}
            <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden group border-4 border-[#333]">
              
              {/* Cute sparkles overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none opacity-40 mix-blend-overlay bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')]" />
              
              <video 
                ref={videoRef}
                className={`w-full h-full object-cover relative z-10 transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-105 saturate-[0.8]'}`}
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
                <div className="absolute inset-0 bg-[#FFB6C1]/30 backdrop-blur-[4px]" onClick={togglePlay} />
                <button 
                  onClick={togglePlay}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#FFF0F5] border-4 border-[#FF69B4] flex items-center justify-center text-[#FF69B4] hover:scale-110 active:scale-95 transition-transform z-40 shadow-[0_10px_20px_rgba(255,105,180,0.4)]"
                >
                  <span className={`text-4xl sm:text-6xl font-pixel ${isPlaying ? 'ml-0' : 'ml-2'} drop-shadow-[2px_2px_0_rgba(255,105,180,0.2)]`}>
                    {isPlaying ? "II" : "▶"}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Post-it note / Cute sticker */}
          <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 w-24 h-24 sm:w-32 sm:h-32 bg-[#FFD166] rotate-12 shadow-lg p-3 flex flex-col items-center justify-center pointer-events-none border-2 border-[#E5B25D] rounded-sm">
            <span className="font-retro text-[10px] sm:text-xs text-black text-center opacity-80 leading-tight">
              our<br/>memories
            </span>
            <span className="text-xl mt-1">💖</span>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-[#FF8FB3]/60 backdrop-blur-sm rotate-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
