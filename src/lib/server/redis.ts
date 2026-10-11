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

export const SPOTIFY_LOCK_KEY = 'spotify_api_lock';

/**
 * Computes a SHA-256 hex digest of a token string to avoid storing raw tokens in Redis keys.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Checks whether the Spotify API circuit breaker is currently active.
 * Returns null if not locked, or { locked: true, retryAfter: number } if locked.
 */
export async function getSpotifyApiLock(): Promise<{ locked: boolean; retryAfter: number } | null> {
  if (!redis) return null;
  try {
    const isLocked = await redis.get(SPOTIFY_LOCK_KEY);
    if (isLocked) {
      const ttl = await redis.ttl(SPOTIFY_LOCK_KEY);
      return { locked: true, retryAfter: Math.max(1, ttl) };
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
    const ex = Math.max(1, retryAfterSeconds);
    await redis.set(SPOTIFY_LOCK_KEY, 'locked', { ex });
  } catch (e) {
    console.error('Redis error setting circuit breaker (spotify_api_lock):', e);
  }
}
