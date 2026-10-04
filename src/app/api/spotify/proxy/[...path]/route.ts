import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'todo';
const redis = isRedisConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null;

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

async function refreshAccessToken(refreshToken: string, redirectUri: string) {
  const payload = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  };

  const body = await fetch("https://accounts.spotify.com/api/token", payload);
  if (!body.ok) {
    const errorText = await body.text();
    console.error("Token refresh failed with status", body.status, "and body:", errorText);
    return null;
  }
  const response = await body.json();
  return response;
}

async function handleReq(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = new URL(request.url);
  const spotifyUrl = `https://api.spotify.com/v1/${pathString}${url.search}`;

  const cookieStore = await cookies();
  let accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If we have no access token but we have a refresh token, we want to trigger the 401 refresh flow below.
  // Sending 'Bearer undefined' might cause a 400 Bad Request instead of 401 Unauthorized.
  if (!accessToken && refreshToken) {
    accessToken = 'invalid_token';
  }

  try {
    // 1. Check Circuit Breaker
    if (redis) {
      try {
        const isLocked = await redis.get('spotify_api_lock');
        if (isLocked) {
          const ttl = await redis.ttl('spotify_api_lock');
          return NextResponse.json({ error: 'Too Many Requests (Circuit Breaker)', retryAfter: Math.max(1, ttl) }, { status: 429 });
        }
      } catch (e) {
        console.error("Redis error checking circuit breaker:", e);
      }
    }

    // 2. Check Cache for read-heavy endpoints (GET requests)
    const isCacheable = request.method === 'GET' && 
      (pathString.startsWith('me/playlists') || 
       pathString.startsWith('search') || 
       pathString.startsWith('me/tracks') ||
       pathString.startsWith('me/library') ||
       pathString.startsWith('playlists/'));
       
    const cacheKey = `spotify_cache:${accessToken}:${spotifyUrl}`;
    if (isCacheable && redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return NextResponse.json(cachedData, { status: 200, headers: { 'X-Cache': 'HIT' } });
        }
      } catch (e) {
        console.error("Redis error checking cache:", e);
      }
    }

    // 3. Make Spotify Request
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accessToken}`);
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const options: RequestInit = {
      method: request.method,
      headers,
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) options.body = body;
    }

    let response = await fetch(spotifyUrl, options);

    // 4. Handle 401 (Exactly one refresh attempt)
    if (response.status === 401 && refreshToken) {
      const host = url.host;
      const protocol = url.protocol;
      const redirectUri = `${protocol}//${host}/api/spotify/callback`; // Even though refresh doesn't strictly need it, it's good practice.
      
      const newTokens = await refreshAccessToken(refreshToken, redirectUri);
      if (newTokens && newTokens.access_token) {
        // Update cookie
        cookieStore.set('spotify_access_token', newTokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: newTokens.expires_in,
        });
        if (newTokens.refresh_token) {
          cookieStore.set('spotify_refresh_token', newTokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        }
        
        // Retry exact same request with new token
        headers.set('Authorization', `Bearer ${newTokens.access_token}`);
        options.headers = headers;
        response = await fetch(spotifyUrl, options);
      } else {
        // Token refresh failed, clear cookies and return 401
        cookieStore.delete('spotify_access_token');
        cookieStore.delete('spotify_refresh_token');
        return NextResponse.json({ error: 'Unauthorized (Session Expired)' }, { status: 401 });
      }
    }

    // 5. Handle 403 (Pass directly to client, no retry)
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      console.error(`[Spotify API 403 Forbidden] URL: ${spotifyUrl}`, JSON.stringify(data, null, 2));
      return NextResponse.json(data, { status: 403 });
    }

    // 6. Handle 429 (Set Circuit Breaker)
    if (response.status === 429) {
      const retryAfterStr = response.headers.get('Retry-After');
      let retryAfter = retryAfterStr ? parseInt(retryAfterStr, 10) : 60;
      if (isNaN(retryAfter)) retryAfter = 60;
      
      if (redis) {
        try {
          await redis.set('spotify_api_lock', 'locked', { ex: retryAfter });
        } catch (e) {
          console.error("Redis error setting circuit breaker:", e);
        }
      }
      
      return NextResponse.json({ error: 'Too Many Requests', retryAfter }, { status: 429 });
    }

    // 6b. Bust playlist cache after successful write operations
    if (response.ok && request.method !== 'GET' && request.method !== 'HEAD' && redis) {
      const isLibraryPlaylistWrite = pathString === 'me/library' && !!url.searchParams.get('uris')?.includes('spotify:playlist:');
      const isPlaylistWrite = pathString.startsWith('me/playlists') || pathString.startsWith('playlists/') || isLibraryPlaylistWrite;
      if (isPlaylistWrite) {
        try {
          // Delete the cached GET /me/playlists response so the next fetch gets fresh data
          const playlistCacheUrl = `https://api.spotify.com/v1/me/playlists`;
          const playlistCacheKey = `spotify_cache:${accessToken}:${playlistCacheUrl}`;
          await redis.del(playlistCacheKey);

          // Targeted cache invalidation for specific playlist operations
          // Match playlists/{playlist_id} or playlists/{playlist_id}/items
          let playlistId = null;
          const match = pathString.match(/^playlists\/([^\/]+)/);
          if (match && match[1]) {
            playlistId = match[1];
          } else if (isLibraryPlaylistWrite) {
            const uris = url.searchParams.get('uris');
            const pMatch = uris?.match(/spotify:playlist:([^,&]+)/);
            if (pMatch && pMatch[1]) {
              playlistId = pMatch[1];
            }
          }

          if (playlistId) {
            const pattern = `spotify_cache:${accessToken}:https://api.spotify.com/v1/playlists/${playlistId}*`;
            const keys = await redis.keys(pattern);
            if (keys && keys.length > 0) {
              await redis.del(...keys);
            }
          }
        } catch (e) {
          console.error("Redis error busting playlist cache:", e);
        }
      }
    }

    // 7. Parse and Cache Success Responses
    if (response.ok && isCacheable) {
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }
      if (data) {
        // Asynchronously write to Redis
        if (redis) redis.set(cacheKey, data, { ex: CACHE_TTL }).catch(console.error);
        return NextResponse.json(data, { status: 200, headers: { 'X-Cache': 'MISS' } });
      }
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Forward non-JSON or uncacheable responses (use the unconsumed response)
    const responseBody = await response.arrayBuffer();
    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy safe headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
        proxyResponse.headers.set(key, value);
      }
    });

    return proxyResponse;

  } catch (error: any) {
    console.error("Proxy error:", error);
    // TODO: Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}

export const GET = handleReq;
export const POST = handleReq;
export const PUT = handleReq;
export const PATCH = handleReq;
export const DELETE = handleReq;
