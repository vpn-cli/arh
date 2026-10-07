import React, { useEffect, useState } from 'react';
import { useArtist, useArtistAlbums, useArtistFeaturedTracks } from '@/hooks/useArtist';
import { ArtistHeader } from './ArtistHeader';
import { AlbumCard } from './AlbumCard';
import { TrackList } from './TrackList';

interface ArtistDetailProps {
  artistId: string;
  onBack: () => void;
  onClickAlbum: (id: string) => void;
  onPlayTrack?: (uri: string, contextUri?: string) => void;
  onAddToQueue?: (track: any, contextUri?: string) => void;
  onAddToPlaylist?: (uri: string) => void;
  onAddMemory?: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
}

export function ArtistDetail({ artistId, onBack, onClickAlbum, onPlayTrack, onAddToQueue, onAddToPlaylist, onAddMemory }: ArtistDetailProps) {
  const { data: artist, isLoading: isLoadingArtist, isError: isArtistError, error: artistError } = useArtist(artistId);
  const { data: albumsData, isLoading: isLoadingAlbums, isError: isAlbumsError, error: albumsError } = useArtistAlbums(artistId);
  const { data: featuredTracksData, isLoading: isLoadingFeaturedTracks, isError: isFeaturedTracksError, error: featuredTracksError } = useArtistFeaturedTracks(artist?.name);
  
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  
  useEffect(() => {
    const aError = artistError as Record<string, unknown>;
    const alError = albumsError as Record<string, unknown>;
    const ftError = featuredTracksError as Record<string, unknown>;
    if (aError?.status === 429 && aError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(aError.retryAfter as number);
    } else if (alError?.status === 429 && alError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(alError.retryAfter as number);
    } else if (ftError?.status === 429 && ftError?.retryAfter && rateLimitTimer === null) {
      setRateLimitTimer(ftError.retryAfter as number);
    }
  }, [artistError, albumsError, featuredTracksError, rateLimitTimer]);

  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  if (isArtistError && (artistError as Record<string, unknown>)?.status === 429) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[#FF4500] font-pixel text-xs text-center px-4">
          RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((artistError as any)?.retryAfter ?? 60)} SECONDS.
        </div>
        <button onClick={onBack} className="mt-4 font-pixel text-[var(--color-muted)] text-[10px]">GO BACK</button>
      </div>
    );
  }

  if (isLoadingArtist) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[var(--color-muted)] font-pixel text-xs animate-pulse">LOADING ARTIST...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[var(--color-muted)] font-pixel text-xs">ARTIST NOT FOUND</div>
        <button onClick={onBack} className="mt-4 font-pixel text-[var(--color-muted)] text-[10px]">GO BACK</button>
      </div>
    );
  }

  const items = albumsData?.items || [];
  
  // Deduplicate by name (sometimes API returns same album from different regions)
  const uniqueItems = items.reduce((acc: any[], item: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!acc.some(x => x.name === item.name)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const albums = uniqueItems.filter((item: any) => item.album_group === 'album');
  const singles = uniqueItems.filter((item: any) => item.album_group === 'single' || item.album_type === 'single');

  return (
    <div className="flex flex-col h-full w-full">
      <ArtistHeader 
        artist={artist} 
        onBack={onBack} 
      />
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
        {isAlbumsError && (albumsError as Record<string, unknown>)?.status === 429 ? (
          <div className="flex items-center justify-center text-[#FF4500] font-pixel text-xs text-center px-4 h-20">
            RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((albumsError as Record<string, unknown>)?.retryAfter as number ?? 60)} SECONDS.
          </div>
        ) : isAlbumsError ? (
          <div className="flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2 h-20">
            <span className="text-[#FF4500]">RELEASES UNAVAILABLE</span>
          </div>
        ) : isLoadingAlbums ? (
          <div className="flex items-center justify-center text-[var(--color-muted)] font-pixel text-xs animate-pulse h-20">
            LOADING RELEASES...
          </div>
        ) : (
          <>
            {/* Featured Tracks Section */}
            {isFeaturedTracksError && (featuredTracksError as Record<string, unknown>)?.status === 429 ? (
              <div className="flex items-center justify-center text-[#FF4500] font-pixel text-xs text-center px-4 h-20">
                RATE LIMITED BY SPOTIFY.<br/>WAIT {rateLimitTimer || ((featuredTracksError as Record<string, unknown>)?.retryAfter as number ?? 60)} SECONDS.
              </div>
            ) : isFeaturedTracksError ? (
              <div className="flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2 h-20">
                <span className="text-[#FF4500]">FEATURED TRACKS UNAVAILABLE</span>
              </div>
            ) : (featuredTracksData?.tracks?.items && featuredTracksData.tracks.items.length > 0) ? (
              <div className="flex flex-col gap-3">
                <h3 className="font-pixel text-[12px] text-[var(--color-vibrant)]">FEATURED TRACKS</h3>
                <TrackList 
                  tracks={featuredTracksData.tracks.items.slice(0, 5)} 
                  isLoading={isLoadingFeaturedTracks} 
                  onPlayTrack={(uri) => onPlayTrack?.(uri)} 
                  onAddToQueue={(track) => onAddToQueue && onAddToQueue(track)}
                  onAddMemory={onAddMemory ? (track) => onAddMemory(track, 'track') : undefined}
                  variant="compact"
                />
              </div>
            ) : (featuredTracksData && (!featuredTracksData.tracks?.items || featuredTracksData.tracks.items.length === 0)) ? (
              <div className="flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2 h-20 text-[var(--color-muted)]/70">
                NO FEATURED TRACKS FOUND
              </div>
            ) : isLoadingFeaturedTracks ? (
              <div className="flex items-center justify-center text-[var(--color-muted)] font-pixel text-xs animate-pulse h-20">
                FEATURED TRACKS...
              </div>
            ) : null}

            {albums.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-pixel text-[12px] text-[var(--color-vibrant)]">ALBUMS</h3>
                <div className="flex flex-col gap-2">
                  {albums.map((album: any) => (
                    <AlbumCard key={album.id} album={album} onClick={onClickAlbum} variant="default" />
                  ))}
                </div>
              </div>
            )}
            
            {singles.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-pixel text-[12px] text-[var(--color-vibrant)]">SINGLES & EPS</h3>
                <div className="flex flex-col gap-2">
                  {singles.map((single: any) => (
                    <AlbumCard key={single.id} album={single} onClick={onClickAlbum} variant="default" />
                  ))}
                </div>
              </div>
            )}

            {albums.length === 0 && singles.length === 0 && (
              <div className="flex flex-col items-center justify-center font-pixel text-[10px] text-center px-4 gap-2 h-20 text-[var(--color-muted)]/70">
                NO RELEASES FOUND
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
