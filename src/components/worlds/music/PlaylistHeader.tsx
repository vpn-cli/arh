import React from 'react';

interface PlaylistHeaderProps {
  playlist: any;
  onBack: () => void;
}

export function PlaylistHeader({ playlist, onBack }: PlaylistHeaderProps) {
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
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl text-[#D81B60] truncate">{playlist.name}</h2>
        {playlist.description && (
          <p className="font-retro text-[10px] text-[#9B4F96] opacity-80 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: playlist.description }} />
        )}
        <div className="font-retro text-[10px] text-[#FF69B4] mt-2 font-bold tracking-widest uppercase">
          {playlist.tracks?.total || 0} TRACKS
        </div>
      </div>
    </div>
  );
}
