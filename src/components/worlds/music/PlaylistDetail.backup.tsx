import React, { useEffect, useState } from 'react';
import { usePlaylist, usePlaylistItems } from '@/hooks/usePlaylist';
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistActions } from './PlaylistActions';
import { PlaylistTrackList } from './PlaylistTrackList';

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
  onPlayPlaylist: (uri: string) => void;
  onPlayTrack: (uri: string) => void;
  onShufflePlay?: (uri: string) => void;
}

export function PlaylistDetail({ playlistId, onBack, onPlayPlaylist, onPlayTrack, onShufflePlay }: PlaylistDetailProps) {
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
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[var(--color-dark)] opacity-80 font-pixel text-xs text-center px-4">
          RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((playlistError as any)?.retryAfter ?? 60)} SECONDS.
        </div>
        <button onClick={onBack} className="mt-4 font-pixel text-[var(--color-muted)] text-[10px]">GO BACK</button>
      </div>
    );
  }

  if (isLoadingPlaylist) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[var(--color-muted)] font-pixel text-xs animate-pulse">LOADING PLAYLIST...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[var(--color-muted)] font-pixel text-xs">PLAYLIST NOT FOUND</div>
        <button onClick={onBack} className="mt-4 font-pixel text-[var(--color-muted)] text-[10px]">GO BACK</button>
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
      <PlaylistHeader playlist={playlist} onBack={onBack} />
      <PlaylistActions 
        onPlay={handlePlay} 
        onShuffle={handleShuffle} 
        disabled={isLoadingItems || !itemsData?.items?.length} 
      />
      {isItemsError && (itemsError as any)?.status === 429 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-dark)] opacity-80 font-pixel text-xs text-center px-4">
          RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((itemsError as any)?.retryAfter ?? 60)} SECONDS.
        </div>
      ) : isItemsError && (itemsError as any)?.status === 403 ? (
        <div className="flex-1 flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2">
          <span className="text-[var(--color-dark)] opacity-80">TRACKS UNAVAILABLE</span>
          <span className="text-[var(--color-muted)]/70 leading-relaxed uppercase">You don't have access to this playlist's items.</span>
        </div>
      ) : (
        <PlaylistTrackList 
          tracks={itemsData?.items || []} 
          isLoading={isLoadingItems} 
          onPlayTrack={onPlayTrack} 
        />
      )}
    </div>
  );
}
