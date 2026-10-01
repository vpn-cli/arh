"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import StoryCard from "../ui/StoryCard";
import HamsterSticker from "../ui/HamsterSticker";
import { sfx } from "@/lib/audio";

interface StoryStep {
  id: string;
  title: string;
  variant: "pink" | "blue" | "yellow" | "lavender" | "mint";
}

const STORY_STEPS: StoryStep[] = [
  { id: "step-1", title: "WAIT!", variant: "blue" },
  { id: "step-2", title: "REALIZATION", variant: "pink" },
  { id: "step-3", title: "INVESTIGATION", variant: "yellow" },
  { id: "step-4", title: "MEME_JOURNEY", variant: "mint" },
  { id: "step-5", title: "CELEBRATION", variant: "lavender" },
  { id: "step-6", title: "THE_LETTER", variant: "pink" },
  { id: "step-7", title: "END", variant: "blue" },
];

interface StoryFlowProps {
  onComplete?: () => void;
}

export default function StoryFlow({ onComplete }: StoryFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STORY_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#FF8FB3", "#FFD98A", "#DDEBF7", "#C8B8F1", "#B9D7C0", "#FFFFFF"],
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sfx.select();
        if (currentStep < STORY_STEPS.length - 1) {
          nextStep();
        } else {
          if (onComplete) onComplete();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, onComplete]);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center p-4 pt-10">
      
      {/* SKIP BUTTON */}
      <button
        onClick={() => {
          sfx.select();
          if (onComplete) onComplete();
        }}
        className="absolute top-2 right-4 z-50 text-[10px] font-retro text-[#8C7A99] hover:text-[#FF8FB3] transition-colors border-b border-transparent hover:border-[#FF8FB3] tracking-[2px]"
      >
        SKIP SEQUENCE
      </button>
      
      {/* 1. LANDING */}
      <StoryCard
        title={STORY_STEPS[0].title}
        variant={STORY_STEPS[0].variant}
        isActive={currentStep === 0}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-3 border-b border-[#2E2A52]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,143,179,0.1)_0%,transparent_70%)] pointer-events-none" />
          <img src="/hampter/AWWAAAAAHAHA.jpeg" alt="hamster" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10" />
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-pixel text-xl md:text-2xl text-[#FF8FB3] font-bold mb-2 tracking-wider drop-shadow-[0_2px_0_#100E1C]">WAIT!</h2>
           <p className="font-retro text-xs text-[#D2CBE6] tracking-[2px] mb-4">before you go any further...</p>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               OKAY?
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 2. REALIZATION */}
      <StoryCard
        title={STORY_STEPS[1].title}
        variant={STORY_STEPS[1].variant}
        isActive={currentStep === 1}
        onEnter={triggerConfetti}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#FFE27A]/10 flex items-center justify-center overflow-hidden p-3 border-b border-[#2E2A52]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,209,102,0.1)_0%,transparent_70%)] pointer-events-none" />
          <img src="/hampter/Hamster smirk.jpeg" alt="hamster smirk" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10" />
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-pixel text-base text-[#FFD166] mb-1 drop-shadow-[0_2px_0_#100E1C]">Oh...</h2>
           <h2 className="font-pixel text-xl md:text-2xl text-[#FFD166] font-bold mb-4 leading-tight drop-shadow-[0_2px_0_#100E1C] tracking-wide">IT'S YOUR BIRTHDAY?!</h2>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro text-[#FF8FB3] text-lg tracking-[3px] font-bold drop-shadow-[0_1px_0_#000] group-hover:text-[#FFD6DD] transition-colors">
               NO WAY!!
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 3. INVESTIGATION */}
      <StoryCard
        title={STORY_STEPS[2].title}
        variant={STORY_STEPS[2].variant}
        isActive={currentStep === 2}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-3 border-b border-[#2E2A52]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
          <img src="/hampter/YAAAA hamster.jpeg" alt="investigation hamster" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10" />
        </div>
        <div className="w-full p-4 flex flex-col items-center text-left bg-[#100F1F]">
           <h2 className="font-pixel text-lg md:text-xl text-[#FFD166] font-bold mb-3 text-center w-full drop-shadow-[0_2px_0_#100E1C]">I did some research...</h2>
           
           <div className="w-full max-w-sm space-y-1.5 font-retro text-[9px] md:text-[10px] mx-auto mb-5 bg-[#1C1A33]/50 p-3 border border-[#383359] shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)]">
             <p className="flex justify-between border-b border-[#383359] pb-1 text-[#8C7A99]"><span>AGE:</span> <span className="font-pixel font-bold text-[#FF8FB3]">CLASSIFIED</span></p>
             <p className="flex justify-between border-b border-[#383359] pb-1 pt-1 text-[#8C7A99]"><span>CHAOS LEVEL:</span> <span className="font-pixel font-bold text-[#FF8FB3]">EXTREME</span></p>
             <p className="flex justify-between border-b border-[#383359] pb-1 pt-1 text-[#8C7A99]"><span>COOLNESS:</span> <span className="font-pixel font-bold text-[#FF8FB3]">100%</span></p>
             <p className="flex justify-between pt-1 text-[#8C7A99]"><span>FRIENDSHIP LVL:</span> <span className="font-pixel font-bold text-[#FFD166]">MAX</span></p>
           </div>

           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               WOW
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 4. MEME JOURNEY */}
      <StoryCard
        title={STORY_STEPS[3].title}
        variant={STORY_STEPS[3].variant}
        isActive={currentStep === 3}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-4 border-b border-[#2E2A52]">
           <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-30 mix-blend-overlay pointer-events-none" />
           <img src="/hampter/Squirtle Pikachu dancing.gif" alt="dancing" className="w-full h-full object-contain relative z-10 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[#383359]" />
           <HamsterSticker src="/hampter/devious hamster doodle.jpeg" className="absolute bottom-2 right-2 z-20" scale={0.5} rotate={12} />
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-pixel text-lg md:text-xl text-[#FF8FB3] font-bold mb-2 drop-shadow-[0_2px_0_#100E1C] tracking-wide">A FEW FACTS...</h2>
           <p className="font-retro text-[9px] md:text-[10px] text-[#D2CBE6] mb-4 leading-relaxed tracking-[2px]">It is scientifically proven that looking at memes makes birthdays 400% better.</p>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               NEXT
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 5. CELEBRATION */}
      <StoryCard
        title={STORY_STEPS[4].title}
        variant={STORY_STEPS[4].variant}
        isActive={currentStep === 4}
        onEnter={() => {
          setTimeout(triggerConfetti, 100);
          setTimeout(triggerConfetti, 500);
        }}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-3 border-b border-[#2E2A52]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,209,102,0.15)_0%,transparent_70%)] pointer-events-none" />
          <img src="/hampter/so cuteee i love it frrr.jpeg" alt="celebration" className="w-full h-full object-contain opacity-90 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] relative z-10" />
          <div className="absolute top-4 left-4 text-2xl animate-float z-20">🎈</div>
          <div className="absolute top-6 right-6 text-2xl animate-float delay-200 z-20">🎈</div>
          <div className="absolute bottom-4 right-6 text-3xl animate-bounce-soft z-20">🎁</div>
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-pixel text-xl md:text-2xl text-[#FFD166] font-bold mb-2 animate-pulse drop-shadow-[0_4px_0_#100E1C] tracking-wide">HAPPY BIRTHDAY!</h2>
           <p className="font-retro text-xs text-[#FF8FB3] tracking-[3px] font-bold mb-4 drop-shadow-[0_2px_0_#100E1C]">LET'S PARTY!!</p>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               LET'S GOOOO
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 6. THE LETTER */}
      <StoryCard
        title={STORY_STEPS[5].title}
        variant={STORY_STEPS[5].variant}
        isActive={currentStep === 5}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-4 border-b border-[#2E2A52]">
           <img src="/hampter/whimsycap.jpeg" alt="whimsy" className="w-full h-full object-contain shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[#383359] relative z-10" />
           <div className="absolute top-4 right-4 transform rotate-12 bg-[#1C1A33] p-2 border border-[#383359] shadow-[0_8px_16px_rgba(0,0,0,0.8)] z-20">
             <span className="text-2xl drop-shadow-xl">✉️</span>
           </div>
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-pixel text-lg md:text-xl text-[#FF8FB3] font-bold mb-2 drop-shadow-[0_2px_0_#100E1C] tracking-wide">A SMALL LETTER...</h2>
           <p className="font-retro text-[9px] md:text-[10px] text-[#D2CBE6] tracking-[2px] mb-4">...for a really big friend.</p>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               nextStep();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               OPEN LETTER
             </span>
           </button>
        </div>
      </StoryCard>

      {/* 7. END */}
      <StoryCard
        title={STORY_STEPS[6].title}
        variant={STORY_STEPS[6].variant}
        isActive={currentStep === 6}
      >
        <div className="w-full h-[180px] shrink-0 relative bg-[#1A1625] flex items-center justify-center overflow-hidden p-3 border-b border-[#2E2A52]">
           <img src="/hampter/almarts27 hamster sticker.jpeg" alt="end hamster" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10" />
           <div className="absolute top-6 left-1/4 text-xl text-[#FF8FB3] animate-heart-pop z-20">♡</div>
           <div className="absolute top-1/4 right-1/4 text-2xl text-[#FFD166] animate-heart-pop delay-200 z-20">♥</div>
           <div className="absolute bottom-1/4 left-1/3 text-lg text-[#FF8FB3] animate-heart-pop delay-300 z-20">♡</div>
        </div>
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-[#100F1F]">
           <h2 className="font-retro text-xs md:text-sm text-[#D2CBE6] tracking-[2px] font-bold mb-1">Thanks for being you.</h2>
           <h2 className="font-pixel text-xl text-[#FF8FB3] font-bold mb-4 drop-shadow-[0_2px_0_#100E1C]">&lt;3</h2>
           
           <button 
             className="relative group w-full md:w-[80%] px-4 py-3 bg-gradient-to-b from-[#E5B25D] to-[#8C6226] rounded-sm shadow-[0_6px_0_#523A12,0_12px_20px_rgba(0,0,0,0.5)] active:translate-y-[6px] active:shadow-[0_0_0_#523A12] transition-all duration-100"
             onMouseEnter={() => sfx.move()}
             onClick={() => {
               sfx.select();
               if (onComplete) onComplete();
             }}
           >
             <span className="font-retro font-bold text-xs sm:text-sm text-[#141224] tracking-[3px] group-hover:text-white drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_1px_0_rgba(0,0,0,0.4)] transition-colors">
               ENTER THE WORLDS
             </span>
           </button>
        </div>
      </StoryCard>

    </div>
  );
}
