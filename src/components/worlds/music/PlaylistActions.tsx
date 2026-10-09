import React from 'react';

interface PlaylistActionsProps {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
  playDisabled?: boolean;
  shuffleDisabled?: boolean;
}

export function PlaylistActions({ onPlay, onShuffle, disabled, playDisabled, shuffleDisabled }: PlaylistActionsProps) {
  const isPlayDisabled = playDisabled !== undefined ? playDisabled : disabled;
  const isShuffleDisabled = shuffleDisabled !== undefined ? shuffleDisabled : disabled;

  return (
    <div className="flex items-center gap-3 p-4 shrink-0">
      <button 
        onClick={onPlay}
        disabled={isPlayDisabled}
        className={`flex-1 shrink-0 bg-gradient-to-r from-[var(--color-vibrant)] to-[var(--color-vibrant)] text-white py-3 rounded-xl shadow-[0_4px_14px_var(--color-vibrant)] transition-all flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] ${isPlayDisabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
      >
        <span className="font-pixel text-sm font-bold tracking-widest">
          ✨ PLAY ✨
        </span>
      </button>
      <button
        onClick={onShuffle}
        disabled={disabled}
        className={`px-4 py-3 bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:bg-[var(--color-light)] transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] ${disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 hover:scale-[1.02]'}`}
        title="Shuffle Play"
        aria-label="Shuffle Play"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>
    </div>
  );
}
