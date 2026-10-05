import React from 'react';
import { useRecentlyPlayed, useTopTracks, useTopArtists, usePlaylists } from '@/hooks/useSpotify';
import { TrackList } from './TrackList';
import { ArtistCard } from './ArtistCard';
import { PlaylistCard } from './PlaylistCard';

interface MixSectionProps {
  onPlayTrack: (uri: string) => void;
  onPlayTracks: (uris: string[]) => void;
  onAddToQueue: (uri: string) => void;
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
  const { data: recentData, isLoading: isRecentLoading, isError: isRecentError, error: recentError } = useRecentlyPlayed({ enabled: true });
  const { data: topTracks, isLoading: isTopTracksLoading, isError: isTopTracksError, error: topTracksError } = useTopTracks('medium_term', { enabled: true });
  const { data: topArtists, isLoading: isTopArtistsLoading, isError: isTopArtistsError, error: topArtistsError } = useTopArtists('medium_term', { enabled: true });
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

  return (
    <div className="flex flex-col gap-6 pb-6">
      
      {/* Continue Listening (Latest from Recently Played) */}
      <section>
        <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase mb-3 px-1">Continue Listening</h2>
        {isRecentError ? renderError(recentError, 'RECENTLY PLAYED') :
         isRecentLoading ? renderLoading('continue listening') :
         recentData && recentData.length > 0 ? (
           <TrackList 
             tracks={[recentData[0].track]} 
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[#7A2871] font-pixel text-xs font-medium px-1">Nothing recently played yet.</div>
         )
        }
      </section>

      {/* Top Tracks */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="font-pixel text-xs font-bold text-[#881337] tracking-wider uppercase">Top Tracks</h2>
          <button 
            onClick={() => topTracks && onPlayTracks(topTracks.map((t: any) => t.uri))}
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
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
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
