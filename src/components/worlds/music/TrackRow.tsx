import React from 'react';

interface TrackRowProps {
  index?: number;
  track: any;
  onPlay: (uri: string, contextUri?: string, trackObj?: any) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  onAddMemory?: (track: any) => void;
  variant?: 'default' | 'compact';
}

export const TrackRow = React.memo(function TrackRow({ index, track, onPlay, onAddToQueue, onAddToPlaylist, onRemoveFromPlaylist, onAddMemory, variant = 'default' }: TrackRowProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';
  const titleSize = isCompact ? 'text-sm font-bold font-pixel' : 'text-base font-bold font-pixel';

  return (
    <div className="group w-full flex items-center gap-2 py-1 px-2 rounded-xl mw-row text-left shrink-0">
      <button
        onClick={() => onPlay(track.uri, undefined, track)}
        className="flex-1 flex items-center gap-3 text-left truncate min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] rounded-lg p-1 -m-1"
        aria-label={`Play ${track.name} by ${track.artists?.map((a: any) => a.name).join(', ') || 'Unknown artist'}`}
      >
        {index !== undefined && !isCompact && (
          <span className="font-pixel text-[var(--color-dark)] font-bold text-xs w-5 shrink-0 text-center">{index + 1}</span>
        )}
        {track.album?.images && track.album.images[0] ? (
          <img src={track.album.images[0].url} alt="" className={`${imgSize} rounded-lg shadow-sm object-cover shrink-0`} />
        ) : (
          <div className={`${imgSize} rounded-lg bg-[var(--color-muted)] text-[var(--color-dark)] font-bold text-xs flex items-center justify-center shadow-sm shrink-0`}>
            ♪
          </div>
        )}
        <div className="flex-1 overflow-hidden z-10 relative min-w-0 flex flex-col">
          <div className="w-full relative overflow-hidden whitespace-nowrap">
            <span className={`${titleSize} text-[var(--color-dark)] pr-2 truncate block w-full`} title={track.name}>
              {track.name}
            </span>
          </div>
          <div className="font-pixel text-sm text-[var(--color-dark)] font-medium truncate w-full mt-0.5" title={track.artists?.map((a:any)=>a.name).join(', ')}>
            {track.artists?.map((a:any)=>a.name).join(', ')}
          </div>
        </div>
      </button>

      {onAddToPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(track.uri);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add to Playlist"
          aria-label={`Add ${track.name} to playlist`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z" />
          </svg>
        </button>
      )}

      {onRemoveFromPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromPlaylist(track.uri);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Remove from Playlist"
          aria-label={`Remove ${track.name} from playlist`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      )}

      {onAddToQueue && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue(track);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add to Queue"
          aria-label={`Add ${track.name} to queue`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      )}
      {onAddMemory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddMemory(track);
          }}
          className="mw-btn mw-row-action p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add Memory"
          aria-label={`Add memory for ${track.name}`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
});
