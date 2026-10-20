"use client";

import React, { useState, useEffect } from "react";
import AmbientParticles from "./AmbientParticles";
import GameboyLoadingScreen from "../ui/GameboyLoadingScreen";
import ClickToEnterScreen from "../ui/ClickToEnterScreen";
import AuthLoadingOverlay from "../ui/AuthLoadingOverlay";
import WorldRouter from "../worlds/WorldRouter";
import { SiteLoadOverlay } from "../transitions/TransitionOverlay";
import { SpotifyPlayerProvider } from "@/providers/SpotifyPlayerProvider";
import { useGameState, isValidWorld } from "@/lib/gameState";
import { isTestMetricsEnabled } from "@/lib/paintSignal";
import { isStandaloneMode } from "../worlds/music/hooks/useMusicView";

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — Master orchestrator
   
   Flow: SiteLoad (5s clip/poster) → ClickToEnter → GameboyLoading → World Hub
   
   Once the Gameboy loading sequence finishes, WorldRouter
   takes over and the user navigates freely between worlds.
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { currentWorld, goToWorld } = useGameState();

  const isStandalone = typeof window !== "undefined" && isStandaloneMode();

  // Phase gates — each unlocks the next screen
  const [hasEntered, setHasEntered] = useState(isStandalone);
  const [introFinished, setIntroFinished] = useState(isStandalone);
  const [_isReady, setIsReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [loaderDone, setLoaderDone] = useState(isStandalone);

  useEffect(() => {
    // Clear any leftover legacy flags so returning visitors aren't skipped
    try {
      window.localStorage.removeItem("story_complete");
    } catch {
      // ignore storage errors
    }

    const isAuthReturn = window.location.search.includes("spotify_auth=");
    const isDevSkip =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("skipIntro") === "1";

    if (isAuthReturn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Client URL parameters must synchronize phase states on initial mount
      setIsAuthLoading(true);
      setHasEntered(true);
      setIntroFinished(true);
      setLoaderDone(true);
    } else if (isDevSkip || isStandalone) {
      setHasEntered(true);
      setIntroFinished(true);
      setLoaderDone(true);
    }
    setIsReady(true);
    if (typeof window !== "undefined" && isTestMetricsEnabled()) {
      window.__isReadyFlipped = performance.now();
    }
  }, []);

  const handleIntroComplete = () => {
    setIntroFinished(true);
    const urlParams = new URLSearchParams(window.location.search);
    const worldParam = urlParams.get("world");
    const targetWorld = isValidWorld(worldParam) ? worldParam : "home";
    if (targetWorld !== currentWorld) {
      goToWorld(targetWorld, { immediate: true });
    }
  };

  const handleLoaderDone = React.useCallback(() => {
    setLoaderDone(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-home-bg text-home-cream flex flex-col overflow-x-hidden selection:bg-music-pink/40">
      {/* ═══ PHASE 0: 5.0s Site Load Overlay (SSR poster + video) ═══ */}
      {!loaderDone && (
        <SiteLoadOverlay onComplete={handleLoaderDone} />
      )}

      {/* Auth Loading Overlay */}
      {isAuthLoading && <AuthLoadingOverlay onComplete={() => setIsAuthLoading(false)} />}
      
      {/* Ambient particle layer (always present) */}
      <AmbientParticles />

      {/* ═══ PHASE 1: Click to Enter gate ═══ */}
      {!hasEntered && (
        <ClickToEnterScreen onEnter={() => setHasEntered(true)} />
      )}

      {/* ═══ PHASE 2: Retro Loading Screen ═══ */}
      {hasEntered && !introFinished && (
        <GameboyLoadingScreen
          onComplete={handleIntroComplete}
        />
      )}

      {/* ═══ PHASE 3: World System (Home → Main/Music/Scrapbook) ═══ */}
      {introFinished && (
        <SpotifyPlayerProvider>
          <WorldRouter />
        </SpotifyPlayerProvider>
      )}
    </div>
  );
}
