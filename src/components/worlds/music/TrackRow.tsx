import React from 'react';
import { MediaRow } from './MediaRow';
import { pickImage } from '@/lib/spotify/images';

export interface TrackRowProps {
  index?: number;
  track: any;
  onPlay: (uri: string, contextUri?: string, trackObj?: any) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  onAddMemory?: (track: any) => void;
  variant?: 'default' | 'compact';
}

export const TrackRow = React.memo(function TrackRow({
  index,
  track,
  onPlay,
  onAddToQueue,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onAddMemory,
  variant = 'default',
}: TrackRowProps) {
  const isCompact = variant === 'compact';
  const imageSize = isCompact ? 36 : 48;
  const imageUrl = pickImage(track?.album?.images, imageSize);
  const artistNames = track?.artists?.map((a: any) => a.name).join(', ') || 'Unknown artist';

  const hasActions = Boolean(onAddToPlaylist || onRemoveFromPlaylist || onAddToQueue || onAddMemory);

  const actions = hasActions ? (
    <>
      {onAddToPlaylist && (
        <button
          type="button"
          onClick={() => onAddToPlaylist(track.uri)}
          className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
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
          type="button"
          onClick={() => onRemoveFromPlaylist(track.uri)}
          className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
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
          type="button"
          onClick={() => onAddToQueue(track)}
          className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
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
          type="button"
          onClick={() => onAddMemory(track)}
          className="mw-btn p-2 text-[var(--color-dark)] shrink-0 rounded-full hover:bg-[var(--color-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)]"
          title="Add Memory"
          aria-label={`Add memory for ${track.name}`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </>
  ) : null;

  return (
    <MediaRow
      title={track.name}
      subtitle={artistNames}
      imageUrl={imageUrl}
      imageShape="rounded"
      imageSize={imageSize}
      rank={index !== undefined && !isCompact ? index + 1 : undefined}
      duration={track.duration_ms}
      onClick={() => onPlay(track.uri, undefined, track)}
      actions={actions}
      actionsVisibility="hover"
    />
  );
});

TrackRow.displayName = 'TrackRow';
