"use client";

import React from "react";
import { usePip } from "./PipContext";
import { MiniPlayerProps } from "./MiniPlayer";

export type PopOutPipButtonProps = Partial<MiniPlayerProps>;

export const PopOutPipButton = React.memo(function PopOutPipButton(
  _props: PopOutPipButtonProps = {}
) {
  const { isSupported, isOpen, togglePip } = usePip();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={togglePip}
      className="font-pixel text-meta min-h-[32px] min-w-[32px] px-3 py-1 rounded-full flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out shadow-xs font-bold active:scale-95 border border-[var(--color-muted)] bg-white hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-[var(--on-vibrant)]"
      title={isOpen ? "Focus floating mini-player" : "Open floating mini-player"}
      aria-label="Open floating mini-player"
    >
      <span className="leading-none text-caption">⧉</span>
      <span className="hidden min-[450px]:inline">Pop out</span>
    </button>
  );
});

PopOutPipButton.displayName = "PopOutPipButton";
