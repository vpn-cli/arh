import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('../redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn().mockReturnValue(Promise.resolve('OK')),
    del: vi.fn().mockReturnValue(Promise.resolve(1)),
    ttl: vi.fn(),
  },
  hashToken: vi.fn((token: string) => `hash_${token}`),
  getSpotifyApiLock: vi.fn().mockResolvedValue(null),
  setSpotifyApiLock: vi.fn().mockResolvedValue(undefined),
  SPOTIFY_LOCK_KEY: 'spotify_api_lock',
}));

import { cookies } from 'next/headers';
import { redis, getSpotifyApiLock, setSpotifyApiLock } from '../redis';
import { getAuthenticatedSpotifyUserId } from '../spotifyAuthUser';

describe('getAuthenticatedSpotifyUserId', () => {
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

  it('returns unauthenticated when spotify_access_token cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns unauthenticated when Spotify /me returns 401', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'expired-token' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 401,
      ok: false,
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: false, reason: 'unauthenticated' });
  });

  it('returns upstream when Spotify /me returns 5xx', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-500' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 503,
      ok: false,
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: false, reason: 'upstream' });
  });

  it('Part 1: checks spotify_api_lock first and returns 429 with retryAfter without calling Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-locked-check' }),
    } as any);

    vi.mocked(getSpotifyApiLock).mockResolvedValueOnce({
      locked: true,
      retryAfter: 48030,
    });

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({
      ok: false,
      reason: 'rate_limited',
      status: 429,
      retryAfter: 48030,
      error: 'Too Many Requests (Circuit Breaker)',
    });
    // Crucial check: Spotify is NEVER called when lock is active
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('Part 1: sets lock in Redis when Spotify /me returns 429 and returns 429 with retryAfter', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-429-received' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 429,
      ok: false,
      headers: new Headers({ 'Retry-After': '120' }),
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(setSpotifyApiLock).toHaveBeenCalledWith(120);
    expect(result).toEqual({
      ok: false,
      reason: 'rate_limited',
      status: 429,
      retryAfter: 120,
      error: 'Too Many Requests',
    });
  });

  it('Part 2: caches user id in Redis for 1 hour on successful fetch', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-fresh-save-redis' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ id: 'user_saved_to_redis' }),
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: true, userId: 'user_saved_to_redis' });
    expect(redis!.set).toHaveBeenCalledWith(
      'spotify_user:hash_token-fresh-save-redis',
      'user_saved_to_redis',
      { ex: 3600 }
    );
  });

  it('Part 2: restores user id from Redis across restarts without calling Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-from-redis-restart' }),
    } as any);

    vi.mocked(redis!.get).mockResolvedValueOnce('user_restored_from_redis');

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: true, userId: 'user_restored_from_redis' });
    // Verified: No external fetch to Spotify was needed
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
