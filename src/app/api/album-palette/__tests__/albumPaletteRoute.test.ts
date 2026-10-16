import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

describe('/api/album-palette', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns 400 when url param is missing', async () => {
    const req = new Request('http://localhost:3000/api/album-palette');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing image url');
  });

  it('fails quietly with status 200, default fallback palette, and logs once at warn when fetch fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const testUrl = 'https://i.scdn.co/image/not-found-art';
    const req = new Request(`http://localhost:3000/api/album-palette?url=${encodeURIComponent(testUrl)}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
    const json = await res.json();

    // Verifies fallback palette based on #C2185B
    expect(json.vibrant).toBeDefined();
    expect(json.computed).toBeDefined();
    expect(json.computed.vibrant).toBe(json.vibrant);

    // Verifies error was logged at warn, NOT error
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Album Palette] Failed to fetch or extract palette for "https://i.scdn.co/image/not-found-art"')
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
