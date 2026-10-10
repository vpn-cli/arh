import React from 'react';
import { ChevronLeftIcon, MusicNoteIcon } from './icons';

interface AlbumHeaderProps {
  album: any;
  onBack: () => void;
}

export function AlbumHeader({ album, onBack }: AlbumHeaderProps) {
  if (!album) return null;
  
  const releaseYear = album.release_date ? album.release_date.substring(0, 4) : '';
  const artistName = album.artists?.map((a: any) => a.name).join(', ') || '';
  
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[var(--color-light)] shrink-0">
      <button 
        onClick={onBack} 
        className="p-2 text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-full flex items-center justify-center"
        aria-label="Go back"
      >
        <ChevronLeftIcon size={20} />
      </button>
      {album.images && album.images[0] ? (
        <img src={album.images[0].url} alt="" className="w-20 h-20 rounded-xl shadow-md object-cover shrink-0 border border-[var(--color-muted)]" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-[var(--color-muted)] flex items-center justify-center shadow-md shrink-0 border border-[var(--color-muted)] text-[var(--color-dark)]">
          <MusicNoteIcon size={32} />
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] truncate" title={album.name}>{album.name}</h2>
        <div className="font-pixel text-xs sm:text-sm text-[var(--color-dark)] font-medium mt-1 truncate" title={artistName}>
          {artistName}
        </div>
        <div className="font-pixel text-xs text-[var(--color-dark)] mt-2 font-bold tracking-wide">
          {album.album_type && `${album.album_type} • `}
          {releaseYear && `${releaseYear} • `}
          {album.total_tracks || 0} tracks
        </div>
      </div>
    </div>
  );
}
