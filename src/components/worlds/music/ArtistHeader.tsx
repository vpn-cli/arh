import React from 'react';

interface ArtistHeaderProps {
  artist: any;
  onBack: () => void;
}

export function ArtistHeader({ artist, onBack }: ArtistHeaderProps) {
  if (!artist) return null;
  
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[#FFE4E1] shrink-0">
      <button onClick={onBack} className="text-[#FF69B4] hover:text-[#D81B60] transition-colors cursor-pointer text-xl font-bold active:scale-95">
        ◀
      </button>
      {artist.images && artist.images[0] ? (
        <img src={artist.images[0].url} alt={artist.name} className="w-20 h-20 rounded-full shadow-md object-cover shrink-0 border-2 border-[#FFB6C1]" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#FFB6C1]/30 flex items-center justify-center shadow-md shrink-0 border-2 border-[#FFB6C1]">
          <span className="text-[#FF69B4] text-2xl">👤</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl text-[#D81B60] truncate" title={artist.name}>{artist.name}</h2>
        <div className="font-retro text-[10px] text-[#9B4F96] opacity-80 mt-1 truncate">
          {artist.followers?.total ? `${artist.followers.total.toLocaleString()} FOLLOWERS` : ''}
        </div>
        <div className="font-retro text-[10px] text-[#FF69B4] mt-2 font-bold tracking-widest uppercase">
          {artist.genres?.slice(0, 3).join(', ')}
        </div>
      </div>
    </div>
  );
}
