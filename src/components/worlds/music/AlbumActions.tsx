import React from 'react';
import { LikeButton } from './LikeButton';
import { PlayIcon, ShuffleIcon } from './icons';

interface AlbumActionsProps {
  onPlay: () => void;
  onShuffle: () => void;
  onToggleSave?: () => void;
  isSaved?: boolean;
  disabled?: boolean;
}

export function AlbumActions({ onPlay, onShuffle, onToggleSave, isSaved, disabled }: AlbumActionsProps) {
  return (
    <div className="flex items-center gap-3 p-4 shrink-0">
      <button 
        type="button"
        onClick={onPlay}
        disabled={disabled}
        className="mw-btn-primary flex-1"
      >
        <PlayIcon size={16} />
        <span>Play</span>
      </button>
      
      {onToggleSave && (
        <LikeButton
          isSaved={isSaved}
          onToggle={onToggleSave}
          disabled={disabled}
          ariaLabel={isSaved ? "Remove album from Library" : "Save album to Library"}
          className="h-10 min-h-[40px] px-3.5 bg-white border border-[var(--color-muted)] rounded-full text-[var(--color-dark)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-light)] active:scale-95"
        />
      )}

      <button
        type="button"
        onClick={onShuffle}
        disabled={disabled}
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
