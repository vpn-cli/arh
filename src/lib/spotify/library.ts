import { proxyFetch } from '@/lib/spotifyClient';

export async function getLikedTracks(limit: number = 50, offset: number = 0) {
  const data = await proxyFetch(`/me/tracks?limit=${limit}&offset=${offset}`);
  return data;
}

export async function checkTracksSaved(trackIds: string[]): Promise<boolean[]> {
  if (trackIds.length === 0) return [];
  // Max 50 IDs per request for /me/library/contains
  const data = await proxyFetch(`/me/library/contains?uris=${trackIds.map(id => `spotify:track:${id}`).join(',')}`);
  return data || [];
}

export async function saveTrack(trackId: string) {
  await proxyFetch(`/me/library?uris=spotify:track:${trackId}`, { method: 'PUT' });
}

export async function removeTrack(trackId: string) {
  await proxyFetch(`/me/library?uris=spotify:track:${trackId}`, { method: 'DELETE' });
}

export function normalizeSavedTrack(item: any) {
  if (!item) return null;
  // If the object is wrapped in a saved-track wrapper, extract the track
  const track = item.track ? item.track : item;
  
  if (!track) return null;

  // Guarantee a URI is present for playback
  if (!track.uri && track.id) {
    track.uri = `spotify:track:${track.id}`;
  }

  // Only return valid tracks
  if (!track.uri) return null;
  
  return track;
}

export function normalizePlaylistItem(playlistItem: any) {
  if (!playlistItem) return null;
  
  const item = playlistItem.item || playlistItem.track || playlistItem;
  if (!item) return null;
  
  // Only accept playable track items (skip episodes/podcasts if not track)
  if (item.type && item.type !== "track") return null;

  // Guarantee a URI is present for playback
  if (!item.uri && item.id) {
    item.uri = `spotify:track:${item.id}`;
  }

  // Only return valid tracks
  if (!item.uri) return null;
  
  return item;
}
