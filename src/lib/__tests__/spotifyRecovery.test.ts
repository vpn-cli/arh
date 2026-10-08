import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPlayerForRecovery,
  recoverPlaybackDevice,
  subscribeRecoveryState,
  markNeedsRecovery,
  getNeedsRecovery,
  clearNeedsRecovery,
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

  it('successfully recovers device, transfers playback, and updates deviceIdRef', async () => {
    let reconnectingState = false;
    subscribeRecoveryState({
      onReconnectingChange: (val) => {
        reconnectingState = val;
      },
    });

    const recoveredId = await recoverPlaybackDevice();

    expect(recoveredId).toBe('rec_device_456');
    expect(deviceIdRef.current).toBe('rec_device_456');
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

  it('guarantees concurrency locking: concurrent callers await the same recovery operation', async () => {
    const p1 = recoverPlaybackDevice();
    const p2 = recoverPlaybackDevice();
    const p3 = recoverPlaybackDevice();

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    expect(res1).toBe('rec_device_456');
    expect(res2).toBe('rec_device_456');
    expect(res3).toBe('rec_device_456');
    // player.connect and transfer fetch must only be called once!
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

  it('times out if ready event is not received within 5 seconds', async () => {
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

    // Fast-forward 5000ms
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(caughtError?.message).toMatch(/timed out/i);
    expect(errorLogged).toMatch(/timed out/i);
    vi.useRealTimers();
  });
});
