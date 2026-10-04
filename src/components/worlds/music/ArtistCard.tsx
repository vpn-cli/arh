import React from 'react';

interface ArtistCardProps {
  artist: any;
  onClick: (id: string) => void;
  onAddMemory?: (artist: any) => void;
  variant?: 'default' | 'compact';
}

export function ArtistCard({ artist, onClick, onAddMemory, variant = 'default' }: ArtistCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-8 h-8' : 'w-10 h-10';
  const titleSize = isCompact ? 'text-[10px] font-bold font-retro' : 'text-sm font-pixel uppercase';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF0F5] transition-all text-left border border-transparent hover:border-[#FFB6C1] shrink-0"
    >
      <button 
        onClick={() => onClick(artist.id)}
        className="flex-1 flex items-center gap-3 active:scale-95 text-left truncate min-w-0"
      >
      {artist.images && artist.images[0] ? (
        <img src={artist.images[0].url} alt={artist.name} className={`${imgSize} rounded-full shadow-sm object-cover transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md shrink-0`} />
      ) : (
        <div className={`${imgSize} rounded-full bg-[#FFB6C1]/30 flex items-center justify-center shadow-sm shrink-0`} />
      )}
      <div className={`flex-1 overflow-hidden z-10 relative ${isCompact ? 'flex flex-col min-w-0' : ''}`}>
        <div className="w-full relative overflow-hidden whitespace-nowrap">
          <span className={`${titleSize} text-[#7A2871] transition-colors pr-2 truncate block w-full`} title={artist.name}>
            {artist.name}
          </span>
        </div>
        <div className="font-retro text-[8px] text-[#9B4F96] mt-0.5">ARTIST</div>
      </div>
      </button>
      {onAddMemory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddMemory(artist);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-[#FFB6C1] hover:text-[#D81B60] transition-opacity shrink-0 rounded-full hover:bg-[#FFE4E1]"
          title="Add Memory"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
