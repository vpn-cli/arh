import React, { useMemo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { useQueries } from '@tanstack/react-query';
import { proxyFetch } from '@/lib/spotifyClient';
import { SectionHeader } from './SectionHeader';
import { WarningIcon, CloseIcon } from './icons';
import { MemoryCard } from './MemoryCard';
import { getMemoryDecor, MemoryDecor } from './memoryDecor';

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

    memories.forEach((m) => {
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
  const tracksLoading = trackQueries.some((q) => q.isLoading);
  const tracksData = trackQueries.map((q) => q.data).filter(Boolean);

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
  const artistsLoading = artistQueries.some((q) => q.isLoading);
  const artistsData = artistQueries.map((q) => q.data).filter(Boolean);

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
  const playlistsLoading = playlistQueries.some((q) => q.isLoading);
  const playlistsData = playlistQueries.map((q) => q.data).filter(Boolean);

  const isLoading = tracksLoading || artistsLoading || playlistsLoading;

  // Map to entity
  const entityMap = useMemo(() => {
    const map = new Map<string, any>();
    tracksData?.forEach((t: any) => t && map.set(t.uri, t));
    artistsData?.forEach((a: any) => a && map.set(a.uri, a));
    playlistsData?.forEach((p: any) => p && map.set(p.uri, p));
    return map;
  }, [tracksData, artistsData, playlistsData]);

  // Derive decor for each memory sequentially to guarantee consecutive alternation
  const memoriesWithDecor = useMemo(() => {
    let prevDecor: MemoryDecor | null = null;
    return memories.map((memory) => {
      const decor = getMemoryDecor(memory.id, prevDecor);
      prevDecor = decor;
      return { memory, decor };
    });
  }, [memories]);

  if (memories.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-y-auto min-h-0 pb-10">
        <SectionHeader
          title="My memories"
          sticker="r3c4"
          actions={
            <span className="font-pixel text-caption font-bold text-[var(--color-dark)] px-2.5 py-1 bg-white border border-[var(--color-muted)] rounded-full">
              0 SAVED
            </span>
          }
        />
        <div className="flex flex-col items-center justify-center flex-1 opacity-80 min-h-[200px]">
          <div className="text-display mb-4">📓</div>
          <div className="text-[var(--color-dark)] font-pixel text-caption font-bold text-center">NO MEMORIES YET</div>
          <div className="text-[var(--color-dark)] font-pixel text-caption mt-2 text-center max-w-[240px] font-medium">
            Save a song, artist, or playlist here when it means something special to you.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto min-h-0 pb-10">
      <SectionHeader
        title="My memories"
        sticker="r3c4"
        actions={
          <span className="font-pixel text-caption font-bold text-[var(--color-dark)] px-2.5 py-1 bg-white border border-[var(--color-muted)] rounded-full">
            {memories.length} SAVED
          </span>
        }
      />

      {error && (
        <div className="bg-[var(--color-light)] border border-[var(--color-vibrant)] text-[var(--color-vibrant)] p-2.5 rounded-xl font-pixel text-caption flex items-center justify-between font-bold mb-3 shrink-0 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <WarningIcon size={14} className="shrink-0 text-[var(--color-vibrant)]" />
            {error}
          </span>
          <button
            onClick={clearError}
            className="text-[var(--color-dark)] hover:opacity-75 w-6 h-6 min-w-[24px] min-h-[24px] rounded flex items-center justify-center cursor-pointer"
            aria-label="Clear error"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center font-pixel text-caption text-[var(--color-dark)] font-medium animate-pulse my-4">
          RECALLING MEMORIES...
        </div>
      )}

      {/* Scrapbook Grid: one column when narrow, two when wide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 px-3 sm:px-4">
        {memoriesWithDecor.map(({ memory, decor }) => {
          const entity = entityMap.get(memory.spotifyUri);
          return (
            <MemoryCard
              key={memory.id}
              memory={memory}
              entity={entity}
              isLoading={isLoading}
              decor={decor}
              onPlayTrack={onPlayTrack}
              onClickArtist={onClickArtist}
              onClickPlaylist={onClickPlaylist}
              onEditMemory={onEditMemory}
              onDeleteMemory={deleteMemory}
            />
          );
        })}
      </div>
    </div>
  );
}
