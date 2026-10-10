import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '../route';

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

vi.mock('@/lib/lyrics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/lyrics')>();
  return {
    ...actual,
  };
});

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

  describe('POST /api/lyrics', () => {
    it('accepts range block pastes and saves as synced manual lyrics', async () => {
      let insertedValues: any = null;

      mockInsert.mockReturnValue({
        values: (val: any) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: () => ({
              returning: () => [{ offsetMs: 0 }],
            }),
          };
        },
      });

      const lyricsInput = `• 0:19 – 0:35 | first line
second line
• 0:35 – 0:50 | third line`;

      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'POST',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({
          trackId: 'track-range-1',
          lyrics: lyricsInput,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.source).toBe('manual');
      expect(json.warning).toBeUndefined();

      // Check DB values
      expect(insertedValues.spotifyId).toBe('track-range-1');
      expect(insertedValues.source).toBe('manual');
      expect(insertedValues.synced).toBe(
        '[00:19.00] first line\n[00:27.00] second line\n[00:35.00] third line'
      );
      expect(insertedValues.plain).toBe('first line\nsecond line\nthird line');

      // Check parsed synced output in JSON response
      expect(json.synced).toHaveLength(3);
      expect(json.synced[0].timeMs).toBe(19000);
      expect(json.synced[0].text).toBe('first line');
      expect(json.synced[1].timeMs).toBe(27000);
      expect(json.synced[1].text).toBe('second line');
      expect(json.synced[2].timeMs).toBe(35000);
      expect(json.synced[2].text).toBe('third line');
    });

    it('falls back to plain text when timestamps are not ascending and tells the user why', async () => {
      let insertedValues: any = null;

      mockInsert.mockReturnValue({
        values: (val: any) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: () => ({
              returning: () => [{ offsetMs: 0 }],
            }),
          };
        },
      });

      // Out of order: 0:40 then 0:20
      const invalidLyrics = `• 0:40 – 0:50 | later line
• 0:20 – 0:30 | earlier line`;

      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'POST',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({
          trackId: 'track-invalid-order',
          lyrics: invalidLyrics,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.source).toBe('manual');
      expect(json.synced).toBeNull();
      expect(json.plain).toBe('later line\nearlier line');
      expect(json.warning).toContain('Timestamps must be ascending');

      expect(insertedValues.synced).toBeNull();
      expect(insertedValues.plain).toBe('later line\nearlier line');
    });

    it('falls back to plain text when timestamp exceeds track duration (+5s buffer)', async () => {
      let insertedValues: any = null;

      mockInsert.mockReturnValue({
        values: (val: any) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: () => ({
              returning: () => [{ offsetMs: 0 }],
            }),
          };
        },
      });

      // Track is 180s (3:00). Max allowed is 185s. Line is at 3:15 (195s)
      const lyricsExceedingDuration = `• 3:00 – 3:15 | line exceeding track length`;

      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'POST',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({
          trackId: 'track-exceed-dur',
          lyrics: lyricsExceedingDuration,
          durationMs: 180000,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.source).toBe('manual');
      expect(json.synced).toBeNull();
      expect(json.plain).toBe('line exceeding track length');
      expect(json.warning).toContain('exceeds track duration');

      expect(insertedValues.synced).toBeNull();
      expect(insertedValues.plain).toBe('line exceeding track length');
    });

    it('saves as plain text when forcePlain is true', async () => {
      let insertedValues: any = null;

      mockInsert.mockReturnValue({
        values: (val: any) => {
          insertedValues = val;
          return {
            onConflictDoUpdate: () => ({
              returning: () => [{ offsetMs: 0 }],
            }),
          };
        },
      });

      const rangeInput = `• 0:19 – 0:35 | first line
• 0:35 – 0:50 | second line`;

      const req = new NextRequest('http://localhost:3000/api/lyrics', {
        method: 'POST',
        headers: { 'x-scrapbook-secret': 'test-admin-secret' },
        body: JSON.stringify({
          trackId: 'track-force-plain',
          lyrics: rangeInput,
          forcePlain: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.synced).toBeNull();
      expect(json.plain).toBe('first line\nsecond line');
      expect(insertedValues.synced).toBeNull();
      expect(insertedValues.plain).toBe('first line\nsecond line');
    });
  });
});
