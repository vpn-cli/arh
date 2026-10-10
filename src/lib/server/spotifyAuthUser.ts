import { cookies } from 'next/headers';

export type AuthUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'upstream' };

// In-memory cache per accessToken: token -> { userId, expiresAt }
// Avoids repeated external calls to Spotify /me for identical valid access tokens
interface CacheEntry {
  userId: string;
  expiresAt: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

  // Check in-memory cache
  const cached = userCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, userId: cached.userId };
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (res.status === 401) {
      userCache.delete(accessToken);
      return { ok: false, reason: 'unauthenticated' };
    }

    if (res.status === 429 || res.status >= 500) {
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

    // Cache the verified user ID for this access token
    userCache.set(accessToken, {
      userId,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return { ok: true, userId };
  } catch (err) {
    console.error('[getAuthenticatedSpotifyUserId] Network exception calling Spotify /me:', err);
    return { ok: false, reason: 'upstream' };
  }
}
