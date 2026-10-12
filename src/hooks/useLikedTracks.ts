import { useQuery } from '@tanstack/react-query';
import { getLikedTracks, normalizeSavedTrack } from '@/lib/spotify/library';
import { useSpotifySession } from './useSpotify';

export async function fetchLikedTracks(page: number = 0, limit: number = 50) {
  const offset = page * limit;
  const data = await getLikedTracks(limit, offset);
  return {
    tracks: (data?.items || []).map(normalizeSavedTrack).filter(Boolean),
    total: data?.total || 0,
    next: data?.next,
    previous: data?.previous,
  };
}

export function useLikedTracks(page: number = 0, limit: number = 50, options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'likedTracks', page, limit],
    queryFn: () => fetchLikedTracks(page, limit),
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}
