import React from 'react';

interface PlaylistActionsProps {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
}

export function PlaylistActions({ onPlay, onShuffle, disabled }: PlaylistActionsProps) {
  return (
    <div className="flex items-center gap-3 p-4 shrink-0">
      <button 
        onClick={onPlay}
        disabled={disabled}
        className={`flex-1 shrink-0 bg-gradient-to-r from-[#D81B60] to-[#C2185B] text-white py-3 rounded-xl shadow-[0_4px_14px_rgba(194,24,91,0.35)] transition-all flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
      >
        <span className="font-pixel text-sm font-bold tracking-widest">
          ✨ PLAY ✨
        </span>
      </button>
      <button
        onClick={onShuffle}
        disabled={disabled}
        className={`px-4 py-3 bg-[#FFF0F5] border-2 border-[#FF87BE] rounded-xl text-[#7A2871] hover:text-[#881337] hover:bg-[#FFE4E1] transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] ${disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 hover:scale-[1.02]'}`}
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
