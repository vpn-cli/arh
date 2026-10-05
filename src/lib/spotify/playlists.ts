import { proxyFetch } from '@/lib/spotifyClient';
import { normalizeSavedTrack, normalizePlaylistItem } from './library';

export async function getPlaylist(id: string) {
  const data = await proxyFetch(`/playlists/${id}`);
  if (!data) return null;
  const total = data.tracks?.total ?? data.items?.total ?? (Array.isArray(data.items) ? data.items.length : (Array.isArray(data.tracks?.items) ? data.tracks.items.length : 0));
  return {
    ...data,
    total_tracks: total,
    tracks: data.tracks || { total, items: [] },
    items: data.items || data.tracks?.items || []
  };
}

export async function getPlaylistItems(id: string) {
  let data = await proxyFetch(`/playlists/${id}/tracks?limit=100`).catch(() => null);
  if (!data || !data.items) {
    data = await proxyFetch(`/playlists/${id}/items?limit=100`).catch(() => null);
  }
  if (!data || !data.items) {
    // Fallback: fetch playlist directly which contains initial tracks
    const playlist = await proxyFetch(`/playlists/${id}`).catch(() => null);
    if (playlist && (playlist.tracks?.items || playlist.items)) {
      data = {
        total: playlist.tracks?.total ?? playlist.items?.total ?? (playlist.tracks?.items?.length || playlist.items?.length || 0),
        items: playlist.tracks?.items || playlist.items || []
      };
    }
  }
  if (!data || !data.items) return null;
  
  // Normalize track items using the specific playlist item logic
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
  try {
    return await proxyFetch(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris }),
    });
  } catch {
    return await proxyFetch(`/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris }),
    });
  }
}

export async function removeItemsFromPlaylist(playlistId: string, uri: string, snapshot_id?: string) {
  const body = JSON.stringify({
    tracks: [{ uri }],
    items: [{ uri }],
    ...(snapshot_id ? { snapshot_id } : {})
  });
  try {
    return await proxyFetch(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    return await proxyFetch(`/playlists/${playlistId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }
}

export async function reorderPlaylistItems(playlistId: string, range_start: number, insert_before: number, snapshot_id?: string) {
  const body = JSON.stringify({
    range_start,
    insert_before,
    range_length: 1,
    ...(snapshot_id ? { snapshot_id } : {})
  });
  try {
    return await proxyFetch(`/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    return await proxyFetch(`/playlists/${playlistId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }
}

export async function removePlaylistFromLibrary(playlistId: string) {
  return await proxyFetch(`/me/library?uris=spotify:playlist:${playlistId}`, {
    method: 'DELETE'
  });
}
