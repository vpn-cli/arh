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
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);
  const repeatMode = useSpotifyPlayerStore((s) => s.repeatMode);

  const isLoading = accountTier === 'unknown';
  const isFree = accountTier === 'free';

  return (
    <div className="flex items-center justify-between w-full mt-3 px-3 py-1.5 rounded-full bg-[var(--color-muted)]/20 border border-[var(--color-muted)]/40 shadow-xs">
      {/* Shuffle Button: 32px */}
      <button
        onClick={toggleShuffle}
        data-cursor="music"
        className={`kitty-music-control relative w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 ${
          isShuffle
            ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
            : 'bg-transparent text-[var(--color-dark)] hover:bg-[var(--color-dark)]/5'
        }`}
        disabled={!isReady && !token}
        aria-label="Shuffle"
        title="Shuffle"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 3h5v5" />
          <path d="M4 20l5.5-5.5M21 3l-7.5 7.5" />
          <path d="M21 21v-5h-5" />
          <path d="M4 4l16 16" />
        </svg>
        {isShuffle && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--color-vibrant)] rounded-full" />
        )}
      </button>

      {/* Previous Track: 40px */}
      <button
        onClick={prevTrack}
        data-cursor="music"
        className="kitty-music-control w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center bg-transparent text-[var(--color-dark)] hover:bg-[var(--color-dark)]/5 transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
        disabled={!isReady && !token}
        aria-label="Previous track"
        title="Previous"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="19 20 9 12 19 4 19 20" />
          <line x1="5" y1="4" x2="5" y2="20" strokeWidth="2.5" />
        </svg>
      </button>

      {/* Play / Pause: 56px with soft ring */}
      <button
        onClick={togglePlay}
        data-cursor="music"
        className={`kitty-music-control ${!isPaused && !isFree && !isLoading ? 'kitty-play-pulse' : ''} w-14 h-14 min-w-[56px] min-h-[56px] rounded-full flex items-center justify-center text-[var(--on-vibrant)] transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 ${
          isFree
            ? 'bg-[#1DB954] ring-4 ring-[#1DB954]/25 shadow-[0_4px_14px_rgba(29,185,84,0.4)]'
            : 'bg-[var(--color-vibrant)] ring-4 ring-[var(--color-vibrant)]/25 shadow-[0_4px_14px_var(--color-vibrant)]'
        }`}
        disabled={isLoading || (!isReady && !token && accountTier === 'premium')}
        aria-label={
          isLoading
            ? 'Loading player'
            : isFree
            ? 'Open in Spotify'
            : isPaused
            ? 'Play'
            : 'Pause'
        }
        title={
          isLoading
            ? 'Loading player'
            : isFree
            ? 'Open in Spotify'
            : isPaused
            ? 'Play'
            : 'Pause'
        }
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFree ? (
          <span className="font-pixel text-caption leading-tight text-center px-1 font-bold">
            OPEN IN<br />SPOTIFY
          </span>
        ) : isPaused ? (
          <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        )}
      </button>

      {/* Next Track: 40px */}
      <button
        onClick={nextTrack}
        data-cursor="music"
        className="kitty-music-control w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center bg-transparent text-[var(--color-dark)] hover:bg-[var(--color-dark)]/5 transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
        disabled={!isReady && !token}
        aria-label="Next track"
        title="Next"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="4" x2="19" y2="20" strokeWidth="2.5" />
        </svg>
      </button>

      {/* Repeat Button: 32px */}
      <button
        onClick={toggleRepeat}
        data-cursor="music"
        className={`kitty-music-control relative w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 ${
          repeatMode !== 'off'
            ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-xs'
            : 'bg-transparent text-[var(--color-dark)] hover:bg-[var(--color-dark)]/5'
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
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          {repeatMode === 'track' && (
            <text x="12" y="14.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none" className="font-pixel">1</text>
          )}
        </svg>
        {repeatMode === 'context' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--color-vibrant)] rounded-full" />
        )}
      </button>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
