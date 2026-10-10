import React, { useState, useMemo } from 'react';
import { useTopTracks, useTopArtists } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { MediaRow } from './MediaRow';
import { pickImage } from '@/lib/spotify/images';

interface FrequenciesSectionProps {
  onPlayTrack: (uri: string) => void;
  onPlayTracks: (uris: string[]) => void;
  onAddToQueue: (uri: string) => void;
  onAddToPlaylist: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  rateLimitTimer: number | null;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export function FrequenciesSection({
  onPlayTrack,
  onPlayTracks,
  onAddToQueue,
  onAddToPlaylist,
  onClickArtist,
  onAddMemory,
  rateLimitTimer
}: FrequenciesSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');

  // Request slightly more items to generate better insights
  const { data: topTracks, isLoading: isTopTracksLoading, isError: isTopTracksError, error: topTracksError } = useTopTracks(timeRange, { enabled: true, limit: 20 });
  const { data: topArtists, isLoading: isTopArtistsLoading, isError: isTopArtistsError, error: topArtistsError } = useTopArtists(timeRange, { enabled: true, limit: 20 });

  // Compute metrics based strictly on returned data
  const metrics = useMemo(() => {
    if (!topTracks || topTracks.length === 0) return null;

    const artistCounts = new Map<string, { count: number, name: string }>();
    let uniqueArtists = 0;
    let multiArtistTrackCount = 0;

    topTracks.forEach((track: any) => {
      if (track.artists && track.artists.length > 0) {
        if (track.artists.length > 1) {
          multiArtistTrackCount++;
        }
        track.artists.forEach((artist: any) => {
          if (!artistCounts.has(artist.id)) {
            artistCounts.set(artist.id, { count: 0, name: artist.name });
            uniqueArtists++;
          }
          artistCounts.get(artist.id)!.count++;
        });
      }
    });

    let mostFrequentArtist = { name: '', count: 0 };
    artistCounts.forEach((data) => {
      if (data.count > mostFrequentArtist.count) {
        mostFrequentArtist = data;
      }
    });

    return {
      uniqueArtists,
      mostFrequentArtist,
      multiArtistTrackCount,
      totalTracks: topTracks.length
    };
  }, [topTracks]);

  const renderError = (error: any, label: string) => {
    if (error?.status === 429) {
      return (
        <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-xs font-medium text-center px-4 mb-4 border border-[var(--color-dark)]/30 rounded-xl bg-[var(--color-dark)]/5">
          {label} RATE LIMITED.<br/>WAIT {rateLimitTimer || (error?.retryAfter ?? 60)} SECONDS.
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-xs font-medium text-center px-4 mb-4 border border-[var(--color-dark)]/30 rounded-xl bg-[var(--color-dark)]/5">
        Failed to load {label}
      </div>
    );
  };

  const renderLoading = (label: string) => (
    <div className="flex items-center justify-center h-16 text-[var(--color-dark)] font-pixel text-xs font-medium mb-4 animate-pulse">
      Loading {label}...
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* Time Range Segmented Control (3 equal pills) */}
      <div className="grid grid-cols-3 gap-1 bg-[var(--color-light)] p-1 rounded-xl shrink-0 border border-[var(--color-muted)]/40">
        {[
          { id: 'short_term', label: 'Short Term (~4 wks)' },
          { id: 'medium_term', label: 'Medium Term (~6 mos)' },
          { id: 'long_term', label: 'Long Term (all time)' }
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as TimeRange)}
            className={`w-full font-pixel text-xs py-2 rounded-lg transition-all font-bold text-center ${
              timeRange === range.id 
                ? 'bg-[var(--color-vibrant)] text-white shadow-xs' 
                : 'text-[var(--color-dark)] hover:bg-white/50 active:scale-95'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Listening Patterns / Summary (3 stat tiles on palette-tinted surface) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)]">✦</span> Listening Profile
          </h2>
        </div>
        {isTopTracksLoading ? (
          renderLoading('profile')
        ) : isTopTracksError ? (
          renderError(topTracksError, 'profile')
        ) : metrics ? (
          <div className="bg-[var(--color-light)]/70 border-2 border-[var(--color-muted)] rounded-2xl p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/90 border border-[var(--color-muted)]/40 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="font-pixel text-3xl font-extrabold text-[var(--color-dark)]">
                  {metrics.uniqueArtists}
                </span>
                <span className="font-pixel text-xs font-bold text-[var(--color-dark)] opacity-75 mt-1">
                  Unique Artists
                </span>
                <span className="font-pixel text-[11px] text-[var(--color-dark)] opacity-60 mt-0.5">
                  in top {metrics.totalTracks} tracks
                </span>
              </div>

              <div className="bg-white/90 border border-[var(--color-muted)]/40 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="font-pixel text-3xl font-extrabold text-[var(--color-dark)]">
                  {metrics.multiArtistTrackCount}
                </span>
                <span className="font-pixel text-xs font-bold text-[var(--color-dark)] opacity-75 mt-1">
                  Collab Tracks
                </span>
                <span className="font-pixel text-[11px] text-[var(--color-dark)] opacity-60 mt-0.5">
                  multiple artists
                </span>
              </div>

              <div className="bg-white/90 border border-[var(--color-muted)]/40 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="font-pixel text-3xl font-extrabold text-[var(--color-dark)]">
                  {metrics.mostFrequentArtist.count > 0 ? metrics.mostFrequentArtist.count : 0}
                </span>
                <span className="font-pixel text-xs font-bold text-[var(--color-dark)] opacity-75 mt-1">
                  Top Artist Tracks
                </span>
                <span className="font-pixel text-[11px] text-[var(--color-dark)] opacity-60 mt-0.5 truncate max-w-full" title={metrics.mostFrequentArtist.name}>
                  {metrics.mostFrequentArtist.name || 'None'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[var(--color-dark)] font-pixel text-xs font-medium px-1">Not enough data to compute profile.</div>
        )}
      </section>

      {/* Top Artists (MediaRow with ranks in 2 columns) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)]">♥</span> Top Artists
          </h2>
        </div>
        {isTopArtistsError ? renderError(topArtistsError, 'TOP ARTISTS') :
         isTopArtistsLoading ? renderLoading('top artists') :
         topArtists && topArtists.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {topArtists.slice(0, 10).map((artist: any, idx: number) => (
               <MediaRow 
                 key={artist.id} 
                 rank={idx + 1}
                 title={artist.name} 
                 subtitle="Artist"
                 imageUrl={pickImage(artist.images, 48)}
                 imageShape="circle"
                 imageSize={48}
                 onClick={() => onClickArtist(artist.id)} 
                 actions={
                   onAddMemory ? (
                     <button
                       type="button"
                       onClick={() => onAddMemory(artist, 'artist')}
                       className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
                       title="Add Memory"
                       aria-label={`Add memory for artist ${artist.name}`}
                     >
                       <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                         <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                       </svg>
                     </button>
                   ) : undefined
                 }
               />
             ))}
           </div>
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-xs font-medium px-1">No top artists found.</div>
         )
        }
      </section>

      {/* Top Tracks (Play All aligned with heading, MediaRow with ranks via TrackList) */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] flex items-center gap-2">
            <span className="text-[var(--color-vibrant)]">♪</span> Top Tracks
          </h2>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri))}
            disabled={!topTracks || topTracks.length === 0}
            className="font-pixel text-xs font-bold bg-[var(--color-vibrant)] text-white px-3.5 py-2 rounded-xl hover:bg-[var(--color-vibrant)] active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
          >
            Play All
          </button>
        </div>
        {isTopTracksError ? renderError(topTracksError, 'TOP TRACKS') :
         isTopTracksLoading ? renderLoading('top tracks') :
         topTracks && topTracks.length > 0 ? (
           <TrackList 
             tracks={topTracks.slice(0, 10)} 
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-xs font-medium px-1">No top tracks found.</div>
         )
        }
      </section>

    </div>
  );
}
