import React from 'react';

interface AlbumCardProps {
  album: any;
  onClick: (id: string) => void;
  variant?: 'default' | 'compact';
}

export function AlbumCard({ album, onClick, variant = 'default' }: AlbumCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-8 h-8' : 'w-10 h-10';
  const titleSize = isCompact ? 'text-[10px] font-bold font-retro' : 'text-sm font-pixel uppercase';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF0F5] transition-all text-left border border-transparent hover:border-[#FFB6C1] shrink-0"
    >
      <button
        onClick={() => onClick(album.id)}
        className="flex-1 flex items-center gap-3 active:scale-95 text-left truncate min-w-0"
      >
      {album.images && album.images[0] ? (
        <img src={album.images[0].url} alt={album.name} className={`${imgSize} rounded-lg shadow-sm object-cover transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md shrink-0`} />
      ) : (
        <div className={`${imgSize} rounded-lg bg-[#FFB6C1]/30 flex items-center justify-center shadow-sm shrink-0`} />
      )}
      <div className={`flex-1 overflow-hidden z-10 relative ${isCompact ? 'flex flex-col min-w-0' : ''}`}>
        <div className="w-full relative overflow-hidden whitespace-nowrap">
          <span className={`${titleSize} text-[#7A2871] transition-colors pr-2 truncate block w-full`} title={album.name}>
            {album.name}
          </span>
        </div>
        <div className="font-retro text-[8px] text-[#9B4F96] mt-0.5 truncate" title={album.artists?.map((a:any)=>a.name).join(', ')}>
          ALBUM • {album.artists?.map((a:any)=>a.name).join(', ')}
        </div>
      </div>
      </button>
    </div>
  );
}
