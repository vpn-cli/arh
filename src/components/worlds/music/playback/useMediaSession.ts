"use client";

import { useEffect } from "react";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

export interface MediaSessionProps {
  togglePlay: () => Promise<void>;
  prevTrack: () => void;
  nextTrack: () => void;
}

export function useMediaSession({ togglePlay, prevTrack, nextTrack }: MediaSessionProps) {
  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (currentTrack) {
      const artUrl =
        currentTrack.album?.images?.[0]?.url ||
        (typeof currentTrack.album?.images?.[0] === "string"
          ? currentTrack.album.images[0]
          : null) ||
        "/icons/app/icon-512.png";

      const artists = currentTrack.artists
        ? currentTrack.artists.map((a: { name: string }) => a.name).join(", ")
        : "Unknown Artist";

      const metadataInit = {
        title: currentTrack.name || "Unknown Track",
        artist: artists,
        album: currentTrack.album?.name || "Music World",
        artwork: [{ src: artUrl, sizes: "512x512", type: "image/png" }],
      };

      if (typeof window !== "undefined" && typeof (window as any).MediaMetadata !== "undefined") {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata(metadataInit);
      } else {
        (navigator.mediaSession as any).metadata = metadataInit;
      }

      navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";
    }

    try {
      navigator.mediaSession.setActionHandler("play", togglePlay);
      navigator.mediaSession.setActionHandler("pause", togglePlay);
      navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
      navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
    } catch (e) {
      console.warn("Error setting media session action handler:", e);
    }

    return () => {
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("previoustrack", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
        } catch {}
      }
    };
  }, [currentTrack, isPaused, togglePlay, prevTrack, nextTrack]);
}
