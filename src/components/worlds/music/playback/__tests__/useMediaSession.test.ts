import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaSession } from "../useMediaSession";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

describe("useMediaSession", () => {
  const originalMediaSession = navigator.mediaSession;

  beforeEach(() => {
    (navigator as any).mediaSession = {
      metadata: null,
      playbackState: "none",
      setActionHandler: vi.fn(),
    };
    useSpotifyPlayerStore.setState({
      currentTrack: null,
      isPaused: true,
    });
  });

  afterEach(() => {
    (navigator as any).mediaSession = originalMediaSession;
    vi.restoreAllMocks();
  });

  it("registers action handlers for play, pause, previoustrack, and nexttrack", () => {
    const togglePlay = vi.fn().mockResolvedValue(undefined);
    const prevTrack = vi.fn();
    const nextTrack = vi.fn();

    renderHook(() => useMediaSession({ togglePlay, prevTrack, nextTrack }));

    expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith("play", expect.any(Function));
    expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith("pause", expect.any(Function));
    expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith("previoustrack", expect.any(Function));
    expect(navigator.mediaSession.setActionHandler).toHaveBeenCalledWith("nexttrack", expect.any(Function));
  });

  it("updates metadata and playbackState when track is playing", () => {
    const togglePlay = vi.fn().mockResolvedValue(undefined);
    const prevTrack = vi.fn();
    const nextTrack = vi.fn();

    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: "t1",
        name: "Kawaii Lofi",
        artists: [{ name: "Hamster Beats" }],
        album: { name: "Snack Time", images: [{ url: "https://example.com/art.png" }] },
      } as any,
      isPaused: false,
    });

    renderHook(() => useMediaSession({ togglePlay, prevTrack, nextTrack }));

    expect(navigator.mediaSession.playbackState).toBe("playing");
    expect(navigator.mediaSession.metadata).toBeDefined();
  });
});
