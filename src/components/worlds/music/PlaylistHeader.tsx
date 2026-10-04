import React from 'react';

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
    <div className="flex items-center gap-4 p-4 border-b-2 border-[#FFE4E1] shrink-0">
      <button onClick={onBack} className="text-[#FF69B4] hover:text-[#D81B60] transition-colors cursor-pointer text-xl font-bold active:scale-95">
        ◀
      </button>
      {playlist.images && playlist.images[0] ? (
        <img src={playlist.images[0].url} alt={playlist.name} className="w-20 h-20 rounded-xl shadow-md object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-[#FFB6C1]/30 flex items-center justify-center shadow-md shrink-0">
          <span className="text-[#FF69B4] text-2xl">♪</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center relative">
        <h2 className="font-pixel text-xl text-[#D81B60] truncate pr-8">{playlist.name}</h2>
        {onEdit && (
          <button onClick={onEdit} className="absolute top-0 right-6 text-[#FFB6C1] hover:text-[#FF69B4] transition-colors" title="Edit Playlist">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="absolute top-0 right-0 text-[#FFB6C1] hover:text-[#D81B60] transition-colors" title="Remove Playlist">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        )}
        {playlist.description && (
          <p className="font-retro text-[10px] text-[#9B4F96] opacity-80 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: playlist.description }} />
        )}
        <div className="font-retro text-[10px] text-[#FF69B4] mt-2 font-bold tracking-widest uppercase">
          {isRestricted 
            ? (playlist.items?.total ? `${playlist.items.total} TRACKS` : 'TRACKS UNAVAILABLE')
            : `${playlist.items?.total ?? 0} TRACKS`
          }
        </div>
      </div>
    </div>
  );
}
