import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/server/redis', () => ({
  hashToken: vi.fn((token: string) => `hash_${token}`),
  getSpotifyApiLock: vi.fn(),
  setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
  reserveSpotifyRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 }),
}));

import { cookies } from 'next/headers';
import {
  getSpotifyApiLock,
  setSpotifyApiLock,
  reserveSpotifyRateLimit,
} from '@/lib/server/redis';
import { GET } from '../route';

describe('Diagnose API Route (/api/spotify/diagnose)', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    (process.env as any).NODE_ENV = 'development';
    global.fetch = vi.fn();
    vi.mocked(getSpotifyApiLock).mockResolvedValue(null);
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    global.fetch = originalFetch;
  });

  it('checks spotify_api_lock first and returns 429 without calling Spotify', async () => {
    vi.mocked(getSpotifyApiLock).mockResolvedValueOnce({
      locked: true,
      retryAfter: 48030,
    });

    const res = await GET();
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json).toEqual({
      error: 'Too Many Requests (Circuit Breaker)',
      retryAfter: 48030,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sets lock and returns 429 when Spotify returns 429 during diagnostic step', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => {
        if (name === 'spotify_access_token') return { value: 'test-token' };
        return undefined;
      }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValueOnce({
      status: 429,
      headers: new Headers({ 'Retry-After': '500' }),
      text: async () => JSON.stringify({ error: 'Too Many Requests' }),
      json: async () => ({ error: 'Too Many Requests' }),
    } as any);

    const res = await GET();
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(setSpotifyApiLock).toHaveBeenCalledWith(500);
    expect(json.retryAfter).toBe(500);
  });

  it('returns local-limiter 429 when rate limiter trips during diagnostic step', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) => {
        if (name === 'spotify_access_token') return { value: 'test-token' };
        return undefined;
      }),
    } as any);

    vi.mocked(reserveSpotifyRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 20,
      appCount: 30,
      userCount: 30,
    });

    const res = await GET();
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json).toMatchObject({
      source: 'local-limiter',
      retryAfter: 20,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
