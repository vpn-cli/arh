import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
});

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn(function () {
      return {
        scan: vi.fn(),
        del: vi.fn().mockResolvedValue(1),
      };
    }),
  };
});

import { redis, deleteByPattern } from '../redis';

describe('deleteByPattern SCAN helper (redis.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes across multiple batches with SCAN loop (MATCH pattern, COUNT 100)', async () => {
    const pattern = 'spotify_cache:token123:https://api.spotify.com/v1/me/playlists*';

    // Mock multi-batch SCAN:
    // Call 1: cursor 0 -> returns nextCursor 'cursor_batch_2', keys ['key1', 'key2']
    // Call 2: cursor 'cursor_batch_2' -> returns nextCursor '0', keys ['key3']
    vi.mocked(redis!.scan)
      .mockResolvedValueOnce(['cursor_batch_2', ['key1', 'key2']])
      .mockResolvedValueOnce(['0', ['key3']]);

    const totalDeleted = await deleteByPattern(pattern, 100);

    expect(totalDeleted).toBe(3);

    // Verify scan calls
    expect(redis!.scan).toHaveBeenCalledTimes(2);
    expect(redis!.scan).toHaveBeenNthCalledWith(1, 0, { match: pattern, count: 100 });
    expect(redis!.scan).toHaveBeenNthCalledWith(2, 'cursor_batch_2', { match: pattern, count: 100 });

    // Verify del calls per batch
    expect(redis!.del).toHaveBeenCalledTimes(2);
    expect(redis!.del).toHaveBeenNthCalledWith(1, 'key1', 'key2');
    expect(redis!.del).toHaveBeenNthCalledWith(2, 'key3');
  });

  it('handles scan with zero matches without calling del', async () => {
    const pattern = 'spotify_cache:empty*';
    vi.mocked(redis!.scan).mockResolvedValueOnce(['0', []]);

    const totalDeleted = await deleteByPattern(pattern);

    expect(totalDeleted).toBe(0);
    expect(redis!.scan).toHaveBeenCalledTimes(1);
    expect(redis!.del).not.toHaveBeenCalled();
  });
});
