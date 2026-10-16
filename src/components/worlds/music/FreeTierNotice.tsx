"use client";

import React, { useState, useEffect } from 'react';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { CloseIcon } from './icons';

const STORAGE_KEY = 'spotify_free_tier_dismissed';

export function FreeTierNotice() {
  const accountTier = useSpotifyPlayerStore((s) => s.accountTier);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    setDismissed(isDismissed);
  }, []);

  if (accountTier !== 'free' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // sessionStorage might fail in private browsing
    }
  };

  return (
    <div
      role="status"
      data-testid="free-tier-notice"
      className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 pointer-events-none transition-all duration-300"
    >
      <div className="pointer-events-auto bg-[var(--color-bg)]/95 border-2 border-[var(--color-muted)] text-[var(--color-dark)] px-4 py-2.5 rounded-2xl font-pixel text-caption flex items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <span>Playback opens in the Spotify app. In-browser playback needs Spotify Premium.</span>
        <button
          onClick={handleDismiss}
          className="mw-btn w-6 h-6 min-w-[24px] min-h-[24px] rounded-full hover:bg-[var(--color-muted)]/30 text-[var(--color-dark)] flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Dismiss notice"
          title="Dismiss"
        >
          <CloseIcon size={12} />
        </button>
      </div>
    </div>
  );
}
