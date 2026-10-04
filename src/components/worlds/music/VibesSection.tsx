import React, { useState, useMemo } from 'react';
import { useTopTracks, useTopArtists } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';

interface VibesSectionProps {
  onPlayTrack: (uri: string) => void;
  onPlayTracks: (uris: string[]) => void;
  onAddToQueue: (uri: string) => void;
  onAddToPlaylist: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
  rateLimitTimer: number | null;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

interface VibeCategory {
  id: string;
  label: string;
  count: number;
  artists: any[];
  tracks: any[];
}

export function VibesSection({
  onPlayTrack,
  onPlayTracks,
  onAddToQueue,
  onAddToPlaylist,
  onClickArtist,
  onAddMemory,
  rateLimitTimer
}: VibesSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [selectedVibeId, setSelectedVibeId] = useState<string | null>(null);

  // Use limit 50 to get a good dataset for deriving vibes
  const { data: topTracks, isLoading: isTopTracksLoading, isError: isTopTracksError, error: topTracksError } = useTopTracks(timeRange, { enabled: true, limit: 50 });
  const { data: topArtists, isLoading: isTopArtistsLoading, isError: isTopArtistsError, error: topArtistsError } = useTopArtists(timeRange, { enabled: true, limit: 50 });

  const vibeCategories = useMemo(() => {
    if (!topArtists || !topTracks) return [];
    
    const genreMap = new Map<string, { count: number, artists: any[], tracks: any[] }>();
    let hasAnyGenres = false;
    
    topArtists.forEach((artist: any) => {
      if (artist.genres && Array.isArray(artist.genres) && artist.genres.length > 0) {
        hasAnyGenres = true;
        artist.genres.forEach((g: string) => {
          const id = g;
          if (!genreMap.has(id)) {
            genreMap.set(id, { count: 0, artists: [], tracks: [] });
          }
          const entry = genreMap.get(id)!;
          entry.count += 1;
          entry.artists.push(artist);
        });
      }
    });

    if (hasAnyGenres) {
      topTracks.forEach((track: any) => {
        if (track.artists && Array.isArray(track.artists)) {
          track.artists.forEach((trackArtist: any) => {
            const fullArtist = topArtists.find((a: any) => a.id === trackArtist.id);
            if (fullArtist && fullArtist.genres) {
              fullArtist.genres.forEach((g: string) => {
                const entry = genreMap.get(g);
                if (entry) {
                  if (!entry.tracks.find(t => t.id === track.id)) {
                    entry.tracks.push(track);
                  }
                }
              });
            }
          });
        }
      });
      
      const sorted = Array.from(genreMap.entries())
        .map(([id, data]) => ({ 
          id, 
          label: id.toUpperCase(), 
          count: data.count, 
          artists: data.artists, 
          tracks: data.tracks 
        }))
        .sort((a, b) => b.count !== a.count ? b.count - a.count : b.tracks.length - a.tracks.length);
        
      return sorted.slice(0, 10);
    }

    // FALLBACK: If Spotify did not provide genres, generate Vibes from track data (Decades & Popularity)
    const fallbackMap = new Map<string, { count: number, artists: any[], tracks: any[] }>();
    
    const getDecade = (dateStr?: string) => {
      if (!dateStr || dateStr.length < 4) return null;
      const year = parseInt(dateStr.substring(0, 4));
      if (isNaN(year)) return null;
      const decade = Math.floor(year / 10) * 10;
      return `${decade}s`;
    };

    topTracks.forEach((track: any) => {
      const labels: string[] = [];
      
      // Decade Vibe
      const decade = getDecade(track.album?.release_date);
      if (decade) {
        labels.push(`${decade} MUSIC`);
      }

      // Popularity Vibe
      if (typeof track.popularity === 'number') {
        if (track.popularity >= 80) labels.push('MAINSTREAM HITS');
        else if (track.popularity < 40) labels.push('HIDDEN GEMS');
      }

      labels.forEach(label => {
        if (!fallbackMap.has(label)) {
          fallbackMap.set(label, { count: 0, artists: [], tracks: [] });
        }
        const entry = fallbackMap.get(label)!;
        entry.count += 1;
        if (!entry.tracks.find(t => t.id === track.id)) {
          entry.tracks.push(track);
        }
        // Extract artists from track
        if (track.artists) {
          track.artists.forEach((a: any) => {
            const fullArtist = topArtists.find((ta: any) => ta.id === a.id) || a;
            if (!entry.artists.find(ea => ea.id === a.id)) {
              entry.artists.push(fullArtist);
            }
          });
        }
      });
    });

    const fallbackSorted = Array.from(fallbackMap.entries())
      .map(([id, data]) => ({
        id,
        label: id,
        count: data.count, // count represents track count here roughly
        artists: data.artists,
        tracks: data.tracks
      }))
      .sort((a, b) => b.tracks.length - a.tracks.length);

    return fallbackSorted.slice(0, 10);
  }, [topArtists, topTracks]);

  const selectedVibe = useMemo(() => {
    return vibeCategories.find(v => v.id === selectedVibeId) || null;
  }, [vibeCategories, selectedVibeId]);

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

  if (selectedVibe) {
    return (
      <div className="flex flex-col h-full min-h-0 pb-6">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button 
            onClick={() => setSelectedVibeId(null)}
            className="text-[10px] text-[#7A2871] hover:text-[#D81B60] cursor-pointer font-retro tracking-widest flex items-center gap-1"
          >
            ◀ BACK TO VIBES
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-6 shrink-0 bg-gradient-to-r from-[#FFF0F5] to-[#FFE4E1] p-6 rounded-2xl border-2 border-[#FFB6C1]">
          <h2 className="font-pixel text-xl text-[#D81B60] mb-2 text-center">{selectedVibe.label}</h2>
          <p className="font-retro text-[10px] text-[#9B4F96]">
            {selectedVibe.artists.length} TOP ARTISTS • {selectedVibe.tracks.length} TOP TRACKS
          </p>
          <button 
            onClick={() => {
              if (selectedVibe.tracks.length > 0) {
                onPlayTracks(selectedVibe.tracks.map(t => t.uri));
              }
            }}
            disabled={selectedVibe.tracks.length === 0}
            className="mt-4 bg-[#FF69B4] text-white px-6 py-2 rounded-full font-pixel text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,105,180,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PLAY VIBE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 flex flex-col gap-6">
          {selectedVibe.artists.length > 0 && (
            <section>
              <h3 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">VIBE ARTISTS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {selectedVibe.artists.map((artist) => (
                  <ArtistCard 
                    key={artist.id} 
                    artist={artist} 
                    onClick={onClickArtist} 
                    onAddMemory={(artist) => onAddMemory(artist, 'artist')}
                    variant="compact"
                  />
                ))}
              </div>
            </section>
          )}

          {selectedVibe.tracks.length > 0 && (
            <section>
              <h3 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">VIBE TRACKS</h3>
              <TrackList 
                tracks={selectedVibe.tracks} 
                onPlayTrack={onPlayTrack} 
                onAddToQueue={onAddToQueue} 
                onAddToPlaylist={onAddToPlaylist} 
                onAddMemory={(track) => onAddMemory(track, 'track')}
              />
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
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

      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">YOUR TOP VIBES</h2>
        <p className="font-retro text-[9px] text-[#9B4F96] mb-4 px-1 leading-relaxed">
          Based on your top artists' genres in the selected time range.
        </p>

        {isTopArtistsError ? renderError(topArtistsError, 'DATA') :
         isTopTracksError ? renderError(topTracksError, 'DATA') :
         (isTopArtistsLoading || isTopTracksLoading) ? renderLoading('VIBES') :
         vibeCategories.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {vibeCategories.map(vibe => (
               <button
                 key={vibe.id}
                 onClick={() => setSelectedVibeId(vibe.id)}
                 className="flex flex-col items-start p-4 bg-[#FFFFFF] border-2 border-[#FFE4E1] hover:border-[#FFB6C1] hover:shadow-sm rounded-xl transition-all text-left group"
               >
                 <span className="font-pixel text-[10px] text-[#D81B60] mb-2 group-hover:text-[#FF69B4] transition-colors">{vibe.label}</span>
                 <span className="font-retro text-[9px] text-[#7A2871]">
                   {vibe.artists.length} ARTISTS
                 </span>
                 {vibe.tracks.length > 0 && (
                   <span className="font-retro text-[9px] text-[#9B4F96]">
                     {vibe.tracks.length} TRACKS
                   </span>
                 )}
               </button>
             ))}
           </div>
         ) : (
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO VIBES FOUND. LISTEN TO MORE MUSIC!</div>
         )
        }
      </section>
    </div>
  );
}
