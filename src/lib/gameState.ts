"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   GAME STATE — World navigation & interaction state
   
   Canonical worlds: home | main | music | scrapbook
   The Vault is NOT a world — it's local state inside Main.
   ═══════════════════════════════════════════════════════ */

export type WorldId = "home" | "main" | "music" | "scrapbook";

export interface GameState {
  currentWorld: WorldId;
  previousWorld: WorldId | null;
  isTransitioning: boolean;
  mainWorldScrollY: number;
}

export interface GameActions {
  goToWorld: (world: WorldId) => void;
  goHome: () => void;
  setMainWorldScrollY: (y: number) => void;
}

const GameStateContext = createContext<(GameState & GameActions) | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => {
    // Only access localStorage if we are in the browser
    let initialWorld: WorldId = "home";
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const returnToMusic = window.localStorage.getItem("spotify_auth_return");
      // If we have a code, we are exchanging a token, so wait before entering music world
      if (returnToMusic === "true" && !code) {
        initialWorld = "music";
      }
    }
    return {
      currentWorld: initialWorld,
      previousWorld: null,
      isTransitioning: false,
      mainWorldScrollY: 0,
    };
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("spotify_auth");
    const returnToMusic = window.localStorage.getItem("spotify_auth_return");

    if (authStatus === "success") {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.localStorage.removeItem("spotify_auth_return");
      if (returnToMusic) {
        setState((prev) => ({ ...prev, currentWorld: "music" }));
      }
    } else if (authStatus === "error") {
      window.history.replaceState({}, document.title, window.location.pathname);
      window.localStorage.removeItem("spotify_auth_return");
      console.error("Spotify authentication failed.");
    }
  }, []);

  const goToWorld = useCallback((world: WorldId) => {
    setState((prev) => ({
      ...prev,
      isTransitioning: true,
      previousWorld: prev.currentWorld,
    }));

    // Transition delay for animation
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        currentWorld: world,
        isTransitioning: false,
      }));
      // Scroll to top when entering a new world
      window.scrollTo({ top: 0 });
    }, 500);
  }, []);

  const goHome = useCallback(() => {
    goToWorld("home");
  }, [goToWorld]);

  const setMainWorldScrollY = useCallback((y: number) => {
    setState((prev) => ({ ...prev, mainWorldScrollY: y }));
  }, []);

  return React.createElement(
    GameStateContext.Provider,
    { value: { ...state, goToWorld, goHome, setMainWorldScrollY } },
    children
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within GameStateProvider");
  return ctx;
}
