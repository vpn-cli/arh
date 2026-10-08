import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPlayerForRecovery,
  recoverPlaybackDevice,
  subscribeRecoveryState,
  markNeedsRecovery,
  getNeedsRecovery,
  clearNeedsRecovery,
  markNotReady,
} from '../spotifyRecovery';

describe('spotifyRecovery', () => {
  let mockPlayer: any;
  let deviceIdRef: { current: string | null };
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useRealTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });
    deviceIdRef = { current: null };

    const listeners: Record<string, Function[]> = {};
    mockPlayer = {
      connect: vi.fn().mockImplementation(() => {
        // Simulate SDK firing ready event after a short tick
        setTimeout(() => {
          listeners['ready']?.forEach((cb) => cb({ device_id: 'rec_device_456' }));
        }, 50);
        return Promise.resolve(true);
      }),
      disconnect: vi.fn(),
      addListener: vi.fn((event: string, cb: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
      }),
      removeListener: vi.fn((event: string, cb: Function) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((fn) => fn !== cb);
        }
      }),
    };

    registerPlayerForRecovery(mockPlayer, deviceIdRef);
    clearNeedsRecovery();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('Step 1: skips connect if deviceIdRef has an ID and not_ready has not fired, transferring playback directly', async () => {
    deviceIdRef.current = 'existing_device_123';
    markNeedsRecovery();

    const recoveredId = await recoverPlaybackDevice();

    expect(recoveredId).toBe('existing_device_123');
    expect(mockPlayer.connect).not.toHaveBeenCalled();
    expect(mockPlayer.disconnect).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/spotify/proxy/me/player',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ device_ids: ['existing_device_123'], play: false }),
      })
    );
    expect(getNeedsRecovery()).toBe(false);
  });

  it('Step 2: falls back to full reconnect if transfer in step 1 returns 404', async () => {
    deviceIdRef.current = 'stale_device_123';

    // First transfer returns 404, second transfer (after reconnect) succeeds
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Device not found',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

    const recoveredId = await recoverPlaybackDevice();

    expect(recoveredId).toBe('rec_device_456');
    expect(deviceIdRef.current).toBe('rec_device_456');
    expect(mockPlayer.disconnect).toHaveBeenCalledTimes(1);
    expect(mockPlayer.connect).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/spotify/proxy/me/player',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ device_ids: ['rec_device_456'], play: false }),
      })
    );
  });

  it('Step 2: does full reconnect when no device ID is present', async () => {
    deviceIdRef.current = null;

    let reconnectingState = false;
    subscribeRecoveryState({
      onReconnectingChange: (val) => {
        reconnectingState = val;
      },
    });

    const recoveredId = await recoverPlaybackDevice();

    expect(recoveredId).toBe('rec_device_456');
    expect(deviceIdRef.current).toBe('rec_device_456');
    expect(mockPlayer.disconnect).toHaveBeenCalledTimes(1);
    expect(mockPlayer.connect).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/spotify/proxy/me/player',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ device_ids: ['rec_device_456'], play: false }),
      })
    );
    expect(reconnectingState).toBe(false);
  });

  it('Step 2: does full reconnect if not_ready fired even if deviceId is present', async () => {
    deviceIdRef.current = 'existing_device_123';
    markNotReady(true);

    const recoveredId = await recoverPlaybackDevice();

    expect(recoveredId).toBe('rec_device_456');
    expect(mockPlayer.disconnect).toHaveBeenCalledTimes(1);
    expect(mockPlayer.connect).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/spotify/proxy/me/player',
      expect.objectContaining({
        body: JSON.stringify({ device_ids: ['rec_device_456'], play: false }),
      })
    );
  });

  it('Step 3: failed transfer in step 1 (non-404) fails recovery immediately', async () => {
    deviceIdRef.current = 'existing_device_123';
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(recoverPlaybackDevice()).rejects.toThrow(/Failed to transfer playback/);
    expect(mockPlayer.connect).not.toHaveBeenCalled();
  });

  it('Step 3: failed transfer in step 2 fails recovery and throws', async () => {
    deviceIdRef.current = null;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'Bad Gateway',
    });

    let errorReported: string | null = null;
    subscribeRecoveryState({
      onErrorChange: (err) => {
        errorReported = err;
      },
    });

    await expect(recoverPlaybackDevice()).rejects.toThrow(/Failed to transfer playback/);
    expect(errorReported).toMatch(/Failed to transfer playback/);
  });

  it('guarantees concurrency locking: concurrent callers await the same recovery operation', async () => {
    const p1 = recoverPlaybackDevice();
    const p2 = recoverPlaybackDevice();
    const p3 = recoverPlaybackDevice();

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    expect(res1).toBe('rec_device_456');
    expect(res2).toBe('rec_device_456');
    expect(res3).toBe('rec_device_456');
    expect(mockPlayer.connect).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('tracks needsRecovery flag accurately', () => {
    expect(getNeedsRecovery()).toBe(false);
    markNeedsRecovery();
    expect(getNeedsRecovery()).toBe(true);
    clearNeedsRecovery();
    expect(getNeedsRecovery()).toBe(false);
  });

  it('times out if ready event is not received within 10 seconds', async () => {
    vi.useFakeTimers();
    mockPlayer.connect = vi.fn().mockResolvedValue(true); // Does not fire ready

    let errorLogged: any = null;
    subscribeRecoveryState({
      onErrorChange: (err) => {
        errorLogged = err;
      },
    });

    let caughtError: any = null;
    const promise = recoverPlaybackDevice().catch((err) => {
      caughtError = err;
    });

    // Fast-forward 10000ms
    await vi.advanceTimersByTimeAsync(10000);
    await promise;

    expect(caughtError?.message).toMatch(/timed out.*10s/i);
    expect(errorLogged).toMatch(/timed out.*10s/i);
    vi.useRealTimers();
  }, 15000);
});
