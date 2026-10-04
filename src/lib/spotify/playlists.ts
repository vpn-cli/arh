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

export async function createPlaylist(data: { name: string, description?: string, public?: boolean }) {
  return await proxyFetch(`/me/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updatePlaylist(playlistId: string, data: { name?: string, description?: string, public?: boolean }) {
  return await proxyFetch(`/playlists/${playlistId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function addItemsToPlaylist(playlistId: string, uris: string[]) {
  return await proxyFetch(`/playlists/${playlistId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris }),
  });
}

export async function removeItemsFromPlaylist(playlistId: string, uri: string, snapshot_id?: string) {
  return await proxyFetch(`/playlists/${playlistId}/items`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ uri }],
      ...(snapshot_id ? { snapshot_id } : {})
    }),
  });
}

export async function reorderPlaylistItems(playlistId: string, range_start: number, insert_before: number, snapshot_id?: string) {
  return await proxyFetch(`/playlists/${playlistId}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range_start,
      insert_before,
      range_length: 1,
      ...(snapshot_id ? { snapshot_id } : {})
    }),
  });
}

export async function removePlaylistFromLibrary(playlistId: string) {
  return await proxyFetch(`/me/library?uris=spotify:playlist:${playlistId}`, {
    method: 'DELETE'
  });
}
