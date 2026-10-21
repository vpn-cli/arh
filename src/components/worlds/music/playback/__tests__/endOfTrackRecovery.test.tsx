/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act, renderHook, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressBar, ProgressBarHandle } from '../../now-playing/ProgressBar';
import {
  playbackClock,
  getSharedPositionMs,
  updateSharedPlaybackState,
} from '../playbackClock';
import {
  SpotifyPlayerProvider,
  useSpotifyPlayer,
  disconnectSpotifyPlayer,
} from '@/providers/SpotifyPlayerProvider';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { usePlayerStateSync } from '../../hooks/usePlayerStateSync';
import * as globalPlaybackActions from '../globalPlaybackActions';

let mockCurrentWorld = 'music';
vi.mock('@/lib/gameState', () => ({
  useGameState: () => ({
    currentWorld: mockCurrentWorld,
  }),
}));

let mockSessionToken: string | null = 'mock_token_123';
vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: () => ({
    data: mockSessionToken ? { accessToken: mockSessionToken } : null,
  }),
  useTrackSavedStatus: () => ({ data: false }),
  useSpotifyMutations: () => ({
    play: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
    toggleSave: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
  }),
}));

vi.mock('@/hooks/useAccountTier', () => ({
  useAccountTier: vi.fn(),
}));

vi.mock('@/lib/spotifyClient', () => ({
  getFreshToken: vi.fn().mockResolvedValue('fresh_token_123'),
  onLoginRequired: vi.fn(),
  proxyFetch: vi.fn().mockResolvedValue({ currently_playing: null, queue: [] }),
}));

let mockProviderOverride: any = null;
vi.mock('@/providers/SpotifyPlayerProvider', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/providers/SpotifyPlayerProvider')>();
  return {
    ...mod,
    useSpotifyPlayer: () => {
      if (mockProviderOverride) return mockProviderOverride;
      return mod.useSpotifyPlayer();
    },
  };
});

describe('End-of-track advance recovery and clamping', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProviderOverride = null;
    disconnectSpotifyPlayer();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useSpotifyPlayerStore.setState({
      accountTier: 'premium',
      duration: 174000,
      isPaused: false,
      currentTrack: null,
      player: null,
    });
    mockCurrentWorld = 'music';
    mockSessionToken = 'mock_token_123';
  });

  afterEach(() => {
    cleanup();
    mockProviderOverride = null;
    disconnectSpotifyPlayer();
    delete (window as any).Spotify;
    delete (window as any).onSpotifyWebPlaybackSDKReady;
    vi.restoreAllMocks();
  });

  it('a. elapsed never exceeds duration in the label, including when wall-clock time has run far past track end', () => {
    // 1. Clock clamping check
    const trackDurationMs = 174000; // 2:54
    const originalNow = Date.now;
    let fakeTime = 1000000;
    Date.now = () => fakeTime;

    updateSharedPlaybackState(100000, false, trackDurationMs);
    expect(getSharedPositionMs()).toBe(100000);

    // Advance fake wall-clock by 160 seconds (well past the 74s remaining)
    fakeTime += 160000;
    // Without clamping this would be 260000 (4:20). With clamping, exactly 174000 (2:54).
    expect(getSharedPositionMs()).toBe(trackDurationMs);

    Date.now = originalNow;

    // 2. ProgressBar DOM label check
    useSpotifyPlayerStore.setState({ duration: trackDurationMs });
    const { container } = render(
      <ProgressBar
        getPositionMs={() => 262000} // wall clock position past track end (4:22)
        onSeek={vi.fn()}
        onDragSeek={vi.fn()}
      />
    );

    const spans = container.querySelectorAll('span');
    const timeLabel = spans[0];
    expect(timeLabel?.textContent).toBe('2:54');
  });

  it('b. focus resync propagates: simulate visibilitychange with a known state and assert store/clock/subscribers received it', async () => {
    const knownState = {
      position: 45000,
      duration: 180000,
      paused: false,
      shuffle: true,
      repeat_mode: 1,
      track_window: {
        current_track: { id: 'track_resync_1', uri: 'spotify:track:resync_1', name: 'Resync Track' },
        next_tracks: [],
      },
    };

    let registeredStateListener: ((s: any) => void) | null = null;
    const mockPlayerInstance = {
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn(),
      addListener: vi.fn((event: string, cb: any) => {
        if (event === 'player_state_changed') {
          registeredStateListener = cb;
        }
      }),
      removeListener: vi.fn(),
      getCurrentState: vi.fn().mockResolvedValue(knownState),
    };

    (window as any).Spotify = {
      Player: vi.fn().mockImplementation(function (this: any) {
        return mockPlayerInstance;
      }),
    };

    const subscriberFn = vi.fn();

    function TestConsumer() {
      const { subscribe } = useSpotifyPlayer();
      React.useEffect(() => {
        return subscribe(subscriberFn);
      }, [subscribe]);
      return <div>Mounted</div>;
    }

    render(
      <SpotifyPlayerProvider>
        <TestConsumer />
      </SpotifyPlayerProvider>
    );

    expect(registeredStateListener).toBeTruthy();

    // Now simulate visibilitychange to visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Verify subscriber received the knownState
    expect(subscriberFn).toHaveBeenCalledWith(knownState);

    // Verify store received track, paused, duration
    const store = useSpotifyPlayerStore.getState();
    expect(store.currentTrack?.id).toBe('track_resync_1');
    expect(store.duration).toBe(180000);
    expect(store.isPaused).toBe(false);

    // Verify playbackClock received it
    expect(playbackClock.getPositionMs()).toBeGreaterThanOrEqual(45000);
    expect(playbackClock.getPositionMs()).toBeLessThan(47000);
  });

  it('c. isEnded with nextTracks.length > 0 dispatches exactly one advance', async () => {
    vi.useFakeTimers();
    try {
      const nextSpy = vi.spyOn(globalPlaybackActions, 'nextTrackGlobal').mockImplementation(() => {});

      let subscriberCallback: ((state: any) => void) | null = null;
      mockProviderOverride = {
        player: {
          getCurrentState: vi.fn().mockResolvedValue(null),
          seek: vi.fn(),
        },
        deviceIdRef: { current: 'dev_123' },
        latestStateRef: { current: null },
        subscribe: vi.fn((cb) => {
          subscriberCallback = cb;
          return () => {};
        }),
        disconnect: vi.fn(),
      };

      const userPausedRef = { current: false };
      const progressBarRef = { current: { applyState: vi.fn(), showPosition: vi.fn() } as unknown as ProgressBarHandle };
      const lyricsViewRef = { current: null };

      useSpotifyPlayerStore.setState({
        player: mockProviderOverride.player,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(
        () =>
          usePlayerStateSync({
            progressBarRef: { current: progressBarRef.current },
            lyricsViewRef,
            userPausedRef,
            selectedDevice: 'dev_123',
          }),
        { wrapper }
      );

      expect(subscriberCallback).toBeTruthy();

      const track1 = { id: 'track_1', uri: 'spotify:track:track_1', name: 'Track 1' };
      const track2 = { id: 'track_2', uri: 'spotify:track:track_2', name: 'Track 2' };

      // 1. Track is playing and passes 1000ms threshold
      await act(async () => {
        subscriberCallback?.({
          position: 5000,
          duration: 180000,
          paused: false,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // 2. Track reaches near end while playing
      await act(async () => {
        subscriberCallback?.({
          position: 178000,
          duration: 180000,
          paused: false,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // 3. Track stalls at end with paused: true and next_tracks > 0
      await act(async () => {
        subscriberCallback?.({
          position: 178000,
          duration: 180000,
          paused: true,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // Initially deferred: nextTrackGlobal is not called immediately
      expect(nextSpy).not.toHaveBeenCalled();

      // Advance by 2000ms deferred window
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(nextSpy).toHaveBeenCalledTimes(1);

      // 4. Repeated end event for the same track should NOT dispatch again
      await act(async () => {
        subscriberCallback?.({
          position: 178000,
          duration: 180000,
          paused: true,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(nextSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('d. normal SDK auto-advance does NOT trigger the fallback (the no-op case)', async () => {
    vi.useFakeTimers();
    try {
      const nextSpy = vi.spyOn(globalPlaybackActions, 'nextTrackGlobal').mockImplementation(() => {});

      let subscriberCallback: ((state: any) => void) | null = null;
      mockProviderOverride = {
        player: {
          getCurrentState: vi.fn().mockResolvedValue(null),
          seek: vi.fn(),
        },
        deviceIdRef: { current: 'dev_123' },
        latestStateRef: { current: null },
        subscribe: vi.fn((cb) => {
          subscriberCallback = cb;
          return () => {};
        }),
        disconnect: vi.fn(),
      };

      useSpotifyPlayerStore.setState({
        player: mockProviderOverride.player,
      });

      const userPausedRef = { current: false };
      const progressBarRef = { current: null };
      const lyricsViewRef = { current: null };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(
        () =>
          usePlayerStateSync({
            progressBarRef,
            lyricsViewRef,
            userPausedRef,
            selectedDevice: 'dev_123',
          }),
        { wrapper }
      );

      const track1 = { id: 'track_1', uri: 'spotify:track:track_1', name: 'Track 1' };
      const track2 = { id: 'track_2', uri: 'spotify:track:track_2', name: 'Track 2' };

      // 1. Track 1 playing past threshold
      await act(async () => {
        subscriberCallback?.({
          position: 5000,
          duration: 180000,
          paused: false,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // 2. Track 1 near end, still playing
      await act(async () => {
        subscriberCallback?.({
          position: 179000,
          duration: 180000,
          paused: false,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // 3. Emit final state still reporting the ended track (paused, at duration, next_tracks non-empty)
      await act(async () => {
        subscriberCallback?.({
          position: 180000,
          duration: 180000,
          paused: true,
          track_window: {
            current_track: track1,
            next_tracks: [track2],
          },
        });
      });

      // 4. SDK advances on its own shortly after
      await act(async () => {
        vi.advanceTimersByTime(500);
        subscriberCallback?.({
          position: 50,
          duration: 200000,
          paused: false,
          track_window: {
            current_track: track2,
            next_tracks: [],
          },
        });
      });

      // 5. Let the deferred window elapse deterministically
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });

      expect(nextSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('e. user-initiated pause at end of track does NOT trigger it', async () => {
    const nextSpy = vi.spyOn(globalPlaybackActions, 'nextTrackGlobal').mockImplementation(() => {});

    let subscriberCallback: ((state: any) => void) | null = null;
    mockProviderOverride = {
      player: {
        getCurrentState: vi.fn().mockResolvedValue(null),
        seek: vi.fn(),
      },
      deviceIdRef: { current: 'dev_123' },
      latestStateRef: { current: null },
      subscribe: vi.fn((cb) => {
        subscriberCallback = cb;
        return () => {};
      }),
      disconnect: vi.fn(),
    };

    useSpotifyPlayerStore.setState({
      player: mockProviderOverride.player,
    });

    const userPausedRef = { current: false };
    const progressBarRef = { current: null };
    const lyricsViewRef = { current: null };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(
      () =>
        usePlayerStateSync({
          progressBarRef,
          lyricsViewRef,
          userPausedRef,
          selectedDevice: 'dev_123',
        }),
      { wrapper }
    );

    const track1 = { id: 'track_1', uri: 'spotify:track:track_1', name: 'Track 1' };
    const track2 = { id: 'track_2', uri: 'spotify:track:track_2', name: 'Track 2' };

    // Track 1 playing
    await act(async () => {
      subscriberCallback?.({
        position: 5000,
        duration: 180000,
        paused: false,
        track_window: {
          current_track: track1,
          next_tracks: [track2],
        },
      });
    });

    // Track 1 near end
    await act(async () => {
      subscriberCallback?.({
        position: 178500,
        duration: 180000,
        paused: false,
        track_window: {
          current_track: track1,
          next_tracks: [track2],
        },
      });
    });

    // User explicitly paused playback
    userPausedRef.current = true;

    // Track state arrives reflecting pause at 178500
    await act(async () => {
      subscriberCallback?.({
        position: 178500,
        duration: 180000,
        paused: true,
        track_window: {
          current_track: track1,
          next_tracks: [track2],
        },
      });
    });

    expect(nextSpy).not.toHaveBeenCalled();
  });
});
