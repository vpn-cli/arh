import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { proxyFetch, spotifyQueue } from '../spotifyClient';

describe('spotifyClient (Fail-Safe API Proxy)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
    spotifyQueue.clear();
    if (spotifyQueue.isPaused) {
      spotifyQueue.start();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('should pause queue globally for 60 seconds on 429 response without retryAfter', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too Many Requests' })
    });

    await expect(proxyFetch('/me/player/devices')).rejects.toEqual({
      status: 429,
      message: 'Too Many Requests',
      retryAfter: 60
    });

    // The queue should now be paused
    expect(spotifyQueue.isPaused).toBe(true);

    // Advance time by 59 seconds
    vi.advanceTimersByTime(59000);
    expect(spotifyQueue.isPaused).toBe(true);

    // Advance time by 1 more second
    vi.advanceTimersByTime(1000);
    expect(spotifyQueue.isPaused).toBe(false);
  });

  it('should pause queue globally for specified retryAfter seconds on 429 response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too Many Requests', retryAfter: 10 })
    });

    await expect(proxyFetch('/me/player')).rejects.toEqual({
      status: 429,
      message: 'Too Many Requests',
      retryAfter: 10
    });

    expect(spotifyQueue.isPaused).toBe(true);

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    expect(spotifyQueue.isPaused).toBe(false);
  });
});
