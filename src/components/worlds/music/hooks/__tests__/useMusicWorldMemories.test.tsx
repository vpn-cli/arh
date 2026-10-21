import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMusicWorldMemories } from '../useMusicWorldMemories';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { useSpotifySession } from '@/hooks/useSpotify';

vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: vi.fn(),
}));

vi.mock('@/lib/memoriesClient', () => ({
  memoriesFetch: vi.fn(),
}));

function TestMusicWorld() {
  useMusicWorldMemories();
  return <div data-testid="music-world">Music World</div>;
}

describe('useMusicWorldMemories & Music World Preload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMemoriesStore.setState({ memories: [], isLoading: false, error: null, isAuthenticated: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preloading Music World makes no request to /api/memories or /api/spotify', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const { preloadWorld } = await import('@/components/worlds/WorldRouter');

    await preloadWorld('music');

    const calledUrls = fetchSpy.mock.calls.map((call) => String(call[0]));
    expect(calledUrls.some((url) => url.includes('/api/memories'))).toBe(false);
    expect(calledUrls.some((url) => url.includes('/api/spotify'))).toBe(false);

    fetchSpy.mockRestore();
  }, 30000);

  it('loads memories once when Music World mounts and the user is authenticated', () => {
    vi.mocked(useSpotifySession).mockReturnValue({
      isSuccess: true,
      data: { accessToken: 'valid_token' },
    } as any);

    const loadSpy = vi.spyOn(useMemoriesStore.getState(), 'loadMemories');

    render(<TestMusicWorld />);

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledWith(true);
  });

  it('does not load memories when Music World mounts and the user is not authenticated', () => {
    vi.mocked(useSpotifySession).mockReturnValue({
      isSuccess: false,
      data: null,
    } as any);

    const loadSpy = vi.spyOn(useMemoriesStore.getState(), 'loadMemories');

    render(<TestMusicWorld />);

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('two focus events within 5 minutes cause one load', () => {
    vi.useFakeTimers();
    vi.mocked(useSpotifySession).mockReturnValue({
      isSuccess: true,
      data: { accessToken: 'valid_token' },
    } as any);

    const loadSpy = vi.spyOn(useMemoriesStore.getState(), 'loadMemories');

    render(<TestMusicWorld />);
    // 1 call on mount
    expect(loadSpy).toHaveBeenCalledTimes(1);

    // First focus event after 1 minute (within 5 minutes)
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(loadSpy).toHaveBeenCalledTimes(1); // Throttled

    // Second focus event after another 1 minute (within 5 minutes)
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(loadSpy).toHaveBeenCalledTimes(1); // Still throttled

    // Focus event after 5 minutes from initial load
    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000 + 1000); // 5m 1s total
      window.dispatchEvent(new Event('focus'));
    });
    expect(loadSpy).toHaveBeenCalledTimes(2); // Allowed
  });

  it('removes the focus listener when Music World unmounts', () => {
    vi.useFakeTimers();
    vi.mocked(useSpotifySession).mockReturnValue({
      isSuccess: true,
      data: { accessToken: 'valid_token' },
    } as any);

    const loadSpy = vi.spyOn(useMemoriesStore.getState(), 'loadMemories');

    const { unmount } = render(<TestMusicWorld />);
    expect(loadSpy).toHaveBeenCalledTimes(1);

    unmount();

    // Advance 10 minutes and dispatch focus
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
      window.dispatchEvent(new Event('focus'));
    });

    // Still only 1 call because listener was removed on unmount
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
