import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaybackActions } from '../usePlaybackActions';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { proxyFetch } from '@/lib/spotifyClient';

const mockPlayMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/lib/spotifyClient', () => ({
  proxyFetch: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/spotifyRecovery', () => ({
  recoverPlaybackDevice: vi.fn().mockResolvedValue('test_device_123'),
  getNeedsRecovery: vi.fn().mockReturnValue(false),
  clearNeedsRecovery: vi.fn(),
  setNeedsRecovery: vi.fn(),
}));

vi.mock('@/lib/sfx', () => ({
  sfx: {
    select: vi.fn(),
  },
}));

vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: () => ({ data: { accessToken: 'mock_token' } }),
  useSpotifyMutations: () => ({
    play: { mutateAsync: mockPlayMutateAsync },
    toggleSave: { mutateAsync: vi.fn() },
    toggleShuffle: { mutateAsync: vi.fn() },
    toggleRepeat: { mutateAsync: vi.fn() },
  }),
  usePlayerQueue: () => ({ data: { queue: [] } }),
  useTrackSavedStatus: () => ({ data: false }),
}));

vi.mock('@/providers/SpotifyPlayerProvider', () => ({
  useSpotifyPlayer: () => ({
    player: null,
    deviceIdRef: { current: 'test_device_123' },
    needsRecoveryRef: { current: false },
    latestStateRef: { current: null },
    subscribe: vi.fn(),
  }),
}));

describe('Queue bugs and playback matching tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSpotifyPlayerStore.setState({
      queue: [],
      queueIndex: 0,
      deviceId: 'test_device_123',
      isPremium: true,
      currentTrack: null,
    });
  });

  it('(a) playing a playlist row sets the queue to that playlist with the clicked index', async () => {
    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'test_device_123',
        setRecoveryError: vi.fn(),
      })
    );

    const playlistUri = 'spotify:playlist:test_playlist_123';
    const tracksList = [
      { uri: 'spotify:track:track_0', name: 'Track 0', id: 't0' },
      { uri: 'spotify:track:track_1', name: 'Track 1', id: 't1' },
      { uri: 'spotify:track:track_2', name: 'Track 2', id: 't2' },
    ];

    await act(async () => {
      await result.current.playContextTrack(playlistUri, 'spotify:track:track_1', tracksList);
    });

    const state = useSpotifyPlayerStore.getState();
    expect(state.queue).toHaveLength(3);
    expect(state.queue[0]).toEqual({ track: tracksList[0], contextUri: playlistUri });
    expect(state.queue[1]).toEqual({ track: tracksList[1], contextUri: playlistUri });
    expect(state.queue[2]).toEqual({ track: tracksList[2], contextUri: playlistUri });
    expect(state.queueIndex).toBe(1);
    expect(state.currentTrack).toEqual(tracksList[1]);
  });

  it('(b) with a queue of three, playing the second keeps three tracks, sets index 1, and sends all three uris with offset 1', async () => {
    const initialQueue = [
      { track: { uri: 'spotify:track:track_0', name: 'Track 0', id: 't0' }, contextUri: undefined },
      { track: { uri: 'spotify:track:track_1', name: 'Track 1', id: 't1' }, contextUri: undefined },
      { track: { uri: 'spotify:track:track_2', name: 'Track 2', id: 't2' }, contextUri: undefined },
    ];

    useSpotifyPlayerStore.setState({
      queue: initialQueue,
      queueIndex: 0,
      deviceId: 'test_device_123',
      isPremium: true,
    });

    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'test_device_123',
        setRecoveryError: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.playQueueItem(1);
    });

    const state = useSpotifyPlayerStore.getState();
    // Keeps three tracks
    expect(state.queue).toHaveLength(3);
    expect(state.queue[0].track.uri).toBe('spotify:track:track_0');
    expect(state.queue[1].track.uri).toBe('spotify:track:track_1');
    expect(state.queue[2].track.uri).toBe('spotify:track:track_2');
    // Sets index 1
    expect(state.queueIndex).toBe(1);

    // Sends all three uris with offset 1
    expect(proxyFetch).toHaveBeenCalledTimes(1);
    const [url, options] = (proxyFetch as any).mock.calls[0];
    expect(url).toContain('/me/player/play');
    const sentBody = JSON.parse(options.body);
    expect(sentBody.uris).toEqual([
      'spotify:track:track_0',
      'spotify:track:track_1',
      'spotify:track:track_2',
    ]);
    expect(sentBody.offset).toEqual({ position: 1 });
  });

  it('(c) album Play without tracks clears the store queue', async () => {
    const initialQueue = [
      { track: { uri: 'spotify:track:old_0', name: 'Old 0' }, contextUri: undefined },
      { track: { uri: 'spotify:track:old_1', name: 'Old 1' }, contextUri: undefined },
    ];

    useSpotifyPlayerStore.setState({
      queue: initialQueue,
      queueIndex: 0,
      deviceId: 'test_device_123',
      isPremium: true,
    });

    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'test_device_123',
        setRecoveryError: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.playPlaylist('spotify:album:album_without_tracks');
    });

    const state = useSpotifyPlayerStore.getState();
    expect(state.queue).toEqual([]);
    expect(state.queue).toHaveLength(0);
  });

  it('playContextTrack without tracks clears the store queue', async () => {
    const initialQueue = [
      { track: { uri: 'spotify:track:old_0', name: 'Old 0' }, contextUri: undefined },
      { track: { uri: 'spotify:track:old_1', name: 'Old 1' }, contextUri: undefined },
    ];

    useSpotifyPlayerStore.setState({
      queue: initialQueue,
      queueIndex: 0,
      deviceId: 'test_device_123',
      isPremium: true,
    });

    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'test_device_123',
        setRecoveryError: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.playContextTrack('spotify:playlist:playlist_without_tracks', 'spotify:track:any');
    });

    const state = useSpotifyPlayerStore.getState();
    expect(state.queue).toEqual([]);
    expect(state.queue).toHaveLength(0);
  });

  it('correctly handles track objects with boolean track: true (e.g. from Mix or playlists)', async () => {
    const { result } = renderHook(() =>
      usePlaybackActions({
        selectedDevice: 'test_device_123',
        setRecoveryError: vi.fn(),
      })
    );

    const playlistUri = 'spotify:playlist:test_mix';
    const mixTracks = [
      { uri: 'spotify:track:mix_0', name: 'Mix Track 0', id: 'm0', track: true, duration_ms: 180000 },
      { uri: 'spotify:track:mix_1', name: 'Mix Track 1', id: 'm1', track: true, duration_ms: 200000 },
    ];

    await act(async () => {
      await result.current.playContextTrack(playlistUri, 'spotify:track:mix_1', mixTracks);
    });

    const state = useSpotifyPlayerStore.getState();
    expect(state.queue).toHaveLength(2);
    expect(state.queue[0].track).toEqual(mixTracks[0]);
    expect(state.queue[0].track.name).toBe('Mix Track 0');
    expect(state.queue[1].track).toEqual(mixTracks[1]);
    expect(state.queue[1].track.name).toBe('Mix Track 1');
    expect(state.queueIndex).toBe(1);
    expect(state.currentTrack).toEqual(mixTracks[1]);
  });
});
