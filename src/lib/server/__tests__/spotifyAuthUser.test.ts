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
  reserveSpotifyRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0, appCount: 0, userCount: 0 }),
  keyPrefix: vi.fn(() => ''),
  SPOTIFY_LOCK_KEY: 'spotify_api_lock',
}));

import { cookies } from 'next/headers';
import {
  redis,
  getSpotifyApiLock,
  setSpotifyApiLock,
  reserveSpotifyRateLimit,
  keyPrefix,
} from '../redis';
import { inFlightGetRequests } from '../spotifyInFlight';
import { getAuthenticatedSpotifyUserId } from '../spotifyAuthUser';

describe('getAuthenticatedSpotifyUserId', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(getSpotifyApiLock).mockResolvedValue(null);
    vi.mocked(redis!.get).mockResolvedValue(null);
    inFlightGetRequests.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    inFlightGetRequests.clear();
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

  it('blocks request when local rate limiter trips and returns 429 without calling Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-rate-limited' }),
    } as any);

    vi.mocked(reserveSpotifyRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 15,
      appCount: 30,
      userCount: 30,
      limitType: 'user',
    });

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({
      ok: false,
      reason: 'rate_limited',
      status: 429,
      retryAfter: 15,
      error: 'Too Many Requests (Rate Limit Exceeded)',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('prevents double-counting by reusing cached proxy /me data from Redis without calling limiter or Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-cached-by-proxy' }),
    } as any);

    vi.mocked(redis!.get).mockImplementation(async (key: string) => {
      if (key.includes('spotify_cache:')) {
        return { id: 'user_from_proxy_cache', display_name: 'Test User' };
      }
      return null;
    });

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: true, userId: 'user_from_proxy_cache' });
    expect(reserveSpotifyRateLimit).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('prevents double-counting by awaiting an in-flight /me request without calling limiter or Spotify', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-in-flight-coalesce' }),
    } as any);

    const meCacheKey = 'spotify_cache:hash_token-in-flight-coalesce:https://api.spotify.com/v1/me';
    const fakeInFlightPromise = Promise.resolve({
      status: 200,
      body: { id: 'user_from_in_flight' },
      isJson: true,
      isNoContent: false,
      headers: {},
    });

    inFlightGetRequests.set(meCacheKey, fakeInFlightPromise);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: true, userId: 'user_from_in_flight' });
    expect(reserveSpotifyRateLimit).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls keyPrefix() directly to namespace redis cache keys', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-prefix-check' }),
    } as any);

    vi.mocked(keyPrefix).mockReturnValue('dev:');

    vi.mocked(redis!.get).mockImplementation(async (key: string) => {
      if (key === 'dev:spotify_user:hash_token-prefix-check') {
        return 'user_with_prefix';
      }
      return null;
    });

    const result = await getAuthenticatedSpotifyUserId();
    expect(keyPrefix).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, userId: 'user_with_prefix' });
  });
});
