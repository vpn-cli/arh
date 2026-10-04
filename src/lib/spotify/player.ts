import { proxyFetch } from '@/lib/spotifyClient';

export async function getRecentlyPlayed(limit: number = 50) {
  const data = await proxyFetch(`/me/player/recently-played?limit=${limit}`);
  return data;
}
