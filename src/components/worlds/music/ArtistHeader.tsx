import React from 'react';

interface ArtistHeaderProps {
  artist: any;
  onBack: () => void;
}

export function ArtistHeader({ artist, onBack }: ArtistHeaderProps) {
  if (!artist) return null;
  
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-[#FFE4E1] shrink-0">
      <button 
        onClick={onBack} 
        className="p-2 text-[#7A2871] hover:text-[#881337] transition-colors cursor-pointer text-lg font-bold active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#881337] rounded-full"
        aria-label="Go back"
      >
        ◀
      </button>
      {artist.images && artist.images[0] ? (
        <img src={artist.images[0].url} alt="" className="w-20 h-20 rounded-full shadow-md object-cover shrink-0 border-2 border-[#FFD0E2]" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#FFC1DA] flex items-center justify-center shadow-md shrink-0 border-2 border-[#FFD0E2]">
          <span className="text-[#881337] text-2xl font-bold">👤</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <h2 className="font-pixel text-xl sm:text-2xl font-bold text-[#881337] truncate" title={artist.name}>{artist.name}</h2>
        <div className="font-pixel text-xs sm:text-sm text-[#7A2871] font-medium mt-1 truncate">
          {artist.followers?.total ? `${artist.followers.total.toLocaleString()} followers` : ''}
        </div>
        <div className="font-pixel text-xs text-[#8C3A7A] mt-2 font-bold tracking-wide">
          {artist.genres?.slice(0, 3).join(', ')}
        </div>
      </div>
    </div>
  );
}
