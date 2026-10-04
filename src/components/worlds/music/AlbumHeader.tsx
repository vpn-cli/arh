import React from 'react';

interface AlbumHeaderProps {
  album: any;
  onBack: () => void;
}

export function AlbumHeader({ album, onBack }: AlbumHeaderProps) {
  if (!album) return null;
  
  const releaseYear = album.release_date ? album.release_date.substring(0, 4) : '';
  const artistName = album.artists?.map((a: any) => a.name).join(', ') || '';
  
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[#FFE4E1] shrink-0">
      <button onClick={onBack} className="text-[#FF69B4] hover:text-[#D81B60] transition-colors cursor-pointer text-xl font-bold active:scale-95">
        ◀
      </button>
      {album.images && album.images[0] ? (
        <img src={album.images[0].url} alt={album.name} className="w-20 h-20 rounded-xl shadow-md object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-[#FFB6C1]/30 flex items-center justify-center shadow-md shrink-0">
          <span className="text-[#FF69B4] text-2xl">♪</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl text-[#D81B60] truncate" title={album.name}>{album.name}</h2>
        <div className="font-retro text-[10px] text-[#9B4F96] opacity-80 mt-1 truncate" title={artistName}>
          {artistName}
        </div>
        <div className="font-retro text-[10px] text-[#FF69B4] mt-2 font-bold tracking-widest uppercase">
          {album.album_type && `${album.album_type} • `}
          {releaseYear && `${releaseYear} • `}
          {album.total_tracks || 0} TRACKS
        </div>
      </div>
    </div>
  );
}
