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
});
