import React, { useEffect, useState } from 'react';
import { usePlaylist, usePlaylistItems } from '@/hooks/usePlaylist';
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistActions } from './PlaylistActions';
import { PlaylistTrackList } from './PlaylistTrackList';

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
  onPlayPlaylist: (uri: string) => void;
  onPlayTrack: (uri: string, contextUri?: string) => void;
  onAddToQueue?: (track: any, contextUri?: string) => void;
  onShufflePlay?: (uri: string) => void;
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

  if (isPlaylistError && (playlistError as any)?.status === 429) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[#B91C1C] font-pixel text-xs font-bold text-center px-4">
          Rate limited by Spotify.<br/>Wait {rateLimitTimer || ((playlistError as any)?.retryAfter ?? 60)} seconds.
        </div>
        <button onClick={onBack} className="mt-4 font-pixel text-xs font-bold text-[#881337] bg-white border border-[#FF87BE] px-4 py-1.5 rounded-full hover:bg-[#FFE1EF] transition-all">Go Back</button>
      </div>
    );
  }

  if (isLoadingPlaylist) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[#8C3A7A] font-pixel text-xs font-medium animate-pulse">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-[#7A2871] font-pixel text-xs font-medium">Playlist not found</div>
        <button onClick={onBack} className="mt-4 font-pixel text-xs font-bold text-[#881337] bg-white border border-[#FF87BE] px-4 py-1.5 rounded-full hover:bg-[#FFE1EF] transition-all">Go Back</button>
      </div>
    );
  }

  const handlePlay = () => {
    if (playlist?.uri) {
      onPlayPlaylist(playlist.uri);
    }
  };

  const handleShuffle = () => {
    if (onShufflePlay && playlist?.uri) {
      onShufflePlay(playlist.uri);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <PlaylistHeader 
        playlist={playlist} 
        onBack={onBack} 
        isRestricted={isItemsError && (itemsError as any)?.status === 403}
        onEdit={onEdit}
        onRemove={onRemove}
      />
      <PlaylistActions 
        onPlay={handlePlay} 
        onShuffle={handleShuffle} 
        disabled={isLoadingItems || !itemsData?.items?.length} 
      />
      {isItemsError && (itemsError as any)?.status === 429 ? (
        <div className="flex-1 flex items-center justify-center text-[#B91C1C] font-pixel text-xs font-bold text-center px-4">
          Rate limited by Spotify.<br/>Wait {rateLimitTimer || ((itemsError as any)?.retryAfter ?? 60)} seconds.
        </div>
      ) : isItemsError && (itemsError as any)?.status === 403 ? (
        <div className="flex-1 flex flex-col items-center justify-center font-pixel text-xs text-center px-4 gap-2">
          <span className="text-[#B91C1C] font-bold">Tracks Unavailable</span>
          <span className="text-[#7A2871] leading-relaxed">Spotify does not allow this app to read tracks from this playlist.</span>
        </div>
      ) : (
        <PlaylistTrackList 
          tracks={itemsData?.items || []} 
          isLoading={isLoadingItems} 
          onPlayTrack={(uri) => onPlayTrack(uri, playlist?.uri)} 
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
