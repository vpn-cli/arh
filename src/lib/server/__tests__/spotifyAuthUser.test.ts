import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { getAuthenticatedSpotifyUserId } from '../spotifyAuthUser';

describe('getAuthenticatedSpotifyUserId', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
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

  it('returns upstream when Spotify /me returns 429 or 5xx', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-429' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 429,
      ok: false,
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: false, reason: 'upstream' });
  });

  it('returns ok and userId when Spotify /me succeeds', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token-user-abc' }),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ id: 'spotify_user_vipinkaushik' }),
    } as any);

    const result = await getAuthenticatedSpotifyUserId();
    expect(result).toEqual({ ok: true, userId: 'spotify_user_vipinkaushik' });

    // Verify in-memory cache on subsequent call with identical access token
    const cachedResult = await getAuthenticatedSpotifyUserId();
    expect(cachedResult).toEqual({ ok: true, userId: 'spotify_user_vipinkaushik' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
