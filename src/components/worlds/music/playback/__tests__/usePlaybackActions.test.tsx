import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { usePlaybackActions } from '../usePlaybackActions';

const mockRecoverPlaybackDevice = vi.fn().mockResolvedValue('recovered_dev_123');

vi.mock('@/lib/spotifyRecovery', () => ({
  recoverPlaybackDevice: () => mockRecoverPlaybackDevice(),
}));

const mockPlayMutateAsync = vi.fn().mockResolvedValue({});
const mockToggleSaveMutateAsync = vi.fn().mockResolvedValue({});
const mockToggleShuffleMutateAsync = vi.fn().mockResolvedValue({});
const mockToggleRepeatMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: () => ({ data: { accessToken: 'mock_token' } }),
  useSpotifyMutations: () => ({
    play: { mutateAsync: mockPlayMutateAsync },
    toggleSave: { mutateAsync: mockToggleSaveMutateAsync },
    toggleShuffle: { mutateAsync: mockToggleShuffleMutateAsync },
    toggleRepeat: { mutateAsync: mockToggleRepeatMutateAsync },
  }),
  usePlayerQueue: () => ({ data: { queue: [] } }),
  useTrackSavedStatus: () => ({ data: false }),
}));

let mockNeedsRecovery = false;
let mockDeviceId = 'existing_dev_1';
let mockIsPremium = true;
let mockCurrentTrack: any = { id: 'track_1', uri: 'spotify:track:track_1' };

const mockSetQueue = vi.fn();
const mockSetQueueIndex = vi.fn();
const mockSetIsShuffle = vi.fn();
const mockSetRepeatMode = vi.fn();

vi.mock('@/store/spotifyStore', () => ({
  useSpotifyPlayerStore: Object.assign(
    (selector: any) => selector({ player: null, currentTrack: mockCurrentTrack }),
    {
      getState: () => ({
        player: null,
        deviceId: mockDeviceId,
        isPremium: mockIsPremium,
        currentTrack: mockCurrentTrack,
        queue: [],
        queueIndex: 0,
        repeatMode: 'off',
        isShuffle: false,
        setQueue: mockSetQueue,
        setQueueIndex: mockSetQueueIndex,
        setIsShuffle: mockSetIsShuffle,
        setRepeatMode: mockSetRepeatMode,
        addToQueue: vi.fn(),
      }),
    }
  ),
}));

vi.mock('@/providers/SpotifyPlayerProvider', () => ({
  useSpotifyPlayer: () => ({
    player: null,
    deviceIdRef: { current: 'existing_dev_1' },
    needsRecoveryRef: {
      get current() {
        return mockNeedsRecovery;
      },
      set current(val: boolean) {
        mockNeedsRecovery = val;
      },
    },
  }),
}));

describe('usePlaybackActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeedsRecovery = false;
    mockDeviceId = 'existing_dev_1';
    mockIsPremium = true;
  });

  it('returns all required actions and userPausedRef', () => {
    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'dev_1',
        setRecoveryError: vi.fn(),
      })
    );

    expect(typeof result.current.playTrack).toBe('function');
    expect(typeof result.current.playTracks).toBe('function');
    expect(typeof result.current.playPlaylist).toBe('function');
    expect(typeof result.current.playContextTrack).toBe('function');
    expect(typeof result.current.playQueueItem).toBe('function');
    expect(typeof result.current.togglePlay).toBe('function');
    expect(typeof result.current.nextTrack).toBe('function');
    expect(typeof result.current.prevTrack).toBe('function');
    expect(typeof result.current.toggleShuffle).toBe('function');
    expect(typeof result.current.toggleRepeat).toBe('function');
    expect(typeof result.current.toggleSaveTrack).toBe('function');
    expect(typeof result.current.handleAddToQueue).toBe('function');
    expect(result.current.userPausedRef).toBeDefined();
    expect(result.current.userPausedRef.current).toBe(false);
  });

  it('returns stable action callbacks across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ selectedDevice }) =>
        usePlaybackActions({
          selectedDevice,
          setRecoveryError: vi.fn(),
        }),
      { initialProps: { selectedDevice: 'dev_1' } }
    );

    const initialPlayTrack = result.current.playTrack;
    const initialTogglePlay = result.current.togglePlay;
    const initialPlayTracks = result.current.playTracks;

    rerender({ selectedDevice: 'dev_2' });

    expect(result.current.playTrack).toBe(initialPlayTrack);
    expect(result.current.togglePlay).toBe(initialTogglePlay);
    expect(result.current.playTracks).toBe(initialPlayTracks);
  });

  it('runs recoverPlaybackDevice when needsRecoveryRef is set', async () => {
    mockNeedsRecovery = true;
    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: '',
        setRecoveryError: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.playTrack('spotify:track:test1234');
    });

    expect(mockRecoverPlaybackDevice).toHaveBeenCalledTimes(1);
    expect(mockPlayMutateAsync).toHaveBeenCalled();
  });
});
