import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshSpotifyToken } from '../server/spotifyAuthServer';

describe('spotifyAuthServer - refreshSpotifyToken', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('marks isInvalidGrant: true and retryable: false when Spotify returns invalid_grant', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'invalid_grant', error_description: 'Refresh token revoked' }),
    });

    const result = await refreshSpotifyToken('revoked_refresh_token_123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
      expect(result.isInvalidGrant).toBe(true);
      expect(result.retryable).toBe(false);
    }
  });

  it('marks isInvalidGrant: false and retryable: true on Spotify 500/503 errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    const result = await refreshSpotifyToken('temp_503_token_' + Date.now());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(503);
      expect(result.isInvalidGrant).toBe(false);
      expect(result.retryable).toBe(true);
    }
  });

  it('marks isInvalidGrant: false and retryable: true on network exception', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND accounts.spotify.com'));

    const result = await refreshSpotifyToken('network_error_token_' + Date.now());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(503);
      expect(result.isInvalidGrant).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.errorText).toContain('ENOTFOUND');
    }
  });

  it('successfully returns new access token and rotated refresh token on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        access_token: 'new_access_token_123',
        refresh_token: 'rotated_refresh_token_456',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    const result = await refreshSpotifyToken('valid_refresh_token');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.accessToken).toBe('new_access_token_123');
      expect(result.refreshToken).toBe('rotated_refresh_token_456');
      expect(result.expiresIn).toBe(3600);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    }
  });
});
