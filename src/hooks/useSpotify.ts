import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proxyFetch } from '@/lib/spotifyClient';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { fetchLikedTracks } from './useLikedTracks';

export function useSpotifySession() {
  return useQuery({
    queryKey: ['spotifySession'],
    queryFn: async () => {
      const res = await fetch('/api/spotify/session');
      if (!res.ok) throw new Error('No session');
      return res.json();
    },
    retry: false,
    staleTime: 55 * 60 * 1000, // 55 minutes
  });
}

export async function fetchSpotifyMe() {
  try {
    const data = await proxyFetch('/me');
    const tier = data?.product === 'premium' ? 'premium' : 'free';
    useSpotifyPlayerStore.getState().setAccountTier(tier);
    return data;
  } catch (err) {
    // On failure, keep 'unknown'. Only a successful /me or SDK account_error may set 'free'.
    throw err;
  }
}

export function useSpotifyMe(options?: {
  enabled?: boolean;
  refetchInterval?: number | false | ((query: any) => number | false | undefined);
  refetchIntervalInBackground?: boolean;
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
}) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'me'],
    queryFn: fetchSpotifyMe,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    retry: options?.retry ?? false,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: options?.refetchIntervalInBackground ?? true,
  });
}

export function usePlaylists(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'playlists'],
    queryFn: async () => {
      const [meData, playlistsData] = await Promise.all([
        queryClient.ensureQueryData({
          queryKey: ['spotify', 'me'],
          queryFn: fetchSpotifyMe,
          staleTime: 5 * 60 * 1000,
        }).catch(() => null),
        proxyFetch('/me/playlists?limit=50').catch(() => null)
      ]);
      const currentUserId = meData?.id;
      const allPlaylists = playlistsData?.items || [];
      if (!currentUserId) return allPlaylists;
      const userPlaylists = allPlaylists.filter((p: any) => p?.owner?.id === currentUserId);
      return userPlaylists.length > 0 ? userPlaylists : allPlaylists;
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
}

export function useBirthdayMix(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'birthdayMix'],
    queryFn: async () => {
      const [likedData, recentData, medTop] = await Promise.all([
        queryClient.ensureQueryData({
          queryKey: ['spotify', 'likedTracks', 0, 50],
          queryFn: () => fetchLikedTracks(0, 50),
          staleTime: 5 * 60 * 1000,
        }).catch(() => ({ tracks: [] })),
        queryClient.ensureQueryData({
          queryKey: ['spotify', 'recentlyPlayed'],
          queryFn: () => fetchRecentlyPlayed(50),
          staleTime: 2 * 60 * 1000,
        }).catch(() => []),
        proxyFetch('/me/top/tracks?limit=50&time_range=medium_term').catch(() => ({ items: [] })),
      ]);

      const medTracks = medTop?.items || [];
      const savedTracks = likedData?.tracks || [];
      // Birthday mix takes the first 30 of recently played (fetched with limit=50)
      const recentTracks = (recentData || []).slice(0, 30).map((i: any) => i?.track).filter(Boolean);

      const seen = new Set<string>();
      const merged = [...medTracks, ...recentTracks, ...savedTracks].filter((t: any) => {
        if (!t?.id || !t?.uri || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      // Fisher-Yates shuffle
      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]];
      }

      return merged.slice(0, 35);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlayerQueue(options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled === true && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'playerQueue'],
    queryFn: async () => {
      const { getPlayerQueue } = await import('@/lib/spotify/player');
      return await getPlayerQueue();
    },
    enabled: isEnabled,
    refetchInterval: false,
    staleTime: 10_000,
  });
}

export function useTrackSavedStatus(trackId?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'saved', trackId],
    queryFn: async () => {
      if (!trackId) return false;
      const data = await proxyFetch(`/me/library/contains?uris=spotify:track:${trackId}`, { isPolling: true });
      return data && data.length > 0 ? data[0] : false;
    },
    enabled: isAuthenticated && !!trackId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpotifyMutations() {
  const queryClient = useQueryClient();

  const play = useMutation({
    mutationFn: async ({ uris, context_uri, offset, device_id }: { uris?: string[], context_uri?: string, offset?: { uri?: string, position?: number }, device_id?: string }) => {
      let url = '/me/player/play';
      if (device_id) url += `?device_id=${device_id}`;
      const body: Record<string, unknown> = {};
      if (uris) body.uris = uris;
      if (context_uri) body.context_uri = context_uri;
      if (offset) body.offset = offset;
      
      const payload = Object.keys(body).length > 0 ? JSON.stringify(body) : undefined;
      
      const { PLAYBACK_DEBUG } = await import('@/components/worlds/music/playback/playbackHelpers');
      if (PLAYBACK_DEBUG) {
        console.debug('[PLAYBACK_DEBUG] PUT /me/player/play request:', {
          url,
          body,
          clickedUri: uris?.[0] || offset?.uri || context_uri,
        });
      }

      await proxyFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    }
  });

  const toggleSave = useMutation({
    mutationFn: async ({ trackId, isSaved }: { trackId: string, isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'PUT';
      await proxyFetch(`/me/library?uris=spotify:track:${trackId}`, { method });
      return { trackId, newStatus: !isSaved };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['spotify', 'saved', data.trackId], data.newStatus);
    }
  });

  const toggleShuffle = useMutation({
    mutationFn: async ({ state, device_id }: { state: boolean, device_id?: string }) => {
      let url = `/me/player/shuffle?state=${state}`;
      if (device_id) url += `&device_id=${device_id}`;
      await proxyFetch(url, { method: 'PUT' });
    }
  });

  const toggleRepeat = useMutation({
    mutationFn: async ({ state, device_id }: { state: 'off' | 'context' | 'track', device_id?: string }) => {
      let url = `/me/player/repeat?state=${state}`;
      if (device_id) url += `&device_id=${device_id}`;
      await proxyFetch(url, { method: 'PUT' });
    }
  });

  return { play, toggleSave, toggleShuffle, toggleRepeat };
}

export async function fetchRecentlyPlayed(limit: number = 50) {
  const { getRecentlyPlayed } = await import('@/lib/spotify/player');
  const data = await getRecentlyPlayed(limit);
  return data?.items || [];
}

export function useRecentlyPlayed(options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'recentlyPlayed'],
    queryFn: () => fetchRecentlyPlayed(50),
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (recently played can update frequently)
  });
}

export function useTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', options?: { enabled?: boolean, limit?: number }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['spotify', 'topTracks', timeRange, limit],
    queryFn: async () => {
      const data = await proxyFetch(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
      return data?.items || [];
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', options?: { enabled?: boolean, limit?: number }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;
  const limit = options?.limit || 10;

  return useQuery({
    queryKey: ['spotify', 'topArtists', timeRange, limit],
    queryFn: async () => {
      const data = await proxyFetch(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
      return data?.items || [];
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}
