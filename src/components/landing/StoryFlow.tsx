"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import StoryCard from "../ui/StoryCard";
import HamsterSticker from "../ui/HamsterSticker";

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

export default function StoryFlow() {
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

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] flex items-center justify-center p-4">
      {/* 1. LANDING */}
      <StoryCard
        title={STORY_STEPS[0].title}
        variant={STORY_STEPS[0].variant}
        isActive={currentStep === 0}
      >
        <h2 className="font-pixel text-4xl text-dark font-bold mt-4">WAIT!</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full my-6">
          <HamsterSticker
            src="/images/hampters/hampter_00.png"
            speech="before you go any further..."
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            scale={1.2}
          />
        </div>
        <button className="pixel-btn pixel-btn--pink pixel-btn--large w-full mt-auto" onClick={nextStep}>
          OKAY?
        </button>
      </StoryCard>

      {/* 2. REALIZATION */}
      <StoryCard
        title={STORY_STEPS[1].title}
        variant={STORY_STEPS[1].variant}
        isActive={currentStep === 1}
        onEnter={triggerConfetti}
      >
        <h2 className="font-pixel text-2xl text-dark mt-2">Oh...</h2>
        <h2 className="font-pixel text-4xl text-dark font-bold">IT'S YOUR BIRTHDAY?!</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full my-6">
          <HamsterSticker
            src="/images/hampters/hampter_08.png"
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            scale={1.4}
            rotate={-5}
          />
        </div>
        <button className="pixel-btn pixel-btn--yellow pixel-btn--large w-full mt-auto" onClick={nextStep}>
          NO WAY!!
        </button>
      </StoryCard>

      {/* 3. INVESTIGATION */}
      <StoryCard
        title={STORY_STEPS[2].title}
        variant={STORY_STEPS[2].variant}
        isActive={currentStep === 2}
      >
        <h2 className="font-pixel text-2xl text-dark mt-2 mb-4">I did some research on you...</h2>
        <div className="flex-1 flex flex-row items-center justify-between relative w-full h-full text-left font-terminal text-lg">
          <div className="relative w-1/2 h-full min-h-[150px]">
             <HamsterSticker
              src="/images/hampters/hampter_11.png"
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              scale={1.2}
            />
          </div>
          <div className="w-1/2 space-y-2">
            <p>Age: <span className="font-handwriting font-bold text-pink text-xl">classified</span></p>
            <p>Chaos: <span className="font-handwriting font-bold text-pink text-xl">high</span></p>
            <p>Good decisions: <span className="font-handwriting font-bold text-pink text-xl">?</span></p>
            <p>Coolness: <span className="font-handwriting font-bold text-pink text-xl">100%</span></p>
            <p>Friendship lvl: <span className="font-handwriting font-bold text-pink text-xl">∞</span></p>
          </div>
        </div>
        <button className="pixel-btn pixel-btn--mint pixel-btn--large w-full mt-4" onClick={nextStep}>
          WOW
        </button>
      </StoryCard>

      {/* 4. MEME JOURNEY */}
      <StoryCard
        title={STORY_STEPS[3].title}
        variant={STORY_STEPS[3].variant}
        isActive={currentStep === 3}
      >
        <h2 className="font-pixel text-2xl text-dark mt-2 mb-4">A few facts...</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full my-6 bg-bg-cream border-2 border-dashed border-dark/20">
          <p className="font-handwriting text-dark-muted">Swipe/click through multiple hamster meme templates (Placeholder for meme gallery)</p>
          <HamsterSticker
            src="/images/hampters/hampter_22.png"
            className="bottom-2 right-2"
            scale={0.8}
            rotate={10}
          />
        </div>
        <button className="pixel-btn pixel-btn--pink pixel-btn--large w-full mt-auto" onClick={nextStep}>
          NEXT
        </button>
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
        <h2 className="font-pixel text-4xl text-pink font-bold mt-2 mb-2 animate-bounce-soft drop-shadow-sm">HAPPY BIRTHDAY!</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full my-6">
          <HamsterSticker
            src="/images/hampters/hampter_14.png"
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            scale={1.5}
            speech="LET'S PARTY!!"
          />
          <div className="absolute top-0 left-4 text-3xl animate-float">🎈</div>
          <div className="absolute top-4 right-8 text-3xl animate-float delay-200">🎈</div>
          <div className="absolute bottom-4 left-8 text-3xl animate-pulse">✨</div>
          <div className="absolute bottom-0 right-4 text-3xl animate-bounce-soft delay-300">🎁</div>
        </div>
        <button className="pixel-btn pixel-btn--lavender pixel-btn--large w-full mt-auto" onClick={nextStep}>
          LET'S GOOOO
        </button>
      </StoryCard>

      {/* 6. THE LETTER */}
      <StoryCard
        title={STORY_STEPS[5].title}
        variant={STORY_STEPS[5].variant}
        isActive={currentStep === 5}
      >
        <h2 className="font-pixel text-2xl text-dark mt-2 mb-6">A small letter for a big friend.</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full">
           <HamsterSticker
            src="/images/hampters/hampter_03.png"
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            scale={1.2}
          />
          <div className="absolute top-10 right-10 transform rotate-12 bg-[#FFF9E6] p-4 border border-dark/20 shadow-md">
            <span className="text-4xl">✉️</span>
          </div>
        </div>
        <button className="pixel-btn pixel-btn--pink pixel-btn--large w-full mt-auto" onClick={nextStep}>
          READ &lt;3
        </button>
      </StoryCard>

      {/* 7. END */}
      <StoryCard
        title={STORY_STEPS[6].title}
        variant={STORY_STEPS[6].variant}
        isActive={currentStep === 6}
      >
        <h2 className="font-pixel text-3xl text-dark mt-4 mb-2">Thanks for being you</h2>
        <h2 className="font-pixel text-3xl text-pink font-bold">&lt;3</h2>
        <div className="flex-1 flex items-center justify-center relative w-full h-full my-6">
          <HamsterSticker
            src="/images/hampters/hampter_05.png"
            className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            scale={1.3}
          />
          <div className="absolute top-4 left-1/4 text-2xl text-pink animate-heart-pop">♡</div>
          <div className="absolute top-1/4 right-1/4 text-3xl text-pink animate-heart-pop delay-200">♥</div>
          <div className="absolute bottom-1/4 left-1/3 text-xl text-pink animate-heart-pop delay-300">♡</div>
        </div>
        <button className="pixel-btn pixel-btn--mint pixel-btn--large w-full mt-auto" onClick={() => setCurrentStep(0)}>
          REPLAY?
        </button>
      </StoryCard>

    </div>
  );
}
