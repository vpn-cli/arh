import { proxyFetch } from '../spotifyClient';

export interface SearchParams {
  query: string;
  type: ('track' | 'artist' | 'album' | 'playlist')[];
  limit?: number;
  offset?: number;
}

export async function searchSpotify({ query, type, limit = 10, offset = 0 }: SearchParams) {
  if (!query.trim()) {
    return null;
  }
  // Max limit allowed is 10 per type as per requirement
  const safeLimit = Math.min(limit, 10);
  const typeStr = type.join(',');
  const encodedQuery = encodeURIComponent(query.trim());
  const url = `/search?q=${encodedQuery}&type=${typeStr}&limit=${safeLimit}&offset=${offset}`;

  const data = await proxyFetch(url);
  return data;
}
