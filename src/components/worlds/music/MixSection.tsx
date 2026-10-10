import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRecentlyPlayed, useTopTracks, useTopArtists, usePlaylists, useBirthdayMix } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';
import { PlaylistCard } from './PlaylistCard';
import { ShuffleIcon, PlayIcon } from './icons';

interface MixSectionProps {
  onPlayTrack: (uri: string, contextUri?: string, track?: any) => void;
  onPlayTracks: (uris: string[], tracks?: any[], offsetPosition?: number) => void;
  onAddToQueue: (uri: string, track?: any) => void;
  onAddToPlaylist: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onClickPlaylist: (id: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  rateLimitTimer: number | null;
}

export function MixSection({
  onPlayTrack,
  onPlayTracks,
  onAddToQueue,
  onAddToPlaylist,
  onClickArtist,
  onClickPlaylist,
  onAddMemory,
  rateLimitTimer
}: MixSectionProps) {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('short_term');
  const [mixSearch, setMixSearch] = useState('');

  const { data: mixTracks = [], isLoading: isMixLoading, isError: isMixError, error: mixError, refetch: refetchMix } = useBirthdayMix({ enabled: true });
  const { data: recentData, isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: true });
  const { data: topTracks, isLoading: isTopTracksLoading, isError: isTopTracksError, error: topTracksError } = useTopTracks(timeRange, { enabled: true, limit: 20 });
  const { data: topArtists, isLoading: isTopArtistsLoading, isError: isTopArtistsError, error: topArtistsError } = useTopArtists(timeRange, { enabled: true, limit: 12 });
  const { data: playlists, isLoading: isPlaylistsLoading, isError: isPlaylistsError, error: playlistsError } = usePlaylists({ enabled: true });

  const renderError = (error: any, label: string) => {
    if (error?.status === 429) {
      return (
        <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-caption font-medium text-center px-4 mb-4 border border-[var(--color-dark)]/30 rounded-xl bg-[var(--color-dark)]/5">
          {label} RATE LIMITED.<br/>WAIT {rateLimitTimer || (error?.retryAfter ?? 60)} SECONDS.
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-caption font-medium text-center px-4 mb-4 border border-[var(--color-dark)]/30 rounded-xl bg-[var(--color-dark)]/5">
        Failed to load {label}
      </div>
    );
  };

  const renderLoading = (label: string) => (
    <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-caption font-medium mb-4 animate-pulse">
      Loading {label}...
    </div>
  );

  const filteredMix = mixTracks.filter((t: any) => {
    if (!mixSearch.trim()) return true;
    const q = mixSearch.toLowerCase();
    const name = t.name?.toLowerCase() || '';
    const artist = t.artists?.map((a: any) => a.name).join(' ').toLowerCase() || '';
    return name.includes(q) || artist.includes(q);
  });

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* ✦ DYNAMIC BIRTHDAY / DAILY MIX ✦ */}
      <section className="bg-gradient-to-br from-[var(--color-light)] via-[var(--color-bg)] to-[var(--color-light)] border-2 border-[var(--color-muted)] rounded-3xl p-5 shadow-[0_10px_30px_rgba(255,105,180,0.18)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-title">✨</span>
              <h2 className="font-pixel text-title sm:text-heading font-extrabold text-[var(--color-dark)] tracking-wide">
                Daily Birthday Mix
              </h2>
            </div>
            <p className="font-pixel text-caption text-[var(--color-dark)] mt-1 font-medium">
              Dynamic blend of your recent listens, top tracks, and personal favorites ♡
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['spotify', 'birthdayMix'] });
                refetchMix();
              }}
              disabled={isMixLoading}
              className="bg-white hover:bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] px-3.5 py-2 rounded-xl font-pixel text-caption font-bold transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-xs hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              title="Generate a fresh new mix"
            >
              <ShuffleIcon size={14} /> Re-mix
            </button>
            <button
              onClick={() => {
                if (filteredMix.length > 0) {
                  onPlayTracks(filteredMix.map((t: any) => t.uri), filteredMix);
                }
              }}
              disabled={isMixLoading || filteredMix.length === 0}
              className="bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-[var(--on-vibrant)] px-5 py-2 rounded-xl font-pixel text-caption font-bold transition-[transform,background-color,color,box-shadow] duration-150 ease-in-out shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlayIcon size={14} /> Play Entire Mix ({filteredMix.length})
            </button>
          </div>
        </div>

        {/* Search within Mix */}
        <div className="mb-3">
          <input
            type="text"
            value={mixSearch}
            onChange={(e) => setMixSearch(e.target.value)}
            placeholder="Search tracks or artists in your mix..."
            className="w-full bg-white border border-[var(--color-light)] rounded-xl px-3 py-1.5 min-h-[32px] font-pixel text-meta text-[var(--color-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-vibrant)]"
          />
        </div>

        {isMixError ? renderError(mixError, 'MIX') :
         isMixLoading ? renderLoading('your dynamic mix') :
         filteredMix.length > 0 ? (
           <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
             <TrackList 
               tracks={filteredMix} 
               onPlayTrack={(uri) => {
                 const tappedIndex = filteredMix.findIndex((t: any) => t.uri === uri);
                 const position = tappedIndex >= 0 ? tappedIndex : 0;
                 onPlayTracks(filteredMix.map((t: any) => t.uri), filteredMix, position);
               }} 
               onAddToQueue={(uri) => {
                 const trackObj = filteredMix.find((t: any) => t.uri === uri);
                 onAddToQueue(uri, trackObj);
               }} 
               onAddToPlaylist={onAddToPlaylist} 
               onAddMemory={(track) => onAddMemory(track, 'track')}
             />
           </div>
         ) : (
           <div className="text-center py-6 text-[var(--color-dark)] font-pixel text-caption">
             No mix tracks match your search filter.
           </div>
         )
        }
      </section>

      {/* Continue Listening (Latest from Recently Played) */}
      <section>
        <h2 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Continue Listening</h2>
        {isRecentError ? renderError(recentError, 'RECENTLY PLAYED') :
         isRecentLoading ? renderLoading('continue listening') :
         recentData && recentData.length > 0 ? (
           <TrackList 
             tracks={[recentData[0].track]} 
             onPlayTrack={(uri) => onPlayTrack(uri, undefined, recentData[0].track)} 
             onAddToQueue={(uri) => onAddToQueue(uri, recentData[0].track)} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-caption font-medium px-1">Nothing recently played yet.</div>
         )
        }
      </section>

      {/* Top Tracks with Time Range Selector */}
      <section>
        <div className="flex flex-wrap justify-between items-center mb-3 px-1 gap-2">
          <div className="flex items-center gap-3">
            <h2 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase">Top Tracks</h2>
            <div className="flex items-center bg-[var(--color-light)] p-0.5 rounded-lg border border-[var(--color-light)]">
              <button
                onClick={() => setTimeRange('short_term')}
                className={`font-pixel text-meta min-h-[24px] px-2.5 py-1 rounded-md transition-all font-bold flex items-center justify-center ${
                  timeRange === 'short_term' ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-2xs' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
                }`}
              >
                4 Weeks
              </button>
              <button
                onClick={() => setTimeRange('medium_term')}
                className={`font-pixel text-meta min-h-[24px] px-2.5 py-1 rounded-md transition-all font-bold flex items-center justify-center ${
                  timeRange === 'medium_term' ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-2xs' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeRange('long_term')}
                className={`font-pixel text-meta min-h-[24px] px-2.5 py-1 rounded-md transition-all font-bold flex items-center justify-center ${
                  timeRange === 'long_term' ? 'bg-[var(--color-vibrant)] text-[var(--on-vibrant)] shadow-2xs' : 'text-[var(--color-dark)] hover:text-[var(--color-dark)]'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri), topTracks)}
            disabled={!topTracks || topTracks.length === 0}
            className="font-pixel text-meta min-h-[24px] font-bold bg-[var(--color-vibrant)] text-[var(--on-vibrant)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-vibrant)] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] flex items-center justify-center"
          >
            Play All
          </button>
        </div>
        {isTopTracksError ? renderError(topTracksError, 'TOP TRACKS') :
         isTopTracksLoading ? renderLoading('top tracks') :
         topTracks && topTracks.length > 0 ? (
           <TrackList 
             tracks={topTracks} 
             onPlayTrack={(uri) => {
               const trackObj = topTracks.find((t: any) => t.uri === uri);
               onPlayTrack(uri, undefined, trackObj);
             }} 
             onAddToQueue={(uri) => {
               const trackObj = topTracks.find((t: any) => t.uri === uri);
               onAddToQueue(uri, trackObj);
             }} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-caption font-medium px-1">No top tracks found.</div>
         )
        }
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Top Artists</h2>
        {isTopArtistsError ? renderError(topArtistsError, 'TOP ARTISTS') :
         isTopArtistsLoading ? renderLoading('top artists') :
         topArtists && topArtists.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {topArtists.map((artist: any) => (
               <ArtistCard 
                 key={artist.id} 
                 artist={artist} 
                 onClick={onClickArtist} 
                 onAddMemory={(artist) => onAddMemory(artist, 'artist')}
                 variant="compact"
               />
             ))}
           </div>
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-caption font-medium px-1">No top artists found.</div>
         )
        }
      </section>

      {/* Your Playlists */}
      <section>
        <h2 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Your Playlists</h2>
        {isPlaylistsError ? renderError(playlistsError, 'PLAYLISTS') :
         isPlaylistsLoading ? renderLoading('playlists') :
         playlists && playlists.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {playlists.slice(0, 10).map((playlist: any) => (
               <PlaylistCard 
                 key={playlist.id} 
                 playlist={playlist} 
                 onClick={() => onClickPlaylist(playlist.id)} 
                 onAddMemory={(playlist) => onAddMemory(playlist, 'playlist')}
                 variant="compact"
               />
             ))}
           </div>
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-caption font-medium px-1">No playlists found.</div>
         )
        }
      </section>

    </div>
  );
}

