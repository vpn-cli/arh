import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proxyFetch, spotifyQueue, registerDeviceRecoveryHandler, getFreshToken } from '../spotifyClient';

describe('spotifyClient (Fail-Safe API Proxy with Unified Recovery)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    global.fetch = vi.fn();
    spotifyQueue.clear();
    if (spotifyQueue.isPaused) {
      spotifyQueue.start();
    }
    registerDeviceRecoveryHandler(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully return data on 200 response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ items: [] })
    });

    const data = await proxyFetch('/me/playlists');
    expect(data).toEqual({ items: [] });
    expect(global.fetch).toHaveBeenCalledWith('/api/spotify/proxy/me/playlists', expect.any(Object));
  });

  it('should wait for Retry-After and retry once on 429 response, succeeding if second request succeeds', async () => {
    vi.useFakeTimers();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests', retryAfter: 2 })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true })
      });

    const promise = proxyFetch('/me/player');

    // Advance time by 2500ms for Retry-After and queue unpause
    await vi.advanceTimersByTimeAsync(2500);

    const result = await promise;
    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should wait for Retry-After, retry once, and reject if second request also returns 429', async () => {
    vi.useFakeTimers();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests', retryAfter: 2 })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests', retryAfter: 2 })
      });

    let caughtError: any = null;
    const promise = proxyFetch('/me/player').catch((err) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(2500);
    await promise;

    expect(caughtError).toEqual(
      expect.objectContaining({
        status: 429,
        message: 'Too Many Requests',
        retryAfter: 2,
      })
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should refresh token and retry once on 401 response', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })
      // fetch for /api/spotify/session in getFreshToken
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new_token_123' })
      })
      // retry of original request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ items: ['recovered'] })
      });

    const data = await proxyFetch('/me/tracks');
    expect(data).toEqual({ items: ['recovered'] });
    expect(global.fetch).toHaveBeenCalledWith('/api/spotify/proxy/me/tracks', expect.any(Object));
  });

  it('should run device recovery and retry once on 404 Device not found', async () => {
    const mockRecovery = vi.fn().mockResolvedValue('device_new_999');
    registerDeviceRecoveryHandler(mockRecovery);

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            status: 404,
            message: 'Device not found',
            reason: 'NO_ACTIVE_DEVICE'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204
      });

    const result = await proxyFetch('/me/player/play?device_id=old_device');
    expect(mockRecovery).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/spotify/proxy/me/player/play?device_id=device_new_999',
      expect.any(Object)
    );
  });

  it('should deduplicate concurrent calls to getFreshToken via single-flight promise', async () => {
    let sessionCallCount = 0;
    (global.fetch as any).mockImplementation(async (url: string) => {
      if (url === '/api/spotify/session') {
        sessionCallCount++;
        await new Promise((r) => setTimeout(r, 20));
        return {
          ok: true,
          status: 200,
          json: async () => ({ accessToken: 'single_flight_token' }),
        };
      }
      return { ok: true, status: 200 };
    });

    const [token1, token2, token3] = await Promise.all([
      getFreshToken(),
      getFreshToken(),
      getFreshToken(),
    ]);

    expect(sessionCallCount).toBe(1);
    expect(token1).toBe('single_flight_token');
    expect(token2).toBe('single_flight_token');
    expect(token3).toBe('single_flight_token');
  });

  it('should acquire navigator.locks for "spotify-token-refresh" when available', async () => {
    const mockRequest = vi.fn().mockImplementation(async (name, cb) => {
      return await cb();
    });

    Object.defineProperty(window.navigator, 'locks', {
      value: { request: mockRequest },
      configurable: true,
      writable: true,
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'web_locked_token' }),
    });

    const token = await getFreshToken();
    expect(mockRequest).toHaveBeenCalledWith('spotify-token-refresh', expect.any(Function));
    expect(token).toBe('web_locked_token');

    // Clean up
    delete (window.navigator as any).locks;
  });
});
