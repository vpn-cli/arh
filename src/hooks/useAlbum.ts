import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlbum, getAlbumTracks } from '@/lib/spotify/albums';
import { useSpotifySession } from './useSpotify';
import { proxyFetch } from '@/lib/spotifyClient';

export function useAlbum(id?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'album', id],
    queryFn: async () => {
      if (!id) return null;
      return await getAlbum(id);
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403 || error?.status === 404) return false;
      return failureCount < 3;
    }
  });
}

export function useAlbumTracks(id?: string, albumData?: any) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'albumTracks', id],
    queryFn: async () => {
      if (!id) return null;
      return await getAlbumTracks(id, albumData);
    },
    enabled: isAuthenticated && !!id && !!albumData,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403 || error?.status === 404) return false;
      return failureCount < 3;
    }
  });
}

export function useAlbumSavedStatus(albumId?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'saved', 'album', albumId],
    queryFn: async () => {
      if (!albumId) return false;
      const data = await proxyFetch(`/me/library/contains?uris=spotify:album:${albumId}`);
      return data && data.length > 0 ? data[0] : false;
    },
    enabled: isAuthenticated && !!albumId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlbumMutations() {
  const queryClient = useQueryClient();

  const toggleSaveAlbum = useMutation({
    mutationFn: async ({ albumId, isSaved }: { albumId: string, isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'PUT';
      await proxyFetch(`/me/library?uris=spotify:album:${albumId}`, { method });
      return { albumId, newStatus: !isSaved };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['spotify', 'saved', 'album', data.albumId], data.newStatus);
    }
  });

  return { toggleSaveAlbum };
}
