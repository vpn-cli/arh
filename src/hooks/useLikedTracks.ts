import { useQuery } from '@tanstack/react-query';
import { getLikedTracks, normalizeSavedTrack } from '@/lib/spotify/library';
import { useSpotifySession } from './useSpotify';

export function useLikedTracks(page: number = 0, limit: number = 50, options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;
  const offset = page * limit;

  return useQuery({
    queryKey: ['spotify', 'likedTracks', page, limit],
    queryFn: async () => {
      const data = await getLikedTracks(limit, offset);
      return {
        tracks: (data?.items || []).map(normalizeSavedTrack).filter(Boolean),
        total: data?.total || 0,
        next: data?.next,
        previous: data?.previous,
      };
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}
