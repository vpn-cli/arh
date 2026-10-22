import { describe, it, expect, afterEach } from 'vitest';
import {
  cleanTrackTitle,
  getPrimaryArtist,
  isCloseMatch,
  pickBestSearchResult,
  processCandidateLyrics,
  extractPlainFromLrc,
  LrclibTrack
} from '../lyricsLookup';

describe('lyricsLookup title and artist cleaners', () => {
  it('cleans track titles properly', () => {
    expect(cleanTrackTitle('Levitating (feat. DaBaby)')).toBe('Levitating');
    expect(cleanTrackTitle('Industry Baby (feat. Jack Harlow) - Radio Edit')).toBe('Industry Baby');
    expect(cleanTrackTitle('Rocket Man - Remastered 2014')).toBe('Rocket Man');
    expect(cleanTrackTitle('Yellow - Live at Glastonbury')).toBe('Yellow');
    expect(cleanTrackTitle('Wonderwall - Single Version')).toBe('Wonderwall');
    expect(cleanTrackTitle('Hotel California - 2013 Remaster')).toBe('Hotel California');
    expect(cleanTrackTitle('Something [with Justin Bieber]')).toBe('Something');
    expect(cleanTrackTitle('Shape of You')).toBe('Shape of You');
  });

  it('extracts primary artist correctly', () => {
    expect(getPrimaryArtist('Coldplay feat. BTS')).toBe('Coldplay');
    expect(getPrimaryArtist('Drake with Future')).toBe('Drake');
    expect(getPrimaryArtist('Taylor Swift, Bon Iver')).toBe('Taylor Swift');
    expect(getPrimaryArtist('The Beatles')).toBe('The Beatles');
    expect(getPrimaryArtist([{ name: 'Post Malone' }, { name: 'Swae Lee' }])).toBe('Post Malone');
  });
});

describe('lyricsLookup isCloseMatch', () => {
  it('matches valid songs and artists', () => {
    const target = { title: 'Yellow', artist: 'Coldplay' };
    const candidate: LrclibTrack = {
      trackName: 'Yellow',
      artistName: 'Coldplay',
    };
    expect(isCloseMatch(target, candidate)).toBe(true);
  });

  it('matches when candidate title has remaster suffix', () => {
    const target = { title: 'Rocket Man', artist: 'Elton John' };
    const candidate: LrclibTrack = {
      trackName: 'Rocket Man - Remastered 2014',
      artistName: 'Elton John',
    };
    expect(isCloseMatch(target, candidate)).toBe(true);
  });

  it('rejects completely different songs by the same artist', () => {
    const target = { title: 'Yellow', artist: 'Coldplay' };
    const candidate: LrclibTrack = {
      trackName: 'Fix You',
      artistName: 'Coldplay',
    };
    expect(isCloseMatch(target, candidate)).toBe(false);
  });

  it('rejects songs with extra title words like Yellow Submarine', () => {
    const target = { title: 'Yellow', artist: 'Coldplay' };
    const candidate: LrclibTrack = {
      trackName: 'Yellow Submarine',
      artistName: 'The Beatles',
    };
    expect(isCloseMatch(target, candidate)).toBe(false);
  });

  it('rejects songs with the same title by different artist (e.g. covers or tribute)', () => {
    const target = { title: 'Yellow', artist: 'Coldplay' };
    const candidate: LrclibTrack = {
      trackName: 'Yellow',
      artistName: 'Vitamin String Quartet',
    };
    expect(isCloseMatch(target, candidate)).toBe(false);
  });
});

describe('lyricsLookup picking and duration rule', () => {
  it('prefers candidates with syncedLyrics', () => {
    const target = { title: 'Yellow', artist: 'Coldplay', durationSec: 269 };
    const candidates: LrclibTrack[] = [
      {
        trackName: 'Yellow',
        artistName: 'Coldplay',
        duration: 269,
        plainLyrics: 'Look at the stars...',
        syncedLyrics: null,
      },
      {
        trackName: 'Yellow',
        artistName: 'Coldplay',
        duration: 270,
        plainLyrics: 'Look at the stars...',
        syncedLyrics: '[00:35.00] Look at the stars',
      },
    ];

    const best = pickBestSearchResult(candidates, target);
    expect(best).toBeDefined();
    expect(best?.syncedLyrics).toBeTruthy();
  });

  it('prefers candidates with closest duration when synced status is identical', () => {
    const target = { title: 'Yellow', artist: 'Coldplay', durationSec: 269 };
    const candidates: LrclibTrack[] = [
      {
        trackName: 'Yellow',
        artistName: 'Coldplay',
        duration: 290,
        syncedLyrics: '[00:35.00] Look at the stars',
      },
      {
        trackName: 'Yellow',
        artistName: 'Coldplay',
        duration: 270,
        syncedLyrics: '[00:35.00] Look at the stars',
      },
    ];

    const best = pickBestSearchResult(candidates, target);
    expect(best?.duration).toBe(270);
  });

  it('discards syncedLyrics and uses plainLyrics if duration diff > 3s', () => {
    const candidate: LrclibTrack = {
      trackName: 'Yellow',
      artistName: 'Coldplay',
      duration: 280, // diff = 11s (> 3s)
      syncedLyrics: '[00:35.00] Look at the stars\n[00:40.00] Look how they shine',
      plainLyrics: 'Look at the stars\nLook how they shine',
    };

    const processed = processCandidateLyrics(candidate, 269);
    expect(processed.syncedLyrics).toBeNull();
    expect(processed.plainLyrics).toBe('Look at the stars\nLook how they shine');
  });

  it('keeps syncedLyrics if duration diff <= 3s', () => {
    const candidate: LrclibTrack = {
      trackName: 'Yellow',
      artistName: 'Coldplay',
      duration: 270, // diff = 1s (<= 3s)
      syncedLyrics: '[00:35.00] Look at the stars',
      plainLyrics: 'Look at the stars',
    };

    const processed = processCandidateLyrics(candidate, 269);
    expect(processed.syncedLyrics).toBe('[00:35.00] Look at the stars');
    expect(processed.plainLyrics).toBe('Look at the stars');
  });

  it('handles instrumental tracks properly', () => {
    const candidate: LrclibTrack = {
      trackName: 'Orion',
      artistName: 'Metallica',
      duration: 500,
      instrumental: true,
      syncedLyrics: null,
      plainLyrics: null,
    };

    const processed = processCandidateLyrics(candidate, 500);
    expect(processed.instrumental).toBe(true);
    expect(processed.syncedLyrics).toBeNull();
    expect(processed.plainLyrics).toBeNull();
  });

  it('extracts plain lyrics from LRC string cleanly', () => {
    const lrc = '[00:10.00] Hello world\n[00:15.50] How are you';
    expect(extractPlainFromLrc(lrc)).toBe('Hello world\nHow are you');
  });
});

describe('lyricsLookup error handling and failure detection', () => {
  it('detects 429 rate limiting and sets hasUpstreamError', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response('Too Many Requests', { status: 429 }) as any;

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_rate_limit',
        title: 'Song',
        artist: 'Artist',
        durationSec: 200,
      });

      expect(outcome.hasUpstreamError).toBe(true);
      expect(outcome.upstreamError).toBe('rate_limited');
      expect(outcome.result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('detects 500 server error and sets hasUpstreamError', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response('Internal Server Error', { status: 500 }) as any;

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_500',
        title: 'Song',
        artist: 'Artist',
        durationSec: 200,
      });

      expect(outcome.hasUpstreamError).toBe(true);
      expect(outcome.upstreamError).toBe('server_error');
      expect(outcome.result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('detects network timeout and sets hasUpstreamError', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    };

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_timeout',
        title: 'Song',
        artist: 'Artist',
        durationSec: 200,
      });

      expect(outcome.hasUpstreamError).toBe(true);
      expect(outcome.upstreamError).toBe('timeout');
      expect(outcome.result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('marks clean 404 as hasUpstreamError: false', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response('Not Found', { status: 404 }) as any;

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_clean_404',
        title: 'Song',
        artist: 'Artist',
        durationSec: 200,
      });

      expect(outcome.hasUpstreamError).toBe(false);
      expect(outcome.matchedStep).toBe('none');
      expect(outcome.result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('does NOT latch upstream error if search cleanly completes with 200 OK empty array', async () => {
    const originalFetch = global.fetch;
    // Step a/b /api/get fails with 500, but /api/search succeeds with 200 []
    global.fetch = async (url: any) => {
      if (String(url).includes('/api/get')) {
        return new Response('Server Busy', { status: 503 }) as any;
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }) as any;
    };

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_unlatch',
        title: 'Rare Track',
        artist: 'Indie Artist',
        durationSec: 180,
      });

      expect(outcome.hasUpstreamError).toBe(false);
      expect(outcome.matchedStep).toBe('none');
      expect(outcome.result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('retries transient 503 and succeeds on attempt 2', async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
      calls++;
      if (calls === 1) {
        return new Response('Overloaded', { status: 503 }) as any;
      }
      return new Response(
        JSON.stringify({
          id: 1234,
          trackName: 'Track One',
          artistName: 'Artist One',
          plainLyrics: 'La la la',
          duration: 180,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ) as any;
    };

    try {
      const outcome = await (await import('../lyricsLookup')).lookupLyrics({
        trackId: 'test_retry_success',
        title: 'Track One',
        artist: 'Artist One',
        durationSec: 180,
      });

      expect(outcome.hasUpstreamError).toBe(false);
      expect(outcome.matchedStep).toBe('b');
      expect(outcome.result?.plainLyrics).toBe('La la la');
      expect(calls).toBe(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('lyricsLookup suffix stripping and tempo modified titles', () => {
  it('strips verses and remixes correctly', async () => {
    const { cleanTrackTitle } = await import('../lyricsLookup');
    expect(cleanTrackTitle('Duniya - Talwiinder Verse')).toBe('Duniya');
    expect(cleanTrackTitle('Kesariya (Arijit Singh Verse)')).toBe('Kesariya');
    expect(cleanTrackTitle('Starboy - Kygo Remix')).toBe('Starboy');
    expect(cleanTrackTitle('Shape of You (Club Remix)')).toBe('Shape of You');
  });

  it('detects tempo modified titles and only returns plain lyrics', async () => {
    const { isTempoModifiedTitle, processCandidateLyrics, cleanTrackTitle } = await import('../lyricsLookup');
    expect(isTempoModifiedTitle('After Hours - Slowed + Reverb')).toBe(true);
    expect(isTempoModifiedTitle('Starboy (Nightcore)')).toBe(true);
    expect(isTempoModifiedTitle('Blinding Lights (Sped Up)')).toBe(true);
    expect(isTempoModifiedTitle('Yellow')).toBe(false);

    expect(cleanTrackTitle('After Hours - Slowed + Reverb')).toBe('After Hours');

    const candidate = {
      trackName: 'After Hours',
      artistName: 'The Weeknd',
      duration: 360,
      syncedLyrics: '[00:10.00] Thought I almost died',
      plainLyrics: 'Thought I almost died',
    };

    const processed = processCandidateLyrics(candidate, 360, true);
    expect(processed.syncedLyrics).toBeNull();
    expect(processed.plainLyrics).toBe('Thought I almost died');
  });
});

describe('Multi-artist track lookup chain', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('multi-artist track with an exact multi-artist LRCLIB record -> uses that record', async () => {
    const requestedUrls: string[] = [];
    global.fetch = async (url: any) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);
      const parsed = new URL(urlStr);
      const artistParam = parsed.searchParams.get('artist_name');

      if (artistParam === 'Yeat, Joji') {
        return new Response(
          JSON.stringify({
            id: 31700732,
            trackName: 'Back Home',
            artistName: 'Yeat, Joji',
            albumName: 'Back Home',
            duration: 194,
            syncedLyrics: '[00:01.10] And I told you what I told ya',
            plainLyrics: 'And I told you what I told ya',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ) as any;
      }

      return new Response('Not Found', { status: 404 }) as any;
    };

    const { lookupLyrics } = await import('../lyricsLookup');
    const outcome = await lookupLyrics({
      trackId: '40oYjPdjvFBCZH1Smsk46H',
      title: 'Back Home',
      artist: 'Yeat, Joji',
      album: 'Back Home',
      durationSec: 194,
    });

    expect(outcome.hasUpstreamError).toBe(false);
    expect(outcome.matchedStep).toBe('a');
    expect(outcome.lrclibRecordId).toBe(31700732);
    expect(outcome.result?.plainLyrics).toBe('And I told you what I told ya');
    expect(requestedUrls[0]).toContain('artist_name=Yeat%2C+Joji');
    expect(requestedUrls.some((u) => u.includes('artist_name=Yeat&'))).toBe(false);
  });

  it('multi-artist track with ONLY a primary-artist LRCLIB record -> still finds it (no regression)', async () => {
    const requestedUrls: string[] = [];
    global.fetch = async (url: any) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);
      const parsed = new URL(urlStr);
      const artistParam = parsed.searchParams.get('artist_name');

      // Multi-artist fails with 404
      if (artistParam === 'Yeat, Joji') {
        return new Response('Not Found', { status: 404 }) as any;
      }

      // Primary artist fallback succeeds
      if (artistParam === 'Yeat') {
        return new Response(
          JSON.stringify({
            id: 31709461,
            trackName: 'Back Home',
            artistName: 'Yeat',
            albumName: 'ADL',
            duration: 194,
            syncedLyrics: '[00:01.00] Yeat solo lyrics',
            plainLyrics: 'Yeat solo lyrics',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ) as any;
      }

      return new Response('Not Found', { status: 404 }) as any;
    };

    const { lookupLyrics } = await import('../lyricsLookup');
    const outcome = await lookupLyrics({
      trackId: 'test_fallback_track',
      title: 'Back Home',
      artist: 'Yeat, Joji',
      durationSec: 194,
    });

    expect(outcome.hasUpstreamError).toBe(false);
    expect(outcome.matchedStep).toBe('b');
    expect(outcome.lrclibRecordId).toBe(31709461);
    expect(outcome.result?.plainLyrics).toBe('Yeat solo lyrics');

    // First request was with full artist, second was fallback to primary artist
    expect(requestedUrls[0]).toContain('artist_name=Yeat%2C+Joji');
    expect(requestedUrls[1]).toContain('artist_name=Yeat&');
  });

  it('single-artist track -> behaviour identical to today', async () => {
    const requestedUrls: string[] = [];
    global.fetch = async (url: any) => {
      const urlStr = String(url);
      requestedUrls.push(urlStr);
      const parsed = new URL(urlStr);
      const artistParam = parsed.searchParams.get('artist_name');

      if (artistParam === 'Coldplay') {
        return new Response(
          JSON.stringify({
            id: 5555,
            trackName: 'Yellow',
            artistName: 'Coldplay',
            duration: 269,
            syncedLyrics: '[00:10.00] Look at the stars',
            plainLyrics: 'Look at the stars',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ) as any;
      }

      return new Response('Not Found', { status: 404 }) as any;
    };

    const { lookupLyrics } = await import('../lyricsLookup');
    const outcome = await lookupLyrics({
      trackId: 'test_single_artist',
      title: 'Yellow',
      artist: 'Coldplay',
      durationSec: 269,
    });

    expect(outcome.hasUpstreamError).toBe(false);
    expect(outcome.matchedStep).toBe('b');
    expect(outcome.lrclibRecordId).toBe(5555);
    // Single request directly to Coldplay, no redundant fallback
    expect(requestedUrls.length).toBe(1);
    expect(requestedUrls[0]).toContain('artist_name=Coldplay');
  });
});

