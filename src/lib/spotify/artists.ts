import { proxyFetch } from '@/lib/spotifyClient';

export async function getArtist(id: string) {
  return await proxyFetch(`/artists/${id}`);
}

export async function getArtistAlbums(id: string) {
  // Fetch albums, specify include_groups=album,single
  return await proxyFetch(`/artists/${id}/albums?include_groups=album,single&limit=50`);
}

export async function getArtistTopTracks(id: string) {
  // The market=from_token is usually required or recommended for this endpoint
  return await proxyFetch(`/artists/${id}/top-tracks`);
}
