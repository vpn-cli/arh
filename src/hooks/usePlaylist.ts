import { useQuery } from '@tanstack/react-query';
import { getPlaylist, getPlaylistItems } from '@/lib/spotify/playlists';
import { useSpotifySession } from './useSpotify';

export function usePlaylist(id: string | null) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'playlist', id],
    queryFn: async () => {
      if (!id) return null;
      return await getPlaylist(id);
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaylistItems(id: string | null) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'playlistItems', id],
    queryFn: async () => {
      if (!id) return null;
      return await getPlaylistItems(id);
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
