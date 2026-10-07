import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRedirectUri, redirectToSpotifyAuth, logoutSpotify } from '../spotifyAuth';

describe('spotifyAuth utils', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'http://localhost:3000',
      href: '',
    } as any;
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  it('getRedirectUri should return origin + /api/spotify/callback', () => {
    expect(getRedirectUri()).toBe('http://localhost:3000/api/spotify/callback');
  });

  it('redirectToSpotifyAuth should set location.href to /api/spotify/login', () => {
    redirectToSpotifyAuth();
    expect(window.location.href).toBe('/api/spotify/login');
  });

  it('logoutSpotify should set location.href to /', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    
    await logoutSpotify();
    expect(window.location.href).toBe('/');
    
    global.fetch = originalFetch;
  });
});
