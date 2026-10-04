import React, { useEffect, useState } from 'react';
import { useAlbum, useAlbumTracks, useAlbumSavedStatus, useAlbumMutations } from '@/hooks/useAlbum';
import { AlbumHeader } from './AlbumHeader';
import { AlbumActions } from './AlbumActions';
import { AlbumTrackList } from './AlbumTrackList';

interface AlbumDetailProps {
  albumId: string;
  onBack: () => void;
  onPlayAlbum: (uri: string) => void;
  onPlayTrack: (uri: string, contextUri?: string) => void;
  onAddToQueue?: (track: any, contextUri?: string) => void;
  onAddToPlaylist?: (uri: string) => void;
  onShufflePlay?: (uri: string) => void;
}

export function AlbumDetail({ albumId, onBack, onPlayAlbum, onPlayTrack, onAddToQueue, onAddToPlaylist, onShufflePlay }: AlbumDetailProps) {
  const { data: album, isLoading: isLoadingAlbum, isError: isAlbumError, error: albumError } = useAlbum(albumId);
  const { data: itemsData, isLoading: isLoadingItems, isError: isItemsError, error: itemsError } = useAlbumTracks(albumId, album);
  
  const { data: isSaved = false } = useAlbumSavedStatus(albumId);
  const { toggleSaveAlbum } = useAlbumMutations();

  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  
  useEffect(() => {
    const aError = albumError as any;
    const iError = itemsError as any;
    if (aError?.status === 429 && aError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(aError.retryAfter);
    } else if (iError?.status === 429 && iError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(iError.retryAfter);
    }
  }, [albumError, itemsError, rateLimitTimer]);

  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  if (isAlbumError && (albumError as any)?.status === 429) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[#FF4500] font-pixel text-xs text-center px-4">
          RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((albumError as any)?.retryAfter ?? 60)} SECONDS.
        </div>
        <button onClick={onBack} className="mt-4 font-pixel text-[#FF69B4] text-[10px]">GO BACK</button>
      </div>
    );
  }

  if (isLoadingAlbum) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[#FFB6C1] font-pixel text-xs animate-pulse">LOADING ALBUM...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[#FFB6C1] font-pixel text-xs">ALBUM NOT FOUND</div>
        <button onClick={onBack} className="mt-4 font-pixel text-[#FF69B4] text-[10px]">GO BACK</button>
      </div>
    );
  }

  const handlePlay = () => {
    if (album?.uri) {
      onPlayAlbum(album.uri);
    }
  };

  const handleShuffle = () => {
    if (onShufflePlay && album?.uri) {
      onShufflePlay(album.uri);
    }
  };
  
  const handleToggleSave = async () => {
    try {
      await toggleSaveAlbum.mutateAsync({ albumId, isSaved });
    } catch (e: any) {
      console.error('Failed to toggle album save status', e);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AlbumHeader 
        album={album} 
        onBack={onBack} 
      />
      <AlbumActions 
        onPlay={handlePlay} 
        onShuffle={handleShuffle} 
        onToggleSave={handleToggleSave}
        isSaved={isSaved}
        disabled={isLoadingItems || !itemsData?.items?.length} 
      />
      {isItemsError && (itemsError as any)?.status === 429 ? (
        <div className="flex-1 flex items-center justify-center text-[#FF4500] font-pixel text-xs text-center px-4">
          RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((itemsError as any)?.retryAfter ?? 60)} SECONDS.
        </div>
      ) : isItemsError ? (
        <div className="flex-1 flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2">
          <span className="text-[#FF4500]">TRACKS UNAVAILABLE</span>
          <span className="text-[#FFB6C1]/70 leading-relaxed uppercase">UNABLE TO LOAD ALBUM TRACKS.</span>
        </div>
      ) : (
        <AlbumTrackList 
          tracks={itemsData?.items || []} 
          isLoading={isLoadingItems} 
          onPlayTrack={(uri) => onPlayTrack(uri, album?.uri)} 
          onAddToQueue={(track) => onAddToQueue && onAddToQueue(track, album?.uri)}
        />
      )}
    </div>
  );
}
