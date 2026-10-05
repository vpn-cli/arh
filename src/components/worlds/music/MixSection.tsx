import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRecentlyPlayed, useTopTracks, useTopArtists, usePlaylists, useBirthdayMix } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';
import { PlaylistCard } from './PlaylistCard';

interface MixSectionProps {
  onPlayTrack: (uri: string, contextUri?: string, track?: any) => void;
  onPlayTracks: (uris: string[], tracks?: any[]) => void;
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
        <div className="flex items-center justify-center h-16 text-[#B91C1C] font-pixel text-xs font-medium text-center px-4 mb-4 border border-[#B91C1C]/30 rounded-xl bg-[#B91C1C]/5">
          {label} RATE LIMITED.<br/>WAIT {rateLimitTimer || (error?.retryAfter ?? 60)} SECONDS.
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-16 text-[#B91C1C] font-pixel text-xs font-medium text-center px-4 mb-4 border border-[#B91C1C]/30 rounded-xl bg-[#B91C1C]/5">
        Failed to load {label}
      </div>
    );
  };

  const renderLoading = (label: string) => (
    <div className="flex items-center justify-center h-16 text-[#8C3A7A] font-pixel text-xs font-medium mb-4 animate-pulse">
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
      <section className="bg-gradient-to-br from-[#FFE1EF] via-[#FFF3F8] to-[#FFE8F3] border-2 border-[#FF87BE] rounded-3xl p-5 shadow-[0_10px_30px_rgba(255,105,180,0.18)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="font-pixel text-xl sm:text-2xl font-extrabold text-[#881337] tracking-wide">
                Daily Birthday Mix
              </h2>
            </div>
            <p className="font-pixel text-xs text-[#7A2871] mt-1 font-medium">
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
              className="bg-white hover:bg-[#FFE1EF] border border-[#FF87BE] text-[#881337] px-3.5 py-2 rounded-xl font-pixel text-xs font-bold transition-all shadow-xs hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              title="Generate a fresh new mix"
            >
              <span>🔀</span> Re-mix
            </button>
            <button
              onClick={() => {
                if (filteredMix.length > 0) {
                  onPlayTracks(filteredMix.map((t: any) => t.uri), filteredMix);
                }
              }}
              disabled={isMixLoading || filteredMix.length === 0}
              className="bg-[#C2185B] hover:bg-[#A0144F] text-white px-5 py-2 rounded-xl font-pixel text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>▶</span> Play Entire Mix ({filteredMix.length})
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
            className="w-full bg-white border border-[#FFCADF] rounded-xl px-3 py-1.5 font-pixel text-xs text-[#4A0E4E] placeholder:text-[#7A2871]/70 focus:outline-none focus:border-[#C2185B]"
          />
        </div>

        {isMixError ? renderError(mixError, 'MIX') :
         isMixLoading ? renderLoading('your dynamic mix') :
         filteredMix.length > 0 ? (
           <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
             <TrackList 
               tracks={filteredMix} 
               onPlayTrack={(uri) => {
                 const trackObj = filteredMix.find((t: any) => t.uri === uri);
                 onPlayTrack(uri, 'spotify:mix', trackObj);
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
           <div className="text-center py-6 text-[#7A2871] font-pixel text-xs">
             No mix tracks match your search filter.
           </div>
         )
        }
      </section>

      {/* Continue Listening (Latest from Recently Played) */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase mb-3 px-1">Continue Listening</h2>
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
           <div className="text-[#7A2871] font-pixel text-xs font-medium px-1">Nothing recently played yet.</div>
         )
        }
      </section>

      {/* Top Tracks with Time Range Selector */}
      <section>
        <div className="flex flex-wrap justify-between items-center mb-3 px-1 gap-2">
          <div className="flex items-center gap-3">
            <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase">Top Tracks</h2>
            <div className="flex items-center bg-[#FFE4F0] p-0.5 rounded-lg border border-[#FFCADF]">
              <button
                onClick={() => setTimeRange('short_term')}
                className={`font-pixel text-[10px] px-2.5 py-0.5 rounded-md transition-all font-bold ${
                  timeRange === 'short_term' ? 'bg-[#C2185B] text-white shadow-2xs' : 'text-[#7A2871] hover:text-[#881337]'
                }`}
              >
                4 Weeks
              </button>
              <button
                onClick={() => setTimeRange('medium_term')}
                className={`font-pixel text-[10px] px-2.5 py-0.5 rounded-md transition-all font-bold ${
                  timeRange === 'medium_term' ? 'bg-[#C2185B] text-white shadow-2xs' : 'text-[#7A2871] hover:text-[#881337]'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeRange('long_term')}
                className={`font-pixel text-[10px] px-2.5 py-0.5 rounded-md transition-all font-bold ${
                  timeRange === 'long_term' ? 'bg-[#C2185B] text-white shadow-2xs' : 'text-[#7A2871] hover:text-[#881337]'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri), topTracks)}
            disabled={!topTracks || topTracks.length === 0}
            className="font-pixel text-xs font-bold bg-[#C2185B] text-white px-3 py-1.5 rounded-lg hover:bg-[#A0144F] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337]"
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
           <div className="text-[#7A2871] font-pixel text-xs font-medium px-1">No top tracks found.</div>
         )
        }
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase mb-3 px-1">Top Artists</h2>
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
           <div className="text-[#7A2871] font-pixel text-xs font-medium px-1">No top artists found.</div>
         )
        }
      </section>

      {/* Your Playlists */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase mb-3 px-1">Your Playlists</h2>
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
           <div className="text-[#7A2871] font-pixel text-xs font-medium px-1">No playlists found.</div>
         )
        }
      </section>

    </div>
  );
}

