"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import LandingNavigation from "./LandingNavigation";
import AmbientParticles from "./AmbientParticles";
import PixelCursor from "../ui/PixelCursor";
import GameboyLoadingScreen from "../ui/GameboyLoadingScreen";
import StoryFlow from "./StoryFlow";
import HamsterSticker from "../ui/HamsterSticker";
import IndiePixelWindow from "../ui/IndiePixelWindow";
import { sfx } from "@/lib/audio";

export default function LandingPage() {
  const [introFinished, setIntroFinished] = useState(false);
  const [storyStarted, setStoryStarted] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-[#0C0A15] text-[#FFEBB3] flex flex-col overflow-x-hidden selection:bg-[#FF8FB3]/40">
      {/* Deep indie parallax background */}
      {introFinished && (
        <div className="fixed inset-0 z-0 pointer-events-none">
           <video
            src="/videos/real_vid.mp4"
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0C0A15]/60 bg-[radial-gradient(ellipse_at_center,rgba(12,10,21,0.4)_0%,rgba(12,10,21,0.9)_100%)]" />
        </div>
      )}

      {/* Ambient particle layer */}
      <AmbientParticles />

      {/* Custom pixel cursor (desktop only, hidden on retro loading screen) */}
      {introFinished && <PixelCursor />}

      {/* Retro Loading Screen overlay */}
      {!introFinished && (
        <GameboyLoadingScreen
          onComplete={() => {
            setIntroFinished(true);
            setStoryStarted(true);
          }}
        />
      )}

      {/* Navigation taskbar */}
      <LandingNavigation />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col items-center">
        
        {/* HERO SECTION - Premium Indie RPG UI */}
        {!storyStarted && (
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-12 mb-16 mt-16 relative">
          <div className="w-full max-w-2xl">
            <IndiePixelWindow title="WELCOME, ADVENTURER">
              <div className="p-8 text-center flex flex-col items-center gap-6">
                <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl font-bold text-[#FFD166] leading-tight drop-shadow-[0_4px_0_#100E1C] tracking-wide">
                  A LITTLE <br/>
                  WEBSITE <br/>
                  <span className="text-[#FF8FB3]">FOR A VERY</span><br/>
                  <span className="text-[#FF8FB3]">SPECIAL HUMAN</span>
                </h1>
                
                <div className="h-[2px] w-full max-w-xs bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-transparent my-2" />
                
                <p className="font-retro text-sm sm:text-base text-[#D2CBE6] tracking-[2px] leading-relaxed">
                  memes. hamsters. chaos. love.
                </p>

                <button 
                  className="relative group mt-8 px-8 py-4 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_15px_20px_rgba(0,0,0,0.6)] active:translate-y-[6px] active:shadow-[0_0px_0_#523A12,0_5px_10px_rgba(0,0,0,0.6)] transition-all duration-100"
                  onMouseEnter={() => sfx.move()}
                  onClick={() => {
                    sfx.select();
                    setStoryStarted(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-20 mix-blend-overlay pointer-events-none" />
                  <span className="font-retro font-bold text-xl text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
                    START <span className="animate-pulse inline-block ml-2">▶</span>
                  </span>
                </button>
              </div>
            </IndiePixelWindow>
          </div>
          
          <div className="hidden lg:block relative w-1/3">
            <IndiePixelWindow title="COMPANION">
              <div className="p-4 flex flex-col items-center bg-[#100E1C]/80">
                <HamsterSticker
                  src="/hampter/devious hamster doodle.jpeg"
                  speech="psst... it's your birthday!"
                  className="z-10 animate-chill-breathe"
                  scale={1.0}
                />
              </div>
            </IndiePixelWindow>
          </div>
        </div>
        )}

        {/* INTERACTIVE STORY SECTION */}
        {storyStarted && (
           <div
             className="w-full flex-1 flex items-center justify-center min-h-[85vh] animate-slide-up"
             id="story-section"
           >
             <StoryFlow />
           </div>
        )}

      </main>

      {/* FOOTER */}
      {!storyStarted && introFinished && (
      <footer className="w-full relative bg-[#0C0A15]/80 border-t-2 border-[#2E2A52] px-4 pt-12 pb-12 mt-auto overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left">
           <div>
             <h3 className="font-retro text-lg sm:text-xl font-bold text-[#FFD166] mb-2 tracking-[2px] drop-shadow-[0_2px_0_#100E1C]">
               SAME STUPID HAMSTER. <br/>
               A MUCH HAPPIER YEAR. ♡
             </h3>
             <p className="font-retro text-sm text-[#8C7A99] mt-4 tracking-[1.5px]">
               the best is still ahead ▶
             </p>
           </div>
           
           <div className="relative">
              <HamsterSticker
                src="/hampter/Hamster Stickers.jpeg"
                scale={0.9}
                rotate={-2}
                className="relative z-10"
              />
           </div>
        </div>
      </footer>
      )}
    </div>
  );
}
