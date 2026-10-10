import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlaybackControls } from "../../now-playing/PlaybackControls";
import { MediaSessionHost } from "../../pip/MediaSessionHost";
import * as globalActions from "../globalPlaybackActions";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

describe("Next track single source of truth", () => {
  const originalMediaSession = navigator.mediaSession;

  beforeEach(() => {
    (navigator as any).mediaSession = {
      metadata: null,
      playbackState: "none",
      setActionHandler: vi.fn(),
    };
    useSpotifyPlayerStore.setState({
      isReady: true,
      isPremium: true,
      isPaused: false,
      currentTrack: { id: "track-1", name: "Track One" } as any,
    });
  });

  afterEach(() => {
    (navigator as any).mediaSession = originalMediaSession;
    vi.restoreAllMocks();
  });

  it("proves the media-session 'nexttrack' handler and the main Next button call the same function", () => {
    const nextSpy = vi.spyOn(globalActions, "nextTrackGlobal").mockImplementation(() => {});

    // 1. Mount MediaSessionHost (registers with navigator.mediaSession)
    render(<MediaSessionHost />);

    // Check what function was registered for 'nexttrack'
    const calls = vi.mocked(navigator.mediaSession.setActionHandler).mock.calls;
    const nextTrackCall = calls.find((call) => call[0] === "nexttrack");
    expect(nextTrackCall).toBeDefined();
    const mediaSessionNextHandler = nextTrackCall![1] as () => void;

    // 2. Mount main player PlaybackControls with the same nextTrackGlobal action
    render(
      <PlaybackControls
        token="test-token"
        togglePlay={globalActions.togglePlayGlobal}
        prevTrack={globalActions.prevTrackGlobal}
        nextTrack={globalActions.nextTrackGlobal}
        toggleShuffle={vi.fn()}
        toggleRepeat={vi.fn()}
      />
    );

    const mainNextButton = screen.getByRole("button", { name: /next track/i });

    // Click the main player Next button
    fireEvent.click(mainNextButton);
    expect(nextSpy).toHaveBeenCalledTimes(1);

    // Trigger the media-session nexttrack action handler
    mediaSessionNextHandler();
    expect(nextSpy).toHaveBeenCalledTimes(2);

    // Confirm both target the exact same function
    expect(mediaSessionNextHandler).toBe(globalActions.nextTrackGlobal);
  });
});
