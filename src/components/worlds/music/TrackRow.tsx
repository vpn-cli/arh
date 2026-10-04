import React from 'react';

interface TrackRowProps {
  index?: number;
  track: any;
  onPlay: (uri: string) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  variant?: 'default' | 'compact';
}

export function TrackRow({ index, track, onPlay, onAddToQueue, onAddToPlaylist, onRemoveFromPlaylist, variant = 'default' }: TrackRowProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-8 h-8' : 'w-10 h-10';
  const titleSize = isCompact ? 'text-[10px] font-bold font-retro' : 'text-sm font-pixel uppercase';
  const artistSize = isCompact ? 'text-[8px] text-[#9B4F96]' : 'text-[9px] text-[#D81B60] opacity-80 mt-0.5';

  return (
    <div className="group w-full flex items-center gap-2 p-2 rounded-xl hover:bg-[#FFF0F5] transition-all text-left border border-transparent hover:border-[#FFB6C1] shrink-0">
      <button
        onClick={() => onPlay(track.uri)}
        className="flex-1 flex items-center gap-3 active:scale-95 text-left truncate min-w-0"
      >
        {index !== undefined && !isCompact && (
          <span className="font-pixel text-[#FFB6C1] text-xs w-4 shrink-0">{index + 1}</span>
        )}
        {track.album?.images && track.album.images[0] ? (
          <img src={track.album.images[0].url} alt={track.name} className={`${imgSize} rounded-lg shadow-sm object-cover transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md shrink-0`} />
        ) : (
          <div className={`${imgSize} rounded-lg bg-[#FFB6C1]/30 flex items-center justify-center shadow-sm shrink-0`} />
        )}
        <div className={`flex-1 overflow-hidden z-10 relative ${isCompact ? 'flex flex-col min-w-0' : ''}`}>
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[#7A2871] transition-colors pr-2 truncate block w-full`} title={track.name}>
              {track.name}
            </span>
          </div>
          <div className={`font-retro transition-opacity truncate w-full ${artistSize}`} title={track.artists?.map((a:any)=>a.name).join(', ')}>
            {track.artists?.map((a:any)=>a.name).join(', ')}
          </div>
        </div>
      </button>

      {onAddToPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(track.uri);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-[#FFB6C1] hover:text-[#D81B60] transition-opacity shrink-0 rounded-full hover:bg-[#FFE4E1]"
          title="Add to Playlist"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z" />
          </svg>
        </button>
      )}

      {onRemoveFromPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromPlaylist(track.uri);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-[#FFB6C1] hover:text-[#FF4500] transition-opacity shrink-0 rounded-full hover:bg-[#FFE4E1]"
          title="Remove from Playlist"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      )}

      {onAddToQueue && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(track);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-[#FFB6C1] hover:text-[#D81B60] transition-opacity shrink-0 rounded-full hover:bg-[#FFE4E1]"
          title="Add to Queue"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
