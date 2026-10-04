import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlaylist, updatePlaylist, addItemsToPlaylist, removeItemsFromPlaylist, reorderPlaylistItems } from '@/lib/spotify/playlists';
import { useSpotifySession } from './useSpotify';

export function usePlaylistMutations() {
  const queryClient = useQueryClient();
  const { data: sessionData } = useSpotifySession();
  
  const create = useMutation({
    mutationFn: async (data: { name: string, description?: string, public?: boolean }) => {
      return await createPlaylist(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlists'] });
    }
  });

  const update = useMutation({
    mutationFn: async ({ playlistId, data }: { playlistId: string, data: { name?: string, description?: string, public?: boolean } }) => {
      await updatePlaylist(playlistId, data);
      return playlistId;
    },
    onSuccess: (playlistId) => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlists'] });
    }
  });

  const addItems = useMutation({
    mutationFn: async ({ playlistId, uris }: { playlistId: string, uris: string[] }) => {
      return await addItemsToPlaylist(playlistId, uris);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlistItems', variables.playlistId] });
    }
  });

  const removeItems = useMutation({
    mutationFn: async ({ playlistId, uri, snapshot_id }: { playlistId: string, uri: string, snapshot_id?: string }) => {
      return await removeItemsFromPlaylist(playlistId, uri, snapshot_id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlistItems', variables.playlistId] });
    }
  });

  const reorderItems = useMutation({
    mutationFn: async ({ playlistId, range_start, insert_before, snapshot_id }: { playlistId: string, range_start: number, insert_before: number, snapshot_id?: string }) => {
      return await reorderPlaylistItems(playlistId, range_start, insert_before, snapshot_id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlist', variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['spotify', 'playlistItems', variables.playlistId] });
    }
  });

  return {
    create,
    update,
    addItems,
    removeItems,
    reorderItems,
  };
}
