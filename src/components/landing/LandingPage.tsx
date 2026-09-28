"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import LandingNavigation from "./LandingNavigation";
import AmbientParticles from "./AmbientParticles";
import PixelCursor from "../ui/PixelCursor";
import GameboyLoadingScreen from "../ui/GameboyLoadingScreen";
import StoryFlow from "./StoryFlow";
import HamsterSticker from "../ui/HamsterSticker";

export default function LandingPage() {
  const [introFinished, setIntroFinished] = useState(false);
  const [storyStarted, setStoryStarted] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-bg-parchment text-dark flex flex-col overflow-x-hidden">
      {/* Ambient particle layer */}
      <AmbientParticles />

      {/* Custom pixel cursor (desktop only) */}
      <PixelCursor />

      {/* Retro Loading Screen overlay */}
      {!introFinished && (
        <GameboyLoadingScreen onComplete={() => setIntroFinished(true)} />
      )}

      {/* Navigation taskbar */}
      <LandingNavigation />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col items-center">
        
        {/* HERO SECTION - Preserving the vibe of the top banner from the reference */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 mb-16 mt-8 relative">
          <div className="w-full md:w-2/3">
            <h1 className="font-pixel text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-dark leading-tight">
              A LITTLE <br/>
              WEBSITE <br/>
              <span className="text-pink">FOR A VERY</span><br/>
              <span className="text-pink">SPECIAL HUMAN</span>
            </h1>
            <p className="font-terminal text-xl sm:text-2xl mt-4 text-dark-muted">
              memes. hamsters. chaos. love.
            </p>
            {!storyStarted && (
               <button 
                className="pixel-btn pixel-btn--pink pixel-btn--large mt-8 text-xl flex items-center gap-4"
                onClick={() => {
                  setStoryStarted(true);
                  // Scroll down to story flow slightly smoothly
                  setTimeout(() => {
                     window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }}
              >
                START <span className="animate-bounce-soft inline-block">→</span >
              </button>
            )}
          </div>
          
          <div className="w-full md:w-1/3 relative flex justify-center h-64 md:h-auto">
             {/* Fake sticky note */}
             <div className="absolute top-0 right-0 lg:-right-12 transform rotate-6 bg-blue-soft p-4 border border-dark border-dashed shadow-md z-0 hidden sm:block">
                <ul className="font-handwriting text-xl text-dark space-y-1">
                  <li>♡ SAME FRIEND</li>
                  <li>♡ SAME CHAOS</li>
                  <li>♡ ANOTHER YEAR</li>
                  <li>♡ HAPPIER YOU</li>
                </ul>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 washi-tape washi-tape--yellow -rotate-2 border border-border/20 z-10" />
             </div>

             <HamsterSticker
              src="/images/hampters/hampter_00.png"
              speech="psst... it's your birthday!"
              className="mt-12 z-10"
              scale={1.2}
            />
          </div>

          <div className="absolute -left-12 top-1/2 font-handwriting text-dark/40 -rotate-12 hidden lg:block text-xl">
             same<br/>stupid<br/>hamster,<br/>different<br/>page!
          </div>
          
          <div className="absolute -right-16 bottom-0 font-handwriting text-dark/40 rotate-6 hidden lg:block text-xl text-right">
             a<br/>pixelated<br/>hamster<br/>adventure<br/>&lt;3
          </div>
        </div>

        {/* INTERACTIVE STORY SECTION */}
        {storyStarted && (
           <div className="w-full mt-12 mb-20 animate-slide-up" id="story-section">
             <StoryFlow />
           </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full relative bg-blue-soft/30 border-t-3 border-border px-4 pt-16 pb-12 mt-auto overflow-hidden">
        {/* Pixel clouds / city bg (abstracted via particles or simple divs here) */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none opacity-40">
           {/* Cloud decorations */}
           <div className="absolute bottom-4 left-10 text-4xl">☁️</div>
           <div className="absolute bottom-12 left-1/4 text-6xl">☁️</div>
           <div className="absolute bottom-2 right-1/4 text-5xl">☁️</div>
           <div className="absolute bottom-16 right-10 text-3xl">☁️</div>
           <div className="absolute bottom-20 left-1/2 text-2xl text-yellow animate-pulse">✨</div>
           <div className="absolute top-10 right-1/3 text-xl text-pink animate-pulse delay-200">✨</div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left">
           <div>
             <h3 className="font-pixel text-2xl sm:text-3xl font-bold text-dark mb-2 tracking-wide">
               SAME STUPID HAMSTER. <br/>
               A MUCH HAPPIER YEAR. ♡
             </h3>
             <p className="font-handwriting text-xl text-dark-muted mt-4">
               the best is still ahead →
             </p>
           </div>
           
           <div className="relative">
              <div className="speech-bubble absolute -top-12 -left-16 font-handwriting text-sm rotate-6 z-20">
                make it<br/>memorable<br/>&lt;3
              </div>
              <HamsterSticker
                src="/images/hampters/hampter_03.png"
                scale={1}
                rotate={-2}
                className="relative z-10"
              />
           </div>
        </div>
      </footer>
    </div>
  );
}
