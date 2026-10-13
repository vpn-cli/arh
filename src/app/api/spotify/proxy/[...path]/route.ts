import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  redis,
  hashToken,
  getSpotifyApiLock,
  setSpotifyApiLock,
  reserveSpotifyRateLimit,
  deleteByPattern,
  keyPrefix,
} from '@/lib/server/redis';
import { recordUpstreamSpotifyRequest } from '@/lib/server/spotifyLogger';
import {
  inFlightGetRequests,
  InFlightResult,
} from '@/lib/server/spotifyInFlight';
import { isSpotifyMockMode, MOCK_USER_ID } from '@/mocks/spotify/config';
import tracksFixture from '@/mocks/spotify/fixtures/tracks.json';

export interface EndpointCacheRule {
  exact?: string;
  prefix?: string;
  ttl: number | null;
}

export const ENDPOINT_CACHE_RULES: EndpointCacheRule[] = [
  // me/player/queue: never cached in Redis
  { exact: 'me/player/queue', ttl: null },
  // me/top/tracks and me/top/artists: 6 hours (21600 seconds)
  { prefix: 'me/top/tracks', ttl: 21600 },
  { prefix: 'me/top/artists', ttl: 21600 },
  // me/player/recently-played: 60 seconds
  { prefix: 'me/player/recently-played', ttl: 60 },
  // Existing cached endpoints (1 hour = 3600 seconds)
  { exact: 'me', ttl: 3600 },
  { prefix: 'me/playlists', ttl: 3600 },
  { prefix: 'search', ttl: 3600 },
  { prefix: 'me/tracks', ttl: 3600 },
  { prefix: 'me/library', ttl: 3600 },
  { prefix: 'playlists/', ttl: 3600 },
];

export function getEndpointTtl(pathString: string): number | null {
  for (const rule of ENDPOINT_CACHE_RULES) {
    if (rule.exact !== undefined && pathString === rule.exact) {
      return rule.ttl;
    }
    if (rule.prefix !== undefined && pathString.startsWith(rule.prefix)) {
      return rule.ttl;
    }
  }
  return null;
}

export const _inFlightGetRequestsForTesting = inFlightGetRequests;

function toNextResponse(result: InFlightResult): NextResponse {
  if (result.isNoContent) {
    return new NextResponse(null, { status: 204 });
  }
  if (result.isJson) {
    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  }
  return new NextResponse(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: result.headers,
  });
}

async function executeUpstreamRequest(
  request: Request,
  spotifyUrl: string,
  accessToken: string,
  isCacheable: boolean,
  ttl: number | null,
  cacheKey: string,
  tokenHash: string,
  pathString: string,
  url: URL,
): Promise<InFlightResult> {
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

  recordUpstreamSpotifyRequest(spotifyUrl);
  const response = await fetch(spotifyUrl, options);

  // 4. Handle 401: return 401 directly so client wrapper's single-flight getFreshToken refreshes via /api/spotify/session
  if (response.status === 401) {
    console.warn(
      `[${new Date().toISOString()}] [Spotify Proxy] Upstream 401 Unauthorized for ${request.method} ${spotifyUrl}. Returning 401 to client.`,
    );
    return {
      status: 401,
      isJson: true,
      isNoContent: false,
      body: { error: 'Unauthorized' },
      headers: {},
    };
  }

  // Log status code and response body for every failed Spotify API call
  if (!response.ok && response.status !== 204) {
    const cloned =
      typeof response.clone === 'function' ? response.clone() : null;
    const bodyText = cloned ? await cloned.text().catch(() => '') : '';
    console.error(
      `[${new Date().toISOString()}] [Spotify API Failed] ${request.method} ${spotifyUrl} - Status: ${response.status}, Body:`,
      bodyText,
    );
  }

  // 5. Handle 403 (Pass directly to client, no retry)
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    console.error(
      `[Spotify API 403 Forbidden] URL: ${spotifyUrl}`,
      JSON.stringify(data, null, 2),
    );
    return {
      status: 403,
      isJson: true,
      isNoContent: false,
      body: data,
      headers: {},
    };
  }

  // 6. Handle 429 (Set Circuit Breaker)
  if (response.status === 429) {
    const retryAfterStr = response.headers.get('Retry-After');
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

  // 6b. Bust playlist and track cache after successful write operations
  if (
    response.ok &&
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    redis
  ) {
    const isLibraryPlaylistWrite =
      pathString === 'me/library' &&
      !!url.searchParams.get('uris')?.includes('spotify:playlist:');
    const isPlaylistWrite =
      pathString.startsWith('me/playlists') ||
      pathString.startsWith('playlists/') ||
      isLibraryPlaylistWrite;
    if (isPlaylistWrite) {
      try {
        // Bust playlist caches using SCAN pattern deletes
        await deleteByPattern(
          `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/playlists*`,
        );

        // Targeted cache invalidation for specific playlist operations
        let playlistId = null;
        const match = pathString.match(/^playlists\/([^/]+)/);
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
          await deleteByPattern(
            `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/playlists/${playlistId}*`,
          );
        }
      } catch (e: any) {
        console.error(
          'Redis error busting playlist cache:',
          e?.message || JSON.stringify(e),
        );
      }
    }

    const isTrackWrite =
      pathString.startsWith('me/tracks') ||
      (pathString.startsWith('me/library') && !isLibraryPlaylistWrite);
    if (isTrackWrite) {
      try {
        await deleteByPattern(
          `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/tracks*`,
        );
        await deleteByPattern(
          `${keyPrefix()}spotify_cache:${tokenHash}:https://api.spotify.com/v1/me/library/contains*`,
        );
      } catch (e: any) {
        console.error(
          'Redis error busting track cache:',
          e?.message || JSON.stringify(e),
        );
      }
    }
  }

  // 7. Parse and Cache Success Responses
  if (response.ok && isCacheable && ttl !== null) {
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (data) {
      if (redis) {
        redis.set(cacheKey, data, { ex: ttl }).catch(console.error);
        if (pathString === 'me' && data && data.id) {
          redis
            .set(`${keyPrefix()}spotify_user:${tokenHash}`, data.id, {
              ex: ttl,
            })
            .catch(console.error);
        }
      }
      return {
        status: 200,
        isJson: true,
        isNoContent: false,
        body: data,
        headers: { 'X-Cache': 'MISS' },
      };
    }
  }

  if (response.status === 204) {
    return {
      status: 204,
      isJson: false,
      isNoContent: true,
      body: null,
      headers: {},
    };
  }

  const responseContentType = response.headers?.get
    ? response.headers.get('content-type') || ''
    : '';
  if (responseContentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    const safeHeaders: Record<string, string> = {};
    response.headers?.forEach?.((value, key) => {
      if (
        key.toLowerCase() !== 'content-encoding' &&
        key.toLowerCase() !== 'transfer-encoding'
      ) {
        safeHeaders[key] = value;
      }
    });
    return {
      status: response.status,
      isJson: true,
      isNoContent: false,
      body: data,
      headers: safeHeaders,
    };
  }

  // Forward non-JSON or uncacheable responses
  const responseBody = await response.arrayBuffer();
  const safeHeaders: Record<string, string> = {};
  response.headers?.forEach?.((value, key) => {
    if (
      key.toLowerCase() !== 'content-encoding' &&
      key.toLowerCase() !== 'transfer-encoding'
    ) {
      safeHeaders[key] = value;
    }
  });

  return {
    status: response.status,
    statusText: response.statusText,
    isJson: false,
    isNoContent: false,
    body: responseBody,
    headers: safeHeaders,
  };
}

async function handleReq(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = new URL(request.url);

  // In mock mode: short-circuit allowlisted GET endpoints. Writes (POST/PUT/DELETE)
  // fall through to the 501 below — see handoff note re: me/player/play|pause.
  if (isSpotifyMockMode()) {
    if (request.method === 'GET') {
      if (pathString === 'me') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          id: MOCK_USER_ID,
          display_name: 'Mock User',
          product: 'premium',
        });
      }

      if (pathString === 'me/playlists') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      }

      if (pathString === 'me/player/recently-played') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          items: [],
          total: 0,
          limit: 50,
          cursors: null,
        });
      }

      if (pathString === 'me/tracks') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      }

      if (pathString === 'me/library/contains') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        const urisList = url.searchParams.getAll('uris');
        const idsList = url.searchParams.getAll('ids');
        const combined = [...urisList, ...idsList]
          .flatMap((s) => s.split(','))
          .filter(Boolean);
        const count = combined.length > 0 ? combined.length : 1;
        return NextResponse.json(new Array(count).fill(false));
      }

      if (pathString === 'me/top/tracks' || pathString === 'me/top/artists') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ items: [], total: 0, limit: 20, offset: 0 });
      }

      if (pathString === 'me/player/queue') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ currently_playing: null, queue: [] });
      }

      if (pathString === 'me/player/devices') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ devices: [] });
      }

      if (pathString === 'search') {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          tracks: { items: [], total: 0, limit: 20, offset: 0 },
        });
      }

      if (pathString.startsWith('albums/') && pathString.endsWith('/tracks')) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      }

      if (pathString.startsWith('albums/')) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          id: null,
          name: '',
          tracks: { items: [], total: 0, limit: 50, offset: 0 },
        });
      }

      if (pathString.startsWith('artists/') && pathString.endsWith('/albums')) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ items: [], total: 0, limit: 10, offset: 0 });
      }

      if (pathString.startsWith('artists/')) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({ id: null, name: '', images: [] });
      }

      if (
        pathString.startsWith('playlists/') &&
        pathString.endsWith('/items')
      ) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          items: [],
          total: 0,
          limit: 100,
          offset: 0,
        });
      }

      if (pathString.startsWith('playlists/')) {
        console.info('[Spotify Proxy] Mock served:', pathString);
        return NextResponse.json({
          id: null,
          name: '',
          tracks: { items: [], total: 0 },
        });
      }

      if (pathString.startsWith('tracks/')) {
        const trackId = pathString.slice('tracks/'.length);
        const track = (tracksFixture as Array<{ id: string }>).find(
          (t) => t.id === trackId,
        );
        if (track) {
          console.info('[Spotify Proxy] Mock served:', pathString);
          return NextResponse.json(track);
        }
        return NextResponse.json({ error: 'not found' }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'mock endpoint not implemented' },
      { status: 501 },
    );
  }

  const searchParams = new URLSearchParams(url.search);
  if (searchParams.has('limit')) {
    let limit = parseInt(searchParams.get('limit') || '', 10);
    if (!isNaN(limit)) {
      // February 2026: Search endpoint limit parameter maximum value is 10
      if (pathString.startsWith('search')) {
        limit = Math.min(Math.max(1, limit), 10);
      }
      searchParams.set('limit', limit.toString());
    } else {
      searchParams.delete('limit');
    }
  }
  searchParams.sort();
  const qs = searchParams.toString();
  const spotifyUrl = `https://api.spotify.com/v1/${pathString}${qs ? '?' + qs : ''}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokenHash = hashToken(accessToken);

  try {
    // 1. Check Circuit Breaker Lock
    const lock = await getSpotifyApiLock();
    if (lock) {
      return NextResponse.json(
        {
          error: 'Too Many Requests (Circuit Breaker)',
          retryAfter: lock.retryAfter,
        },
        { status: 429 },
      );
    }

    // 2. Check Cache for read-heavy endpoints (GET requests) BEFORE Rate Limiter
    // Cache hits must NEVER call the limiter, even when budget is exhausted.
    const endpointTtl =
      request.method === 'GET' ? getEndpointTtl(pathString) : null;
    const isCacheable = endpointTtl !== null;

    const cacheKey = `${keyPrefix()}spotify_cache:${tokenHash}:${spotifyUrl}`;
    if (isCacheable && redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return NextResponse.json(cachedData, {
            status: 200,
            headers: { 'X-Cache': 'HIT' },
          });
        }
      } catch (e) {
        console.error('Redis error checking cache:', e);
      }
    }

    // 3. Rate Limiter & Upstream Request Execution (with GET coalescing)
    if (request.method === 'GET') {
      let inFlight = inFlightGetRequests.get(cacheKey);
      if (!inFlight) {
        inFlight = (async () => {
          try {
            const limitRes = await reserveSpotifyRateLimit(
              tokenHash,
              pathString,
            );
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

            return await executeUpstreamRequest(
              request,
              spotifyUrl,
              accessToken,
              isCacheable,
              endpointTtl,
              cacheKey,
              tokenHash,
              pathString,
              url,
            );
          } finally {
            inFlightGetRequests.delete(cacheKey);
          }
        })();

        inFlightGetRequests.set(cacheKey, inFlight);
      }

      const result = await inFlight;
      return toNextResponse(result);
    } else {
      // Non-GET requests (PUT, POST, DELETE, etc.) - writes
      const limitRes = await reserveSpotifyRateLimit(tokenHash, pathString);
      if (!limitRes.allowed) {
        return NextResponse.json(
          {
            error: 'Too Many Requests (Rate Limit Exceeded)',
            source: 'local-limiter',
            retryAfter: limitRes.retryAfter,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(limitRes.retryAfter) },
          },
        );
      }

      const result = await executeUpstreamRequest(
        request,
        spotifyUrl,
        accessToken,
        isCacheable,
        endpointTtl,
        cacheKey,
        tokenHash,
        pathString,
        url,
      );
      return toNextResponse(result);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    // TODO: Sentry.captureException(error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export const GET = handleReq;
export const POST = handleReq;
export const PUT = handleReq;
export const PATCH = handleReq;
export const DELETE = handleReq;
