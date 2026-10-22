import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/server/spotifyAuthServer', () => ({
  refreshSpotifyToken: vi.fn(),
}));

vi.mock('@/mocks/spotify/config', () => ({
  isSpotifyMockMode: vi.fn().mockReturnValue(false),
  MOCK_ACCESS_TOKEN: 'mock_access',
  MOCK_REFRESH_TOKEN: 'mock_refresh',
}));

import { cookies } from 'next/headers';
import { refreshSpotifyToken } from '@/lib/server/spotifyAuthServer';
import { GET } from '../route';

describe('/api/spotify/session Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('on invalid_grant returns 401 and sets no Set-Cookie deletions', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === 'spotify_access_token') return undefined; // expired
        if (name === 'spotify_token_expires_at') return { value: '0' }; // expired
        if (name === 'spotify_refresh_token') return { value: 'losing_refresh_token' };
        return undefined;
      }),
    } as any);

    vi.mocked(refreshSpotifyToken).mockResolvedValue({
      success: false,
      status: 400,
      isInvalidGrant: true,
      errorText: '{"error":"invalid_grant","error_description":"Invalid refresh token"}',
      retryable: false,
    });

    const res = await GET();

    // 1. Status must be 401
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Session expired');

    // 2. Must NOT emit any Set-Cookie deletions (retaining cookies so winner's refresh is not erased)
    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    expect(setCookieHeaders).toEqual([]);

    // Check that cookies list on the response object is empty
    expect(res.cookies.getAll()).toEqual([]);
  });
});
