import React, { useMemo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { useQueries } from '@tanstack/react-query';
import { proxyFetch } from '@/lib/spotifyClient';
import { SectionHeader } from './SectionHeader';
import { StickerIcon } from './StickerIcon';
import { StickerSlot } from './stickerConfig';
import { PlayIcon, WarningIcon, CloseIcon } from './icons';

interface MemoriesSectionProps {
  onPlayTrack: (uri: string) => void;
  onPlayPlaylist: (uri: string) => void;
  onAddToQueue: (track: any) => void;
  onAddToPlaylist: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onClickPlaylist: (id: string) => void;
  onEditMemory: (entity: any | null, type: 'track' | 'artist' | 'playlist', memoryId?: string) => void;
}

const STICKER_CYCLE: StickerSlot[] = ['r3c4', 'r2c2', 'r1c3', 'r5c3'];

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

  // Map to entity
  const entityMap = useMemo(() => {
    const map = new Map<string, any>();
    tracksData?.forEach((t: any) => t && map.set(t.uri, t));
    artistsData?.forEach((a: any) => a && map.set(a.uri, a));
    playlistsData?.forEach((p: any) => p && map.set(p.uri, p));
    return map;
  }, [tracksData, artistsData, playlistsData]);

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
            {memories.length} {memories.length === 1 ? 'SAVED' : 'SAVED'}
          </span>
        }
      />

      {error && (
        <div className="bg-[var(--color-light)] border border-[var(--color-vibrant)] text-[var(--color-vibrant)] p-2.5 rounded-xl font-pixel text-caption flex items-center justify-between font-bold mb-3 shrink-0 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <WarningIcon size={14} className="shrink-0 text-[var(--color-vibrant)]" />
            {error}
          </span>
          <button onClick={clearError} className="text-[var(--color-dark)] hover:opacity-75 w-6 h-6 min-w-[24px] min-h-[24px] rounded flex items-center justify-center" aria-label="Clear error">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
        {memories.map((memory, idx) => {
          const entity = entityMap.get(memory.spotifyUri);
          const isFailed = !isLoading && !entity;
          const cornerSticker = STICKER_CYCLE[idx % STICKER_CYCLE.length];
          const tiltDeg = idx % 2 === 0 ? '-1.2deg' : '1.2deg';

          const coverImage =
            entity?.album?.images?.[0]?.url ||
            entity?.images?.[0]?.url ||
            (typeof entity?.album?.images?.[0] === 'string' ? entity.album.images[0] : null) ||
            (typeof entity?.images?.[0] === 'string' ? entity.images[0] : null) ||
            null;

          const artistOrSubtitle =
            entity?.artists?.map((a: any) => a.name).join(', ') ||
            (memory.entityType === 'artist' ? 'Artist' : memory.entityType === 'playlist' ? 'Playlist' : '');

          return (
            <div
              key={memory.id}
              className="mw-card mw-memory-card relative bg-[#fffdfa] rounded-2xl p-4 flex flex-col justify-between select-none"
              style={{
                '--memory-tilt': tiltDeg,
              } as React.CSSProperties}
            >
              {/* Strip of decorative tape at the top centre */}
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/80 border border-[var(--color-muted)]/40 shadow-2xs rotate-[-1deg] pointer-events-none rounded-xs z-10"
                aria-hidden="true"
              />

              {/* 40px corner sticker cycling through ['r3c4', 'r2c2', 'r1c3', 'r5c3'] */}
              <div className="absolute -top-2 -right-2 z-10 pointer-events-none drop-shadow-xs">
                <StickerIcon name={cornerSticker} size={40} />
              </div>

              {/* Header: Chips & Actions */}
              <div className="flex justify-between items-start gap-2 mb-2 pr-6">
                <div className="flex gap-2 items-center flex-wrap">
                  {memory.category && (
                    <span className="bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] font-pixel text-caption px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {memory.category}
                    </span>
                  )}
                  {memory.dateLabel && (
                    <span className="text-[var(--color-dark)] font-pixel text-caption font-semibold uppercase">
                      {memory.dateLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditMemory(entity || null, memory.entityType, memory.id)}
                    className="text-meta font-bold text-[var(--color-dark)] font-pixel min-h-[24px] px-2 py-0.5 rounded hover:bg-[var(--color-light)] transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMemory(memory.id)}
                    className="text-meta font-bold text-[var(--color-dark)] font-pixel min-h-[24px] px-2 py-0.5 rounded hover:bg-[var(--color-light)] transition-colors inline-flex items-center justify-center cursor-pointer"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              {/* Note text large, in quotes */}
              <blockquote className="font-pixel text-title font-bold text-[var(--color-dark)] leading-snug my-2 select-text">
                &ldquo;{memory.note}&rdquo;
              </blockquote>

              {/* Song as a mini polaroid */}
              <div className="mt-3">
                {isFailed ? (
                  <div className="p-2 text-center text-[var(--color-dark)] font-pixel text-caption font-medium border border-[var(--color-muted)]/30 rounded-xl bg-white/50">
                    SPOTIFY ENTITY UNAVAILABLE
                  </div>
                ) : entity ? (
                  <div
                    onClick={() => {
                      if (memory.entityType === 'track') onPlayTrack(entity.uri);
                      else if (memory.entityType === 'artist') onClickArtist(entity.id);
                      else if (memory.entityType === 'playlist') onClickPlaylist(entity.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (memory.entityType === 'track') onPlayTrack(entity.uri);
                        else if (memory.entityType === 'artist') onClickArtist(entity.id);
                        else if (memory.entityType === 'playlist') onClickPlaylist(entity.id);
                      }
                    }}
                    aria-label={`Play ${entity.name || 'item'}`}
                    className="group/polaroid flex items-center gap-3 p-2 bg-white rounded-xl border border-[var(--color-muted)] shadow-2xs hover:bg-[var(--color-light)]/50 cursor-pointer transition-colors"
                  >
                    {/* 56px cover with white border */}
                    <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-lg overflow-hidden border-2 border-white shadow-2xs shrink-0 bg-[var(--color-muted)]/20 relative">
                      {coverImage ? (
                        <img src={coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-dark)] font-bold text-caption">
                          ♪
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/polaroid:opacity-100 flex items-center justify-center transition-opacity">
                        <PlayIcon size={18} className="text-white ml-0.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="font-pixel text-body font-bold text-[var(--color-dark)] truncate">
                        {entity.name}
                      </div>
                      {artistOrSubtitle && (
                        <div className="font-pixel text-caption text-[var(--color-text-muted)] truncate mt-0.5">
                          {artistOrSubtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-14 animate-pulse bg-[var(--color-light)] rounded-xl border border-[var(--color-muted)]/30" />
                )}
              </div>

              {/* Date as small stamp at bottom right */}
              <div className="text-[var(--color-dark)] font-pixel text-caption font-semibold self-end opacity-75 mt-3 px-2 py-0.5 border border-dashed border-[var(--color-muted)] rounded bg-white/60">
                {new Date(memory.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
