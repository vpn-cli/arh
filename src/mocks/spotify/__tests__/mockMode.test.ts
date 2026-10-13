import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSpotifyMockMode,
  assertMockModeAllowed,
  resetProductionGuardWarningForTesting,
  MOCK_USER_ID,
} from '../config';
import {
  setupSpotifyMockServer,
  teardownSpotifyMockServer,
  server,
} from '../server';
import { mockSpotifyState } from '../state';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/server/redis', () => {
  const cache = new Map<string, any>();
  const mockLimitFn = vi
    .fn()
    .mockResolvedValue({
      allowed: true,
      retryAfter: 0,
      appCount: 0,
      userCount: 0,
    });
  const keyPrefix = () =>
    process.env.REDIS_KEY_PREFIX !== undefined
      ? process.env.REDIS_KEY_PREFIX
      : process.env.NODE_ENV === 'production'
        ? ''
        : 'dev:';
  return {
    redis: {
      get: vi.fn(async (key: string) => cache.get(key) || null),
      set: vi.fn(async (key: string, val: any) => {
        cache.set(key, val);
        return 'OK';
      }),
      del: vi.fn(async (...keys: string[]) => {
        for (const k of keys) cache.delete(k);
        return keys.length;
      }),
      pipeline: vi.fn(() => ({
        get: vi.fn().mockReturnThis(),
        ttl: vi.fn().mockReturnThis(),
        exec: vi.fn(async () => [null, 60]),
      })),
      scan: vi.fn(async () => [0, []]),
    },
    hashToken: (token: string) =>
      require('crypto').createHash('sha256').update(token).digest('hex'),
    keyPrefix,
    getSpotifyLockKey: () => `${keyPrefix()}spotify_api_lock`,
    getSpotifyApiLock: vi.fn().mockResolvedValue(null),
    setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
    reserveSpotifyRateLimit: mockLimitFn,
    deleteByPattern: vi.fn().mockResolvedValue(0),
  };
});

import { cookies } from 'next/headers';
import {
  reserveSpotifyRateLimit,
  getSpotifyApiLock,
  keyPrefix,
  getSpotifyLockKey,
} from '@/lib/server/redis';
import { GET, PUT } from '@/app/api/spotify/proxy/[...path]/route';
import { GET as getSession } from '@/app/api/spotify/session/route';

describe('Spotify Mock Mode & MSW Integration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpotifyState.reset();
    resetProductionGuardWarningForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    teardownSpotifyMockServer();
    process.env = { ...originalEnv };
  });

  describe('1. Production Hard Guard', () => {
    it('in production, mock mode is simply off and logs one warning if flags look wrong', () => {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.SPOTIFY_LIVE;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(isSpotifyMockMode()).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Spotify Mock] Production mode active: mock mode is strictly off.',
        ),
      );

      // Subsequent call does not spam warnings
      expect(isSpotifyMockMode()).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });

    it('production with mock flags set starts normally with mock off (never throws at startup)', () => {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.SPOTIFY_LIVE;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // assertMockModeAllowed logs warning and returns false without throwing
      expect(assertMockModeAllowed()).toBe(false);

      // setupSpotifyMockServer returns false, does not throw, and mock server remains inactive
      expect(setupSpotifyMockServer()).toBe(false);

      warnSpy.mockRestore();
    });

    it('mock mode is ON by default in development unless SPOTIFY_LIVE=1', () => {
      (process.env as any).NODE_ENV = 'development';
      delete process.env.SPOTIFY_LIVE;
      expect(isSpotifyMockMode()).toBe(true);

      process.env.SPOTIFY_LIVE = '1';
      expect(isSpotifyMockMode()).toBe(false);
    });
  });

  describe('2. Namespacing by Environment', () => {
    it('keyPrefix honors REDIS_KEY_PREFIX: unset, empty, and set to a value', () => {
      const orig = process.env.REDIS_KEY_PREFIX;
      try {
        // 1. Unset: defaults to 'dev:'
        delete process.env.REDIS_KEY_PREFIX;
        (process.env as any).NODE_ENV = 'development';
        expect(keyPrefix()).toBe('dev:');
        expect(getSpotifyLockKey()).toBe('dev:spotify_api_lock');

        // 2. Empty string: returns '' (used in production to keep keys unchanged)
        process.env.REDIS_KEY_PREFIX = '';
        expect(keyPrefix()).toBe('');
        expect(getSpotifyLockKey()).toBe('spotify_api_lock');

        // 3. Set to custom value: returns value as-is
        process.env.REDIS_KEY_PREFIX = 'prod:';
        expect(keyPrefix()).toBe('prod:');
        expect(getSpotifyLockKey()).toBe('prod:spotify_api_lock');

        process.env.REDIS_KEY_PREFIX = 'test_v1:';
        expect(keyPrefix()).toBe('test_v1:');
        expect(getSpotifyLockKey()).toBe('test_v1:spotify_api_lock');
      } finally {
        if (orig !== undefined) {
          process.env.REDIS_KEY_PREFIX = orig;
        } else {
          delete process.env.REDIS_KEY_PREFIX;
        }
      }
    });
  });

  describe('3. Fixture Paging', () => {
    it('saved tracks pagination honors limit and offset', () => {
      const page1 = mockSpotifyState.getSavedTracks(0, 2);
      expect(page1.items).toHaveLength(2);
      expect(page1.offset).toBe(0);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(2);
      expect(page1.next).toContain('offset=2');
      expect(page1.previous).toBeNull();

      const page2 = mockSpotifyState.getSavedTracks(2, 2);
      expect(page2.items).toHaveLength(1);
      expect(page2.offset).toBe(2);
      expect(page2.limit).toBe(2);
      expect(page2.previous).toContain('offset=0');

      // Verify disjoint pages
      expect(page1.items[0].track.id).not.toBe(page2.items[0].track.id);
    });

    it('playlists pagination honors limit and offset', () => {
      const page1 = mockSpotifyState.getPlaylists(0, 1);
      expect(page1.items).toHaveLength(1);
      expect(page1.offset).toBe(0);
      expect(page1.limit).toBe(1);

      const page2 = mockSpotifyState.getPlaylists(1, 1);
      expect(page2.items).toHaveLength(1);
      expect(page2.offset).toBe(1);
      expect(page2.limit).toBe(1);
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    });
  });

  describe('4. Like-Then-Read Reflects In-Memory State', () => {
    it('saving and removing tracks immediately updates contains and saved tracks list', () => {
      const targetTrackId = 'track_mock_4';

      // 1. Initially not liked
      expect(mockSpotifyState.checkSavedTracks([targetTrackId])).toEqual([
        false,
      ]);

      // 2. Save track (like)
      mockSpotifyState.saveTracks([targetTrackId]);
      expect(mockSpotifyState.checkSavedTracks([targetTrackId])).toEqual([
        true,
      ]);

      // Verify track appears in saved tracks
      const saved = mockSpotifyState.getSavedTracks(0, 50);
      const found = saved.items.some((item) => item.track.id === targetTrackId);
      expect(found).toBe(true);

      // 3. Remove track (unlike)
      mockSpotifyState.removeSavedTracks([targetTrackId]);
      expect(mockSpotifyState.checkSavedTracks([targetTrackId])).toEqual([
        false,
      ]);

      const savedAfter = mockSpotifyState.getSavedTracks(0, 50);
      const foundAfter = savedAfter.items.some(
        (item) => item.track.id === targetTrackId,
      );
      expect(foundAfter).toBe(false);
    });
  });

  describe('5. Proxy Cache/Limiter Path Runs in Mock Mode', () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = 'development';
      process.env.SPOTIFY_LIVE = '0';
      server.listen({ onUnhandledFrame: 'error' });
    });

    afterEach(() => {
      server.close();
    });

    it('proxy short-circuits in mock mode and returns allowlisted mock fixtures without upstream fetch or limiter', async () => {
      expect(MOCK_USER_ID).toBe('mock-user');

      const req1 = new Request('http://localhost:3000/api/spotify/proxy/me');
      const res1 = await GET(req1, {
        params: Promise.resolve({ path: ['me'] }),
      });

      // In mock mode, proxy short-circuits before circuit breaker lock or rate limiter
      expect(getSpotifyApiLock).not.toHaveBeenCalled();
      expect(reserveSpotifyRateLimit).not.toHaveBeenCalled();

      // Returns allowlisted mock fixture data directly
      expect(res1.status).toBe(200);
      const body1 = await res1.json();
      expect(body1).toEqual({
        id: 'mock-user',
        display_name: 'Mock User',
        product: 'premium',
      });
    });
    it.each([
      {
        name: 'me/top/tracks',
        path: ['me', 'top', 'tracks'],
        expected: { items: [], total: 0, limit: 20, offset: 0 },
      },
      {
        name: 'me/top/artists',
        path: ['me', 'top', 'artists'],
        expected: { items: [], total: 0, limit: 20, offset: 0 },
      },
      {
        name: 'me/player/queue',
        path: ['me', 'player', 'queue'],
        expected: { currently_playing: null, queue: [] },
      },
      {
        name: 'me/player/devices',
        path: ['me', 'player', 'devices'],
        expected: { devices: [] },
      },
      {
        name: 'search',
        path: ['search'],
        expected: { tracks: { items: [], total: 0, limit: 20, offset: 0 } },
      },
      {
        name: 'albums/*/tracks',
        path: ['albums', 'test_album', 'tracks'],
        expected: { items: [], total: 0, limit: 50, offset: 0 },
      },
      {
        name: 'albums/*',
        path: ['albums', 'test_album'],
        expected: {
          id: null,
          name: '',
          tracks: { items: [], total: 0, limit: 50, offset: 0 },
        },
      },
      {
        name: 'artists/*/albums',
        path: ['artists', 'test_artist', 'albums'],
        expected: { items: [], total: 0, limit: 10, offset: 0 },
      },
      {
        name: 'artists/*',
        path: ['artists', 'test_artist'],
        expected: { id: null, name: '', images: [] },
      },
      {
        name: 'playlists/*/items',
        path: ['playlists', 'test_playlist', 'items'],
        expected: { items: [], total: 0, limit: 100, offset: 0 },
      },
      {
        name: 'playlists/*',
        path: ['playlists', 'test_playlist'],
        expected: { id: null, name: '', tracks: { items: [], total: 0 } },
      },
    ])(
      'mock GET proxy /api/spotify/proxy/$name returns 200 with fixture',
      async ({ path, expected }) => {
        const pathStr = path.join('/');
        const req = new Request(
          `http://localhost:3000/api/spotify/proxy/${pathStr}`,
        );
        const res = await GET(req, { params: Promise.resolve({ path }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toEqual(expected);
      },
    );

    it('PUT /api/spotify/proxy/me/player/pause returns 501 in mock mode', async () => {
      const req = new Request(
        'http://localhost:3000/api/spotify/proxy/me/player/pause',
        {
          method: 'PUT',
        },
      );
      const res = await PUT(req, {
        params: Promise.resolve({ path: ['me', 'player', 'pause'] }),
      });
      expect(res.status).toBe(501);
    });

    it('unhandled Spotify request in mock mode returns 501 and never reaches the network', async () => {
      const res = await fetch(
        'https://api.spotify.com/v1/some-unhandled-endpoint',
      );
      expect(res.status).toBe(501);
      const json = await res.json();
      expect(json).toEqual({
        error: 'no mock for GET /v1/some-unhandled-endpoint',
      });
    });

    it('unhandled Spotify POST request in mock mode returns 501 and never reaches the network', async () => {
      const res = await fetch(
        'https://api.spotify.com/v1/some-unhandled-post-endpoint',
        {
          method: 'POST',
        },
      );
      expect(res.status).toBe(501);
      const json = await res.json();
      expect(json).toEqual({
        error: 'no mock for POST /v1/some-unhandled-post-endpoint',
      });
    });

    it('MOCK_USER_ID matches mocked /me id and is used for memories identity', () => {
      expect(MOCK_USER_ID).toBe('mock-user');
      const me = mockSpotifyState.getMe();
      expect(me.id).toBe(MOCK_USER_ID);
      expect(me.display_name).toBe('Mock VIPIN');
    });

    it('unmocked accounts.spotify.com request gets 501 and never reaches the network', async () => {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
      });
      expect(res.status).toBe(501);
      const json = await res.json();
      expect(json).toEqual({
        error: 'no mock for POST /api/token',
      });
    });

    it('token refresh in mock mode refreshes locally and never needs accounts.spotify.com', async () => {
      // Simulate expired cookie in mock mode
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === 'spotify_access_token')
            return { value: 'old-mock-token' };
          if (name === 'spotify_token_expires_at')
            return { value: String(Date.now() - 10000) }; // expired
          if (name === 'spotify_refresh_token')
            return { value: 'mock_spotify_refresh_token' };
          return undefined;
        }),
      } as any);

      const res = await getSession();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.accessToken).toBe('old-mock-token');
      expect(data.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('6. Live Mode (SPOTIFY_LIVE=1) Proxy Cache/Limiter Path with MSW', () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = 'development';
      process.env.SPOTIFY_LIVE = '1';
      server.listen({ onUnhandledFrame: 'error' });
    });

    afterEach(() => {
      server.close();
    });

    it('proxy executes lock, limiter, and cache paths while MSW fakes upstream fetch with fake user id', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'dev-mock-access-token' }),
      } as any);

      expect(MOCK_USER_ID).toBe('mock-user');

      const req1 = new Request('http://localhost:3000/api/spotify/proxy/me');
      const res1 = await GET(req1, {
        params: Promise.resolve({ path: ['me'] }),
      });

      // Circuit breaker lock was checked
      expect(getSpotifyApiLock).toHaveBeenCalled();
      // Rate limiter was called on cache miss
      expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);

      // Returns mock fixture data from MSW with fake user id
      expect(res1.status).toBe(200);
      expect(res1.headers.get('X-Cache')).toBe('MISS');
      const body1 = await res1.json();
      expect(body1).toMatchObject({
        id: 'mock-user',
        display_name: 'Mock VIPIN',
      });

      // 2nd identical GET: hits cache, rate limiter is NOT called again
      const req2 = new Request('http://localhost:3000/api/spotify/proxy/me');
      const res2 = await GET(req2, {
        params: Promise.resolve({ path: ['me'] }),
      });
      expect(res2.status).toBe(200);
      expect(res2.headers.get('X-Cache')).toBe('HIT');
      const body2 = await res2.json();
      expect(body2).toEqual(body1);

      // Limiter was NOT called on cache hit
      expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);
    });
  });
});
