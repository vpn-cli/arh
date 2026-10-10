import React from 'react';
import { ChevronLeftIcon, MusicNoteIcon, PlayIcon, ShuffleIcon, EditIcon, TrashIcon } from './icons';

interface PlaylistHeaderProps {
  playlist: any;
  tracks?: any[];
  onBack: () => void;
  isRestricted?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  onPlay?: () => void;
  onShuffle?: () => void;
  playDisabled?: boolean;
  shuffleDisabled?: boolean;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

export function PlaylistHeader({
  playlist,
  tracks = [],
  onBack,
  isRestricted,
  onEdit,
  onRemove,
  onPlay,
  onShuffle,
  playDisabled,
  shuffleDisabled,
}: PlaylistHeaderProps) {
  if (!playlist) return null;

  const totalDurationMs = tracks.reduce((acc, t) => {
    const d = t?.duration_ms || t?.track?.duration_ms || 0;
    return acc + d;
  }, 0);
  const durationText = totalDurationMs > 0 ? formatDuration(totalDurationMs) : '';

  const ownerName = playlist.owner?.display_name || playlist.owner?.id || 'Spotify';
  const trackCount =
    playlist.items?.total ??
    playlist.tracks?.total ??
    (Array.isArray(playlist.items)
      ? playlist.items.length
      : Array.isArray(playlist.tracks)
      ? playlist.tracks.length
      : playlist.items?.items?.length ?? tracks.length);

  const coverUrl = playlist.images?.[0]?.url || (typeof playlist.images?.[0] === 'string' ? playlist.images[0] : null);

  return (
    <div className="flex flex-col shrink-0 p-4 pb-2">
      {/* Back control: SVG chevron button at the top left */}
      <div className="mb-3 shrink-0">
        <button
          onClick={onBack}
          className="text-meta text-[var(--color-dark)] hover:text-[var(--color-dark)] cursor-pointer font-pixel font-bold tracking-wide flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)] rounded-lg px-2 py-1"
          aria-label="Back to playlists"
        >
          <ChevronLeftIcon size={14} /> Back to Playlists
        </button>
      </div>

      {/* Tinted card container matching Vibes detail header */}
      <div className="bg-gradient-to-r from-[var(--color-light)] to-[var(--color-light)] p-5 sm:p-6 rounded-2xl border-2 border-[var(--color-muted)] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Cover: about 160px with a shadow on the left */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={playlist.name}
            className="w-40 h-40 rounded-xl shadow-lg object-cover shrink-0 border border-[var(--color-muted)]"
          />
        ) : (
          <div className="w-40 h-40 rounded-xl bg-[var(--color-muted)] flex items-center justify-center shadow-lg shrink-0 border border-[var(--color-muted)] text-[var(--color-dark)]">
            <MusicNoteIcon size={48} />
          </div>
        )}

        {/* Beside it: small PLAYLIST label, large title, one meta line, action row */}
        <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left w-full">
          <span className="font-pixel text-caption font-bold tracking-wider text-[var(--color-text-muted)] uppercase mb-1">
            PLAYLIST
          </span>
          <h1
            className="font-pixel text-heading sm:text-display font-extrabold text-[var(--color-dark)] truncate mb-1.5"
            title={playlist.name}
          >
            {playlist.name}
          </h1>

          {/* Meta line: owner, track count, total duration */}
          <div className="font-pixel text-caption text-[var(--color-dark)] font-medium opacity-80 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span>{ownerName}</span>
            <span>•</span>
            <span>
              {isRestricted ? (trackCount ? `${trackCount} songs` : 'Tracks unavailable') : `${trackCount} songs`}
            </span>
            {durationText && (
              <>
                <span>•</span>
                <span>{durationText}</span>
              </>
            )}
          </div>

          {playlist.description && (
            <p
              className="font-pixel text-caption text-[var(--color-text-muted)] mt-2 line-clamp-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: playlist.description }}
            />
          )}

          {/* Action row under meta line */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 flex-wrap">
            {onPlay && (
              <button
                onClick={onPlay}
                disabled={playDisabled}
                className="bg-[var(--color-vibrant)] text-[var(--on-vibrant)] px-6 py-2.5 rounded-full font-pixel text-body font-bold shadow-md hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
              >
                <PlayIcon size={14} className="fill-current ml-0.5" /> Play
              </button>
            )}

            {onShuffle && (
              <button
                onClick={onShuffle}
                disabled={shuffleDisabled}
                className="w-10 h-10 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-muted)] text-[var(--color-dark)] hover:bg-[var(--color-muted)]/20 active:scale-95 transition-all flex items-center justify-center shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
                title="Shuffle Play"
                aria-label="Shuffle Play"
              >
                <ShuffleIcon size={16} />
              </button>
            )}

            {onEdit && (
              <button
                onClick={onEdit}
                className="w-10 h-10 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-muted)] text-[var(--color-dark)] hover:bg-[var(--color-muted)]/20 active:scale-95 transition-all flex items-center justify-center shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
                title="Edit Playlist"
                aria-label="Edit Playlist"
              >
                <EditIcon size={16} />
              </button>
            )}

            {onRemove && (
              <button
                onClick={onRemove}
                className="w-10 h-10 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-muted)] text-[var(--color-dark)] hover:bg-[var(--color-muted)]/20 active:scale-95 transition-all flex items-center justify-center shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
                title="Delete Playlist"
                aria-label="Delete Playlist"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
