import { cookies } from 'next/headers';
import { redis, hashToken, getSpotifyApiLock, setSpotifyApiLock } from './redis';

export type AuthUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'upstream' }
  | { ok: false; reason: 'rate_limited'; status: 429; retryAfter: number; error: string };

// In-memory cache per accessToken: token -> { userId, expiresAt }
// Avoids repeated external calls to Spotify /me for identical valid access tokens
interface CacheEntry {
  userId: string;
  expiresAt: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory
const REDIS_USER_CACHE_TTL_SEC = 3600; // 1 hour in Redis

/**
 * Derives the Spotify User ID server-side from the session cookie.
 * Does NOT refresh tokens (token refresh is handled exclusively by /api/spotify/session
 * to prevent refresh-token rotation race conditions).
 */
export async function getAuthenticatedSpotifyUserId(): Promise<AuthUserResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    return { ok: false, reason: 'unauthenticated' };
  }

  // 1. Check in-memory cache
  const cached = userCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, userId: cached.userId };
  }

  const tokenHash = hashToken(accessToken);
  const redisKey = `spotify_user:${tokenHash}`;

  // 2. Check Redis cache (User ID survives restarts - Requirement 2)
  if (redis) {
    try {
      const cachedUserId = await redis.get<string>(redisKey);
      if (cachedUserId && typeof cachedUserId === 'string') {
        userCache.set(accessToken, {
          userId: cachedUserId,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return { ok: true, userId: cachedUserId };
      }
    } catch (e) {
      console.error('[getAuthenticatedSpotifyUserId] Redis user cache read error:', e);
    }
  }

  // 3. Check Circuit Breaker lock before calling Spotify directly (Requirement 1)
  const lock = await getSpotifyApiLock();
  if (lock) {
    return {
      ok: false,
      reason: 'rate_limited',
      status: 429,
      retryAfter: lock.retryAfter,
      error: 'Too Many Requests (Circuit Breaker)',
    };
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (res.status === 401) {
      userCache.delete(accessToken);
      if (redis) {
        redis.del(redisKey).catch(() => {});
      }
      return { ok: false, reason: 'unauthenticated' };
    }

    // Handle 429: set circuit breaker lock and return 429 with retryAfter (Requirement 1)
    if (res.status === 429) {
      const retryAfterStr = res.headers?.get ? res.headers.get('Retry-After') : null;
      let retryAfter = retryAfterStr ? parseInt(retryAfterStr, 10) : 60;
      if (isNaN(retryAfter)) retryAfter = 60;
      await setSpotifyApiLock(retryAfter);
      return {
        ok: false,
        reason: 'rate_limited',
        status: 429,
        retryAfter,
        error: 'Too Many Requests',
      };
    }

    if (res.status >= 500) {
      return { ok: false, reason: 'upstream' };
    }

    if (!res.ok) {
      return { ok: false, reason: 'unauthenticated' };
    }

    const data = await res.json();
    const userId = data?.id;

    if (!userId || typeof userId !== 'string') {
      return { ok: false, reason: 'unauthenticated' };
    }

    // Cache the verified user ID in memory
    userCache.set(accessToken, {
      userId,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Cache in Redis for 1 hour (Requirement 2)
    if (redis) {
      redis.set(redisKey, userId, { ex: REDIS_USER_CACHE_TTL_SEC }).catch((err) => {
        console.error('[getAuthenticatedSpotifyUserId] Redis user cache write error:', err);
      });
    }

    return { ok: true, userId };
  } catch (err) {
    console.error('[getAuthenticatedSpotifyUserId] Network exception calling Spotify /me:', err);
    return { ok: false, reason: 'upstream' };
  }
}
