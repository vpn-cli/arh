import React, { useState, useMemo } from 'react';
import { useTopTracks, useTopArtists } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';

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
      
      {/* Time Range Selector */}
      <div className="flex bg-[var(--color-light)] p-1 rounded-xl shrink-0 border border-[var(--color-light)]">
        {[
          { id: 'short_term', label: 'Short Term (~4 wks)' },
          { id: 'medium_term', label: 'Medium Term (~6 mos)' },
          { id: 'long_term', label: 'Long Term (all time)' }
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as TimeRange)}
            className={`flex-1 font-pixel text-xs py-2 rounded-lg transition-colors font-bold ${
              timeRange === range.id 
                ? 'bg-[var(--color-vibrant)] text-white shadow-xs' 
                : 'text-[var(--color-dark)] hover:bg-[var(--color-light)]'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Listening Patterns / Summary */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Listening Profile</h2>
        {isTopTracksLoading ? (
          renderLoading('profile')
        ) : isTopTracksError ? (
          renderError(topTracksError, 'profile')
        ) : metrics ? (
          <div className="bg-[#FFFFFF] border-2 border-[var(--color-light)] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-light)] pb-2">
              <span className="font-pixel text-xs text-[var(--color-dark)] font-medium">Unique Artists</span>
              <span className="font-pixel text-xs font-bold text-[var(--color-dark)] text-right ml-2">{metrics.uniqueArtists} artists in your top {metrics.totalTracks} tracks</span>
            </div>
            
            {metrics.multiArtistTrackCount > 0 && (
              <div className="flex items-center justify-between border-b border-[var(--color-light)] pb-2">
                <span className="font-pixel text-xs text-[var(--color-dark)] font-medium">Multi-Artist Tracks</span>
                <span className="font-pixel text-xs font-bold text-[var(--color-dark)] text-right ml-2">{metrics.multiArtistTrackCount} of your top {metrics.totalTracks} tracks</span>
              </div>
            )}

            {metrics.mostFrequentArtist.count > 1 && (
              <div className="flex flex-col pt-1">
                <span className="font-pixel text-xs text-[var(--color-dark)] font-medium mb-1">Most Represented Artist</span>
                <span className="font-pixel text-sm font-bold text-[var(--color-dark)]">
                  {metrics.mostFrequentArtist.name}
                </span>
                <span className="font-pixel text-xs text-[var(--color-dark)] font-medium mt-0.5">
                  {metrics.mostFrequentArtist.count} of your top {metrics.totalTracks} tracks
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[var(--color-dark)] font-pixel text-xs font-medium px-1">Not enough data to compute profile.</div>
        )}
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Top Artists</h2>
        {isTopArtistsError ? renderError(topArtistsError, 'TOP ARTISTS') :
         isTopArtistsLoading ? renderLoading('top artists') :
         topArtists && topArtists.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {topArtists.slice(0, 10).map((artist: any) => (
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
           <div className="text-[var(--color-dark)] font-pixel text-xs font-medium px-1">No top artists found.</div>
         )
        }
      </section>

      {/* Top Tracks */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-pixel text-xs font-bold text-[var(--color-dark)] tracking-wider uppercase">Top Tracks</h2>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri))}
            disabled={!topTracks || topTracks.length === 0}
            className="font-pixel text-xs font-bold bg-[var(--color-vibrant)] text-white px-3 py-1.5 rounded-lg hover:bg-[var(--color-vibrant)] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
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
