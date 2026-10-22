/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import {
  SpotifyPlayerProvider,
  useSpotifyPlayer,
  disconnectSpotifyPlayer,
} from '../SpotifyPlayerProvider';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { recordPendingTrackId, clearPendingTrackId } from '@/components/worlds/music/playback/playbackHelpers';

// Mocks
let mockCurrentWorld = 'home';
vi.mock('@/lib/gameState', () => ({
  useGameState: () => ({
    currentWorld: mockCurrentWorld,
  }),
}));

let mockSessionToken: string | null = 'test_token_123';
vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: () => ({
    data: mockSessionToken ? { accessToken: mockSessionToken } : null,
  }),
  useTrackSavedStatus: () => ({ data: false }),
  useSpotifyMutations: () => ({
    toggleSave: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
  }),
}));

vi.mock('@/hooks/useAccountTier', () => ({
  useAccountTier: vi.fn(),
}));

vi.mock('@/lib/spotifyClient', () => ({
  getFreshToken: vi.fn().mockResolvedValue('fresh_token_123'),
  onLoginRequired: vi.fn(),
}));

describe('SpotifyPlayerProvider', () => {
  let mockPlayerInstance: any;
  let playerConstructorSpy: any;

  beforeEach(() => {
    disconnectSpotifyPlayer();
    useSpotifyPlayerStore.setState({
      accountTier: 'premium',
    });
    mockCurrentWorld = 'home';
    mockSessionToken = 'test_token_123';

    mockPlayerInstance = {
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      getCurrentState: vi.fn().mockResolvedValue({
        track_window: { current_track: { id: 'track1', name: 'Song 1' } },
        position: 45000,
        duration: 180000,
        paused: false,
      }),
    };

    playerConstructorSpy = vi.fn().mockImplementation(function (this: any) {
      return mockPlayerInstance;
    });

    (window as any).Spotify = {
      Player: playerConstructorSpy,
    };
  });

  afterEach(() => {
    disconnectSpotifyPlayer();
    delete (window as any).Spotify;
    delete (window as any).onSpotifyWebPlaybackSDKReady;
    vi.restoreAllMocks();
  });

  it('does not create player when currentWorld is not music', () => {
    mockCurrentWorld = 'home';
    mockSessionToken = 'test_token_123';

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).not.toHaveBeenCalled();
  });

  it('does not create player when token is null even if currentWorld is music', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = null;

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).not.toHaveBeenCalled();
  });

  it('does not create or connect SDK when accountTier is free', () => {
    useSpotifyPlayerStore.setState({
      accountTier: 'free',
    });
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).not.toHaveBeenCalled();
    expect(mockPlayerInstance.connect).not.toHaveBeenCalled();
  });

  it('does not create or connect SDK when accountTier is unknown', () => {
    useSpotifyPlayerStore.setState({
      accountTier: 'unknown',
    });
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).not.toHaveBeenCalled();
    expect(mockPlayerInstance.connect).not.toHaveBeenCalled();
  });

  it('creates player once when currentWorld is music and user has a token', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).toHaveBeenCalledTimes(1);
    expect(mockPlayerInstance.connect).toHaveBeenCalled();
  });

  it('guards against creating a second player on remount or React StrictMode re-renders', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    const { unmount } = render(
      <SpotifyPlayerProvider>
        <div>Child 1</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).toHaveBeenCalledTimes(1);

    // Remount provider
    unmount();

    render(
      <SpotifyPlayerProvider>
        <div>Child 2</div>
      </SpotifyPlayerProvider>
    );

    // Player constructor should still only have been called once!
    expect(playerConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it('disconnects player and clears reference on disconnectSpotifyPlayer', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    render(
      <SpotifyPlayerProvider>
        <div>Child</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).toHaveBeenCalledTimes(1);

    act(() => {
      disconnectSpotifyPlayer();
    });

    expect(mockPlayerInstance.disconnect).toHaveBeenCalled();

    // After disconnect, entering music again can re-create player
    render(
      <SpotifyPlayerProvider>
        <div>Child 2</div>
      </SpotifyPlayerProvider>
    );

    expect(playerConstructorSpy).toHaveBeenCalledTimes(2);
  });

  it('exposes subscribe function and allows subscribers to receive state updates', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    let capturedState: any = null;
    let listenerFn: Function | null = null;

    mockPlayerInstance.addListener.mockImplementation((event: string, cb: Function) => {
      if (event === 'player_state_changed') {
        listenerFn = cb;
      }
    });

    const TestConsumer = () => {
      const { subscribe } = useSpotifyPlayer();
      React.useEffect(() => {
        return subscribe((st) => {
          capturedState = st;
        });
      }, [subscribe]);
      return <div>Consumer</div>;
    };

    render(
      <SpotifyPlayerProvider>
        <TestConsumer />
      </SpotifyPlayerProvider>
    );

    expect(listenerFn).toBeDefined();

    act(() => {
      listenerFn!({
        track_window: { current_track: { id: 't2' } },
        position: 10000,
        duration: 200000,
        paused: true,
      });
    });

    expect(capturedState).toEqual({
      track_window: { current_track: { id: 't2' } },
      position: 10000,
      duration: 200000,
      paused: true,
    });
  });

  it('optimistic B, then SDK state A within 3s -> currentTrack stays B', () => {
    mockCurrentWorld = 'music';
    mockSessionToken = 'test_token_123';

    let listenerFn: Function | null = null;
    mockPlayerInstance.addListener.mockImplementation((event: string, cb: Function) => {
      if (event === 'player_state_changed') {
        listenerFn = cb;
      }
    });

    render(
      <SpotifyPlayerProvider>
        <div>Player</div>
      </SpotifyPlayerProvider>
    );

    const trackA = { id: 'trackA', name: 'Song A' };
    const trackB = { id: 'trackB', name: 'Song B' };

    useSpotifyPlayerStore.getState().setCurrentTrack(trackA);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('trackA');

    // Optimistic B arrives
    recordPendingTrackId('trackB');
    useSpotifyPlayerStore.getState().setCurrentTrack(trackB);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('trackB');

    // SDK state A arrives within 3s
    act(() => {
      listenerFn!({
        track_window: { current_track: trackA },
        position: 1000,
        duration: 200000,
        paused: false,
      });
    });

    // Must stay B, but paused/position updated!
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('trackB');
    expect(useSpotifyPlayerStore.getState().isPaused).toBe(false);

    // SDK state B arrives -> clears pendingTrackId and stays B
    act(() => {
      listenerFn!({
        track_window: { current_track: trackB },
        position: 2000,
        duration: 200000,
        paused: false,
      });
    });
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('trackB');

    // Next track C arrives after pending play is resolved -> updates to C
    const trackC = { id: 'trackC', name: 'Song C' };
    act(() => {
      listenerFn!({
        track_window: { current_track: trackC },
        position: 3000,
        duration: 200000,
        paused: false,
      });
    });
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('trackC');

    clearPendingTrackId();
  });
});
