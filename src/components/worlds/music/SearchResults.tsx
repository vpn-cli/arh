import React from 'react';
import { useSearch } from '@/hooks/useSearch';
import { TrackRow } from './TrackRow';
import { ArtistCard } from './ArtistCard';
import { AlbumCard } from './AlbumCard';
import { PlaylistCard } from './PlaylistCard';

interface SearchResultsProps {
  query: string;
  onPlayTrack: (uri: string) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onPlayPlaylist?: (uri: string) => void;
  onClickPlaylist: (id: string) => void;
  onClickAlbum: (id: string) => void;
  onClickArtist?: (id: string) => void;
  onAddMemory: (entity: any, type: 'track' | 'artist' | 'playlist') => void;
}

export const SearchResults = React.memo(function SearchResults({ query, onPlayTrack, onPlayPlaylist, onAddToQueue, onAddToPlaylist, onClickPlaylist, onClickAlbum, onClickArtist, onAddMemory }: SearchResultsProps) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useSearch(query);

  if (!query.trim()) {
    return <div className="text-center text-[var(--color-dark)] font-pixel text-sm font-medium mt-8">Type to search songs, artists, and playlists ♡</div>;
  }

  if (isLoading) {
    return <div className="text-center text-[var(--color-dark)] font-pixel text-sm font-medium mt-8 animate-pulse">Searching music world...</div>;
  }

  if (isError) {
    return <div className="text-center text-[var(--color-dark)] font-pixel text-sm font-medium mt-8">Error searching. Please try again!</div>;
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
    return <div className="text-center text-[var(--color-dark)] font-pixel text-sm font-medium mt-8">No matches found for &quot;{query}&quot;</div>;
  }

  const handleArtistClick = (id: string) => {
    if (onClickArtist) {
      onClickArtist(id);
    }
  };

  const handleAlbumClick = (id: string) => {
    onClickAlbum(id);
  };

  return (
    <div className="flex flex-col gap-6">
      {tracks.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="font-pixel text-sm font-bold text-[var(--color-dark)] tracking-wider uppercase px-1 mb-1">Tracks</h4>
          {tracks.map((t, idx) => (
            <TrackRow key={`${t.id}-${idx}`} track={t} onPlay={onPlayTrack} onAddToQueue={onAddToQueue} onAddMemory={(track) => onAddMemory(track, 'track')} variant="compact" />
          ))}
        </div>
      )}

      {artists.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="font-pixel text-sm font-bold text-[var(--color-dark)] tracking-wider uppercase px-1 mb-1">Artists</h4>
          {artists.map((a, idx) => (
            <ArtistCard key={`${a.id}-${idx}`} artist={a} onClick={handleArtistClick} onAddMemory={(artist) => onAddMemory(artist, 'artist')} variant="compact" />
          ))}
        </div>
      )}

      {albums.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="font-pixel text-sm font-bold text-[var(--color-dark)] tracking-wider uppercase px-1 mb-1">Albums</h4>
          {albums.map((a, idx) => (
            <AlbumCard key={`${a.id}-${idx}`} album={a} onClick={handleAlbumClick} variant="compact" />
          ))}
        </div>
      )}

      {playlists.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="font-pixel text-sm font-bold text-[var(--color-dark)] tracking-wider uppercase px-1 mb-1">Playlists</h4>
          {playlists.map((p, idx) => (
            <PlaylistCard key={`${p.id}-${idx}`} playlist={p} onClick={() => onClickPlaylist(p.id)} onAddMemory={(playlist) => onAddMemory(playlist, 'playlist')} variant="compact" />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full bg-white hover:bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] transition-colors py-2.5 rounded-xl font-pixel text-xs font-bold disabled:opacity-50 mt-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]"
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load more results'}
        </button>
      )}
    </div>
  );
});
