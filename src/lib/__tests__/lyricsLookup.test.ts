import { describe, it, expect } from 'vitest';
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
});

