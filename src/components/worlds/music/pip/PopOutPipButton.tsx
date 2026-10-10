"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { MiniPlayer, MiniPlayerProps } from "./MiniPlayer";

export type PopOutPipButtonProps = MiniPlayerProps;

export const PopOutPipButton = React.memo(function PopOutPipButton(props: PopOutPipButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      setIsSupported(true);
    }
  }, []);

  const copyStylesAndVars = useCallback((targetWindow: Window) => {
    // 1. Copy stylesheets
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
      } catch (err) {
        // Fallback for cross-origin sheets
        if (styleSheet.href) {
          const link = targetWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.href = styleSheet.href;
          targetWindow.document.head.appendChild(link);
        }
      }
    });

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
      const srcStyle = document.documentElement.style;
      const targetStyle = targetWindow.document.documentElement.style;
      paletteVars.forEach((v) => {
        const val = srcStyle.getPropertyValue(v);
        if (val) {
          targetStyle.setProperty(v, val);
        }
      });
      targetWindow.document.body.className =
        "bg-[var(--color-bg)] text-[var(--color-dark)] m-0 p-0 overflow-hidden font-sans select-none";
    };

    syncPalette();

    const observer = new MutationObserver(syncPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return observer;
  }, []);

  const handleOpenPip = useCallback(async () => {
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
      pip.document.title = "Now Playing — Music World";

      const observer = copyStylesAndVars(pip);

      const handleClose = () => {
        observer.disconnect();
        pipWindowRef.current = null;
        setPipWindow(null);
      };

      pip.addEventListener("pagehide", handleClose, { once: true });
    } catch (err) {
      console.warn("Document Picture-in-Picture request failed:", err);
    }
  }, [copyStylesAndVars]);

  if (!isSupported) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpenPip}
        className="font-pixel text-meta min-h-[32px] min-w-[32px] px-3 py-1 rounded-full flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out shadow-xs font-bold active:scale-95 border border-[var(--color-muted)] bg-white hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-[var(--on-vibrant)]"
        title="Open floating mini-player"
        aria-label="Open floating mini-player"
      >
        <span className="leading-none text-caption">⧉</span>
        <span className="hidden min-[450px]:inline">Pop out</span>
      </button>

      {pipWindow &&
        pipWindow.document &&
        createPortal(<MiniPlayer {...props} />, pipWindow.document.body)}
    </>
  );
});

PopOutPipButton.displayName = "PopOutPipButton";
