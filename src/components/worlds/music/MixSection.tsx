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
      
      {/* Continue Listening (Latest from Recently Played) */}
      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">CONTINUE LISTENING</h2>
        {isRecentError ? renderError(recentError, 'RECENTLY PLAYED') :
         isRecentLoading ? renderLoading('CONTINUE LISTENING') :
         recentData && recentData.length > 0 ? (
           <TrackList 
             tracks={[recentData[0].track]} 
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NOTHING RECENTLY PLAYED</div>
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
             tracks={topTracks} 
             onPlayTrack={onPlayTrack} 
             onAddToQueue={onAddToQueue} 
             onAddToPlaylist={onAddToPlaylist} 
             onAddMemory={(track) => onAddMemory(track, 'track')}
           />
         ) : (
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO TOP TRACKS</div>
         )
        }
      </section>

      {/* Top Artists */}
      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">TOP ARTISTS</h2>
        {isTopArtistsError ? renderError(topArtistsError, 'TOP ARTISTS') :
         isTopArtistsLoading ? renderLoading('TOP ARTISTS') :
         topArtists && topArtists.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
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
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO TOP ARTISTS</div>
         )
        }
      </section>

      {/* Your Playlists */}
      <section>
        <h2 className="font-pixel text-xs text-[#7A2871] mb-3 px-1">YOUR PLAYLISTS</h2>
        {isPlaylistsError ? renderError(playlistsError, 'PLAYLISTS') :
         isPlaylistsLoading ? renderLoading('PLAYLISTS') :
         playlists && playlists.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
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
           <div className="text-[#FFB6C1] font-pixel text-[10px] px-1">NO PLAYLISTS</div>
         )
        }
      </section>

    </div>
  );
}
