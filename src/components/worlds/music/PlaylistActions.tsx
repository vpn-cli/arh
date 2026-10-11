import React from 'react';
import { PlayIcon, ShuffleIcon } from './icons';

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
        type="button"
        onClick={onPlay}
        disabled={isPlayDisabled}
        className="mw-btn-primary flex-1"
      >
        <PlayIcon size={16} />
        <span>Play</span>
      </button>
      <button
        type="button"
        onClick={onShuffle}
        disabled={isShuffleDisabled}
        className="mw-btn-secondary"
        title="Shuffle Play"
        aria-label="Shuffle Play"
      >
        <ShuffleIcon size={16} />
        <span>Shuffle</span>
      </button>
    </div>
  );
}
