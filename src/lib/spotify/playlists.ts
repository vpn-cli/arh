import { proxyFetch } from '@/lib/spotifyClient';
import { normalizeSavedTrack, normalizePlaylistItem } from './library';

export async function getPlaylist(id: string) {
  const data = await proxyFetch(`/playlists/${id}`);
  if (!data) return null;
  const total = data.items?.total ?? data.tracks?.total ?? (Array.isArray(data.items) ? data.items.length : (Array.isArray(data.tracks?.items) ? data.tracks.items.length : 0));
  return {
    ...data,
    total_tracks: total,
    tracks: data.tracks || (data.items?.items ? { total, items: data.items.items } : { total, items: [] }),
    items: data.items || data.tracks?.items || []
  };
}

export async function getPlaylistItems(id: string) {
  // February 2026: exclusively use /playlists/{id}/items
  let data = await proxyFetch(`/playlists/${id}/items?limit=100`).catch(() => null);
  if (!data || !data.items) {
    // Fallback: fetch playlist directly which contains initial items/tracks metadata if available
    const playlist = await proxyFetch(`/playlists/${id}`).catch(() => null);
    if (playlist && (playlist.items?.items || playlist.items || playlist.tracks?.items)) {
      const pItems = playlist.items?.items || (Array.isArray(playlist.items) ? playlist.items : playlist.tracks?.items) || [];
      data = {
        total: playlist.items?.total ?? playlist.tracks?.total ?? pItems.length,
        items: pItems
      };
    }
  }
  if (!data || !data.items) return null;
  
  // Normalize track items using the specific playlist item logic (handles item.item and item.track)
  const items = data.items.map((item: any) => normalizePlaylistItem(item)).filter(Boolean);
  return {
    ...data,
    total: data.total ?? items.length,
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
  const body = JSON.stringify({
    items: [{ uri }],
    ...(snapshot_id ? { snapshot_id } : {})
  });
  return await proxyFetch(`/playlists/${playlistId}/items`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export async function reorderPlaylistItems(playlistId: string, range_start: number, insert_before: number, snapshot_id?: string) {
  const body = JSON.stringify({
    range_start,
    insert_before,
    range_length: 1,
    ...(snapshot_id ? { snapshot_id } : {})
  });
  return await proxyFetch(`/playlists/${playlistId}/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export async function removePlaylistFromLibrary(playlistId: string) {
  return await proxyFetch(`/me/library?uris=spotify:playlist:${playlistId}`, {
    method: 'DELETE'
  });
}
