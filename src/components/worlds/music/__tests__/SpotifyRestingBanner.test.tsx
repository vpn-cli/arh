import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SpotifyRestingBanner } from '../SpotifyRestingBanner';
import { useSpotifyLockStore, setClientSpotifyLock, clearClientSpotifyLock } from '@/store/spotifyLockStore';

describe('SpotifyRestingBanner (Part 6)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    clearClientSpotifyLock();
  });

  afterEach(() => {
    clearClientSpotifyLock();
    vi.useRealTimers();
  });

  it('renders nothing when Spotify is not locked', () => {
    const { container } = render(<SpotifyRestingBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders calm banner with notFound MomentSticker and computed HH:MM when locked', () => {
    // Set lock for 3600 seconds (1 hour from now)
    const fixedNow = new Date('2026-10-12T10:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    act(() => {
      setClientSpotifyLock(3600); // Back at 11:00
    });

    const { container } = render(<SpotifyRestingBanner />);

    const banner = container.querySelector('.mw-resting-banner');
    expect(banner).not.toBeNull();

    // Check for "Spotify is resting. Back at HH:MM."
    const expectedDate = new Date(fixedNow + 3600 * 1000);
    const hh = String(expectedDate.getHours()).padStart(2, '0');
    const mm = String(expectedDate.getMinutes()).padStart(2, '0');
    const expectedTime = `${hh}:${mm}`;

    expect(screen.getByText(`Spotify is resting. Back at ${expectedTime}.`)).toBeTruthy();

    // Verify notFound sticker image is rendered (stickerConfig.moments.notFound is 'r5c1')
    const stickerImg = container.querySelector('img[src*="r5c1"]');
    expect(stickerImg).not.toBeNull();
  });

  it('disappears automatically when the lock expires', () => {
    const fixedNow = new Date('2026-10-12T10:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    act(() => {
      setClientSpotifyLock(5); // 5 seconds lock
    });

    const { container } = render(<SpotifyRestingBanner />);
    expect(container.querySelector('.mw-resting-banner')).not.toBeNull();

    // Advance time past the lock duration
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(container.querySelector('.mw-resting-banner')).toBeNull();
  });
});
