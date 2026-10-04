import React from 'react';
import { useSearch } from '@/hooks/useSearch';
import { TrackRow } from './TrackRow';
import { ArtistCard } from './ArtistCard';
import { AlbumCard } from './AlbumCard';
import { PlaylistCard } from './PlaylistCard';

interface SearchResultsProps {
  query: string;
  onPlayTrack: (uri: string) => void;
  onClickPlaylist: (id: string) => void;
  onClickAlbum: (id: string) => void;
}

export function SearchResults({ query, onPlayTrack, onClickPlaylist, onClickAlbum }: SearchResultsProps) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useSearch(query);

  if (!query.trim()) {
    return <div className="text-center text-[#FFB6C1] font-pixel text-xs mt-4">TYPE TO SEARCH</div>;
  }

  if (isLoading) {
    return <div className="text-center text-[#FFB6C1] font-pixel text-xs mt-4 animate-pulse">SEARCHING...</div>;
  }

  if (isError) {
    return <div className="text-center text-[#FF4500] font-pixel text-xs mt-4">ERROR SEARCHING</div>;
  }

  const pages = data?.pages || [];

  // flatten pages by type and deduplicate by id
  const dedupe = (items: any[]) => {
    const seen = new Set();
    return items.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const tracks = dedupe(pages.flatMap(p => p?.tracks?.items || []));
  const artists = dedupe(pages.flatMap(p => p?.artists?.items || []));
  const albums = dedupe(pages.flatMap(p => p?.albums?.items || []));
  const playlists = dedupe(pages.flatMap(p => p?.playlists?.items || []));

  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0 || playlists.length > 0;

  if (!hasResults) {
    return <div className="text-center text-[#FFB6C1] font-pixel text-xs mt-4">NO MATCHES FOUND</div>;
  }

  const handleArtistClick = (id: string) => {
    // Requirements state:
    // 14. Clicking an artist should similarly use the future artist route/structure without implementing the full Artist phase.
    console.log("Navigating to artist detail flow (placeholder):", id);
    alert(`Artist detail flow for ID: ${id} (Future Phase)`);
  };

  const handleAlbumClick = (id: string) => {
    onClickAlbum(id);
  };

  return (
    <div className="flex flex-col gap-4">
      {tracks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-pixel text-[10px] text-[#D81B60]">TRACKS</h4>
          {tracks.map(t => (
            <TrackRow key={t.id} track={t} onPlay={onPlayTrack} variant="compact" />
          ))}
        </div>
      )}

      {artists.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-pixel text-[10px] text-[#D81B60]">ARTISTS</h4>
          {artists.map(a => (
            <ArtistCard key={a.id} artist={a} onClick={handleArtistClick} variant="compact" />
          ))}
        </div>
      )}

      {albums.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-pixel text-[10px] text-[#D81B60]">ALBUMS</h4>
          {albums.map(a => (
            <AlbumCard key={a.id} album={a} onClick={handleAlbumClick} variant="compact" />
          ))}
        </div>
      )}

      {playlists.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-pixel text-[10px] text-[#D81B60]">PLAYLISTS</h4>
          {playlists.map(p => (
            <PlaylistCard key={p.id} playlist={p} onClick={() => onClickPlaylist(p.id)} variant="compact" />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full bg-[#FFE4E1] hover:bg-[#FFB6C1] text-[#7A2871] hover:text-[#FFFFFF] transition-colors py-2 rounded-xl font-pixel text-[10px] disabled:opacity-50 mt-2"
        >
          {isFetchingNextPage ? 'LOADING...' : 'LOAD MORE'}
        </button>
      )}
    </div>
  );
}
