import React from 'react';

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
        onClick={onPlay}
        disabled={disabled}
        className={`flex-1 shrink-0 bg-gradient-to-r from-[var(--color-vibrant)] to-[var(--color-muted)] text-white py-3 rounded-xl shadow-[0_4px_12px_rgba(255,105,180,0.4)] transition-all flex flex-col items-center justify-center gap-1 ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
      >
        <span className="font-pixel text-sm font-bold tracking-widest">
          ✨ PLAY ✨
        </span>
      </button>
      
      {onToggleSave && (
        <button
          onClick={onToggleSave}
          disabled={disabled}
          className={`px-4 py-3 bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl transition-all flex items-center justify-center ${disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 hover:scale-[1.02] hover:bg-[var(--color-light)]'}`}
          title={isSaved ? "Remove from Library" : "Save to Library"}
        >
          <span className={`text-xl ${isSaved ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-muted)]'}`}>
            {isSaved ? '♥' : '♡'}
          </span>
        </button>
      )}

      <button
        onClick={onShuffle}
        disabled={disabled}
        className={`px-4 py-3 bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-light)] transition-all flex items-center justify-center ${disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 hover:scale-[1.02]'}`}
        title="Shuffle Play"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>
    </div>
  );
}
