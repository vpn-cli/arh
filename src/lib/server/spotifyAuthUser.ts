import { cookies } from 'next/headers';
import {
  redis,
  hashToken,
  getSpotifyApiLock,
  setSpotifyApiLock,
  reserveSpotifyRateLimit,
  keyPrefix,
} from './redis';
import { inFlightGetRequests, InFlightResult } from './spotifyInFlight';
import { recordUpstreamSpotifyRequest } from './spotifyLogger';

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
 *
 * Coalesces with proxy /me requests via inFlightGetRequests and shares Redis cache
 * to ensure an upstream request is never counted twice against the rate limiter.
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
  const prefix = keyPrefix();
  const redisKey = `${prefix}spotify_user:${tokenHash}`;
  const meCacheKey = `${prefix}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me`;

  // 2. Check Redis cache (User ID survives restarts, or proxy /me cache)
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

      // Check if proxy already cached /me in Redis
      const cachedMe = await redis.get<any>(meCacheKey);
      if (cachedMe && typeof cachedMe === 'object' && cachedMe.id) {
        userCache.set(accessToken, {
          userId: cachedMe.id,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return { ok: true, userId: cachedMe.id };
      }
    } catch (e) {
      console.error('[getAuthenticatedSpotifyUserId] Redis user cache read error:', e);
    }
  }

  // 3. Check if there is already an in-flight request for /me (from proxy or concurrent call)
  const existingInFlight = inFlightGetRequests.get(meCacheKey);
  if (existingInFlight) {
    try {
      const result = await existingInFlight;
      if (result.status === 200 && result.body?.id) {
        userCache.set(accessToken, {
          userId: result.body.id,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return { ok: true, userId: result.body.id };
      }
    } catch (e) {
      // Fall through if in-flight failed
    }
  }

  // 4. Check Circuit Breaker lock before calling Spotify directly
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

  // 5. Coalesce this fetch so any concurrent proxy GET /me or auth call waits for it
  const fetchPromise = (async (): Promise<InFlightResult> => {
    try {
      // Rate Limiter check on cache miss
      const limitRes = await reserveSpotifyRateLimit(tokenHash, '/me');
      if (!limitRes.allowed) {
        return {
          status: 429,
          isJson: true,
          isNoContent: false,
          body: {
            error: 'Too Many Requests (Rate Limit Exceeded)',
            source: 'local-limiter',
            retryAfter: limitRes.retryAfter,
          },
          headers: { 'Retry-After': String(limitRes.retryAfter) },
        };
      }

      recordUpstreamSpotifyRequest('https://api.spotify.com/v1/me');
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        userCache.delete(accessToken);
        if (redis) {
          redis.del(redisKey).catch(() => {});
        }
        return {
          status: 401,
          isJson: true,
          isNoContent: false,
          body: { error: 'Unauthorized' },
          headers: {},
        };
      }

      // Handle 429: set circuit breaker lock and return 429 with retryAfter
      if (res.status === 429) {
        const retryAfterStr = res.headers?.get ? res.headers.get('Retry-After') : null;
        let retryAfter = retryAfterStr ? parseInt(retryAfterStr, 10) : 60;
        if (isNaN(retryAfter)) retryAfter = 60;
        await setSpotifyApiLock(retryAfter);
        return {
          status: 429,
          isJson: true,
          isNoContent: false,
          body: { error: 'Too Many Requests', retryAfter },
          headers: { 'Retry-After': String(retryAfter) },
        };
      }

      if (res.status >= 500) {
        return {
          status: res.status,
          isJson: false,
          isNoContent: false,
          body: null,
          headers: {},
        };
      }

      if (!res.ok) {
        return {
          status: res.status,
          isJson: false,
          isNoContent: false,
          body: null,
          headers: {},
        };
      }

      const data = await res.json();
      return {
        status: 200,
        isJson: true,
        isNoContent: false,
        body: data,
        headers: {},
      };
    } finally {
      inFlightGetRequests.delete(meCacheKey);
    }
  })();

  inFlightGetRequests.set(meCacheKey, fetchPromise);

  try {
    const inFlightResult = await fetchPromise;

    if (inFlightResult.status === 401) {
      return { ok: false, reason: 'unauthenticated' };
    }

    if (inFlightResult.status === 429) {
      return {
        ok: false,
        reason: 'rate_limited',
        status: 429,
        retryAfter: inFlightResult.body?.retryAfter || 60,
        error: inFlightResult.body?.error || 'Too Many Requests',
      };
    }

    if (inFlightResult.status >= 500) {
      return { ok: false, reason: 'upstream' };
    }

    if (inFlightResult.status !== 200) {
      return { ok: false, reason: 'unauthenticated' };
    }

    const userId = inFlightResult.body?.id;
    if (!userId || typeof userId !== 'string') {
      return { ok: false, reason: 'unauthenticated' };
    }

    // Cache the verified user ID in memory
    userCache.set(accessToken, {
      userId,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Cache in Redis for 1 hour
    if (redis) {
      redis.set(redisKey, userId, { ex: REDIS_USER_CACHE_TTL_SEC }).catch((err) => {
        console.error('[getAuthenticatedSpotifyUserId] Redis user cache write error:', err);
      });
      redis.set(meCacheKey, inFlightResult.body, { ex: REDIS_USER_CACHE_TTL_SEC }).catch((err) => {
        console.error('[getAuthenticatedSpotifyUserId] Redis /me cache write error:', err);
      });
    }

    return { ok: true, userId };
  } catch (err) {
    inFlightGetRequests.delete(meCacheKey);
    console.error('[getAuthenticatedSpotifyUserId] Network exception calling Spotify /me:', err);
    return { ok: false, reason: 'upstream' };
  }
}
