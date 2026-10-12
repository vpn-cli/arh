import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

const isRedisConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  process.env.UPSTASH_REDIS_REST_URL !== 'todo';

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Returns environment key prefix for Redis namespacing.
 * Reads REDIS_KEY_PREFIX:
 * - If set (even to an empty string ""): uses the exact value as-is.
 * - If unset: defaults to "dev:".
 * In production, REDIS_KEY_PREFIX is set to "" so production keys remain untouched.
 */
export function keyPrefix(): string {
  if (process.env.REDIS_KEY_PREFIX !== undefined) {
    return process.env.REDIS_KEY_PREFIX;
  }
  return 'dev:';
}

export const SPOTIFY_LOCK_KEY = 'spotify_api_lock';

export function getSpotifyLockKey(): string {
  return `${keyPrefix()}spotify_api_lock`;
}

/**
 * Computes a SHA-256 hex digest of a token string to avoid storing raw tokens in Redis keys.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Checks whether the Spotify API circuit breaker is currently active.
 * Uses Redis pipelining to query GET and TTL in a single round-trip.
 * Returns null if not locked, or { locked: true, retryAfter: number } if locked.
 */
export async function getSpotifyApiLock(): Promise<{ locked: boolean; retryAfter: number } | null> {
  if (!redis) return null;
  try {
    const lockKey = getSpotifyLockKey();
    const pipeline = redis.pipeline();
    pipeline.get(lockKey);
    pipeline.ttl(lockKey);
    const results = await pipeline.exec<[string | null, number]>();
    const isLocked = results?.[0];
    const ttl = results?.[1];
    if (isLocked) {
      return { locked: true, retryAfter: Math.max(1, typeof ttl === 'number' ? ttl : 60) };
    }
  } catch (e) {
    console.error('Redis error checking circuit breaker (spotify_api_lock):', e);
  }
  return null;
}

/**
 * Trips the Spotify API circuit breaker lock in Redis for the given retryAfter duration in seconds.
 */
export async function setSpotifyApiLock(retryAfterSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    const lockKey = getSpotifyLockKey();
    const ex = Math.max(1, retryAfterSeconds);
    await redis.set(lockKey, 'locked', { ex });
  } catch (e) {
    console.error('Redis error setting circuit breaker (spotify_api_lock):', e);
  }
}

export interface RateLimitConfig {
  windowSec: number;
  appBudget: number;
  userBudget: number;
}

export function getRateLimitConfig(): RateLimitConfig {
  const windowSec = parseInt(process.env.SPOTIFY_RATE_LIMIT_WINDOW_SEC || '30', 10) || 30;
  const appBudget = parseInt(process.env.SPOTIFY_RATE_LIMIT_APP_BUDGET || '50', 10) || 50;
  const userBudget = parseInt(process.env.SPOTIFY_RATE_LIMIT_USER_BUDGET || '30', 10) || 30;
  return { windowSec, appBudget, userBudget };
}

export interface SpotifyRateLimitResult {
  allowed: boolean;
  retryAfter: number;
  appCount: number;
  userCount: number;
  limitType?: 'user' | 'app';
}

export type RateLimitReserveResult = SpotifyRateLimitResult;

/**
 * Atomic sliding-window rate limiter Lua script.
 * Trims expired entries, checks user and app budgets, and inserts the request
 * only if both budgets are under their limits.
 *
 * KEYS[1] = user key
 * KEYS[2] = app key
 * ARGV[1] = now (timestamp ms)
 * ARGV[2] = windowMs (window duration ms)
 * ARGV[3] = userBudget
 * ARGV[4] = appBudget
 * ARGV[5] = unique member (timestamp:random)
 * ARGV[6] = expireSec (TTL seconds)
 *
 * Returns: { allowed (1 or 0), retryAfter (sec), appCount, userCount, limitType ('user'|'app'|'') }
 */
export const SPOTIFY_RATE_LIMIT_LUA = `
local userKey = KEYS[1]
local appKey = KEYS[2]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local userBudget = tonumber(ARGV[3])
local appBudget = tonumber(ARGV[4])
local member = ARGV[5]
local expireSec = tonumber(ARGV[6])

local cutoff = now - windowMs

-- 1. Trim expired entries from both sets
redis.call('ZREMRANGEBYSCORE', userKey, '-inf', cutoff)
redis.call('ZREMRANGEBYSCORE', appKey, '-inf', cutoff)

-- 2. Count current elements
local userCount = redis.call('ZCARD', userKey)
local appCount = redis.call('ZCARD', appKey)

-- 3. Check user budget
if userCount >= userBudget then
    local oldest = redis.call('ZRANGE', userKey, 0, 0, 'WITHSCORES')
    local retryAfter = 1
    if oldest and #oldest >= 2 then
        local oldestScore = tonumber(oldest[2])
        retryAfter = math.max(1, math.ceil((oldestScore + windowMs - now) / 1000))
    end
    return { 0, retryAfter, appCount, userCount, 'user' }
end

-- 4. Check app budget
if appCount >= appBudget then
    local oldest = redis.call('ZRANGE', appKey, 0, 0, 'WITHSCORES')
    local retryAfter = 1
    if oldest and #oldest >= 2 then
        local oldestScore = tonumber(oldest[2])
        retryAfter = math.max(1, math.ceil((oldestScore + windowMs - now) / 1000))
    end
    return { 0, retryAfter, appCount, userCount, 'app' }
end

-- 5. Under budget: add entry to both sets and refresh TTL
redis.call('ZADD', userKey, now, member)
redis.call('ZADD', appKey, now, member)
redis.call('EXPIRE', userKey, expireSec)
redis.call('EXPIRE', appKey, expireSec)

return { 1, 0, appCount + 1, userCount + 1, '' }
`;

/**
 * Atomically reserves a rate limit slot for a Spotify request using SPOTIFY_RATE_LIMIT_LUA.
 * Mutually exclusive for GET cache-miss vs writes.
 * If Redis errors: fails open, logs one warning, and continues.
 */
export async function reserveSpotifyRateLimit(
  tokenHash: string,
  endpoint = ''
): Promise<SpotifyRateLimitResult> {
  if (!redis) {
    return { allowed: true, retryAfter: 0, appCount: 0, userCount: 0 };
  }

  const { windowSec, appBudget, userBudget } = getRateLimitConfig();
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const expireSec = windowSec + 5;
  const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;

  const p = keyPrefix();
  const userKey = `${p}spotify_rl:${tokenHash}`;
  const appKey = `${p}spotify_rl:app`;

  try {
    const res = await redis.eval<
      (number | string)[],
      [number, number, number, number, string]
    >(
      SPOTIFY_RATE_LIMIT_LUA,
      [userKey, appKey],
      [now, windowMs, userBudget, appBudget, member, expireSec]
    );

    const allowed = res[0] === 1;
    const retryAfter = typeof res[1] === 'number' ? res[1] : Number(res[1]) || 0;
    const appCount = typeof res[2] === 'number' ? res[2] : Number(res[2]) || 0;
    const userCount = typeof res[3] === 'number' ? res[3] : Number(res[3]) || 0;
    const limitType = res[4] === 'user' || res[4] === 'app' ? (res[4] as 'user' | 'app') : undefined;

    if (!allowed) {
      const countInWindow = limitType === 'user' ? userCount : appCount;
      console.warn(`[Rate Limiter] user-hash: ${tokenHash}, endpoint: ${endpoint}, count in window: ${countInWindow}`);
    }

    return {
      allowed,
      retryAfter,
      appCount,
      userCount,
      limitType,
    };
  } catch (error) {
    console.warn('[Rate Limiter] Redis error in limit(), failing open:', error);
    return { allowed: true, retryAfter: 0, appCount: 0, userCount: 0 };
  }
}

/**
 * Clears rate limiter keys in Redis (useful for test resets).
 * Test-only utility. Not imported by any route.
 */
export async function clearRateLimitKeys(tokenHash?: string): Promise<void> {
  if (!redis) return;
  try {
    const p = keyPrefix();
    const keys = [`${p}spotify_rl:app`];
    if (tokenHash) {
      keys.push(`${p}spotify_rl:${tokenHash}`);
    }
    if (typeof redis.del === 'function') {
      await redis.del(...keys).catch(() => {});
    }
    if (typeof redis.scan === 'function') {
      await deleteByPattern(`${p}spotify_rl*`);
    }
  } catch (error) {
    console.error('Redis error clearing rate limit keys:', error);
  }
}

/**
 * Deletes all Redis keys matching the given pattern using a SCAN loop
 * with MATCH and COUNT (default 100), deleting matching keys in batches.
 * Returns the total number of deleted keys.
 */
export async function deleteByPattern(pattern: string, count = 100): Promise<number> {
  if (!redis) return 0;
  let cursor: string | number = 0;
  let totalDeleted = 0;

  try {
    do {
      const scanRes: [string | number, string[]] = await redis.scan(cursor, {
        match: pattern,
        count,
      });
      cursor = scanRes[0];
      const keys = scanRes[1];
      if (keys && keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== 0 && cursor !== '0');
  } catch (error) {
    console.error(`Redis error deleting pattern ${pattern}:`, error);
  }

  return totalDeleted;
}
