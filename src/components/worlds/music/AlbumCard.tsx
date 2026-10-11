import React from 'react';

interface AlbumCardProps {
  album: any;
  onClick: (id: string) => void;
  variant?: 'default' | 'compact';
}

export function AlbumCard({ album, onClick, variant = 'default' }: AlbumCardProps) {
  const isCompact = variant === 'compact';
  const imgSize = isCompact ? 'w-9 h-9' : 'w-11 h-11';

  return (
    <div
      className="group relative w-full flex items-center gap-3 p-2 rounded-xl mw-row text-left shrink-0 select-none"
    >
      <button
        type="button"
        onClick={() => onClick(album.id)}
        className="mw-row-main flex-1 flex items-center gap-3 text-left min-w-0 outline-none focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
        aria-label={`Open album ${album.name}`}
      >
        {album.images && album.images[0] ? (
          <img src={album.images[0].url} alt="" className={`${imgSize} rounded-xl shadow-2xs object-cover shrink-0 border border-[var(--color-muted)]/30`} />
        ) : (
          <div className={`${imgSize} rounded-xl bg-[var(--color-muted)]/20 border border-[var(--color-muted)]/30 text-[var(--color-dark)] font-bold text-caption flex items-center justify-center shadow-2xs shrink-0`}>
            ♪
          </div>
        )}
        <div className="flex-1 overflow-hidden min-w-0 flex flex-col justify-center">
          <div
            className="font-pixel text-body font-bold text-[var(--color-dark)] truncate leading-snug"
            title={album.name}
          >
            {album.name}
          </div>
          <div
            className="font-pixel text-meta font-medium text-[var(--color-text-muted)] truncate mt-0.5 leading-tight"
            title={album.artists?.map((a: any) => a.name).join(', ')}
          >
            Album • {album.artists?.map((a: any) => a.name).join(', ')}
          </div>
        </div>
      </button>
    </div>
  );
}
