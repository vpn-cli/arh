import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/server/redis', () => {
  const { createHash } = require('crypto');
  const mockReserve = vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 });
  return {
    redis: {
      get: vi.fn(),
      set: vi.fn().mockReturnValue(Promise.resolve('OK')),
      ttl: vi.fn(),
      del: vi.fn().mockReturnValue(Promise.resolve(1)),
      keys: vi.fn().mockResolvedValue([]),
    },
    hashToken: (token: string) => require('crypto').createHash('sha256').update(token).digest('hex'),
    keyPrefix: () =>
      process.env.REDIS_KEY_PREFIX !== undefined
        ? process.env.REDIS_KEY_PREFIX
        : (process.env.NODE_ENV === 'production' ? '' : 'dev:'),
    getSpotifyApiLock: vi.fn(),
    setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
    reserveSpotifyRateLimit: mockReserve,
    deleteByPattern: vi.fn().mockResolvedValue(0),
  };
});

import { cookies } from 'next/headers';
import {
  redis,
  getSpotifyApiLock,
  setSpotifyApiLock,
  hashToken,
  keyPrefix,
  reserveSpotifyRateLimit,
  deleteByPattern,
} from '@/lib/server/redis';
import { GET, POST, PUT, DELETE, _inFlightGetRequestsForTesting, getEndpointTtl, ENDPOINT_CACHE_RULES } from '../route';

describe('Spotify Proxy Route (/api/spotify/proxy/[...path])', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    _inFlightGetRequestsForTesting.clear();
    global.fetch = vi.fn();
    vi.mocked(getSpotifyApiLock).mockResolvedValue(null);
    vi.mocked(redis!.get).mockResolvedValue(null);
    vi.mocked(reserveSpotifyRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('Part 1: blocks request when spotify_api_lock is active and returns 429 without calling Spotify (lock wins over limiter)', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    vi.mocked(getSpotifyApiLock).mockResolvedValueOnce({
      locked: true,
      retryAfter: 48030,
    });

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json).toEqual({
      error: 'Too Many Requests (Circuit Breaker)',
      retryAfter: 48030,
    });
    // Never calls Spotify
    expect(global.fetch).not.toHaveBeenCalled();
    // Never checks or consumes rate limiter budget
    expect(reserveSpotifyRateLimit).not.toHaveBeenCalled();
  });

  it('Part 1: trips lock when Spotify returns 429 and returns 429 with Retry-After', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      status: 429,
      headers: new Headers({ 'Retry-After': '120' }),
    } as any);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(setSpotifyApiLock).toHaveBeenCalledWith(120);
  });

  it('under budget passes through and calls Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    const spotifyProfile = { id: 'user_123', display_name: 'Test' };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => JSON.stringify(spotifyProfile),
      }),
      text: async () => JSON.stringify(spotifyProfile),
    } as any);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(200);
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('over budget gives a local 429 with the right Retry-After and source: local-limiter', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    vi.mocked(reserveSpotifyRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 18,
      appCount: 30,
      userCount: 30,
      limitType: 'user',
    });

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('18');
    const json = await res.json();
    expect(json).toEqual({
      error: 'Too Many Requests (Rate Limit Exceeded)',
      source: 'local-limiter',
      retryAfter: 18,
    });
    // Never calls Spotify
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('cache hit does NOT consume budget', async () => {
    const accessToken = 'secret-token-xyz-123';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const tokenHash = hashToken(accessToken);
    const expectedKey = `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me`;

    // 1st request: Cache miss -> calls Spotify -> checks 1 rate limit token -> caches
    const spotifyProfile = { id: 'user_vipinkaushik', display_name: 'Vipin' };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => JSON.stringify(spotifyProfile),
      }),
      text: async () => JSON.stringify(spotifyProfile),
    } as any);

    const req1 = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res1 = await GET(req1, { params: Promise.resolve({ path: ['me'] }) });
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-Cache')).toBe('MISS');
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);
    expect(redis!.set).toHaveBeenCalledWith(expectedKey, spotifyProfile, { ex: 3600 });

    // 2nd request: Cache hit -> serves from Redis -> does NOT call rate limiter
    vi.mocked(redis!.get).mockResolvedValueOnce(spotifyProfile);
    const req2 = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res2 = await GET(req2, { params: Promise.resolve({ path: ['me'] }) });
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache')).toBe('HIT');
    const body2 = await res2.json();
    expect(body2).toEqual(spotifyProfile);

    // Verified: reserveSpotifyRateLimit still only called 1 time total!
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('cache hit served while the budget is exhausted (cache check before limiter)', async () => {
    const accessToken = 'secret-token-budget-exhausted';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const spotifyProfile = { id: 'user_cached_vip', display_name: 'Cached VIP' };
    // Rate limiter is exhausted!
    vi.mocked(reserveSpotifyRateLimit).mockResolvedValue({
      allowed: false,
      retryAfter: 30,
      appCount: 60,
      userCount: 30,
      limitType: 'user',
    });

    // Redis cache has the data
    vi.mocked(redis!.get).mockResolvedValueOnce(spotifyProfile);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    const json = await res.json();
    expect(json).toEqual(spotifyProfile);

    // Limiter was NEVER called, even though budget is exhausted!
    expect(reserveSpotifyRateLimit).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('coalescing makes one upstream call for N concurrent callers and each gets a readable body', async () => {
    const accessToken = 'secret-token-coalesce';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const spotifyProfile = { id: 'coalesced_user', display_name: 'Coalesce Test' };

    // Simulate upstream fetch latency
    vi.mocked(global.fetch).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        status: 200,
        clone: () => ({
          text: async () => JSON.stringify(spotifyProfile),
        }),
        text: async () => JSON.stringify(spotifyProfile),
      } as any;
    });

    const req1 = new Request('http://localhost:3000/api/spotify/proxy/me');
    const req2 = new Request('http://localhost:3000/api/spotify/proxy/me');
    const req3 = new Request('http://localhost:3000/api/spotify/proxy/me');

    // N concurrent callers invoke GET at the same time
    const [res1, res2, res3] = await Promise.all([
      GET(req1, { params: Promise.resolve({ path: ['me'] }) }),
      GET(req2, { params: Promise.resolve({ path: ['me'] }) }),
      GET(req3, { params: Promise.resolve({ path: ['me'] }) }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    // Each caller independently reads their own response body without body stream locking issues
    const [body1, body2, body3] = await Promise.all([
      res1.json(),
      res2.json(),
      res3.json(),
    ]);

    expect(body1).toEqual(spotifyProfile);
    expect(body2).toEqual(spotifyProfile);
    expect(body3).toEqual(spotifyProfile);

    // Upstream fetch called exactly once for 3 callers
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Rate limit checked exactly once for 3 callers
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);
  });

  it('proves one cache-miss GET and one write each reserve exactly once', async () => {
    const accessToken = 'token-one-reserve-test';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const spotifyProfile = { id: 'user_single_reserve', display_name: 'Single Reserve' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => JSON.stringify(spotifyProfile),
      }),
      text: async () => JSON.stringify(spotifyProfile),
      json: async () => spotifyProfile,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as any);

    // 1. One cache-miss GET
    const getReq = new Request('http://localhost:3000/api/spotify/proxy/me');
    const getRes = await GET(getReq, { params: Promise.resolve({ path: ['me'] }) });
    expect(getRes.status).toBe(200);
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(1);

    // 2. One write (PUT)
    const putReq = new Request('http://localhost:3000/api/spotify/proxy/me/player/pause', {
      method: 'PUT',
    });
    const putRes = await PUT(putReq, { params: Promise.resolve({ path: ['me', 'player', 'pause'] }) });
    expect(putRes.status).toBe(200);
    // Exactly 2 total reserves: 1 for GET, 1 for PUT
    expect(reserveSpotifyRateLimit).toHaveBeenCalledTimes(2);
  });

  it('Redis failure lets the request through (fail open)', async () => {
    const accessToken = 'token-redis-failure';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    // reserveSpotifyRateLimit returns allowed: true when failing open on Redis error
    vi.mocked(reserveSpotifyRateLimit).mockResolvedValueOnce({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 });

    const spotifyProfile = { id: 'fail_open_user', display_name: 'Fail Open' };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => JSON.stringify(spotifyProfile),
      }),
      text: async () => JSON.stringify(spotifyProfile),
    } as any);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(spotifyProfile);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('map entry removed after a rejected upstream', async () => {
    const accessToken = 'token-rejected-upstream';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Spotify connection terminated'));

    const req = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res = await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(res.status).toBe(500);
    // Map entry was deleted in finally block
    expect(_inFlightGetRequestsForTesting.size).toBe(0);
  });

  it('create playlist busts /me/playlists?limit=50 via pattern delete', async () => {
    const accessToken = 'token-playlist-bust';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const tokenHash = hashToken(accessToken);
    const createdPlaylist = { id: 'new_playlist_1', name: 'My New Playlist' };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: () => ({
        text: async () => JSON.stringify(createdPlaylist),
      }),
      text: async () => JSON.stringify(createdPlaylist),
      json: async () => createdPlaylist,
    } as any);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me/playlists', {
      method: 'POST',
      body: JSON.stringify({ name: 'My New Playlist' }),
    });
    const res = await POST(req, { params: Promise.resolve({ path: ['me', 'playlists'] }) });

    expect(res.status).toBe(201);
    // Verified: pattern delete matches /me/playlists* (which busts /me/playlists?limit=50)
    expect(deleteByPattern).toHaveBeenCalledWith(
      `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/playlists*`
    );
  });

  it('liking a track busts the contains and me/tracks entries', async () => {
    const accessToken = 'token-like-bust';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const tokenHash = hashToken(accessToken);
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: new Headers(),
    } as any);

    const req = new Request('http://localhost:3000/api/spotify/proxy/me/library?uris=spotify:track:track_123', {
      method: 'PUT',
    });
    const res = await PUT(req, { params: Promise.resolve({ path: ['me', 'library'] }) });

    expect(res.status).toBe(200);
    expect(deleteByPattern).toHaveBeenCalledWith(
      `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/tracks*`
    );
    expect(deleteByPattern).toHaveBeenCalledWith(
      `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/library/contains*`
    );
  });

  it('differently ordered params hit the same cache key', async () => {
    const accessToken = 'token-ordered-params';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const tokenHash = hashToken(accessToken);
    // Expected canonical key with query params sorted alphabetically: limit, offset, q, type
    const expectedCanonicalKey = `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/search?limit=10&offset=5&q=radiohead&type=track`;

    const searchResult = { tracks: { items: [{ id: 'track_1' }] } };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => JSON.stringify(searchResult),
      }),
      text: async () => JSON.stringify(searchResult),
    } as any);

    // 1st request with param order: q, limit, offset, type
    const req1 = new Request('http://localhost:3000/api/spotify/proxy/search?q=radiohead&limit=10&offset=5&type=track');
    const res1 = await GET(req1, { params: Promise.resolve({ path: ['search'] }) });
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-Cache')).toBe('MISS');
    expect(redis!.set).toHaveBeenCalledWith(expectedCanonicalKey, searchResult, { ex: 3600 });

    // 2nd request with completely reversed param order: type, offset, q, limit
    vi.mocked(redis!.get).mockResolvedValueOnce(searchResult);
    const req2 = new Request('http://localhost:3000/api/spotify/proxy/search?type=track&offset=5&q=radiohead&limit=10');
    const res2 = await GET(req2, { params: Promise.resolve({ path: ['search'] }) });
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache')).toBe('HIT');
    expect(redis!.get).toHaveBeenLastCalledWith(expectedCanonicalKey);

    // Spotify fetch was only called ONCE across both requests
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  describe('Per-endpoint TTL table (Prompt U)', () => {
    it('returns correct TTL for each endpoint class', () => {
      expect(getEndpointTtl('me/top/tracks')).toBe(21600);
      expect(getEndpointTtl('me/top/artists')).toBe(21600);
      expect(getEndpointTtl('me/player/recently-played')).toBe(60);
      expect(getEndpointTtl('me/player/queue')).toBeNull();
      expect(getEndpointTtl('me')).toBe(3600);
      expect(getEndpointTtl('me/playlists')).toBe(3600);
      expect(getEndpointTtl('search')).toBe(3600);
      expect(getEndpointTtl('me/tracks')).toBe(3600);
      expect(getEndpointTtl('me/library')).toBe(3600);
      expect(getEndpointTtl('playlists/123')).toBe(3600);
      expect(getEndpointTtl('me/player')).toBeNull();
    });

    it('caches me/top/tracks with 21600s TTL and me/player/recently-played with 60s TTL', async () => {
      const accessToken = 'token-ttl-test';
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: accessToken }),
      } as any);

      // Top tracks
      const topTracks = { items: [{ id: 'track_top_1' }] };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        clone: () => ({ text: async () => JSON.stringify(topTracks) }),
        text: async () => JSON.stringify(topTracks),
      } as any);

      const req1 = new Request('http://localhost:3000/api/spotify/proxy/me/top/tracks?limit=50');
      const res1 = await GET(req1, { params: Promise.resolve({ path: ['me', 'top', 'tracks'] }) });
      expect(res1.status).toBe(200);
      expect(redis!.set).toHaveBeenCalledWith(
        expect.stringContaining('me/top/tracks'),
        topTracks,
        { ex: 21600 }
      );

      // Recently played
      const recentTracks = { items: [{ track: { id: 'track_rec_1' } }] };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        clone: () => ({ text: async () => JSON.stringify(recentTracks) }),
        text: async () => JSON.stringify(recentTracks),
      } as any);

      const req2 = new Request('http://localhost:3000/api/spotify/proxy/me/player/recently-played?limit=50');
      const res2 = await GET(req2, { params: Promise.resolve({ path: ['me', 'player', 'recently-played'] }) });
      expect(res2.status).toBe(200);
      expect(redis!.set).toHaveBeenCalledWith(
        expect.stringContaining('me/player/recently-played'),
        recentTracks,
        { ex: 60 }
      );
    });

    it('me/player/queue is never cached in Redis', async () => {
      const accessToken = 'token-queue-uncached';
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: accessToken }),
      } as any);

      const queueData = { currently_playing: null, queue: [] };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => queueData,
        clone: () => ({ text: async () => JSON.stringify(queueData) }),
        text: async () => JSON.stringify(queueData),
      } as any);

      const req = new Request('http://localhost:3000/api/spotify/proxy/me/player/queue');
      const res = await GET(req, { params: Promise.resolve({ path: ['me', 'player', 'queue'] }) });
      expect(res.status).toBe(200);
      expect(redis!.set).not.toHaveBeenCalledWith(
        expect.stringContaining('me/player/queue'),
        expect.anything(),
        expect.anything()
      );
    });
  });
});
