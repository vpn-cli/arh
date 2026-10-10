"use client";

import React, { Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePip } from "./PipContext";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { useSpotifySession, useTrackSavedStatus, useSpotifyMutations } from "@/hooks/useSpotify";
import { getSharedPositionMs, seekSharedClock } from "../playback/playbackClock";
import {
  togglePlayGlobal,
  prevTrackGlobal,
  nextTrackGlobal,
  seekGlobal,
} from "../playback/globalPlaybackActions";

const LazyMiniPlayer = React.lazy(() =>
  import("./MiniPlayer").then((m) => ({ default: m.MiniPlayer }))
);

export function PipHost() {
  const { pipWindow } = usePip();
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const { data: sessionData } = useSpotifySession();
  const token = sessionData?.accessToken || null;
  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);
  const { toggleSave } = useSpotifyMutations();

  const handleToggleSaveTrack = useCallback(async () => {
    if (!token || !currentTrack) return;
    try {
      await toggleSave.mutateAsync({
        trackId: currentTrack.id,
        isSaved,
      });
    } catch (err) {
      console.warn("[PipHost] toggleSave error:", err);
    }
  }, [token, currentTrack, isSaved, toggleSave]);

  if (!pipWindow || !pipWindow.document?.body) {
    return null;
  }

  return createPortal(
    <Suspense fallback={null}>
      <LazyMiniPlayer
        getPositionMs={getSharedPositionMs}
        onSeek={seekGlobal}
        onDragSeek={seekSharedClock}
        togglePlay={togglePlayGlobal}
        prevTrack={prevTrackGlobal}
        nextTrack={nextTrackGlobal}
        isSaved={isSaved}
        toggleSaveTrack={handleToggleSaveTrack}
        token={token}
      />
    </Suspense>,
    pipWindow.document.body
  );
}
