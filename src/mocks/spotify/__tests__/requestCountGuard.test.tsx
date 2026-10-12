import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../server';
import { mockSpotifyState } from '../state';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameStateProvider } from '@/lib/gameState';

// Named limit constants per Prompt U specification
export const MAX_COLD_MUSIC_WORLD_SPOTIFY_REQUESTS = 5;
export const MAX_COLD_HOME_SPOTIFY_REQUESTS = 0;
export const MAX_TRACK_CHANGES_QUEUE_REQUESTS = 1;

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// In-memory Redis mock for proxy route caching
const redisCache = new Map<string, any>();
vi.mock('@/lib/server/redis', () => {
  const mockLimitFn = vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 });
  const keyPrefix = () => 'test:';
  return {
    redis: {
      get: vi.fn(async (key: string) => redisCache.get(key) || null),
      set: vi.fn(async (key: string, val: any) => {
        redisCache.set(key, val);
        return 'OK';
      }),
      del: vi.fn(async (...keys: string[]) => {
        for (const k of keys) redisCache.delete(k);
        return keys.length;
      }),
      scan: vi.fn(async () => [0, []]),
    },
    hashToken: (token: string) => require('crypto').createHash('sha256').update(token).digest('hex'),
    keyPrefix,
    getSpotifyLockKey: () => 'test:spotify_api_lock',
    getSpotifyApiLock: vi.fn().mockResolvedValue(null),
    setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
    reserveSpotifyRateLimit: mockLimitFn,
    deleteByPattern: vi.fn().mockResolvedValue(0),
  };
});

// Mock GSAP and audio
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: () => ({
      fromTo: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }),
    to: vi.fn().mockReturnValue({ kill: vi.fn() }),
    fromTo: vi.fn().mockReturnValue({ kill: vi.fn() }),
  },
}));

let globalEmitState: (state: any) => void = () => {};
const mockPlayerInstance = {
  getCurrentState: vi.fn().mockResolvedValue(null),
  seek: vi.fn(),
};
const mockDeviceIdRef = { current: 'test-device' };
const mockLatestStateRef = { current: null };

vi.mock('@/providers/SpotifyPlayerProvider', () => ({
  useSpotifyPlayer: () => ({
    player: mockPlayerInstance,
    deviceIdRef: mockDeviceIdRef,
    latestStateRef: mockLatestStateRef,
    subscribe: (cb: any) => {
      globalEmitState = cb;
      return () => {};
    },
  }),
  SpotifyPlayerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/audio', () => ({
  sfx: {
    hover: vi.fn(),
    select: vi.fn(),
  },
  getAudioContext: vi.fn(),
}));

import { cookies } from 'next/headers';
import HomeWorld from '@/components/worlds/HomeWorld';
import MusicWorld from '@/components/worlds/music/MusicWorld';
import { GET as proxyGET } from '@/app/api/spotify/proxy/[...path]/route';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { usePlayerStateSync } from '@/components/worlds/music/hooks/usePlayerStateSync';

describe('Prompt U: Request Count Guards (MSW)', () => {
  const interceptedSpotifyRequests: { url: string; method: string }[] = [];

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' } as any);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    redisCache.clear();
    mockSpotifyState.reset();
    interceptedSpotifyRequests.length = 0;

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === 'spotify_access_token') return { value: 'mock-access-token' };
        return undefined;
      }),
    } as any);

    // Listen to every request starting with api.spotify.com
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url);
      if (url.hostname === 'api.spotify.com') {
        interceptedSpotifyRequests.push({ url: request.url, method: request.method });
      }
    });

    // Wire local proxy and session endpoints through MSW to execute proxy route
    server.use(
      http.get(/\/api\/spotify\/session/, () => {
        return HttpResponse.json({
          accessToken: 'mock-access-token',
          user: { id: 'mock-user' },
        });
      }),
      http.get(/\/api\/memories/, () => {
        return HttpResponse.json([]);
      }),
      http.all(/\/api\/spotify\/proxy\/(.*)/, async ({ request }) => {
        const url = new URL(request.url);
        const prefix = '/api/spotify/proxy/';
        const idx = url.pathname.indexOf(prefix);
        const pathStr = idx !== -1 ? url.pathname.slice(idx + prefix.length) : '';
        const path = pathStr.split('/').filter(Boolean);
        const res = await proxyGET(request, { params: Promise.resolve({ path }) });
        return res;
      })
    );
  });

  afterEach(() => {
    server.events.removeAllListeners('request:start');
    server.resetHandlers();
    useSpotifyPlayerStore.getState().setCurrentTrack(null);
  });

  it('Render Home: 0 Spotify requests (MAX_COLD_HOME_SPOTIFY_REQUESTS = 0)', async () => {
    render(
      <GameStateProvider>
        <HomeWorld />
      </GameStateProvider>
    );

    // Give microtasks time to execute
    await new Promise((r) => setTimeout(r, 50));

    expect(interceptedSpotifyRequests.length).toBeLessThanOrEqual(MAX_COLD_HOME_SPOTIFY_REQUESTS);
    expect(interceptedSpotifyRequests.length).toBe(0);
  });

  it('Render Music World cold (empty cache): at most 5 Spotify requests (MAX_COLD_MUSIC_WORLD_SPOTIFY_REQUESTS = 5)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GameStateProvider>
          <MusicWorld />
        </GameStateProvider>
      </QueryClientProvider>
    );

    // Wait for initial queries to settle
    await waitFor(() => {
      // Must not exceed MAX_COLD_MUSIC_WORLD_SPOTIFY_REQUESTS
      expect(interceptedSpotifyRequests.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Allow any in-flight promises to resolve
    await new Promise((r) => setTimeout(r, 200));

    // Inspect intercepted calls to api.spotify.com
    const uniqueEndpoints = interceptedSpotifyRequests.map((r) => {
      const u = new URL(r.url);
      return `${r.method} ${u.pathname}${u.search}`;
    });

    expect(interceptedSpotifyRequests.length).toBeLessThanOrEqual(
      MAX_COLD_MUSIC_WORLD_SPOTIFY_REQUESTS
    );

    // Ensure queue endpoint was NOT called on cold load (since modal is closed)
    expect(uniqueEndpoints.some((ep) => ep.includes('/me/player/queue'))).toBe(false);

    // Ensure no more than 5 requests
    expect(uniqueEndpoints.length).toBeLessThanOrEqual(5);
  });

  it('Simulate 5 track changes within 3 seconds: at most 1 queue request (MAX_TRACK_CHANGES_QUEUE_REQUESTS = 1)', async () => {
    vi.useFakeTimers();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    let emitState: (state: any) => void = () => {};

    // Test component subscribing to playerStateSync
    function PlayerSyncTester() {
      usePlayerStateSync({
        progressBarRef: { current: null },
        lyricsViewRef: { current: null },
        userPausedRef: { current: false },
      });
      return <div data-testid="sync-tester">Sync Active</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <PlayerSyncTester />
      </QueryClientProvider>
    );

    const tracks = [
      { id: 'track_1', uri: 'spotify:track:1', name: 'Song 1' },
      { id: 'track_2', uri: 'spotify:track:2', name: 'Song 2' },
      { id: 'track_3', uri: 'spotify:track:3', name: 'Song 3' },
      { id: 'track_4', uri: 'spotify:track:4', name: 'Song 4' },
      { id: 'track_5', uri: 'spotify:track:5', name: 'Song 5' },
    ];

    interceptedSpotifyRequests.length = 0;

    // Simulate 5 track changes within 3 seconds (one every 500ms)
    for (let i = 0; i < 5; i++) {
      act(() => {
        globalEmitState({
          track_window: {
            current_track: tracks[i],
            next_tracks: [{ id: `next_${i}`, uri: `spotify:track:next_${i}` }],
          },
          paused: false,
          position: 0,
          duration: 200000,
        });
      });

      // Advance by 500ms (< 1.5s debounce timeout)
      act(() => {
        vi.advanceTimersByTime(500);
      });
    }

    // After 2.5s and 5 track changes, the 1.5s debounce timer has not fired yet
    const queueRequestsDuringSkips = interceptedSpotifyRequests.filter((r) =>
      r.url.includes('/me/player/queue')
    );
    expect(queueRequestsDuringSkips.length).toBe(0);

    // Now advance by 1500ms to fire the debounced queue refresh
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Restore real timers so network resolution and microtasks complete smoothly
    vi.useRealTimers();

    await waitFor(() => {
      const queueRequests = interceptedSpotifyRequests.filter((r) =>
        r.url.includes('/me/player/queue')
      );
      expect(queueRequests.length).toBeLessThanOrEqual(MAX_TRACK_CHANGES_QUEUE_REQUESTS);
      expect(queueRequests.length).toBe(1);
    }, { timeout: 2000 });
  });
});
