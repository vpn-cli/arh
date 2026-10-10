import React, { useEffect, useState } from 'react';
import { usePlaylist, usePlaylistItems } from '@/hooks/usePlaylist';
import { normalizePlaylistItem } from '@/lib/spotify/library';
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistTrackList } from './PlaylistTrackList';

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
  onPlayPlaylist: (uri: string, tracks?: any[]) => void;
  onPlayTrack: (uri: string, contextUri?: string, track?: any) => void;
  onAddToQueue?: (track: any, contextUri?: string) => void;
  onShufflePlay?: (uri: string, tracks?: any[]) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onAddMemory?: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
}

export function PlaylistDetail({ playlistId, onBack, onPlayPlaylist, onPlayTrack, onAddToQueue, onShufflePlay, onAddToPlaylist, onRemoveFromPlaylist, onReorder, onEdit, onRemove, onAddMemory }: PlaylistDetailProps) {
  const { data: playlist, isLoading: isLoadingPlaylist, isError: isPlaylistError, error: playlistError } = usePlaylist(playlistId);
  const { data: itemsData, isLoading: isLoadingItems, isError: isItemsError, error: itemsError } = usePlaylistItems(playlistId);

  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  
  useEffect(() => {
    const pError = playlistError as any;
    const iError = itemsError as any;
    if (pError?.status === 429 && pError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(pError.retryAfter);
    } else if (iError?.status === 429 && iError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(iError.retryAfter);
    }
  }, [playlistError, itemsError, rateLimitTimer]);

  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  const resolvedTracks = React.useMemo(() => {
    if (itemsData?.items && itemsData.items.length > 0) {
      return itemsData.items;
    }
    if (playlist?.tracks?.items && Array.isArray(playlist.tracks.items) && playlist.tracks.items.length > 0) {
      return playlist.tracks.items.map(normalizePlaylistItem).filter(Boolean);
    }
    if (Array.isArray(playlist?.items) && playlist.items.length > 0) {
      return playlist.items.map(normalizePlaylistItem).filter(Boolean);
    }
    return [];
  }, [itemsData, playlist]);

  const totalTrackCount = 
    itemsData?.total ??
    (itemsData?.items?.length) ??
    playlist?.tracks?.total ??
    playlist?.items?.total ??
    resolvedTracks.length;

  if (isPlaylistError && (playlistError as any)?.status === 429) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[var(--color-dark)] font-pixel text-caption font-bold text-center px-4">
          Rate limited by Spotify.<br/>Wait {rateLimitTimer || ((playlistError as any)?.retryAfter ?? 60)} seconds.
        </div>
        <button onClick={onBack} className="mt-4 font-pixel text-meta font-bold text-[var(--color-dark)] bg-white border border-[var(--color-muted)] min-h-[32px] px-4 py-1.5 rounded-full hover:bg-[var(--color-light)] transition-all inline-flex items-center justify-center">Go Back</button>
      </div>
    );
  }

  if (isLoadingPlaylist) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[var(--color-dark)] font-pixel text-caption font-medium animate-pulse">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[var(--color-dark)] font-pixel text-caption font-medium">Playlist not found</div>
        <button onClick={onBack} className="mt-4 font-pixel text-meta font-bold text-[var(--color-dark)] bg-white border border-[var(--color-muted)] min-h-[32px] px-4 py-1.5 rounded-full hover:bg-[var(--color-light)] transition-all inline-flex items-center justify-center">Go Back</button>
      </div>
    );
  }

  const handlePlay = () => {
    if (playlist?.uri) {
      onPlayPlaylist(playlist.uri, resolvedTracks);
    }
  };

  const handleShuffle = () => {
    if (onShufflePlay && playlist?.uri) {
      onShufflePlay(playlist.uri, resolvedTracks);
    }
  };

  const isRestricted = 
    !isLoadingPlaylist &&
    !isLoadingItems &&
    resolvedTracks.length === 0 &&
    (Boolean((itemsError as any)?.status === 403) || !itemsData);

  return (
    <div className="flex flex-col h-full w-full">
      <PlaylistHeader 
        playlist={{
          ...playlist,
          items: {
            total: totalTrackCount
          },
          tracks: {
            total: totalTrackCount
          }
        }} 
        tracks={resolvedTracks}
        onBack={onBack} 
        isRestricted={isRestricted}
        onEdit={onEdit}
        onRemove={onRemove}
        onPlay={handlePlay}
        onShuffle={handleShuffle}
        playDisabled={!playlist?.uri}
        shuffleDisabled={resolvedTracks.length === 0}
      />
      {isItemsError && (itemsError as any)?.status === 429 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-dark)] font-pixel text-caption font-bold text-center px-4">
          Rate limited by Spotify.<br/>Wait {rateLimitTimer || ((itemsError as any)?.retryAfter ?? 60)} seconds.
        </div>
      ) : isRestricted ? (
        <div className="flex-1 flex flex-col items-center justify-center font-pixel text-caption text-center px-4 gap-2 text-[var(--color-dark)]">
          <span className="font-bold text-body">Track list unavailable</span>
          <span className="text-[var(--color-muted)] text-caption max-w-xs leading-relaxed">
            Track list is unavailable for playlists you do not own. You can still play this playlist using the Play button above.
          </span>
        </div>
      ) : (
        <PlaylistTrackList 
          tracks={resolvedTracks} 
          isLoading={isLoadingItems && resolvedTracks.length === 0} 
          onPlayTrack={(uri) => {
            const trackObj = resolvedTracks.find((t: any) => t.uri === uri);
            onPlayTrack(uri, playlist?.uri, trackObj);
          }} 
          onAddToQueue={(track) => onAddToQueue && onAddToQueue(track, playlist?.uri)}
          onAddToPlaylist={onAddToPlaylist}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
          onReorder={onReorder}
          onAddMemory={onAddMemory ? (track) => onAddMemory(track, 'track') : undefined}
        />
      )}
    </div>
  );
}
