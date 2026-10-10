"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

export interface PipContextValue {
  isSupported: boolean;
  isOpen: boolean;
  pipWindow: Window | null;
  openPip: () => Promise<void>;
  closePip: () => void;
  togglePip: () => Promise<void>;
}

export const PipContext = createContext<PipContextValue>({
  isSupported: false,
  isOpen: false,
  pipWindow: null,
  openPip: async () => {},
  closePip: () => {},
  togglePip: async () => {},
});

export function usePip(): PipContextValue {
  return useContext(PipContext);
}

function copyStylesAndVars(targetWindow: Window) {
  // 1. Copy stylesheets
  try {
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        if (styleSheet.href) {
          const link = targetWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.type = styleSheet.type || "text/css";
          link.media = styleSheet.media.mediaText;
          link.href = styleSheet.href;
          targetWindow.document.head.appendChild(link);
        } else if (styleSheet.cssRules) {
          const style = targetWindow.document.createElement("style");
          [...styleSheet.cssRules].forEach((rule) => {
            style.appendChild(targetWindow.document.createTextNode(rule.cssText));
          });
          targetWindow.document.head.appendChild(style);
        }
      } catch {
        if (styleSheet.href) {
          const link = targetWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.href = styleSheet.href;
          targetWindow.document.head.appendChild(link);
        }
      }
    });
  } catch {}

  // 2. Palette variable synchronization
  const paletteVars = [
    "--base-color",
    "--color-bg",
    "--color-light",
    "--color-muted",
    "--color-vibrant",
    "--color-dark",
    "--on-vibrant",
    "--color-text-muted",
  ];

  const syncPalette = () => {
    try {
      const srcStyle = document.documentElement.style;
      const targetStyle = targetWindow.document?.documentElement?.style;
      if (!targetStyle) return;
      paletteVars.forEach((v) => {
        const val = srcStyle.getPropertyValue(v);
        if (val) {
          targetStyle.setProperty(v, val);
        }
      });
      if (targetWindow.document.body) {
        targetWindow.document.body.className =
          "bg-[var(--color-bg)] text-[var(--color-dark)] m-0 p-0 overflow-hidden font-sans select-none";
      }
    } catch {}
  };

  syncPalette();

  const observer = new MutationObserver(syncPalette);
  try {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  } catch {}

  return observer;
}

export function PipProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      setIsSupported(true);
    }
  }, []);

  const closePip = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    observerRef.current?.disconnect();
    observerRef.current = null;
    pipWindowRef.current = null;
    setPipWindow(null);
  }, []);

  const openPip = useCallback(async () => {
    if (typeof window === "undefined" || !("documentPictureInPicture" in window)) return;

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 340,
        height: 420,
      });

      pipWindowRef.current = pip;
      setPipWindow(pip);
      if (pip.document) {
        pip.document.title = "Now Playing — Music World";
      }

      observerRef.current = copyStylesAndVars(pip);

      const handleClose = () => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        pipWindowRef.current = null;
        setPipWindow(null);
      };

      pip.addEventListener("pagehide", handleClose, { once: true });
    } catch (err) {
      console.warn("[PipProvider] Document Picture-in-Picture request failed:", err);
    }
  }, []);

  const togglePip = useCallback(async () => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
    } else {
      await openPip();
    }
  }, [openPip]);

  const value: PipContextValue = {
    isSupported,
    isOpen: Boolean(pipWindow),
    pipWindow,
    openPip,
    closePip,
    togglePip,
  };

  return <PipContext.Provider value={value}>{children}</PipContext.Provider>;
}
