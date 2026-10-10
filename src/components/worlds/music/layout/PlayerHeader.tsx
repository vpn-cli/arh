"use client";

import React from "react";
import { ChevronLeftIcon, SearchIcon, CloseIcon, MusicNoteIcon } from "../icons";
import { InstallAppButton } from "./InstallAppButton";

export interface PlayerHeaderProps {
  onGoHome?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export const PlayerHeader = React.memo(function PlayerHeader({
  onGoHome,
  searchQuery,
  onSearchChange,
  onClearSearch,
}: PlayerHeaderProps) {
  return (
    <div className="mw-player-header flex h-14 border-b-2 border-[var(--color-muted)] items-center px-4 justify-between shrink-0 bg-[var(--color-bg)]/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-muted)]" />
          <div className="w-3 h-3 rounded-full bg-[#FFDAB9]" />
          <div className="w-3 h-3 rounded-full bg-[#86EFAC]" />
        </div>

        {onGoHome && (
          <button
            onClick={onGoHome}
            className="mw-btn group px-3 py-1 min-h-[28px] bg-white/50 hover:bg-[var(--color-light)] border border-[var(--color-muted)] rounded-full flex items-center gap-1.5"
            aria-label="Return to Home World"
            title="Return to Home World"
          >
            <ChevronLeftIcon size={12} className="text-[var(--color-dark)] group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-pixel text-caption text-[var(--color-dark)] font-bold tracking-wider uppercase group-hover:text-[var(--color-vibrant)] transition-colors">
              Home World
            </span>
          </button>
        )}

        <img src="/hampter/hello_kitty_pin.png" alt="" className="w-7 h-7 object-contain hidden sm:block ml-2" />
        <span className="font-pixel text-body font-bold text-[var(--color-dark)] hidden xl:inline-block">KAWAII_PLAYER.EXE</span>
        <span className="font-pixel text-body text-[var(--color-vibrant)] hidden xl:inline-block">♥</span>
      </div>
      <div className="flex-1 max-w-md mx-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search songs, artists, playlists..."
          aria-label="Search songs, artists, playlists"
          className="w-full bg-white/95 border-2 border-[var(--color-muted)] rounded-full px-10 py-2 font-pixel text-body text-[var(--color-dark)] placeholder:text-[var(--color-dark)]/80 focus:outline-none focus:border-[var(--color-vibrant)] focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]/20 transition-colors"
        />
        <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="mw-btn absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-dark)] hover:text-[var(--color-dark)] w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded-full"
            aria-label="Clear search"
            title="Clear search"
          >
            <CloseIcon size={13} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 text-[var(--color-dark)] font-bold text-title shrink-0">
        <InstallAppButton />
        <div className="hidden lg:flex px-3 py-1 bg-white/50 border border-[var(--color-muted)] rounded-full items-center gap-1.5 mr-2">
          <span className="font-pixel text-caption text-[var(--color-dark)] font-bold tracking-wider uppercase">Music World</span>
          <MusicNoteIcon size={12} className="text-[var(--color-vibrant)]" />
        </div>
        <button className="mw-btn hover:text-[var(--color-vibrant)] w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" aria-label="Minimize window"><span className="text-body leading-none">_</span></button>
        <button className="mw-btn hover:text-[var(--color-vibrant)] w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" aria-label="Maximize window"><span className="text-body leading-none">□</span></button>
        <button className="mw-btn hover:text-[var(--color-vibrant)] w-6 h-6 min-w-[24px] min-h-[24px] flex items-center justify-center rounded" aria-label="Close window">
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
});
