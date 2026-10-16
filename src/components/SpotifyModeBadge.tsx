"use client";

import React from 'react';
import { isSpotifyMockMode, getMockSpotifyProduct } from '@/mocks/spotify/config';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

export function SpotifyModeBadge() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const isMock = isSpotifyMockMode();
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);
  const tier = accountTier !== 'unknown' ? accountTier : getMockSpotifyProduct();

  return (
    <div
      data-testid="spotify-mode-badge"
      className="pointer-events-auto select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide shadow-md backdrop-blur-md border border-neutral-700/50 shrink-0"
      style={{
        backgroundColor: isMock ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
        color: isMock ? '#fbbf24' : '#34d399',
        borderColor: isMock ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{
          backgroundColor: isMock ? '#fbbf24' : '#34d399',
        }}
      />
      {isMock ? `mock spotify (${tier})` : 'LIVE spotify'}
    </div>
  );
}
