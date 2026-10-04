import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proxyFetch } from '@/lib/spotifyClient';

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

export function usePlaylists(options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'playlists'],
    queryFn: async () => {
      const [meData, playlistsData] = await Promise.all([
        proxyFetch('/me'),
        proxyFetch('/me/playlists')
      ]);
      const currentUserId = meData?.id;
      const allPlaylists = playlistsData?.items || [];
      return allPlaylists.filter((p: any) => p?.owner?.id === currentUserId);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ['spotify', 'devices'],
    queryFn: async () => {
      const data = await proxyFetch('/me/player/devices');
      return data?.devices || [];
    },
    enabled: false, // Only fetch when user explicitly clicks LOAD DEVICES
  });
}

export function useBirthdayMix(options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'birthdayMix'],
    queryFn: async () => {
      const [topData, savedData] = await Promise.all([
        proxyFetch('/me/top/tracks?limit=50&time_range=medium_term'),
        proxyFetch('/me/tracks?limit=50'),
      ]);
      const topTracks = topData?.items || [];
      const savedTracks = (savedData?.items || []).map((i: { track: Record<string, unknown> }) => i.track).filter(Boolean);

      const seen = new Set<string>();
      const merged = [...topTracks, ...savedTracks].filter(t => {
        if (!t?.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]];
      }
      return merged.slice(0, 30);
    },
    enabled: isEnabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTrackSavedStatus(trackId?: string) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;

  return useQuery({
    queryKey: ['spotify', 'saved', trackId],
    queryFn: async () => {
      if (!trackId) return false;
      const data = await proxyFetch(`/me/library/contains?uris=spotify:track:${trackId}`);
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
      
      await proxyFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
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
    mutationFn: async ({ state, device_id }: { state: boolean, device_id: string }) => {
      await proxyFetch(`/me/player/shuffle?state=${state}&device_id=${device_id}`, { method: 'PUT' });
    }
  });

  return { play, toggleSave, toggleShuffle };
}

export function useRecentlyPlayed(options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'recentlyPlayed'],
    queryFn: async () => {
      const { getRecentlyPlayed } = await import('@/lib/spotify/player');
      const data = await getRecentlyPlayed(50);
      return data?.items || [];
    },
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (recently played can update frequently)
  });
}

export function useTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'topTracks', timeRange],
    queryFn: async () => {
      const data = await proxyFetch(`/me/top/tracks?limit=10&time_range=${timeRange}`);
      return data?.items || [];
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', options?: { enabled?: boolean }) {
  const { isSuccess, data: sessionData } = useSpotifySession();
  const isAuthenticated = isSuccess && !!sessionData?.accessToken;
  const isEnabled = options?.enabled !== false && isAuthenticated;

  return useQuery({
    queryKey: ['spotify', 'topArtists', timeRange],
    queryFn: async () => {
      const data = await proxyFetch(`/me/top/artists?limit=10&time_range=${timeRange}`);
      return data?.items || [];
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  });
}
