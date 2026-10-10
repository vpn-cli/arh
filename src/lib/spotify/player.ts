import { proxyFetch } from '@/lib/spotifyClient';

export async function getRecentlyPlayed(limit: number = 50) {
  try {
    const data = await proxyFetch(`/me/player/recently-played?limit=${limit}`);
    return data;
  } catch (err: any) {
    if (err?.isNoActiveDevice || err?.status === 404) {
      return { items: [] };
    }
    throw err;
  }
}

export async function getPlayerQueue() {
  try {
    const data = await proxyFetch('/me/player/queue');
    return data;
  } catch (err: any) {
    if (err?.isNoActiveDevice || err?.status === 404) {
      return { currently_playing: null, queue: [] };
    }
    console.error('Failed to get player queue:', err);
    return null;
  }
}

export async function addTrackToPlayerQueue(uri: string, device_id?: string) {
  let url = `/me/player/queue?uri=${encodeURIComponent(uri)}`;
  if (device_id) url += `&device_id=${encodeURIComponent(device_id)}`;
  return await proxyFetch(url, { method: 'POST' });
}

export async function getRelevantTracks(track: any, limit: number = 10): Promise<any[]> {
  if (!track) return [];
  const artistName = track.artists?.[0]?.name;
  const trackId = track.id;
  // Maximum search limit allowed in February 2026 is 10
  const safeLimit = Math.min(Math.max(1, limit), 10);

  try {
    if (artistName) {
      // Find tracks from the same artist (explicitly request up to max 10)
      const query = `artist:"${artistName.replace(/"/g, '')}"`;
      const searchData = await proxyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`);
      const items = searchData?.tracks?.items || [];
      const filtered = items.filter((t: any) => t && t.id !== trackId && t.is_playable !== false);
      if (filtered.length >= 3) {
        return filtered.slice(0, safeLimit);
      }
    }

    // Fallback: search for genre or title keywords
    const fallbackQuery = track.name ? `track:"${track.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim()}"` : 'genre:pop';
    const fallbackData = await proxyFetch(`/search?q=${encodeURIComponent(fallbackQuery)}&type=track&limit=10`);
    const fallbackItems = (fallbackData?.tracks?.items || []).filter((t: any) => t && t.id !== trackId);
    return fallbackItems.slice(0, safeLimit);
  } catch (error: any) {
    console.warn('Warning fetching relevant tracks:', error?.error?.message || error?.message || error);
    return [];
  }
}

