import { NextRequest, NextResponse } from 'next/server';
import { parseLrc, LyricLine } from '@/lib/lyrics';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'todo';
const redis = isRedisConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null;

const CACHE_TTL_SUCCESS = 60 * 60 * 24 * 30; // 30 days
const CACHE_TTL_404 = 60 * 60 * 24; // 1 day

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
  }

  const cacheKey = `lyrics:${trackId}`;

  try {
    // 1. Check Redis Cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // If it's a cached 404
        if (cached === '404') {
          return NextResponse.json({ synced: null, plain: null });
        }
        return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    }

    // 2. Fetch Track details from Spotify API via proxy
    const proxyUrl = new URL(`/api/spotify/proxy/tracks/${trackId}`, request.url);
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

    const spotifyRes = await fetch(proxyUrl, {
      headers: { 'Cookie': cookieHeader }
    });

    if (!spotifyRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch track from Spotify' }, { status: spotifyRes.status });
    }

    const track = await spotifyRes.json();
    const artistName = track.artists?.[0]?.name;
    const trackName = track.name;
    const durationSec = Math.round(track.duration_ms / 1000);

    if (!artistName || !trackName) {
      return NextResponse.json({ error: 'Invalid track data' }, { status: 400 });
    }

    // 3. Query LRCLIB
    const queryParams = new URLSearchParams();
    queryParams.append('artist_name', artistName);
    queryParams.append('track_name', trackName);
    queryParams.append('duration', durationSec.toString());

    const lrclibRes = await fetch(`https://lrclib.net/api/get?${queryParams.toString()}`, {
      headers: {
        'User-Agent': 'Arh-Music-Player (https://github.com/vipin/arh)'
      }
    });

    if (!lrclibRes.ok) {
      if (lrclibRes.status === 404 && redis) {
        await redis.set(cacheKey, '404', { ex: CACHE_TTL_404 });
      }
      return NextResponse.json({ synced: null, plain: null });
    }

    const data = await lrclibRes.json();
    
    const result = { synced: null as LyricLine[] | null, plain: null as string | null };

    if (data && data.syncedLyrics) {
      result.synced = parseLrc(data.syncedLyrics);
      result.plain = data.plainLyrics || null;
    } else if (data && data.plainLyrics) {
      result.plain = data.plainLyrics;
    }

    // 4. Cache successful result
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL_SUCCESS });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
