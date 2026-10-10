import React from 'react';
import { ChevronLeftIcon, MusicNoteIcon } from './icons';

interface PlaylistHeaderProps {
  playlist: any;
  onBack: () => void;
  isRestricted?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function PlaylistHeader({ playlist, onBack, isRestricted, onEdit, onRemove }: PlaylistHeaderProps) {
  if (!playlist) return null;
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[var(--color-light)] shrink-0">
      <button 
        onClick={onBack} 
        className="p-2 text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-full flex items-center justify-center"
        aria-label="Go back to playlists"
      >
        <ChevronLeftIcon size={20} />
      </button>
      {playlist.images && playlist.images[0] ? (
        <img src={playlist.images[0].url} alt="" className="w-20 h-20 rounded-xl shadow-md object-cover shrink-0 border border-[var(--color-muted)]" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-[var(--color-muted)] flex items-center justify-center shadow-md shrink-0 border border-[var(--color-muted)] text-[var(--color-dark)]">
          <MusicNoteIcon size={32} />
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center relative">
        <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[var(--color-dark)] truncate pr-16">{playlist.name}</h2>
        <div className="absolute top-0 right-0 flex items-center gap-1">
          {onEdit && (
            <button 
              onClick={onEdit} 
              className="p-1.5 text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-full" 
              title="Edit Playlist"
              aria-label="Edit Playlist"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
          )}
          {onRemove && (
            <button 
              onClick={onRemove} 
              className="p-1.5 text-[var(--color-dark)] hover:text-[var(--color-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-full" 
              title="Remove Playlist"
              aria-label="Remove Playlist"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          )}
        </div>
        {playlist.description && (
          <p className="font-pixel text-xs text-[var(--color-dark)] mt-1 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: playlist.description }} />
        )}
        {(() => {
          const trackCount = playlist.items?.total ?? playlist.tracks?.total ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : (playlist.items?.items?.length ?? 0)));
          return (
            <div className="font-pixel text-xs text-[var(--color-dark)] mt-2 font-bold tracking-wide">
              {isRestricted 
                ? (trackCount ? `${trackCount} tracks` : 'Tracks unavailable')
                : `${trackCount} tracks`
              }
            </div>
          );
        })()}
      </div>
    </div>
  );
}
