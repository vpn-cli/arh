import React from 'react';

interface PlaylistCardProps {
  playlist: any;
  onClick: () => void;
  onAddMemory?: (playlist: any) => void;
  variant?: 'default' | 'compact';
}

export function PlaylistCard({ playlist, onClick, onAddMemory, variant = 'default' }: PlaylistCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';
  const titleSize = isCompact ? 'text-xs font-bold font-pixel' : 'text-sm font-bold font-pixel';

  return (
    <div
      className="group w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFF0F5] transition-all text-left border border-transparent hover:border-[#FFB6C1] shrink-0"
    >
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 active:scale-95 text-left truncate min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] rounded-lg p-1 -m-1"
        aria-label={`Open playlist ${playlist.name}`}
      >
        {playlist.images && playlist.images[0] ? (
          <img src={playlist.images[0].url} alt="" className={`${imgSize} rounded-lg shadow-sm object-cover transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md shrink-0`} />
        ) : (
          <div className={`${imgSize} rounded-lg bg-[#FFC1DA] flex items-center justify-center shadow-sm shrink-0 text-[#881337] font-bold text-xs`}>
            ♪
          </div>
        )}
        <div className="flex-1 overflow-hidden z-10 relative flex flex-col min-w-0">
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[#4A0E4E] transition-colors pr-2 truncate block w-full`} title={playlist.name}>
              {playlist.name}
            </span>
          </div>
          {(() => {
            const trackCount = playlist.items?.total ?? playlist.tracks?.total ?? playlist.total_tracks ?? (Array.isArray(playlist.items) ? playlist.items.length : (Array.isArray(playlist.tracks?.items) ? playlist.tracks.items.length : (Array.isArray(playlist.tracks) ? playlist.tracks.length : undefined)));
            return (
              <div className="font-pixel text-xs text-[#7A2871] font-medium mt-0.5 truncate">
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
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-2 text-[#7A2871] hover:text-[#881337] transition-opacity shrink-0 rounded-full hover:bg-[#FFE4E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337]"
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
