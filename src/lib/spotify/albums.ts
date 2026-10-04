import { proxyFetch } from '@/lib/spotifyClient';

export async function getAlbum(id: string) {
  return await proxyFetch(`/albums/${id}`);
}

export function normalizeAlbumTrack(item: any, albumData?: any) {
  if (!item) return null;
  
  // Guarantee a URI is present for playback
  if (!item.uri && item.id) {
    item.uri = `spotify:track:${item.id}`;
  }

  // Only return valid tracks
  if (!item.uri) return null;
  
  const track = { ...item };
  if (albumData && !track.album) {
    track.album = {
      images: albumData.images,
      name: albumData.name,
      id: albumData.id,
      uri: albumData.uri,
    };
  }
  
  return track;
}

export async function getAlbumTracks(id: string, albumData?: any) {
  const data = await proxyFetch(`/albums/${id}/tracks?limit=50`);
  if (!data || !data.items) return null;
  
  const items = data.items.map((item: any) => normalizeAlbumTrack(item, albumData)).filter(Boolean);
  return {
    ...data,
    items
  };
}
