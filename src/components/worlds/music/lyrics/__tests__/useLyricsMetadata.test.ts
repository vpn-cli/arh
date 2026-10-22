import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prefetchLyrics, clearCachedLyrics } from '../useLyrics';

describe('Lyrics Metadata Passing (Part 3)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    clearCachedLyrics();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearCachedLyrics();
  });

  it('prefetchLyrics includes trackName and artistName as query parameters to avoid Spotify lookup', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        synced: null,
        plain: 'Lyrics for testing',
        offsetMs: 0,
      }),
    } as any);

    await prefetchLyrics('track-meta-1', 'Dancing in the Dark', 'Bruce Springsteen');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/lyrics?trackId=track-meta-1&title=Dancing+in+the+Dark&artist=Bruce+Springsteen'
    );
  });

  it('prefetchLyrics includes primaryArtist parameter when passed', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        synced: null,
        plain: 'Lyrics for testing',
        offsetMs: 0,
      }),
    } as any);

    await prefetchLyrics(
      'track-meta-2',
      'See You Again',
      'Tyler, The Creator, Kali Uchis',
      false,
      'Tyler, The Creator'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/lyrics?trackId=track-meta-2&title=See+You+Again&artist=Tyler%2C+The+Creator%2C+Kali+Uchis&primaryArtist=Tyler%2C+The+Creator'
    );
  });
});
