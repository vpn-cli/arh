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
  transitionTarget: WorldId | null;
  mainWorldScrollY: number;
  isWorldRevealed: boolean;
}

export interface GoToWorldOptions {
  immediate?: boolean;
}

export interface GameActions {
  goToWorld: (world: WorldId, options?: GoToWorldOptions) => void;
  goHome: () => void;
  completeTransition: () => void;
  revealWorld: () => void;
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
      transitionTarget: null,
      mainWorldScrollY: 0,
      isWorldRevealed: true,
    };
  });

  // Stale guards: refs to synchronously check transitioning state & current world across ticks
  const isTransitioningRef = React.useRef(false);
  const currentWorldRef = React.useRef<WorldId>(state.currentWorld);
  const transitionTargetRef = React.useRef<WorldId | null>(null);
  const safetyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync currentWorldRef with state.currentWorld
  React.useEffect(() => {
    currentWorldRef.current = state.currentWorld;
  }, [state.currentWorld]);

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore music world state on Spotify OAuth redirect on mount
        setState((prev) => ({ ...prev, currentWorld: "music", isWorldRevealed: true }));
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

  const revealWorld = useCallback(() => {
    setState((prev) => ({ ...prev, isWorldRevealed: true }));
  }, []);

  const completeTransition = useCallback(() => {
    if (!isTransitioningRef.current) return;
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    const target = transitionTargetRef.current || currentWorldRef.current;
    // Confirm currentWorldRef is updated on transition completion
    currentWorldRef.current = target;
    transitionTargetRef.current = null;
    isTransitioningRef.current = false;
    setState((prev) => ({
      ...prev,
      currentWorld: target,
      isTransitioning: false,
      transitionTarget: null,
      isWorldRevealed: true,
    }));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const goToWorld = useCallback((world: WorldId, options?: GoToWorldOptions) => {
    // Correction 3: Synchronous ref guards prevent multiple transitions firing in same tick
    if (isTransitioningRef.current) return;
    if (currentWorldRef.current === world) return;

    if (options?.immediate) {
      isTransitioningRef.current = false;
      transitionTargetRef.current = null;
      currentWorldRef.current = world;
      setState((prev) => ({
        ...prev,
        currentWorld: world,
        previousWorld: prev.currentWorld,
        isTransitioning: false,
        transitionTarget: null,
        isWorldRevealed: true,
      }));
      if (typeof window !== "undefined") {
        window.__transitionOverlayStartTime = null;
        window.scrollTo({ top: 0 });
      }
      return;
    }

    isTransitioningRef.current = true;
    transitionTargetRef.current = world;
    const fromWorld = currentWorldRef.current;

    if (typeof window !== "undefined") {
      window.__transitionOverlayStartTime = performance.now();
    }

    setState((prev) => ({
      ...prev,
      isTransitioning: true,
      transitionTarget: world,
      previousWorld: fromWorld,
      isWorldRevealed: false,
    }));

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    // Hard safety cap raised to 4000ms: if anything hangs, guarantee reset
    safetyTimerRef.current = setTimeout(() => {
      if (isTransitioningRef.current) {
        const target = transitionTargetRef.current || world;
        currentWorldRef.current = target;
        transitionTargetRef.current = null;
        isTransitioningRef.current = false;
        setState((prev) => ({
          ...prev,
          currentWorld: target,
          isTransitioning: false,
          transitionTarget: null,
          isWorldRevealed: true,
        }));
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0 });
        }
      }
    }, 4000);
  }, []);

  const goHome = useCallback(() => {
    goToWorld("home");
  }, [goToWorld]);

  const setMainWorldScrollY = useCallback((y: number) => {
    setState((prev) => ({ ...prev, mainWorldScrollY: y }));
  }, []);

  return React.createElement(
    GameStateContext.Provider,
    { value: { ...state, goToWorld, goHome, completeTransition, revealWorld, setMainWorldScrollY } },
    children
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within GameStateProvider");
  return ctx;
}

export function useOptionalGameState() {
  return useContext(GameStateContext);
}

export function useWorldRevealed(): boolean {
  const ctx = useContext(GameStateContext);
  return ctx ? ctx.isWorldRevealed : true;
}
