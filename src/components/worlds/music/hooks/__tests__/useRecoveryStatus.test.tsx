/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRecoveryStatus } from '../useRecoveryStatus';
import { getFreshToken, onLoginRequired, onSessionRecovered } from '@/lib/spotifyClient';

vi.mock('@/hooks/useSpotify', () => ({
  useSpotifySession: vi.fn(() => ({ data: null, isError: false, refetch: vi.fn() })),
}));

describe('useRecoveryStatus - session expiration and recovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    onLoginRequired(null);
    onSessionRecovered(null);
  });

  it('proves that a single transient session-fetch failure followed by a successful one does NOT leave isSessionExpired true', async () => {
    // Attempt 1: transient failure (401)
    // Attempt 2: retry succeeds with valid accessToken
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'valid_recovered_token' }),
      });

    const { result } = renderHook(() => useRecoveryStatus());

    expect(result.current.isSessionExpired).toBe(false);

    // Trigger token fetch (which experiences transient 401, then succeeds on retry)
    await act(async () => {
      const token = await getFreshToken();
      expect(token).toBe('valid_recovered_token');
    });

    // A single transient failure followed by a successful fetch must NOT leave isSessionExpired true
    expect(result.current.isSessionExpired).toBe(false);
  });

  it('proves that a single transient 200 with missing accessToken followed by a successful one does NOT leave isSessionExpired true', async () => {
    // Attempt 1: transient failure (200 with missing accessToken)
    // Attempt 2: retry succeeds with valid accessToken
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'valid_recovered_token_2' }),
      });

    const { result } = renderHook(() => useRecoveryStatus());

    expect(result.current.isSessionExpired).toBe(false);

    await act(async () => {
      const token = await getFreshToken();
      expect(token).toBe('valid_recovered_token_2');
    });

    expect(result.current.isSessionExpired).toBe(false);
  });

  it('clears isSessionExpired when a later getFreshToken() succeeds after an expired session', async () => {
    // Phase 1: both attempts fail (401), so session expires
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

    const { result } = renderHook(() => useRecoveryStatus());

    await act(async () => {
      const token = await getFreshToken();
      expect(token).toBeNull();
    });

    // Both attempts failed, so session expired overlay is active
    expect(result.current.isSessionExpired).toBe(true);

    // Phase 2: later getFreshToken() succeeds (e.g. backend / token recovered)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'later_valid_token' }),
    });

    await act(async () => {
      const token = await getFreshToken();
      expect(token).toBe('later_valid_token');
    });

    // Must genuinely clear isSessionExpired
    expect(result.current.isSessionExpired).toBe(false);
  });

  it('latches isSessionExpired true only when session fetch retry also fails', async () => {
    // Attempt 1 fails (401)
    // Attempt 2 fails (401)
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

    const { result } = renderHook(() => useRecoveryStatus());

    await act(async () => {
      const token = await getFreshToken();
      expect(token).toBeNull();
    });

    expect(result.current.isSessionExpired).toBe(true);
  });

  it('only calls refetchSession on session recovery when showLoginPrompt was actually true', async () => {
    const mockRefetch = vi.fn();
    const { useSpotifySession } = await import('@/hooks/useSpotify');
    vi.mocked(useSpotifySession).mockReturnValue({
      data: null,
      isError: false,
      refetch: mockRefetch,
    } as any);

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'routine_token' }),
    });

    const { result } = renderHook(() => useRecoveryStatus());

    // Case A: token fetched when showLoginPrompt is false (routine fetch)
    await act(async () => {
      await getFreshToken();
    });
    expect(mockRefetch).not.toHaveBeenCalled();

    // Case B: session failed and prompted login
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

    await act(async () => {
      await getFreshToken();
    });
    expect(result.current.isSessionExpired).toBe(true);

    // Case C: token recovered when showLoginPrompt was true
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'recovery_token' }),
    });

    await act(async () => {
      await getFreshToken();
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(result.current.isSessionExpired).toBe(false);
  });
});
