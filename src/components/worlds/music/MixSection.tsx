import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRecentlyPlayed, useTopTracks, useTopArtists, usePlaylists, useBirthdayMix } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';
import { PlaylistCard } from './PlaylistCard';
import { ShuffleIcon, PlayIcon } from './icons';
import { SectionHeader } from './SectionHeader';
import { SegmentedControl } from './SegmentedControl';

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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const displayedMix = isExpanded ? filteredMix : filteredMix.slice(0, 8);

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* ✦ DYNAMIC BIRTHDAY / DAILY MIX ✦ */}
      <section className="mw-panel flex flex-col">
        <SectionHeader
          title="Daily Birthday Mix"
          sticker="r4c4"
          subtitle="Dynamic blend of your recent listens, top tracks, and personal favorites"
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['spotify', 'birthdayMix'] });
                  refetchMix();
                }}
                disabled={isMixLoading}
                className="mw-btn-secondary"
                title="Generate a fresh new mix"
              >
                <ShuffleIcon size={14} />
                <span>Re-mix</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filteredMix.length > 0) {
                    onPlayTracks(filteredMix.map((t: any) => t.uri), filteredMix);
                  }
                }}
                disabled={isMixLoading || filteredMix.length === 0}
                className="mw-btn-primary"
              >
                <PlayIcon size={14} />
                <span>Play mix ({filteredMix.length})</span>
              </button>
            </>
          }
        />
        <div className="border-b border-[var(--color-muted)] my-3" />

        {/* Search within Mix — appears only when expanded */}
        {isExpanded && (
          <div className="mb-3">
            <input
              type="text"
              value={mixSearch}
              onChange={(e) => setMixSearch(e.target.value)}
              placeholder="Search tracks or artists in your mix..."
              className="w-full bg-white border border-[var(--color-muted)] rounded-xl px-3 py-1.5 min-h-[32px] font-pixel text-meta text-[var(--color-dark)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-vibrant)]"
            />
          </div>
        )}

        {isMixError ? renderError(mixError, 'MIX') :
         isMixLoading ? renderLoading('your dynamic mix') :
         filteredMix.length > 0 ? (
           <>
             <div className={isExpanded ? "max-h-[600px] overflow-y-auto pr-1 custom-scrollbar" : ""}>
               <TrackList 
                 tracks={displayedMix} 
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
             {filteredMix.length > 8 && (
               <div className="flex justify-center mt-3">
                 <button
                   type="button"
                   onClick={() => setIsExpanded((prev) => !prev)}
                   className="mw-btn-secondary"
                 >
                   {isExpanded ? 'Show less' : `Show all (${filteredMix.length})`}
                 </button>
               </div>
             )}
           </>
         ) : (
           <div className="text-center py-6 text-[var(--color-dark)] font-pixel text-caption">
             No mix tracks match your search filter.
           </div>
         )
        }
      </section>

      {/* Continue Listening (Latest from Recently Played) */}
      <section className="mw-panel flex flex-col">
        <SectionHeader
          title="Continue listening"
          sticker="continueListening"
        />
        <div className="border-b border-[var(--color-muted)] my-3" />
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
      <section className="mw-panel flex flex-col">
        <SectionHeader
          title="Top tracks"
          sticker="r2c1"
          actions={
            <>
              <SegmentedControl
                value={timeRange}
                onChange={(range) => setTimeRange(range as typeof timeRange)}
                ariaLabel="Top tracks time range"
              />
              <button 
                type="button"
                onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri), topTracks)}
                disabled={!topTracks || topTracks.length === 0}
                className="mw-btn-primary"
              >
                <PlayIcon size={14} />
                <span>Play all</span>
              </button>
            </>
          }
        />
        <div className="border-b border-[var(--color-muted)] my-3" />
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
