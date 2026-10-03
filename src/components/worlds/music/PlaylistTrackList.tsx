import React from 'react';
import { TrackList } from './TrackList';

interface PlaylistTrackListProps {
  tracks: any[];
  isLoading: boolean;
  onPlayTrack: (uri: string) => void;
}

export function PlaylistTrackList({ tracks, isLoading, onPlayTrack }: PlaylistTrackListProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col px-2 pb-2">
      <TrackList tracks={tracks} isLoading={isLoading} onPlayTrack={onPlayTrack} emptyMessage="NO TRACKS IN PLAYLIST" />
    </div>
  );
}
