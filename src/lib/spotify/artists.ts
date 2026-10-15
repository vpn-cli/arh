import { proxyFetch } from '@/lib/spotifyClient';

export async function getArtist(id: string) {
  return await proxyFetch(`/artists/${id}`);
}

export async function getArtistAlbums(id: string) {
  // Fetch albums, without include_groups in case it causes 400 Bad Request
  return await proxyFetch(`/artists/${id}/albums?limit=10&offset=0`);
}
