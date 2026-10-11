"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpotifyLockStore } from '@/store/spotifyLockStore';
import { MomentSticker } from './MomentSticker';

export function SpotifyRestingBanner() {
  const { isLocked, unlockAt } = useSpotifyLockStore();
  const [now, setNow] = useState<number>(() => Date.now());
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const el = document.querySelector('.mw-content-column');
      if (el) setContainer(el);
    }
  }, []);

  // Periodic tick while locked to compute remaining time and auto-clear when lock expires
  useEffect(() => {
    if (!isLocked || !unlockAt) return;
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= unlockAt) {
        useSpotifyLockStore.getState().clearLock();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, unlockAt]);

  if (!isLocked || !unlockAt || now >= unlockAt) {
    return null;
  }

  const date = new Date(unlockAt);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  const banner = (
    <div
      role="status"
      aria-live="polite"
      className="mw-resting-banner w-full bg-[var(--color-bg)]/95 border-2 border-[var(--color-muted)] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm text-[var(--color-dark)] select-none shrink-0 transition-opacity duration-300"
      style={{ order: -9999 }}
    >
      <MomentSticker moment="notFound" size={40} className="shrink-0" />
      <span className="font-pixel text-body font-bold text-[var(--color-dark)]">
        Spotify is resting. Back at {timeStr}.
      </span>
    </div>
  );

  if (container) {
    return createPortal(banner, container);
  }

  return banner;
}
