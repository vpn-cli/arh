import React from 'react';

interface TrackRowProps {
  index?: number;
  track: any;
  onPlay: (uri: string) => void;
  variant?: 'default' | 'compact';
}

export function TrackRow({ index, track, onPlay, variant = 'default' }: TrackRowProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-8 h-8' : 'w-10 h-10';
  const titleSize = isCompact ? 'text-[10px] font-bold font-retro' : 'text-sm font-pixel uppercase';
  const artistSize = isCompact ? 'text-[8px] text-[#9B4F96]' : 'text-[9px] text-[#D81B60] opacity-80 mt-0.5';

  return (
    <button
      onClick={() => onPlay(track.uri)}
      className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF0F5] transition-all text-left border border-transparent hover:border-[#FFB6C1] shrink-0 active:scale-95"
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
  );
}
