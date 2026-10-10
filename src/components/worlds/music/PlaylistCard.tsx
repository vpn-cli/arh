import React from 'react';
import { MusicNoteIcon } from './icons';

interface PlaylistCardProps {
  playlist: any;
  onClick: () => void;
  onAddMemory?: (playlist: any) => void;
  variant?: 'default' | 'compact';
}

export function PlaylistCard({ playlist, onClick, onAddMemory, variant = 'default' }: PlaylistCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';
  const titleSize = isCompact ? 'text-caption font-bold font-pixel' : 'text-body font-bold font-pixel';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0"
    >
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left truncate min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] rounded-lg p-1 -m-1"
        aria-label={`Open playlist ${playlist.name}`}
      >
        {playlist.images && playlist.images.length >= 4 ? (
          <div className={`${imgSize} rounded-lg shadow-sm overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 bg-[var(--color-muted)]`}>
            {playlist.images.slice(0, 4).map((img: any, i: number) => (
              <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
            ))}
          </div>
        ) : playlist.images && playlist.images[0] ? (
          <img src={playlist.images[0].url || playlist.images[0]} alt="" className={`${imgSize} rounded-lg shadow-sm object-cover shrink-0`} />
        ) : (
          <div className={`${imgSize} rounded-lg bg-[var(--color-muted)] flex items-center justify-center shadow-sm shrink-0 text-[var(--color-dark)]`}>
            <MusicNoteIcon size={isCompact ? 14 : 16} />
          </div>
        )}
        <div className="flex-1 overflow-hidden z-10 relative flex flex-col min-w-0">
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[var(--color-dark)] pr-2 truncate block w-full`} title={playlist.name}>
              {playlist.name}
            </span>
          </div>
          {(() => {
            const trackCount = playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : undefined)));
            return (
              <div className="font-pixel text-caption text-[var(--color-dark)] font-medium mt-0.5 truncate">
                Playlist • {playlist.owner?.display_name || 'Spotify'}{trackCount !== undefined ? ` • ${trackCount} tracks` : ''}
              </div>
            );
          })()}
        </div>
      </button>
      {onAddMemory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddMemory(playlist);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add Memory"
          aria-label={`Add memory for playlist ${playlist.name}`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
