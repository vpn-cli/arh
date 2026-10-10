import React from 'react';

interface ArtistCardProps {
  artist: any;
  onClick: (id: string) => void;
  onAddMemory?: (artist: any) => void;
  variant?: 'default' | 'compact';
}

export function ArtistCard({ artist, onClick, onAddMemory, variant = 'default' }: ArtistCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';
  const titleSize = isCompact ? 'text-caption font-bold font-pixel' : 'text-body font-bold font-pixel';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0"
    >
      <button 
        onClick={() => onClick(artist.id)}
        className="flex-1 flex items-center gap-3 text-left truncate min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] rounded-lg p-1 -m-1"
        aria-label={`Open artist ${artist.name}`}
      >
        {artist.images && artist.images[0] ? (
          <img src={artist.images[0].url} alt="" className={`${imgSize} rounded-full shadow-sm object-cover shrink-0 border border-[var(--color-muted)]`} />
        ) : (
          <div className={`${imgSize} rounded-full bg-[var(--color-muted)] text-[var(--color-dark)] font-bold text-caption flex items-center justify-center shadow-sm shrink-0 border border-[var(--color-muted)]`}>
            👤
          </div>
        )}
        <div className="flex-1 overflow-hidden z-10 relative flex flex-col min-w-0">
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[var(--color-dark)] pr-2 truncate block w-full`} title={artist.name}>
              {artist.name}
            </span>
          </div>
          <div className="font-pixel text-caption text-[var(--color-dark)] font-medium mt-0.5">Artist</div>
        </div>
      </button>
      {onAddMemory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddMemory(artist);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add Memory"
          aria-label={`Add memory for artist ${artist.name}`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
