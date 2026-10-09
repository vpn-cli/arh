"use client";

import React, { memo } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

export interface PlaybackControlsProps {
  token: string | null;
  togglePlay: () => Promise<void>;
  prevTrack: () => void;
  nextTrack: () => void;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
}

export const PlaybackControls = memo(function PlaybackControls({
  token,
  togglePlay,
  prevTrack,
  nextTrack,
  toggleShuffle,
  toggleRepeat,
}: PlaybackControlsProps) {
  const isShuffle = useSpotifyPlayerStore((s) => s.isShuffle);
  const isReady = useSpotifyPlayerStore((s) => s.isReady);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);
  const isPremium = useSpotifyPlayerStore((s) => s.isPremium);
  const repeatMode = useSpotifyPlayerStore((s) => s.repeatMode);

  return (
    <div className="flex items-center justify-between mt-3 px-2">
      <button
        onClick={toggleShuffle}
        className={`transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
          isShuffle ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
        }`}
        disabled={!isReady && !token}
        aria-label="Shuffle"
        title="Shuffle"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>
      <button
        onClick={prevTrack}
        className="text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
        disabled={!isReady && !token}
        aria-label="Previous track"
        title="Previous"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>
      <button
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] disabled:opacity-50 shadow-[0_4px_14px_var(--color-vibrant)] ${
          !isPremium ? 'bg-[#1DB954] hover:bg-[#1ed760]' : 'bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)]'
        }`}
        disabled={!isReady && !token && isPremium}
        aria-label={!isPremium ? 'Open in Spotify' : isPaused ? 'Play' : 'Pause'}
        title={!isPremium ? 'Open in Spotify' : isPaused ? 'Play' : 'Pause'}
      >
        {!isPremium ? (
          <span className="font-pixel text-[10px] leading-tight text-center px-1 font-bold">
            OPEN IN<br />SPOTIFY
          </span>
        ) : isPaused ? (
          <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>
      <button
        onClick={nextTrack}
        className="text-[var(--color-dark)] hover:text-[var(--color-dark)] hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
        disabled={!isReady && !token}
        aria-label="Next track"
        title="Next"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
      <button
        onClick={toggleRepeat}
        className={`relative transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${
          repeatMode !== 'off'
            ? 'text-[var(--color-vibrant)] drop-shadow-[0_2px_4px_var(--color-vibrant)]'
            : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
        }`}
        disabled={!isReady && !token}
        aria-label="Repeat mode"
        title={
          repeatMode === 'off'
            ? 'Enable Repeat'
            : repeatMode === 'context'
            ? 'Repeat: All (Click for Repeat 1)'
            : 'Repeat: One (Click to turn off)'
        }
      >
        {repeatMode === 'track' ? (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        )}
        {repeatMode === 'context' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--color-vibrant)] rounded-full" />
        )}
      </button>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
