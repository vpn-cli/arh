"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CursorMode } from "@/components/ui/cursorUtils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface CursorContextType {
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  programmaticMode: CursorMode | null;
  setProgrammaticMode: (mode: CursorMode | null) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  isFinePointer: boolean;
  prefersReducedMotion: boolean;
  hasInteracted: boolean;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");
  const [programmaticMode, setProgrammaticMode] = useState<CursorMode | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(false);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Custom cursor activates ONLY when pointer: fine and hover: hover are both supported
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePointer = () => {
      setIsFinePointer(mq.matches);
    };
    updatePointer();

    if (mq.addEventListener) {
      mq.addEventListener("change", updatePointer);
    } else {
      mq.addListener(updatePointer);
    }

    // Load persisted sound preference (strictly default false)
    try {
      const stored = localStorage.getItem("kitty_cursor_sound");
      if (stored === "true") {
        setSoundEnabledState(true);
      }
    } catch {
      // safe fallback
    }

    // Track first user gesture to unlock Web Audio API safely
    const handleFirstGesture = () => {
      setHasInteracted(true);
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
    window.addEventListener("pointerdown", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem("kitty_cursor_sound", enabled ? "true" : "false");
    } catch {
      // safe fallback
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled, setSoundEnabled]);

  return (
    <CursorContext.Provider
      value={{
        cursorMode,
        setCursorMode,
        programmaticMode,
        setProgrammaticMode,
        soundEnabled,
        setSoundEnabled,
        toggleSound,
        isFinePointer,
        prefersReducedMotion,
        hasInteracted,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const ctx = useContext(CursorContext);
  if (!ctx) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return ctx;
}
