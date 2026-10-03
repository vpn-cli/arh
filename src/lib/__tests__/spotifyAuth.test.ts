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
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('getRedirectUri should return origin + /api/spotify/callback', () => {
    expect(getRedirectUri()).toBe('http://localhost:3000/api/spotify/callback');
  });

  it('redirectToSpotifyAuth should set location.href to /api/spotify/login', () => {
    redirectToSpotifyAuth();
    expect(window.location.href).toBe('/api/spotify/login');
  });

  it('logoutSpotify should set location.href to /', () => {
    logoutSpotify();
    expect(window.location.href).toBe('/');
  });
});
