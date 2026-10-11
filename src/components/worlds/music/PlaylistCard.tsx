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

  return (
    <div
      className="group relative w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0 select-none"
    >
      <button
        type="button"
        onClick={onClick}
        className="mw-row-main flex-1 flex items-center gap-3 text-left min-w-0 outline-none focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
        aria-label={`Open playlist ${playlist.name}`}
      >
        {playlist.images && playlist.images.length >= 4 ? (
          <div className={`${imgSize} rounded-xl shadow-2xs overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 bg-[var(--color-muted)] border border-[var(--color-muted)]/30`}>
            {playlist.images.slice(0, 4).map((img: any, i: number) => (
              <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
            ))}
          </div>
        ) : playlist.images && playlist.images[0] ? (
          <img src={playlist.images[0].url || playlist.images[0]} alt="" className={`${imgSize} rounded-xl shadow-2xs object-cover shrink-0 border border-[var(--color-muted)]/30`} />
        ) : (
          <div className={`${imgSize} rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-muted)]/30 flex items-center justify-center shadow-2xs shrink-0 text-[var(--color-dark)]`}>
            <MusicNoteIcon size={isCompact ? 14 : 16} />
          </div>
        )}
        <div className="flex-1 overflow-hidden min-w-0 flex flex-col justify-center">
          <div
            className="font-pixel text-body font-bold text-[var(--color-dark)] truncate leading-snug"
            title={playlist.name}
          >
            {playlist.name}
          </div>
          {(() => {
            const trackCount = playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : undefined)));
            return (
              <div className="font-pixel text-meta font-medium text-[var(--color-text-muted)] truncate mt-0.5 leading-tight">
                Playlist • {playlist.owner?.display_name || 'Spotify'}{trackCount !== undefined ? ` • ${trackCount} tracks` : ''}
              </div>
            );
          })()}
        </div>
      </button>
      {onAddMemory && (
        <div className="relative z-10 flex items-center gap-1 shrink-0 mw-row-action">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddMemory(playlist);
            }}
            className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
            title="Add Memory"
            aria-label={`Add memory for playlist ${playlist.name}`}
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
