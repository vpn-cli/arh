"use client";

import React, { useState } from "react";
import Image from "next/image";
import AmbientParticles from "./AmbientParticles";
import PixelCursor from "../ui/PixelCursor";
import GameboyLoadingScreen from "../ui/GameboyLoadingScreen";
import ClickToEnterScreen from "../ui/ClickToEnterScreen";
import StoryFlow from "./StoryFlow";
import WorldRouter from "../worlds/WorldRouter";

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — Master orchestrator
   
   Flow: ClickToEnter → GameboyLoading → StoryFlow (Hamster Intro) → Home World
   
   Once the intro story finishes, the WorldRouter takes
   over and the user navigates freely between worlds.
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  // Phase gates — each unlocks the next screen
  const [hasEntered, setHasEntered] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);

  React.useEffect(() => {
    // If we are returning from Spotify Auth, skip straight to the world
    if (window.location.search.includes("code=")) {
      setHasEntered(true);
      setIntroFinished(true);
      setStoryComplete(true);
      return;
    }

    // If the story was completed in a previous session, skip to the world
    if (window.localStorage.getItem("story_complete") === "true") {
      setHasEntered(true);
      setIntroFinished(true);
      setStoryComplete(true);
    }
  }, []);

  const completeStory = () => {
    setStoryComplete(true);
    window.localStorage.setItem("story_complete", "true");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0C0A15] text-[#FFEBB3] flex flex-col overflow-x-hidden selection:bg-[#FF8FB3]/40">
      {/* Ambient particle layer (always present) */}
      <AmbientParticles />

      {/* Custom pixel cursor (desktop only, after loading) */}
      {introFinished && <PixelCursor />}

      {/* ═══ PHASE 1: Click to Enter gate ═══ */}
      {!hasEntered && (
        <ClickToEnterScreen onEnter={() => setHasEntered(true)} />
      )}

      {/* ═══ PHASE 2: Retro Loading Screen ═══ */}
      {!introFinished && (
        <GameboyLoadingScreen
          onComplete={() => {
            setIntroFinished(true);
          }}
        />
      )}

      {/* ═══ PHASE 3: Hamster Intro (StoryFlow) ═══ */}
      {introFinished && !storyComplete && (
        <div className="relative min-h-screen w-full flex flex-col">
          {/* Background for story section */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <Image
              src="/images/loading_bg_pixel.jpg"
              alt=""
              fill
              priority
              className="object-cover"
              role="presentation"
            />
            <div className="absolute inset-0 bg-[#0C0A15]/60 bg-[radial-gradient(ellipse_at_center,rgba(12,10,21,0.4)_0%,rgba(12,10,21,0.9)_100%)]" />
          </div>

          <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col items-center">
            <div
              className="w-full flex-1 flex items-center justify-center min-h-[85vh] animate-slide-up"
              id="story-section"
            >
              <StoryFlow onComplete={completeStory} />
            </div>
          </main>
        </div>
      )}

      {/* ═══ PHASE 4: World System (Home → Main/Music/Scrapbook) ═══ */}
      {storyComplete && <WorldRouter />}
    </div>
  );
}
