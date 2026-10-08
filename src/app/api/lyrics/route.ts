import { NextRequest, NextResponse } from 'next/server';
import { parseLrc, LyricLine } from '@/lib/lyrics';
import { lookupLyrics, extractPlainFromLrc } from '@/lib/lyricsLookup';
import { db, lyricsCache } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
  }

  try {
    // 1. Check Neon Database Cache
    const cachedRows = await db
      .select()
      .from(lyricsCache)
      .where(eq(lyricsCache.spotifyId, trackId))
      .limit(1);

    if (cachedRows.length > 0) {
      const row = cachedRows[0];

      // Manual entries ALWAYS win and are NEVER overwritten
      if (row.source === 'manual') {
        console.log(`[Lyrics Cache] HIT for track "${trackId}" (source: manual)`);
        return NextResponse.json({
          synced: row.synced ? parseLrc(row.synced) : null,
          plain: row.plain || null,
          instrumental: row.instrumental,
          source: 'manual',
          notFound: false,
        });
      }

      // Check if negative (not_found) cache is still valid (< 7 days)
      if (row.source === 'not_found') {
        const age = Date.now() - new Date(row.fetchedAt).getTime();
        if (age < SEVEN_DAYS_MS) {
          console.log(`[Lyrics Cache] HIT for track "${trackId}" (source: not_found, cached)`);
          return NextResponse.json({
            synced: null,
            plain: null,
            instrumental: false,
            source: 'not_found',
            notFound: true,
          });
        }
        console.log(`[Lyrics Cache] EXPIRED negative cache for track "${trackId}" (> 7 days) -> retrying lookup`);
        // If older than 7 days, proceed to re-query LRCLIB
      } else if (row.source === 'lrclib') {
        console.log(`[Lyrics Cache] HIT for track "${trackId}" (source: lrclib)`);
        return NextResponse.json({
          synced: row.synced ? parseLrc(row.synced) : null,
          plain: row.plain || null,
          instrumental: row.instrumental,
          source: 'lrclib',
          notFound: false,
        });
      }
    }

    console.log(`[Lyrics Cache] MISS for track "${trackId}"`);

    // 2. Fetch Track details (from query params if provided, or from Spotify API via proxy)
    let trackName = searchParams.get('title') || searchParams.get('track_name');
    let artistName = searchParams.get('artist') || searchParams.get('artist_name');
    let albumName = searchParams.get('album') || searchParams.get('album_name') || undefined;
    const durParam = searchParams.get('duration');
    let durationSec = durParam ? parseInt(durParam, 10) : 0;

    if (!trackName || !artistName) {
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
      artistName = track.artists?.[0]?.name;
      trackName = track.name;
      albumName = track.album?.name;
      durationSec = Math.round((track.duration_ms || 0) / 1000);
    }

    if (!artistName || !trackName) {
      return NextResponse.json({ error: 'Invalid track data' }, { status: 400 });
    }

    // 3. Execute 4-step lookup chain (a, b, c, d)
    const { result, matchedStep, hasUpstreamError, upstreamError } = await lookupLyrics({
      trackId,
      title: trackName,
      artist: artistName,
      album: albumName,
      durationSec,
    });

    // 4. Cache results in Neon
    if (result) {
      console.log(`[Lyrics Lookup] Track "${trackName}" (${trackId}) by "${artistName}": matched step ${matchedStep}`);
      await db
        .insert(lyricsCache)
        .values({
          spotifyId: trackId,
          source: 'lrclib',
          synced: result.syncedLyrics,
          plain: result.plainLyrics,
          instrumental: result.instrumental,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: lyricsCache.spotifyId,
          set: {
            source: 'lrclib',
            synced: result.syncedLyrics,
            plain: result.plainLyrics,
            instrumental: result.instrumental,
            fetchedAt: new Date(),
          },
          where: sql`${lyricsCache.source} != 'manual'`,
        });

      return NextResponse.json({
        synced: result.syncedLyrics ? parseLrc(result.syncedLyrics) : null,
        plain: result.plainLyrics,
        instrumental: result.instrumental,
        source: 'lrclib',
        notFound: false,
        step: matchedStep,
      });
    }

    // If an upstream error occurred (timeout, 429, 5xx), NEVER cache as not_found!
    if (hasUpstreamError) {
      console.warn(`[Lyrics Lookup] Track "${trackName}" (${trackId}): upstream error (${upstreamError}). NOT caching as not_found.`);
      return NextResponse.json({
        synced: null,
        plain: null,
        instrumental: false,
        source: null,
        notFound: true,
        step: 'none',
        error: `LRCLIB upstream failure: ${upstreamError}`,
      }, { status: 503 });
    }

    // Clean "no results" response: safe to negative cache for 7 days
    console.log(`[Lyrics Lookup] Track "${trackName}" (${trackId}) by "${artistName}": matched step none (clean not found) -> caching as not_found`);
    await db
      .insert(lyricsCache)
      .values({
        spotifyId: trackId,
        source: 'not_found',
        synced: null,
        plain: null,
        instrumental: false,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lyricsCache.spotifyId,
        set: {
          source: 'not_found',
          synced: null,
          plain: null,
          instrumental: false,
          fetchedAt: new Date(),
        },
        where: sql`${lyricsCache.source} != 'manual'`,
      });

    return NextResponse.json({
      synced: null,
      plain: null,
      instrumental: false,
      source: 'not_found',
      notFound: true,
      step: 'none',
    });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.SCRAPBOOK_ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json({ error: 'Server misconfiguration: SCRAPBOOK_ADMIN_SECRET is unset' }, { status: 500 });
    }

    const secret = req.headers.get('x-scrapbook-secret');
    if (secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { trackId, lyrics } = body;

    if (!trackId || typeof lyrics !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: trackId and lyrics string are required' }, { status: 400 });
    }

    const trimmedLyrics = lyrics.trim();
    if (!trimmedLyrics) {
      return NextResponse.json({ error: 'Lyrics cannot be empty' }, { status: 400 });
    }

    // Check if input has LRC timestamps e.g. [01:23.45]
    const isLrc = /\[\d{2}:\d{2}(?:\.\d{2,3})?\]/.test(trimmedLyrics);
    const synced = isLrc ? trimmedLyrics : null;
    const plain = isLrc ? extractPlainFromLrc(trimmedLyrics) : trimmedLyrics;

    await db
      .insert(lyricsCache)
      .values({
        spotifyId: trackId,
        source: 'manual',
        synced,
        plain,
        instrumental: false,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lyricsCache.spotifyId,
        set: {
          source: 'manual',
          synced,
          plain,
          instrumental: false,
          fetchedAt: new Date(),
        },
      });

    console.log(`[Lyrics Manual] Saved manual lyrics for track ${trackId} (isLrc: ${isLrc})`);

    return NextResponse.json({
      success: true,
      source: 'manual',
      synced: synced ? parseLrc(synced) : null,
      plain,
      instrumental: false,
      notFound: false,
    });
  } catch (error) {
    console.error('Error saving manual lyrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
