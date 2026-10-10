import React from 'react';
import { ChevronLeftIcon, PersonIcon } from './icons';

interface ArtistHeaderProps {
  artist: any;
  onBack: () => void;
}

export function ArtistHeader({ artist, onBack }: ArtistHeaderProps) {
  if (!artist) return null;
  
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[var(--color-light)] shrink-0">
      <button 
        onClick={onBack} 
        className="p-2 text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-full flex items-center justify-center"
        aria-label="Go back"
      >
        <ChevronLeftIcon size={20} />
      </button>
      {artist.images && artist.images[0] ? (
        <img src={artist.images[0].url} alt="" className="w-20 h-20 rounded-full shadow-md object-cover shrink-0 border-2 border-[var(--color-muted)]" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[var(--color-muted)] flex items-center justify-center shadow-md shrink-0 border-2 border-[var(--color-muted)] text-[var(--color-dark)]">
          <PersonIcon size={32} />
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] truncate" title={artist.name}>{artist.name}</h2>
        {artist.followers?.total ? (
          <div className="font-pixel text-xs sm:text-sm text-[var(--color-dark)] font-medium mt-1 truncate">
            {artist.followers.total.toLocaleString()} followers
          </div>
        ) : null}
        <div className="font-pixel text-xs text-[var(--color-dark)] mt-2 font-bold tracking-wide">
          {artist.genres?.slice(0, 3).join(', ')}
        </div>
      </div>
    </div>
  );
}
