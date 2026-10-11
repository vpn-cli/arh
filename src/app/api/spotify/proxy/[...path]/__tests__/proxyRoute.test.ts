import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/server/redis', () => {
  const { createHash } = require('crypto');
  return {
    redis: {
      get: vi.fn(),
      set: vi.fn().mockReturnValue(Promise.resolve('OK')),
      ttl: vi.fn(),
      del: vi.fn().mockReturnValue(Promise.resolve(1)),
      keys: vi.fn().mockResolvedValue([]),
    },
    hashToken: (token: string) => createHash('sha256').update(token).digest('hex'),
    getSpotifyApiLock: vi.fn(),
    setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
  };
});

import { cookies } from 'next/headers';
import { redis, getSpotifyApiLock, setSpotifyApiLock, hashToken } from '@/lib/server/redis';
import { GET } from '../route';

describe('Spotify Proxy Route (/api/spotify/proxy/[...path])', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(getSpotifyApiLock).mockResolvedValue(null);
    vi.mocked(redis!.get).mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('Part 1: blocks request when spotify_api_lock is active and returns 429 without calling Spotify', async () => {
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
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Part 4 & 5: caches GET /me with SHA-256 hashed token key and serves cache HIT', async () => {
    const accessToken = 'secret-token-xyz-123';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: accessToken }),
    } as any);

    const tokenHash = hashToken(accessToken);
    const expectedKey = `spotify_cache:${tokenHash}:https://api.spotify.com/v1/me`;

    // 1st request: Cache miss -> calls Spotify -> stores in Redis
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
    const body1 = await res1.json();
    expect(body1).toEqual(spotifyProfile);
    expect(redis!.set).toHaveBeenCalledWith(expectedKey, spotifyProfile, { ex: 3600 });

    // 2nd request: Cache hit -> serves from Redis without calling Spotify
    vi.mocked(redis!.get).mockResolvedValueOnce(spotifyProfile);
    const req2 = new Request('http://localhost:3000/api/spotify/proxy/me');
    const res2 = await GET(req2, { params: Promise.resolve({ path: ['me'] }) });
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache')).toBe('HIT');
    const body2 = await res2.json();
    expect(body2).toEqual(spotifyProfile);
    // Verified: Only 1 fetch call to Spotify was ever made
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
