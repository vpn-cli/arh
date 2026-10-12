import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://fake-redis.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
});

// In-memory timestamps array per key for Lua script mock
const mockStore: Record<string, { score: number; member: string }[]> = {};
let failNextLimit = false;

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn(function () {
      return {
        del: vi.fn(async (...keys: string[]) => {
          for (const k of keys) delete mockStore[k];
          return keys.length;
        }),
        scan: vi.fn(async (_cursor: any, opts?: any) => {
          const match = opts?.match || '*';
          const prefix = match.replace('*', '');
          const keys = Object.keys(mockStore).filter((k) =>
            match.includes('*') ? k.startsWith(prefix) : k === match
          );
          return [0, keys];
        }),
        pipeline: vi.fn(() => ({
          get: vi.fn().mockReturnThis(),
          ttl: vi.fn().mockReturnThis(),
          exec: vi.fn(async () => [null, 60]),
        })),
        get: vi.fn(),
        set: vi.fn(),
        eval: vi.fn(async (_script: string, keys: string[], args: any[]) => {
          if (failNextLimit) {
            throw new Error('Connection closed by remote host');
          }
          const userKey = keys[0];
          const appKey = keys[1];
          const now = Number(args[0]);
          const windowMs = Number(args[1]);
          const userBudget = Number(args[2]);
          const appBudget = Number(args[3]);
          const member = String(args[4]);

          if (!mockStore[userKey]) mockStore[userKey] = [];
          if (!mockStore[appKey]) mockStore[appKey] = [];

          const cutoff = now - windowMs;
          // Trim expired entries
          mockStore[userKey] = mockStore[userKey].filter((e) => e.score > cutoff);
          mockStore[appKey] = mockStore[appKey].filter((e) => e.score > cutoff);

          const userCount = mockStore[userKey].length;
          const appCount = mockStore[appKey].length;

          if (userCount >= userBudget) {
            const oldestScore = mockStore[userKey][0]?.score ?? now;
            const retryAfter = Math.max(1, Math.ceil((oldestScore + windowMs - now) / 1000));
            return [0, retryAfter, appCount, userCount, 'user'];
          }

          if (appCount >= appBudget) {
            const oldestScore = mockStore[appKey][0]?.score ?? now;
            const retryAfter = Math.max(1, Math.ceil((oldestScore + windowMs - now) / 1000));
            return [0, retryAfter, appCount, userCount, 'app'];
          }

          mockStore[userKey].push({ score: now, member });
          mockStore[appKey].push({ score: now, member });

          return [1, 0, appCount + 1, userCount + 1, ''];
        }),
      };
    }),
  };
});

import {
  reserveSpotifyRateLimit,
  SPOTIFY_RATE_LIMIT_LUA,
  clearRateLimitKeys,
  getRateLimitConfig,
  keyPrefix,
} from '../redis';

describe('Server-Side Sliding-Window Rate Limiter (redis.ts with SPOTIFY_RATE_LIMIT_LUA)', () => {
  const originalEnv = { ...process.env };
  const originalDateNow = Date.now;

  beforeEach(() => {
    vi.clearAllMocks();
    failNextLimit = false;
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '30';
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '5';
    process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET = '10';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Date.now = originalDateNow;
  });

  it('exports SPOTIFY_RATE_LIMIT_LUA script string', () => {
    expect(typeof SPOTIFY_RATE_LIMIT_LUA).toBe('string');
    expect(SPOTIFY_RATE_LIMIT_LUA).toContain('ZREMRANGEBYSCORE');
    expect(SPOTIFY_RATE_LIMIT_LUA).toContain('ZCARD');
    expect(SPOTIFY_RATE_LIMIT_LUA).toContain('ZADD');
  });

  it('reads env-configurable window and budgets with defaults', () => {
    delete process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC;
    delete process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET;
    delete process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET;

    const config = getRateLimitConfig();
    expect(config.windowSec).toBe(30);
    expect(config.appBudget).toBe(60);
    expect(config.userBudget).toBe(30);

    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '10';
    process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET = '50';
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '20';

    const customConfig = getRateLimitConfig();
    expect(customConfig.windowSec).toBe(10);
    expect(customConfig.appBudget).toBe(50);
    expect(customConfig.userBudget).toBe(20);
  });

  it('keyPrefix honors REDIS_KEY_PREFIX: unset, empty, and set to a value', () => {
    const originalPrefix = process.env.REDIS_KEY_PREFIX;
    try {
      // 1. Unset: defaults to 'dev:'
      delete process.env.REDIS_KEY_PREFIX;
      expect(keyPrefix()).toBe('dev:');

      // 2. Empty string: returns '' (used in production to keep keys untouched)
      process.env.REDIS_KEY_PREFIX = '';
      expect(keyPrefix()).toBe('');

      // 3. Set to a custom value: returns that value as-is
      process.env.REDIS_KEY_PREFIX = 'staging:';
      expect(keyPrefix()).toBe('staging:');

      process.env.REDIS_KEY_PREFIX = 'custom_prefix_';
      expect(keyPrefix()).toBe('custom_prefix_');
    } finally {
      if (originalPrefix !== undefined) {
        process.env.REDIS_KEY_PREFIX = originalPrefix;
      } else {
        delete process.env.REDIS_KEY_PREFIX;
      }
    }
  });

  it('under budget passes without blocking', async () => {
    const userHash = 'user_hash_under_budget';
    const endpoint = '/me/player/play';

    // 1st request -> allowed, count is 1
    const res1 = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(res1.allowed).toBe(true);
    expect(res1.userCount).toBe(1);
    expect(res1.appCount).toBe(1);

    // 2nd request -> allowed, count is 2 (budget is 5)
    const res2 = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(res2.allowed).toBe(true);
    expect(res2.userCount).toBe(2);
    expect(res2.appCount).toBe(2);
  });

  it('over budget gives a local 429 with the right Retry-After and logs single warning line', async () => {
    const userHash = 'user_hash_over_budget';
    const endpoint = '/search?q=radiohead';
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '2';
    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '30';

    const baseTime = 1700000000000;
    Date.now = () => baseTime;

    // Request 1 reserved at baseTime (t = 0)
    const r1 = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(r1.allowed).toBe(true);

    // Request 2 reserved at baseTime + 5000ms (t = 5s)
    Date.now = () => baseTime + 5000;
    const r2 = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(r2.allowed).toBe(true);

    // Request 3 at baseTime + 10000ms (t = 10s)
    Date.now = () => baseTime + 10000;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reserve 3: 2 requests already reserved, budget is 2
    const check = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(check.allowed).toBe(false);
    expect(check.userCount).toBe(2);
    expect(check.limitType).toBe('user');

    // Oldest entry was at baseTime (t = 0), window is 30s.
    // Oldest entry expires at baseTime + 30000ms.
    // Current time is baseTime + 10000ms.
    // Remaining seconds: (30000 - 10000) / 1000 = 20 seconds.
    expect(check.retryAfter).toBe(20);

    // Verify single warning line format: user-hash, endpoint, count in window
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      `[Rate Limiter] user-hash: ${userHash}, endpoint: ${endpoint}, count in window: 2`
    );

    warnSpy.mockRestore();
  });

  it('sliding window clears expired requests and allows new requests', async () => {
    const userHash = 'user_hash_sliding_window';
    const endpoint = '/me';
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '2';
    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '30';

    const baseTime = 1700000000000;
    Date.now = () => baseTime;

    // Fill budget at t = 0 and t = 1s
    await reserveSpotifyRateLimit(userHash, endpoint);
    Date.now = () => baseTime + 1000;
    await reserveSpotifyRateLimit(userHash, endpoint);

    // Over budget at t = 10s
    Date.now = () => baseTime + 10000;
    const checkBlocked = await reserveSpotifyRateLimit(userHash, endpoint);
    expect(checkBlocked.allowed).toBe(false);

    // Fast forward to t = 30.5s (first request at t = 0 has expired, second at t = 1s is still within window if window is 30s)
    Date.now = () => baseTime + 30500;
    const checkFreed = await reserveSpotifyRateLimit(userHash, endpoint);
    // 1 expired, 1 remaining + 1 newly reserved = 2 -> allowed!
    expect(checkFreed.allowed).toBe(true);
    expect(checkFreed.userCount).toBe(2);
  });

  it('trips app-wide budget when total across users exceeds appBudget', async () => {
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '10';
    process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET = '3';
    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '30';

    const userA = 'user_A';
    const userB = 'user_B';
    const userC = 'user_C';
    const userD = 'user_D';

    await reserveSpotifyRateLimit(userA);
    await reserveSpotifyRateLimit(userB);
    await reserveSpotifyRateLimit(userC);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // User D has 0 user requests, but app has 3 requests (= appBudget 3)
    const checkD = await reserveSpotifyRateLimit(userD, '/me/top/tracks');
    expect(checkD.allowed).toBe(false);
    expect(checkD.limitType).toBe('app');
    expect(checkD.appCount).toBe(3);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      `[Rate Limiter] user-hash: ${userD}, endpoint: /me/top/tracks, count in window: 3`
    );

    warnSpy.mockRestore();
  });

  it('clearRateLimitKeys cleans up redis state', async () => {
    const userHash = 'user_clear_test';
    await reserveSpotifyRateLimit(userHash);
    const p = keyPrefix();
    expect(mockStore[`${p}spotify_rl:app`]?.length).toBe(1);
    expect(mockStore[`${p}spotify_rl:${userHash}`]?.length).toBe(1);

    await clearRateLimitKeys(userHash);
    expect(mockStore[`${p}spotify_rl:app`]).toBeUndefined();
    expect(mockStore[`${p}spotify_rl:${userHash}`]).toBeUndefined();
  });

  it('concurrent reserves never exceed budget (simulate interleaving)', async () => {
    process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET = '5';
    process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET = '20';
    process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC = '30';
    const userHash = 'concurrent_user';

    // Simulate 12 concurrent requests racing to reserve slots simultaneously
    const requests = Array.from({ length: 12 }, (_, i) =>
      reserveSpotifyRateLimit(userHash, `/track/${i}`)
    );

    const results = await Promise.all(requests);
    const allowed = results.filter((r) => r.allowed);
    const rejected = results.filter((r) => !r.allowed);

    // Exactly 5 allowed, exactly 7 rejected
    expect(allowed.length).toBe(5);
    expect(rejected.length).toBe(7);

    // Ratelimit store never exceeded the budget of 5
    const p = keyPrefix();
    expect(mockStore[`${p}spotify_rl:${userHash}`]?.length).toBe(5);
    expect(mockStore[`${p}spotify_rl:app`]?.length).toBe(5);
  });

  it('Redis failure lets the request through (fails open, logs one warning)', async () => {
    const userHash = 'user_redis_error';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    failNextLimit = true;

    const result = await reserveSpotifyRateLimit(userHash, '/me');

    // Fails open: allowed is true, retryAfter is 0
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);

    // Logs one warning about redis error
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Rate Limiter] Redis error in limit(), failing open:',
      expect.any(Error)
    );

    warnSpy.mockRestore();
  });
});
