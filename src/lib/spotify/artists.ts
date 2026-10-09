import { proxyFetch } from '@/lib/spotifyClient';

export async function getArtist(id: string) {
  return await proxyFetch(`/artists/${id}`);
}

export async function getArtistAlbums(id: string) {
  // Fetch albums, without include_groups in case it causes 400 Bad Request
  return await proxyFetch(`/artists/${id}/albums?limit=10&offset=0`);
}

/**
 * Note: GET /artists/{id}/top-tracks was removed in the February 2026 Spotify Web API update
 * with no direct replacement. Degraded gracefully to return empty tracks.
 */
export async function getArtistTopTracks(_id: string) {
  return { tracks: [] };
}
