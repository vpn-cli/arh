import React from 'react';

interface AlbumCardProps {
  album: any;
  onClick: (id: string) => void;
  variant?: 'default' | 'compact';
}

export function AlbumCard({ album, onClick, variant = 'default' }: AlbumCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';
  const titleSize = isCompact ? 'text-xs font-bold font-pixel' : 'text-sm font-bold font-pixel';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-light)] transition-all text-left border border-transparent hover:border-[var(--color-muted)] shrink-0"
    >
      <button
        onClick={() => onClick(album.id)}
        className="flex-1 flex items-center gap-3 active:scale-95 text-left truncate min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-lg p-1 -m-1"
        aria-label={`Open album ${album.name}`}
      >
        {album.images && album.images[0] ? (
          <img src={album.images[0].url} alt="" className={`${imgSize} rounded-lg shadow-sm object-cover transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md shrink-0`} />
        ) : (
          <div className={`${imgSize} rounded-lg bg-[var(--color-muted)] text-[var(--color-dark)] font-bold text-xs flex items-center justify-center shadow-sm shrink-0`}>
            ♪
          </div>
        )}
        <div className="flex-1 overflow-hidden z-10 relative flex flex-col min-w-0">
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[var(--color-dark)] transition-colors pr-2 truncate block w-full`} title={album.name}>
              {album.name}
            </span>
          </div>
          <div className="font-pixel text-xs text-[var(--color-dark)] font-medium mt-0.5 truncate" title={album.artists?.map((a:any)=>a.name).join(', ')}>
            Album • {album.artists?.map((a:any)=>a.name).join(', ')}
          </div>
        </div>
      </button>
    </div>
  );
}
