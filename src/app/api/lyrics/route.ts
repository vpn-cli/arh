import { NextRequest, NextResponse } from 'next/server';
import { parseLrc, detectLyrics, stripTimestamps } from '@/lib/lyrics';
import { lookupLyrics, getArtistNames } from '@/lib/lyricsLookup';
import { db, lyricsCache } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
export const SERVER_UPSTREAM_COOLDOWN_MS = 60 * 1000;
const upstreamErrorCooldown = new Map<string, { timestamp: number; error: string }>();

export function clearUpstreamErrorCooldown() {
  upstreamErrorCooldown.clear();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trackId = searchParams.get('trackId');
  const isRefresh = searchParams.get('refresh') === 'true';

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
          status: row.instrumental ? 'instrumental' : 'found',
          synced: row.synced ? parseLrc(row.synced) : null,
          plain: row.plain || null,
          instrumental: row.instrumental,
          source: 'manual',
          notFound: false,
          offsetMs: row.offsetMs ?? 0,
        });
      }

      // Check if negative (not_found) cache is still valid (< 7 days)
      if (row.source === 'not_found') {
        const age = Date.now() - new Date(row.fetchedAt).getTime();
        // If refresh requested, enforce a 10-minute rate limit per track
        if (isRefresh && age < TEN_MINUTES_MS) {
          console.log(`[Lyrics Cache] RATE-LIMITED refresh for track "${trackId}" (last checked ${Math.round(age / 1000)}s ago)`);
          return NextResponse.json({
            status: 'not_found',
            synced: null,
            plain: null,
            instrumental: false,
            source: 'not_found',
            notFound: true,
            step: 'none',
            offsetMs: row.offsetMs ?? 0,
          });
        }

        if (!isRefresh && age < SEVEN_DAYS_MS) {
          console.log(`[Lyrics Cache] HIT for track "${trackId}" (source: not_found, cached)`);
          return NextResponse.json({
            status: 'not_found',
            synced: null,
            plain: null,
            instrumental: false,
            source: 'not_found',
            notFound: true,
            step: 'none',
            offsetMs: row.offsetMs ?? 0,
          });
        }
        console.log(`[Lyrics Cache] ${isRefresh ? 'FORCED REFRESH' : 'EXPIRED negative cache'} for track "${trackId}" -> retrying lookup`);
      } else if (row.source === 'lrclib') {
        console.log(`[Lyrics Cache] HIT for track "${trackId}" (source: lrclib)`);
        return NextResponse.json({
          status: row.instrumental ? 'instrumental' : 'found',
          synced: row.synced ? parseLrc(row.synced) : null,
          plain: row.plain || null,
          instrumental: row.instrumental,
          source: 'lrclib',
          notFound: false,
          offsetMs: row.offsetMs ?? 0,
        });
      }
    }

    console.log(`[Lyrics Cache] MISS for track "${trackId}"`);

    // Check server-side in-memory cooldown for upstream errors (e.g. LRCLIB 5xx, 429, timeouts)
    const cooldownEntry = upstreamErrorCooldown.get(trackId);
    if (!isRefresh && cooldownEntry) {
      if (Date.now() - cooldownEntry.timestamp < SERVER_UPSTREAM_COOLDOWN_MS) {
        console.warn(`[Lyrics Upstream Cooldown] Track "${trackId}" is in server cooldown (${Math.round((SERVER_UPSTREAM_COOLDOWN_MS - (Date.now() - cooldownEntry.timestamp)) / 1000)}s remaining). Skipping LRCLIB.`);
        return NextResponse.json({
          status: 'upstream_error',
          synced: null,
          plain: null,
          instrumental: false,
          source: null,
          notFound: false,
          step: 'none',
          error: `LRCLIB upstream cooldown: ${cooldownEntry.error}`,
        }, { status: 503 });
      }
      upstreamErrorCooldown.delete(trackId);
    }

    // 2. Fetch Track details (from query params if provided, or from Spotify API via proxy)
    let trackName = searchParams.get('title') || searchParams.get('track_name');
    let artistName = searchParams.get('artist') || searchParams.get('artist_name');
    let primaryArtistName = searchParams.get('primaryArtist') || searchParams.get('primary_artist') || undefined;
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
      const resolvedArtists = getArtistNames(track);
      artistName = resolvedArtists.full;
      if (!primaryArtistName) {
        primaryArtistName = resolvedArtists.primary;
      }
      trackName = track.name;
      albumName = track.album?.name;
      durationSec = Math.round((track.duration_ms || 0) / 1000);
    }

    if (!artistName || !trackName) {
      return NextResponse.json({ error: 'Invalid track data' }, { status: 400 });
    }

    // 3. Execute 4-step lookup chain (a, b, c, d)
    const { result, matchedStep, hasUpstreamError, upstreamError, lrclibRecordId } = await lookupLyrics({
      trackId,
      title: trackName,
      artist: artistName,
      primaryArtist: primaryArtistName,
      album: albumName,
      durationSec,
    });

    // 4. Cache results in Neon
    if (result) {
      upstreamErrorCooldown.delete(trackId);
      console.log(`[Lyrics Lookup] Track "${trackName}" (${trackId}) by "${artistName}": matched step ${matchedStep} (LRCLIB record id: ${lrclibRecordId ?? 'none'})`);
      const [savedRow] = await db
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
        })
        .returning({ offsetMs: lyricsCache.offsetMs });

      return NextResponse.json({
        status: result.instrumental ? 'instrumental' : 'found',
        synced: result.syncedLyrics ? parseLrc(result.syncedLyrics) : null,
        plain: result.plainLyrics,
        instrumental: result.instrumental,
        source: 'lrclib',
        notFound: false,
        step: matchedStep,
        offsetMs: savedRow?.offsetMs ?? 0,
      });
    }

    // If an upstream error occurred (timeout, 429, 5xx), NEVER cache as not_found!
    if (hasUpstreamError) {
      console.warn(`[Lyrics Lookup] Track "${trackName}" (${trackId}): upstream error (${upstreamError}). NOT caching as not_found.`);
      upstreamErrorCooldown.set(trackId, {
        timestamp: Date.now(),
        error: upstreamError || 'upstream_error',
      });
      const statusCode = upstreamError === 'rate_limited' ? 429 : 503;
      return NextResponse.json({
        status: 'upstream_error',
        synced: null,
        plain: null,
        instrumental: false,
        source: null,
        notFound: false,
        step: 'none',
        error: `LRCLIB upstream failure: ${upstreamError}`,
      }, { status: statusCode });
    }

    upstreamErrorCooldown.delete(trackId);

    // Clean "no results" response: safe to negative cache for 7 days
    console.log(`[Lyrics Lookup] Track "${trackName}" (${trackId}) by "${artistName}": matched step none (clean not found, LRCLIB record id: none) -> caching as not_found`);
    const [savedRow] = await db
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
      })
      .returning({ offsetMs: lyricsCache.offsetMs });

    return NextResponse.json({
      status: 'not_found',
      synced: null,
      plain: null,
      instrumental: false,
      source: 'not_found',
      notFound: true,
      step: 'none',
      offsetMs: savedRow?.offsetMs ?? 0,
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
    const { trackId, lyrics, durationMs, forcePlain } = body;

    if (!trackId || typeof lyrics !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: trackId and lyrics string are required' }, { status: 400 });
    }

    const trimmedLyrics = lyrics.trim();
    if (!trimmedLyrics) {
      return NextResponse.json({ error: 'Lyrics cannot be empty' }, { status: 400 });
    }

    let synced: string | null = null;
    let plain: string = trimmedLyrics;
    let warning: string | undefined = undefined;

    if (forcePlain) {
      plain = stripTimestamps(trimmedLyrics);
      synced = null;
    } else {
      const effectiveDurationMs = typeof durationMs === 'number' && !isNaN(durationMs) ? durationMs : undefined;
      const detection = detectLyrics(trimmedLyrics, effectiveDurationMs);

      if (detection.type === 'plain') {
        synced = null;
        plain = detection.plainText;
      } else if (detection.isValid) {
        synced = detection.lrcText;
        plain = detection.plainText;
      } else {
        // Validation failed: save as plain text with timestamps stripped, and report warning
        synced = null;
        plain = detection.plainText || stripTimestamps(trimmedLyrics);
        warning = detection.validationError || 'Timestamps failed validation and were saved as plain text';
      }
    }

    const [savedRow] = await db
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
      })
      .returning({ offsetMs: lyricsCache.offsetMs });

    console.log(`[Lyrics Manual] Saved manual lyrics for track ${trackId} (synced: ${Boolean(synced)}, warning: ${warning || 'none'})`);
    upstreamErrorCooldown.delete(trackId);

    return NextResponse.json({
      success: true,
      source: 'manual',
      synced: synced ? parseLrc(synced) : null,
      plain,
      instrumental: false,
      notFound: false,
      offsetMs: savedRow?.offsetMs ?? 0,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error('Error saving manual lyrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const { trackId, offsetMs } = body;

    if (!trackId || typeof trackId !== 'string' || typeof offsetMs !== 'number' || isNaN(offsetMs)) {
      return NextResponse.json({ error: 'Invalid payload: trackId string and offsetMs number are required' }, { status: 400 });
    }

    const clampedOffset = Math.max(-5000, Math.min(5000, Math.round(offsetMs)));

    await db
      .insert(lyricsCache)
      .values({
        spotifyId: trackId,
        source: 'manual',
        offsetMs: clampedOffset,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lyricsCache.spotifyId,
        set: {
          offsetMs: clampedOffset,
        },
      });

    console.log(`[Lyrics Offset] Updated offset for track "${trackId}" to ${clampedOffset}ms`);

    return NextResponse.json({
      success: true,
      trackId,
      offsetMs: clampedOffset,
    });
  } catch (error) {
    console.error('Error updating lyrics offset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
