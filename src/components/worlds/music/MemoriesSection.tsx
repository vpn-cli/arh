import React, { useMemo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { useQueries } from '@tanstack/react-query';
import { proxyFetch } from '@/lib/spotifyClient';
import { TrackRow } from './TrackRow';
import { ArtistCard } from './ArtistCard';
import { PlaylistCard } from './PlaylistCard';

interface MemoriesSectionProps {
  onPlayTrack: (uri: string) => void;
  onPlayPlaylist: (uri: string) => void;
  onAddToQueue: (track: any) => void;
  onAddToPlaylist: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onClickPlaylist: (id: string) => void;
  onEditMemory: (entity: any | null, type: 'track' | 'artist' | 'playlist', memoryId?: string) => void;
}

export function MemoriesSection({
  onPlayTrack,
  onPlayPlaylist,
  onAddToQueue,
  onAddToPlaylist,
  onClickArtist,
  onClickPlaylist,
  onEditMemory,
}: MemoriesSectionProps) {
  const memories = useMemoriesStore((state) => state.memories);
  const deleteMemory = useMemoriesStore((state) => state.deleteMemory);
  const error = useMemoriesStore((state) => state.error);
  const clearError = useMemoriesStore((state) => state.clearError);

  // Group IDs by entity type
  const { trackIds, artistIds, playlistIds } = useMemo(() => {
    const tIds: string[] = [];
    const aIds: string[] = [];
    const pIds: string[] = [];
    
    memories.forEach(m => {
      const id = m.spotifyUri.split(':').pop() || '';
      if (m.entityType === 'track') tIds.push(id);
      else if (m.entityType === 'artist') aIds.push(id);
      else if (m.entityType === 'playlist') pIds.push(id);
    });
    
    return { trackIds: tIds, artistIds: aIds, playlistIds: pIds };
  }, [memories]);

  // Fetch Tracks individually
  const trackQueries = useQueries({
    queries: trackIds.map((id) => ({
      queryKey: ['memories', 'track', id],
      queryFn: () => proxyFetch(`/tracks/${id}`),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
    })),
  });
  const tracksLoading = trackQueries.some(q => q.isLoading);
  const tracksData = trackQueries.map(q => q.data).filter(Boolean);

  // Fetch Artists individually
  const artistQueries = useQueries({
    queries: artistIds.map((id) => ({
      queryKey: ['memories', 'artist', id],
      queryFn: () => proxyFetch(`/artists/${id}`),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
    })),
  });
  const artistsLoading = artistQueries.some(q => q.isLoading);
  const artistsData = artistQueries.map(q => q.data).filter(Boolean);

  // Fetch Playlists individually
  const playlistQueries = useQueries({
    queries: playlistIds.map((id) => ({
      queryKey: ['memories', 'playlist', id],
      queryFn: () => proxyFetch(`/playlists/${id}`),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
    })),
  });
  const playlistsLoading = playlistQueries.some(q => q.isLoading);
  const playlistsData = playlistQueries.map(q => q.data).filter(Boolean);

  const isLoading = tracksLoading || artistsLoading || playlistsLoading;

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-80 min-h-[200px]">
        <div className="text-4xl mb-4">📓</div>
        <div className="text-[var(--color-dark)] font-pixel text-xs font-bold text-center">NO MEMORIES YET</div>
        <div className="text-[var(--color-dark)] font-pixel text-xs mt-2 text-center max-w-[240px] font-medium">
          Save a song, artist, or playlist here when it means something special to you.
        </div>
      </div>
    );
  }

  // Map to entity
  const entityMap = new Map<string, any>();
  tracksData?.forEach((t: any) => t && entityMap.set(t.uri, t));
  artistsData?.forEach((a: any) => a && entityMap.set(a.uri, a));
  playlistsData?.forEach((p: any) => p && entityMap.set(p.uri, p));

  return (
    <div className="flex flex-col h-full overflow-y-auto min-h-0 pb-10">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="font-pixel text-xs font-bold uppercase tracking-wider text-[var(--color-dark)]">MY MEMORIES</span>
        <span className="text-xs text-[var(--color-dark)] font-pixel font-bold">{memories.length} SAVED</span>
      </div>

      {error && (
        <div className="bg-[var(--color-light)] border border-[var(--color-vibrant)] text-[var(--color-vibrant)] p-2.5 rounded-xl font-pixel text-xs flex items-center justify-between font-bold mb-3 shrink-0 shadow-2xs">
          <span>⚠️ {error}</span>
          <button onClick={clearError} className="text-[var(--color-dark)] hover:opacity-75 font-bold ml-2">✕</button>
        </div>
      )}

      {isLoading && (
        <div className="text-center font-pixel text-xs text-[var(--color-dark)] font-medium animate-pulse my-4">
          RECALLING MEMORIES...
        </div>
      )}

      <div className="flex flex-col gap-4">
        {memories.map((memory) => {
          const entity = entityMap.get(memory.spotifyUri);
          const isFailed = !isLoading && !entity;

          return (
            <div key={memory.id} className="flex flex-col bg-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-2xl overflow-hidden hover:border-[var(--color-muted)] transition-colors group shadow-xs">
              {/* Note Section */}
              <div className="p-3 bg-white/70 border-b-2 border-[#FFD9EA]">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex gap-2 items-center flex-wrap">
                    {memory.category && (
                      <span className="bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] font-pixel text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">
                        {memory.category}
                      </span>
                    )}
                    {memory.dateLabel && (
                      <span className="text-[var(--color-dark)] font-pixel text-xs font-semibold uppercase">
                        {memory.dateLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditMemory(entity || null, memory.entityType, memory.id)} className="text-xs font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] font-pixel px-2 py-0.5 rounded hover:bg-white/80 transition-colors">EDIT</button>
                    <button onClick={() => deleteMemory(memory.id)} className="text-xs font-bold text-[var(--color-dark)] hover:text-[var(--color-dark)] font-pixel px-2 py-0.5 rounded hover:bg-white/80 transition-colors">DELETE</button>
                  </div>
                </div>
                <p className="font-pixel text-xs sm:text-sm text-[var(--color-dark)] leading-relaxed whitespace-pre-wrap mt-2 font-medium">
                  "{memory.note}"
                </p>
                <div className="text-[var(--color-dark)] font-pixel text-xs mt-2 text-right font-medium">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Entity Section */}
              <div className="p-1">
                {isFailed ? (
                  <div className="p-2 text-center text-[var(--color-dark)] font-pixel text-xs font-medium">
                    SPOTIFY ENTITY UNAVAILABLE
                  </div>
                ) : entity ? (
                  memory.entityType === 'track' ? (
                    <TrackRow
                      track={entity}
                      onPlay={() => onPlayTrack(entity.uri)}
                      onAddToQueue={onAddToQueue}
                      onAddToPlaylist={onAddToPlaylist}
                    />
                  ) : memory.entityType === 'artist' ? (
                    <ArtistCard
                      artist={entity}
                      onClick={onClickArtist}
                      variant="compact"
                    />
                  ) : memory.entityType === 'playlist' ? (
                    <PlaylistCard
                      playlist={entity}
                      onClick={() => onClickPlaylist(entity.id)}
                      variant="compact"
                    />
                  ) : null
                ) : (
                  <div className="h-10 animate-pulse bg-[var(--color-light)] rounded-xl mx-2 my-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
