import { useInfiniteQuery } from '@tanstack/react-query';
import { searchSpotify } from '@/lib/spotify/search';

export function useSearch(query: string, types: ('track' | 'artist' | 'album' | 'playlist')[] = ['track', 'artist', 'album', 'playlist']) {
  return useInfiniteQuery({
    queryKey: ['spotify', 'search', query, types],
    queryFn: async ({ pageParam = 0 }) => {
      if (!query.trim()) {
        return null;
      }
      return searchSpotify({ query, type: types, limit: 10, offset: pageParam as number });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined;
      // Spotify returns an object with keys for each type (e.g. tracks, artists, albums, playlists)
      // Check if any of them has a `next` url to know if we can load more.
      // Easiest is to check the total vs offset + limit for one of the categories.
      // We will check the first category available in the response.
      const categories = ['tracks', 'artists', 'albums', 'playlists'] as const;
      let hasMore = false;
      let nextOffset = undefined;
      
      for (const cat of categories) {
        if (lastPage[cat] && lastPage[cat].next) {
          hasMore = true;
          // Extract offset from next url or just calculate it
          // calculating is easier since we know we request limit=10
        }
      }
      
      if (hasMore) {
        // allPages.length * 10 is the next offset
        return allPages.length * 10;
      }
      return undefined;
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000,
  });
}
