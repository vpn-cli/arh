import React, { useState, useMemo } from 'react';
import { useTopTracks, useTopArtists } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { MediaRow } from './MediaRow';
import { pickImage } from '@/lib/spotify/images';
import { ChevronLeftIcon } from './icons';

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

      // Popularity Vibe (degraded gracefully: popularity removed from track objects in Feb 2026)
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

  if (selectedVibe) {
    return (
      <div className="flex flex-col h-full min-h-0 pb-6">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button 
            onClick={() => setSelectedVibeId(null)}
            className="text-meta text-[var(--color-dark)] hover:text-[var(--color-dark)] cursor-pointer font-pixel font-bold tracking-wide flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-lg px-2 py-1"
          >
            <ChevronLeftIcon size={14} /> Back to Vibes
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-6 shrink-0 bg-gradient-to-r from-[var(--color-light)] to-[var(--color-light)] p-6 rounded-2xl border-2 border-[var(--color-muted)]">
          <h2 className="font-pixel text-heading font-bold text-[var(--color-dark)] mb-1 text-center">{selectedVibe.label}</h2>
          <p className="font-pixel text-caption text-[var(--color-dark)] font-medium">
            {selectedVibe.artists.length} Top Artists • {selectedVibe.tracks.length} Top Tracks
          </p>
          <button 
            onClick={() => {
              if (selectedVibe.tracks.length > 0) {
                onPlayTracks(selectedVibe.tracks.map(t => t.uri));
              }
            }}
            disabled={selectedVibe.tracks.length === 0}
            className="mt-4 bg-[var(--color-vibrant)] text-white px-6 py-2.5 rounded-full font-pixel text-body font-bold hover:bg-[var(--color-vibrant)] active:scale-95 transition-all shadow-[0_4px_14px_var(--color-vibrant)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
          >
            Play Vibe
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 flex flex-col gap-6">
          {selectedVibe.artists.length > 0 && (
            <section>
              <h3 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Vibe Artists</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedVibe.artists.map((artist) => (
                  <MediaRow 
                    key={artist.id} 
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
            </section>
          )}

          {selectedVibe.tracks.length > 0 && (
            <section>
              <h3 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-3 px-1">Vibe Tracks</h3>
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
      <div className="flex bg-[var(--color-light)] p-1 rounded-xl shrink-0 border border-[var(--color-light)]">
        {[
          { id: 'short_term', label: 'Short Term (~4 wks)' },
          { id: 'medium_term', label: 'Medium Term (~6 mos)' },
          { id: 'long_term', label: 'Long Term (all time)' }
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as TimeRange)}
            className={`flex-1 font-pixel text-caption py-2 rounded-lg transition-colors font-bold ${
              timeRange === range.id 
                ? 'bg-[var(--color-vibrant)] text-white shadow-xs' 
                : 'text-[var(--color-dark)] hover:bg-[var(--color-light)]'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <section>
        <h2 className="font-pixel text-caption font-bold text-[var(--color-dark)] tracking-wider uppercase mb-1 px-1">Your Top Vibes</h2>
        <p className="font-pixel text-caption text-[var(--color-dark)] font-medium mb-4 px-1 leading-relaxed">
          Based on your top artists&apos; genres in the selected time range.
        </p>

        {isTopArtistsError ? renderError(topArtistsError, 'DATA') :
         isTopTracksError ? renderError(topTracksError, 'DATA') :
         (isTopArtistsLoading || isTopTracksLoading) ? renderLoading('vibes') :
         vibeCategories.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {vibeCategories.map(vibe => (
               <button
                 key={vibe.id}
                 onClick={() => setSelectedVibeId(vibe.id)}
                 className="flex flex-col items-start p-4 bg-[var(--color-bg)] border-2 border-[var(--color-light)] hover:border-[var(--color-muted)] hover:shadow-sm rounded-xl transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
               >
                 <span className="font-pixel text-body font-bold text-[var(--color-dark)] mb-1 group-hover:text-[var(--color-dark)] transition-colors">{vibe.label}</span>
                 <span className="font-pixel text-caption text-[var(--color-dark)] font-medium">
                   {vibe.artists.length} artists
                 </span>
                 {vibe.tracks.length > 0 && (
                   <span className="font-pixel text-caption text-[var(--color-dark)] font-medium">
                     {vibe.tracks.length} tracks
                   </span>
                 )}
               </button>
             ))}
           </div>
         ) : (
           <div className="text-[var(--color-dark)] font-pixel text-caption font-medium px-1">No vibes found. Listen to more music! ♡</div>
         )
        }
      </section>
    </div>
  );
}
