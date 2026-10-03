import { proxyFetch } from '@/lib/spotifyClient';
import { normalizeSavedTrack } from './library';

export async function getPlaylist(id: string) {
  return await proxyFetch(`/playlists/${id}`);
}

export async function getPlaylistItems(id: string) {
  const data = await proxyFetch(`/playlists/${id}/tracks?limit=100`);
  if (!data || !data.items) return null;
  
  // Normalize track items using the same logic as library tracks
  const items = data.items.map((item: any) => normalizeSavedTrack(item)).filter(Boolean);
  return {
    ...data,
    items
  };
}
