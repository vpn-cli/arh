"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CursorMode } from "@/components/ui/cursorUtils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface CursorContextType {
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  programmaticMode: CursorMode | null;
  setProgrammaticMode: (mode: CursorMode | null) => void;
  isFinePointer: boolean;
  prefersReducedMotion: boolean;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [cursorMode, setCursorMode] = useState<CursorMode>("default");
  const [programmaticMode, setProgrammaticMode] = useState<CursorMode | null>(null);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(true);
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

    // Clean up legacy localStorage key for cursor sound toggle
    try {
      localStorage.removeItem("kitty_cursor_sound");
    } catch {
      // safe fallback
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", updatePointer);
      } else {
        mq.removeListener(updatePointer);
      }
    };
  }, []);

  return (
    <CursorContext.Provider
      value={{
        cursorMode,
        setCursorMode,
        programmaticMode,
        setProgrammaticMode,
        isFinePointer,
        prefersReducedMotion,
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
