import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';

// Mock DB
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: () => mockSelect(),
    insert: (table: any) => mockInsert(table),
    update: (table: any) => mockUpdate(table),
  },
  lyricsCache: {
    spotifyId: 'spotify_id',
    source: 'source',
    synced: 'synced',
    plain: 'plain',
    instrumental: 'instrumental',
    fetchedAt: 'fetched_at',
    offsetMs: 'offset_ms',
  },
}));

vi.mock('@/lib/lyricsLookup', () => ({
  lookupLyrics: vi.fn(),
  extractPlainFromLrc: vi.fn((s) => s),
}));

vi.mock('@/lib/lyrics', () => ({
  parseLrc: vi.fn((s) => [{ timeMs: 1000, text: 'line 1' }]),
}));

describe('Lyrics API Route (/api/lyrics)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, SCRAPBOOK_ADMIN_SECRET: 'test-admin-secret' };
  });

  describe('GET /api/lyrics', () => {
    it('returns offsetMs when cache HIT for manual track', async () => {
      mockSelect.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => [
              {
                spotifyId: 'track-manual-1',
                source: 'manual',
                synced: '[00:01.00] line 1',
                plain: 'line 1',
                instrumental: false,
                fetchedAt: new Date(),
                offsetMs: 350,
              },
            ],
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/lyrics?trackId=track-manual-1');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.source).toBe('manual');
      expect(json.offsetMs).toBe(350);
    });

    it('returns offsetMs when cache HIT for lrclib track', async () => {
      mockSelect.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => [
              {
                spotifyId: 'track-lrclib-1',
                source: 'lrclib',
                synced: '[00:01.00] line 1',
                plain: 'line 1',
                instrumental: false,
                fetchedAt: new Date(),
                offsetMs: -150,
              },
            ],
          }),
        }),
      });

      const req = new NextRequest('http://localhost:3000/api/lyrics?trackId=track-lrclib-1');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.source).toBe('lrclib');
      expect(json.offsetMs).toBe(-150);
    });

    it('logs LRCLIB record id and returns offsetMs on cache MISS lookup', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      mockSelect.mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => [],
          }),
        }),
      });

      const { lookupLyrics } = await import('@/lib/lyricsLookup');
      (lookupLyrics as any).mockResolvedValue({
        result: {
          syncedLyrics: '[00:01.00] test',
          plainLyrics: 'test',
          instrumental: false,
        },
        matchedStep: 'a',
        hasUpstreamError: false,
        lrclibRecordId: 98765,
      });

      mockInsert.mockReturnValue({
        values: () => ({
          onConflictDoUpdate: (args: any) => {
            // Verify offsetMs is NOT in the conflict update set so refreshing never resets offset_ms
            expect(args.set.offsetMs).toBeUndefined();
            return {
              returning: () => [{ offsetMs: 0 }],
            };
          },
        }),
      });

      const req = new NextRequest(
        'http://localhost:3000/api/lyrics?trackId=track-lookup-1&title=Song&artist=Artist'
      );
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.offsetMs).toBe(0);

      // Verify server log line includes LRCLIB record id used
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LRCLIB record id: 98765')
      );
    });
  });

  describe('PATCH /api/lyrics', () => {
    it('rejects requests without valid x-scrapbook-secret with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'PATCH',
        headers: { 'x-scrapbook-secret': 'wrong-secret' },
        body: JSON.stringify({ trackId: 't1', offsetMs: 100 }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('rejects invalid payload with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'PATCH',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({ trackId: '', offsetMs: 'invalid' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('clamps offsetMs to [-5000, 5000] and updates DB', async () => {
      let insertedValues: any = null;
      let conflictSet: any = null;

      mockInsert.mockReturnValue({
        values: (val: any) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: (args: any) => {
              conflictSet = args.set;
              return Promise.resolve();
            },
          };
        },
      });

      // Test upper clamp: 8000 -> 5000
      const reqUpper = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'PATCH',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({ trackId: 'track-clamp', offsetMs: 8000 }),
      });

      const resUpper = await PATCH(reqUpper);
      expect(resUpper.status).toBe(200);
      const jsonUpper = await resUpper.json();
      expect(jsonUpper.offsetMs).toBe(5000);
      expect(insertedValues.offsetMs).toBe(5000);
      expect(conflictSet.offsetMs).toBe(5000);

      // Test lower clamp: -7000 -> -5000
      const reqLower = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'PATCH',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({ trackId: 'track-clamp', offsetMs: -7000 }),
      });

      const resLower = await PATCH(reqLower);
      expect(resLower.status).toBe(200);
      const jsonLower = await resLower.json();
      expect(jsonLower.offsetMs).toBe(-5000);
      expect(insertedValues.offsetMs).toBe(-5000);
      expect(conflictSet.offsetMs).toBe(-5000);
    });
  });
});
