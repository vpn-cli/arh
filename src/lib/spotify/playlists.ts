import { proxyFetch } from '@/lib/spotifyClient';
import { normalizeSavedTrack, normalizePlaylistItem } from './library';

export async function getPlaylist(id: string) {
  return await proxyFetch(`/playlists/${id}`);
}

export async function getPlaylistItems(id: string) {
  const data = await proxyFetch(`/playlists/${id}/items?limit=50`);
  if (!data || !data.items) return null;
  
  // Normalize track items using the specific playlist item logic
  const items = data.items.map((item: any) => normalizePlaylistItem(item)).filter(Boolean);
  return {
    ...data,
    items
  };
}
