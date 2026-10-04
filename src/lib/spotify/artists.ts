import { proxyFetch } from '@/lib/spotifyClient';

export async function getArtist(id: string) {
  return await proxyFetch(`/artists/${id}`);
}

export async function getArtistAlbums(id: string) {
  // Fetch albums, without include_groups in case it causes 400 Bad Request
  return await proxyFetch(`/artists/${id}/albums?limit=10&offset=0`);
}

export async function getArtistTopTracks(id: string) {
  // The market=from_token is usually required or recommended for this endpoint
  return await proxyFetch(`/artists/${id}/top-tracks?market=from_token`);
}
