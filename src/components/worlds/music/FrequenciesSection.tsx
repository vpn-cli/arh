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
  rateLimitTimer: number | null;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export function FrequenciesSection({
  onPlayTrack,
  onPlayTracks,
  onAddToQueue,
  onAddToPlaylist,
  onClickArtist,
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
        <div className="flex items-center justify-center h-16 text-[#FF4500] font-pixel text-[10px] text-center px-4 mb-4 border border-[#FF4500]/30 rounded-xl bg-[#FF4500]/5">
          {label} RATE LIMITED.<br/>WAIT {rateLimitTimer || (error?.retryAfter ?? 60)} SECONDS.
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-16 text-[#FF4500] font-pixel text-[10px] text-center px-4 mb-4 border border-[#FF4500]/30 rounded-xl bg-[#FF4500]/5">
        FAILED TO LOAD {label}
      </div>
    );
  };

  const renderLoading = (label: string) => (
    <div className="flex items-center justify-center h-16 text-[#FFB6C1] font-pixel text-[10px] mb-4 animate-pulse">
      LOADING {label}...
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* Time Range Selector */}
      <div className="flex bg-[#FFF0F5] p-1 rounded-xl shrink-0">
        {[
          { id: 'short_term', label: 'SHORT TERM (~4 wks)' },
          { id: 'medium_term', label: 'MEDIUM TERM (~6 mos)' },
          { id: 'long_term', label: 'LONG TERM (all time)' }
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as TimeRange)}
            className={`flex-1 font-pixel text-[8px] sm:text-[9px] py-2 rounded-lg transition-colors ${
              timeRange === range.id 
                ? 'bg-[#FFB6C1] text-[#FFFFFF] shadow-sm' 
                : 'text-[#7A2871] hover:bg-[#FFE4E1]'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Listening Patterns / Summary */}
      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">LISTENING PROFILE</h2>
        {isTopTracksLoading ? (
          renderLoading('PROFILE')
        ) : isTopTracksError ? (
          renderError(topTracksError, 'PROFILE')
        ) : metrics ? (
          <div className="bg-[#FFFFFF] border-2 border-[#FFE4E1] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#FFE4E1] pb-2">
              <span className="font-retro text-[10px] text-[#7A2871]">UNIQUE ARTISTS</span>
              <span className="font-pixel text-[10px] text-[#D81B60] text-right ml-2">{metrics.uniqueArtists} ARTISTS IN YOUR TOP {metrics.totalTracks} TRACKS</span>
            </div>
            
            {metrics.multiArtistTrackCount > 0 && (
              <div className="flex items-center justify-between border-b border-[#FFE4E1] pb-2">
                <span className="font-retro text-[10px] text-[#7A2871]">MULTI-ARTIST TRACKS</span>
                <span className="font-pixel text-[10px] text-[#D81B60] text-right ml-2">{metrics.multiArtistTrackCount} OF YOUR TOP {metrics.totalTracks} TRACKS</span>
              </div>
            )}

            {metrics.mostFrequentArtist.count > 1 && (
              <div className="flex flex-col pt-1">
                <span className="font-retro text-[10px] text-[#7A2871] mb-1">MOST REPRESENTED ARTIST</span>
                <span className="font-pixel text-[10px] text-[#D81B60]">
                  {metrics.mostFrequentArtist.name}
                </span>
                <span className="font-pixel text-[8px] text-[#9B4F96] mt-1">
                  {metrics.mostFrequentArtist.count} OF YOUR TOP {metrics.totalTracks} TRACKS
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NOT ENOUGH DATA</div>
        )}
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">TOP ARTISTS</h2>
        {isTopArtistsError ? renderError(topArtistsError, 'TOP ARTISTS') :
         isTopArtistsLoading ? renderLoading('TOP ARTISTS') :
         topArtists && topArtists.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
             {topArtists.slice(0, 10).map((artist: any) => (
               <ArtistCard 
                 key={artist.id} 
                 artist={artist} 
                 onClick={onClickArtist} 
                 variant="compact"
               />
             ))}
           </div>
         ) : (
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO TOP ARTISTS</div>
         )
        }
      </section>

      {/* Top Tracks */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-pixel text-xs text-[#7A2871]">TOP TRACKS</h2>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri))}
            disabled={!topTracks || topTracks.length === 0}
            className="font-retro text-[10px] bg-[#FFB6C1] text-white px-2 py-1 rounded-md hover:bg-[#FF69B4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            PLAY ALL
          </button>
        </div>
        {isTopTracksError ? renderError(topTracksError, 'TOP TRACKS') :
         isTopTracksLoading ? renderLoading('TOP TRACKS') :
         topTracks && topTracks.length > 0 ? (
           <TrackList 
             tracks={topTracks.slice(0, 10)} 
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
             onAddToPlaylist={onAddToPlaylist} 
           />
         ) : (
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO TOP TRACKS</div>
         )
        }
      </section>

    </div>
  );
}
