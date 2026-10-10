"use client";

import { useMediaSession } from "../playback/useMediaSession";
import {
  togglePlayGlobal,
  prevTrackGlobal,
  nextTrackGlobal,
} from "../playback/globalPlaybackActions";

export function MediaSessionHost() {
  useMediaSession({
    togglePlay: togglePlayGlobal,
    prevTrack: prevTrackGlobal,
    nextTrack: nextTrackGlobal,
  });

  return null;
}
