import React from 'react';
import { TrackList } from './TrackList';

interface PlaylistTrackListProps {
  tracks: any[];
  isLoading: boolean;
  onPlayTrack: (uri: string) => void;
  onAddToQueue?: (track: any) => void;
  onAddToPlaylist?: (uri: string) => void;
  onRemoveFromPlaylist?: (uri: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  onAddMemory?: (track: any) => void;
}

export function PlaylistTrackList({ tracks, isLoading, onPlayTrack, onAddToQueue, onAddToPlaylist, onRemoveFromPlaylist, onReorder, onAddMemory }: PlaylistTrackListProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col px-2 pb-2">
      <TrackList tracks={tracks} isLoading={isLoading} onPlayTrack={onPlayTrack} onAddToQueue={onAddToQueue} onAddToPlaylist={onAddToPlaylist} onRemoveFromPlaylist={onRemoveFromPlaylist} onReorder={onReorder} onAddMemory={onAddMemory} emptyMessage="NO TRACKS IN PLAYLIST" />
    </div>
  );
}
