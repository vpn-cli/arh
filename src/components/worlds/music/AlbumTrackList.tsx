import React from 'react';
import { TrackList } from './TrackList';

interface AlbumTrackListProps {
  tracks: any[];
  isLoading: boolean;
  onPlayTrack: (uri: string) => void;
  onAddToQueue?: (track: any) => void;
  onAddMemory?: (track: any) => void;
}

export function AlbumTrackList({ tracks, isLoading, onPlayTrack, onAddToQueue, onAddMemory }: AlbumTrackListProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col px-2 pb-2">
      <TrackList tracks={tracks} isLoading={isLoading} onPlayTrack={onPlayTrack} onAddToQueue={onAddToQueue} onAddMemory={onAddMemory} emptyMessage="NO TRACKS ON ALBUM" />
    </div>
  );
}
