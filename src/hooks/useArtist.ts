import { useQuery } from '@tanstack/react-query';
import { getArtist, getArtistAlbums } from '@/lib/spotify/artists';
import { useSpotifySession } from './useSpotify';

export function useArtist(id?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'artist', id],
    queryFn: async () => {
      if (!id) return null;
      return await getArtist(id);
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403 || error?.status === 404) return false;
      return failureCount < 3;
    }
  });
}

export function useArtistAlbums(id?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'artistAlbums', id],
    queryFn: async () => {
      if (!id) return null;
      return await getArtistAlbums(id);
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403 || error?.status === 404) return false;
      return failureCount < 3;
    }
  });
}
