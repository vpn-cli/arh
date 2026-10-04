import React, { useMemo } from 'react';
import { useMemoriesStore } from '@/store/useMemoriesStore';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch Tracks
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['memories', 'tracks', trackIds],
    queryFn: async () => {
      if (!trackIds.length) return [];
      // Spotify batch track limit is 50, assuming fewer memories for now or we would chunk it.
      const res = await proxyFetch(`/tracks?ids=${trackIds.slice(0, 50).join(',')}`);
      return res?.tracks || [];
    },
    enabled: trackIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });

  // Fetch Artists
  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ['memories', 'artists', artistIds],
    queryFn: async () => {
      if (!artistIds.length) return [];
      const res = await proxyFetch(`/artists?ids=${artistIds.slice(0, 50).join(',')}`);
      return res?.artists || [];
    },
    enabled: artistIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });

  // Fetch Playlists (Spotify doesn't have batch playlists, we fetch individually if needed)
  // For simplicity and network stability (Rule 24), we can use useQueries or Promise.all. 
  // If many playlists, chunk them. Let's do Promise.all for now.
  const { data: playlistsData, isLoading: playlistsLoading } = useQuery({
    queryKey: ['memories', 'playlists', playlistIds],
    queryFn: async () => {
      if (!playlistIds.length) return [];
      const reqs = playlistIds.slice(0, 10).map(id => proxyFetch(`/playlists/${id}`).catch(() => null));
      const res = await Promise.all(reqs);
      return res.filter(Boolean);
    },
    enabled: playlistIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });

  const isLoading = tracksLoading || artistsLoading || playlistsLoading;

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-80 min-h-[200px]">
        <div className="text-4xl mb-4">📓</div>
        <div className="text-[#FFB6C1] font-pixel text-xs text-center">NO MEMORIES YET</div>
        <div className="text-[#7A2871] font-retro text-[10px] mt-2 text-center max-w-[200px]">
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
        <span className="font-pixel text-[10px] text-[#D81B60]">MY MEMORIES</span>
        <span className="text-[10px] text-[#7A2871] font-retro">{memories.length} SAVED</span>
      </div>

      {isLoading && (
        <div className="text-center font-pixel text-[10px] text-[#FFB6C1] animate-pulse my-4">
          RECALLING MEMORIES...
        </div>
      )}

      <div className="flex flex-col gap-4">
        {memories.map((memory) => {
          const entity = entityMap.get(memory.spotifyUri);
          const isFailed = !isLoading && !entity;

          return (
            <div key={memory.id} className="flex flex-col bg-[#FFF0F5] border-2 border-[#FFE4E1] rounded-2xl overflow-hidden hover:border-[#FFB6C1] transition-colors group">
              {/* Note Section */}
              <div className="p-3 bg-white/50 border-b-2 border-[#FFE4E1]">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex gap-2 items-center flex-wrap">
                    {memory.category && (
                      <span className="bg-[#FFB6C1] text-white font-pixel text-[8px] px-2 py-0.5 rounded-full uppercase">
                        {memory.category}
                      </span>
                    )}
                    {memory.dateLabel && (
                      <span className="text-[#9B4F96] font-retro text-[9px] uppercase">
                        {memory.dateLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditMemory(entity || null, memory.entityType, memory.id)} className="text-[#7A2871] hover:text-[#D81B60] font-retro text-[9px]">EDIT</button>
                    <button onClick={() => deleteMemory(memory.id)} className="text-[#7A2871] hover:text-[#FF4500] font-retro text-[9px]">DELETE</button>
                  </div>
                </div>
                <p className="font-retro text-[11px] text-[#7A2871] leading-relaxed whitespace-pre-wrap mt-2">
                  "{memory.note}"
                </p>
                <div className="text-[#9B4F96]/50 font-retro text-[8px] mt-2 text-right">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Entity Section */}
              <div className="p-1">
                {isFailed ? (
                  <div className="p-2 text-center text-[#FFB6C1] font-retro text-[10px]">
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
                  <div className="h-10 animate-pulse bg-[#FFE4E1] rounded-xl mx-2 my-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
