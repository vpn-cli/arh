"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   GAME STATE — World navigation & interaction state
   
   Canonical worlds: home | main | music | scrapbook
   The Vault is NOT a world — it's local state inside Main.
   ═══════════════════════════════════════════════════════ */

export type WorldId = "home" | "main" | "music" | "scrapbook";

export const VALID_WORLDS: readonly WorldId[] = ["home", "main", "music", "scrapbook"];

export function isValidWorld(world: string | null | undefined): world is WorldId {
  return typeof world === "string" && (VALID_WORLDS as readonly string[]).includes(world);
}

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
    // Only access localStorage/URL if we are in the browser
    let initialWorld: WorldId = "home";
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const worldParam = urlParams.get("world");
      if (isValidWorld(worldParam)) {
        initialWorld = worldParam;
      } else {
        const code = urlParams.get("code");
        const returnToMusic = window.localStorage.getItem("spotify_auth_return");
        // If we have a code, we are exchanging a token, so wait before entering music world
        if (returnToMusic === "true" && !code) {
          initialWorld = "music";
        }
      }
    }
    return {
      currentWorld: initialWorld,
      previousWorld: null,
      isTransitioning: false,
      mainWorldScrollY: 0,
    };
  });

  // Keep URL ?world= in sync when currentWorld changes (only on root "/" route)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("world") !== state.currentWorld) {
      url.searchParams.set("world", state.currentWorld);
      window.history.replaceState(window.history.state, document.title, url.toString());
    }
  }, [state.currentWorld]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("spotify_auth");
    const returnToMusic = window.localStorage.getItem("spotify_auth_return");

    if (authStatus === "success") {
      window.localStorage.removeItem("spotify_auth_return");
      const url = new URL(window.location.href);
      url.searchParams.delete("spotify_auth");
      if (returnToMusic) {
        url.searchParams.set("world", "music");
        setState((prev) => ({ ...prev, currentWorld: "music" }));
      }
      if (window.location.pathname === "/") {
        window.history.replaceState(window.history.state, document.title, url.toString());
      }
    } else if (authStatus === "error") {
      window.localStorage.removeItem("spotify_auth_return");
      const url = new URL(window.location.href);
      url.searchParams.delete("spotify_auth");
      if (window.location.pathname === "/") {
        window.history.replaceState(window.history.state, document.title, url.toString());
      }
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
