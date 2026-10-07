import { proxyFetch } from '@/lib/spotifyClient';

export async function getRecentlyPlayed(limit: number = 50) {
  const data = await proxyFetch(`/me/player/recently-played?limit=${limit}`);
  return data;
}

export async function getPlayerQueue() {
  try {
    const data = await proxyFetch('/me/player/queue');
    return data;
  } catch (err) {
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

  try {
    if (artistName) {
      // Find top tracks from the same artist
      const query = `artist:"${artistName.replace(/"/g, '')}"`;
      const searchData = await proxyFetch(`/search?q=${encodeURIComponent(query)}&type=track`);
      const items = searchData?.tracks?.items || [];
      const filtered = items.filter((t: any) => t && t.id !== trackId && t.is_playable !== false);
      if (filtered.length >= 3) {
        return filtered.slice(0, limit);
      }
    }

    // Fallback: search for genre or title keywords
    const fallbackQuery = track.name ? `track:"${track.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim()}"` : 'genre:pop';
    const fallbackData = await proxyFetch(`/search?q=${encodeURIComponent(fallbackQuery)}&type=track`);
    const fallbackItems = (fallbackData?.tracks?.items || []).filter((t: any) => t && t.id !== trackId);
    return fallbackItems.slice(0, limit);
  } catch (error: any) {
    console.warn('Warning fetching relevant tracks:', error?.error?.message || error?.message || error);
    return [];
  }
}

