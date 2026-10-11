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

  return (
    <div
      className="group relative w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0 select-none"
    >
      <button 
        type="button"
        onClick={() => onClick(artist.id)}
        className="mw-row-main flex-1 flex items-center gap-3 text-left min-w-0 outline-none focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
        aria-label={`Open artist ${artist.name}`}
      >
        {artist.images && artist.images[0] ? (
          <img src={artist.images[0].url} alt="" className={`${imgSize} rounded-full shadow-2xs object-cover shrink-0 border border-[var(--color-muted)]/30`} />
        ) : (
          <div className={`${imgSize} rounded-full bg-[var(--color-muted)]/20 text-[var(--color-dark)] font-bold text-caption flex items-center justify-center shadow-2xs shrink-0 border border-[var(--color-muted)]/30`}>
            👤
          </div>
        )}
        <div className="flex-1 overflow-hidden min-w-0 flex flex-col justify-center">
          <div
            className="font-pixel text-body font-bold text-[var(--color-dark)] truncate leading-snug"
            title={artist.name}
          >
            {artist.name}
          </div>
          <div className="font-pixel text-meta font-medium text-[var(--color-text-muted)] truncate mt-0.5 leading-tight">
            Artist
          </div>
        </div>
      </button>
      {onAddMemory && (
        <div className="relative z-10 flex items-center gap-1 shrink-0 mw-row-action">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddMemory(artist);
            }}
            className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
            title="Add Memory"
            aria-label={`Add memory for artist ${artist.name}`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
