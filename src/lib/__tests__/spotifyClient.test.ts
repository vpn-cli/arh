import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proxyFetch, spotifyQueue, registerDeviceRecoveryHandler, getFreshToken, clearClientSpotifyLock } from '../spotifyClient';

describe('spotifyClient (Fail-Safe API Proxy with Unified Recovery)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    clearClientSpotifyLock();
    global.fetch = vi.fn();
    spotifyQueue.clear();
    if (spotifyQueue.isPaused) {
      spotifyQueue.start();
    }
    registerDeviceRecoveryHandler(null);
  });

  afterEach(() => {
    clearClientSpotifyLock();
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

  it('should run device recovery and retry once on non-GET 404 Device not found', async () => {
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

    const result = await proxyFetch('/me/player/play?device_id=old_device', { method: 'PUT' });
    expect(mockRecovery).toHaveBeenCalledTimes(1);
    expect(mockRecovery).toHaveBeenCalledWith('proxyFetch 404: PUT /me/player/play?device_id=old_device');
    expect(result).toBeNull();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/spotify/proxy/me/player/play?device_id=device_new_999',
      expect.any(Object)
    );
  });

  it('should NOT run device recovery on GET 404 NO_ACTIVE_DEVICE and surface as no active device', async () => {
    const mockRecovery = vi.fn().mockResolvedValue('device_new_999');
    registerDeviceRecoveryHandler(mockRecovery);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          status: 404,
          message: 'Device not found',
          reason: 'NO_ACTIVE_DEVICE'
        }
      })
    });

    await expect(proxyFetch('/me/player/queue')).rejects.toMatchObject({
      status: 404,
      isNoActiveDevice: true,
    });
    expect(mockRecovery).not.toHaveBeenCalled();
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

  it('sends no Spotify requests while lock is active and rejects immediately', async () => {
    const { setClientSpotifyLock } = await import('@/store/spotifyLockStore');
    setClientSpotifyLock(300);

    let caughtError: any = null;
    try {
      await proxyFetch('/me/player');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toMatchObject({
      status: 429,
      message: 'Spotify is resting',
    });
    expect(caughtError.retryAfter).toBeGreaterThan(0);
    // Verified: No network call was made!
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetchSessionToken called with silent: true logs nothing and does not call the login callback on failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const loginCb = vi.fn();
    const { onLoginRequired } = await import('../spotifyClient');
    onLoginRequired(loginCb);

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const token = await getFreshToken({ silent: true });
    expect(token).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(loginCb).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    onLoginRequired(null);
  });

  it('distinguishes a local 429 from a Spotify 429: does NOT set client lock store for local-limiter', async () => {
    vi.useFakeTimers();
    const { isSpotifyLocked } = await import('@/store/spotifyLockStore');
    expect(isSpotifyLocked()).toBe(false);

    // Mock local-limiter 429
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too Many Requests (Rate Limit Exceeded)',
          source: 'local-limiter',
          retryAfter: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      });

    const promise = proxyFetch('/me/tracks');

    // Allow queue worker to process first fetch
    await vi.advanceTimersByTimeAsync(10);

    // Local 429 should NOT set isSpotifyLocked in store
    expect(isSpotifyLocked()).toBe(false);

    // Advance time for Retry-After and retry
    await vi.advanceTimersByTimeAsync(2500);
    const result = await promise;

    expect(result).toEqual({ success: true });
    // Still not locked
    expect(isSpotifyLocked()).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('distinguishes a local 429 from a Spotify 429: DOES set client lock store for upstream Spotify 429', async () => {
    vi.useFakeTimers();
    const { isSpotifyLocked } = await import('@/store/spotifyLockStore');
    clearClientSpotifyLock();
    expect(isSpotifyLocked()).toBe(false);

    // Mock upstream Spotify 429 (no source: local-limiter)
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too Many Requests',
          retryAfter: 60,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      });

    const promise = proxyFetch('/me/tracks');

    // Allow queue worker to process first fetch
    await vi.advanceTimersByTimeAsync(10);

    // Upstream 429 DOES set isSpotifyLocked in store
    expect(isSpotifyLocked()).toBe(true);

    // Advance time for Retry-After and retry
    await vi.advanceTimersByTimeAsync(65000);
    await promise;

    clearClientSpotifyLock();
    vi.useRealTimers();
  });

  it('mutation is not retried after a local 429', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Too Many Requests (Rate Limit Exceeded)',
        source: 'local-limiter',
        retryAfter: 15,
      }),
    });

    await expect(
      proxyFetch('/me/player/play', { method: 'PUT', body: JSON.stringify({ uris: ['spotify:track:123'] }) })
    ).rejects.toMatchObject({
      status: 429,
      source: 'local-limiter',
    });

    // Exactly 1 fetch attempt - PUT mutation was never retried!
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('drops polling requests instead of retrying them on local 429', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Too Many Requests (Rate Limit Exceeded)',
        source: 'local-limiter',
        retryAfter: 10,
      }),
    });

    const result = await proxyFetch('/me/player', { method: 'GET', isPolling: true });

    // Polling request dropped cleanly, returns null
    expect(result).toBeNull();
    // Exactly 1 fetch attempt - polling was never retried!
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('local 429 retries GET requests with max 2 attempts', async () => {
    vi.useFakeTimers();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too Many Requests',
          source: 'local-limiter',
          retryAfter: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too Many Requests',
          source: 'local-limiter',
          retryAfter: 2,
        }),
      });

    let caughtError: any = null;
    const promise = proxyFetch('/me/tracks', { method: 'GET' }).catch((err) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(2500);
    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError).toMatchObject({
      status: 429,
      source: 'local-limiter',
    });
    // Exactly 2 attempts (1 initial + 1 retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('maps 403 with reason PREMIUM_REQUIRED to distinct error and does not retry', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({
        error: {
          status: 403,
          message: 'Player command failed: Premium required',
          reason: 'PREMIUM_REQUIRED',
        },
      }),
    });

    let caughtError: any = null;
    try {
      await proxyFetch('/me/player/play', { method: 'PUT' });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.status).toBe(403);
    expect(caughtError.reason).toBe('PREMIUM_REQUIRED');
    expect(caughtError.isPremiumRequired).toBe(true);
    expect(caughtError.message).toBe('Spotify Premium required for playback');
    expect(global.fetch).toHaveBeenCalledTimes(1); // Never retried
  });

  it('maps generic 403 to Forbidden without Missing Scopes wording and does not retry', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({
        error: {
          status: 403,
          message: 'Access denied',
        },
      }),
    });

    let caughtError: any = null;
    try {
      await proxyFetch('/me/player/pause', { method: 'PUT' });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.status).toBe(403);
    expect(caughtError.message).toBe('Forbidden');
    expect(caughtError.message).not.toContain('Missing Scopes');
    expect(global.fetch).toHaveBeenCalledTimes(1); // Never retried
  });

  describe('multi-subscriber callback registry (regression: callback clobbering)', () => {
    it('with two onLoginRequired subscribers registered, unsubscribing one leaves the other receiving callbacks', async () => {
      const { onLoginRequired, getFreshToken } = await import('../spotifyClient');
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = onLoginRequired(cb1);
      const unsub2 = onLoginRequired(cb2);

      // Unsubscribe the first subscriber
      unsub1();

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

      await getFreshToken();

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);

      unsub2();
    });

    it('with two onSessionRecovered subscribers registered, unsubscribing one leaves the other receiving callbacks', async () => {
      const { onSessionRecovered, getFreshToken } = await import('../spotifyClient');
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unsub1 = onSessionRecovered(cb1);
      const unsub2 = onSessionRecovered(cb2);

      // Unsubscribe the first subscriber
      unsub1();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'recovered_tok' }),
      });

      await getFreshToken();

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);

      unsub2();
    });

    it('one throwing subscriber does not block subsequent subscribers from running', async () => {
      const { onLoginRequired, getFreshToken } = await import('../spotifyClient');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const throwingCb = vi.fn(() => {
        throw new Error('boom');
      });
      const healthyCb = vi.fn();

      const unsubThrowing = onLoginRequired(throwingCb);
      const unsubHealthy = onLoginRequired(healthyCb);

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

      await getFreshToken();

      expect(throwingCb).toHaveBeenCalledTimes(1);
      expect(healthyCb).toHaveBeenCalledTimes(1);

      unsubThrowing();
      unsubHealthy();
      errorSpy.mockRestore();
    });
  });
});

