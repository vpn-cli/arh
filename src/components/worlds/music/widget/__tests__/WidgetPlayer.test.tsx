import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WidgetPlayer } from "../WidgetPlayer";
import * as globalActions from "../../playback/globalPlaybackActions";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import * as musicViewHook from "../../hooks/useMusicView";

vi.mock("@/hooks/useSpotify", () => ({
  useSpotifySession: vi.fn(() => ({ data: { accessToken: "test-token" } })),
  useTrackSavedStatus: vi.fn(() => ({ data: false })),
  useSpotifyMutations: vi.fn(() => ({
    toggleSave: { mutateAsync: vi.fn().mockResolvedValue({}) },
  })),
}));

vi.mock("../../palette/PaletteBackground", () => ({
  PaletteBackground: () => <div data-testid="palette-bg" />,
}));

describe("WidgetPlayer", () => {
  const originalResizeTo = window.resizeTo;

  beforeEach(() => {
    window.resizeTo = vi.fn();
    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: "track-widget-1",
        name: "Cozy Lofi Beats",
        artists: [{ name: "Kawaii Hamster" }],
        album: { name: "Snack City", images: [{ url: "https://example.com/art.png" }] },
      } as any,
      isPaused: true,
      duration: 180000,
    });
  });

  afterEach(() => {
    window.resizeTo = originalResizeTo;
    vi.restoreAllMocks();
  });

  it("renders track metadata, playback buttons, and progress bar", () => {
    render(<WidgetPlayer />);

    expect(screen.getByText("Cozy Lofi Beats")).toBeDefined();
    expect(screen.getByText("Kawaii Hamster")).toBeDefined();
    expect(screen.getByRole("button", { name: "Play" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Next track" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Expand to full player" })).toBeDefined();
    expect(screen.getByRole("slider", { name: "Playback progress" })).toBeDefined();
  });

  it("delegates playback controls to unified globalPlaybackActions", () => {
    const playSpy = vi.spyOn(globalActions, "togglePlayGlobal").mockResolvedValue(undefined);
    const nextSpy = vi.spyOn(globalActions, "nextTrackGlobal").mockResolvedValue(undefined);
    const prevSpy = vi.spyOn(globalActions, "prevTrackGlobal").mockResolvedValue(undefined);

    render(<WidgetPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(playSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Next track" }));
    expect(nextSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it("triggers seekGlobal when clicking on the progress bar", () => {
    const seekSpy = vi.spyOn(globalActions, "seekGlobal").mockResolvedValue(undefined);
    render(<WidgetPlayer />);

    const slider = screen.getByRole("slider", { name: "Playback progress" });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 100,
      width: 200,
      top: 0,
      bottom: 10,
      right: 300,
      height: 10,
      x: 100,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.mouseDown(slider, { clientX: 200 }); // 50%
    expect(seekSpy).toHaveBeenCalledWith(90000); // 50% of 180000ms
  });

  it("calls expandToFull when expand button is clicked", () => {
    const expandSpy = vi.fn();
    vi.spyOn(musicViewHook, "useMusicView").mockReturnValue({
      isWidgetView: true,
      switchToWidget: vi.fn(),
      expandToFull: expandSpy,
      isStandalone: false,
    });

    render(<WidgetPlayer />);

    fireEvent.click(screen.getByRole("button", { name: "Expand to full player" }));
    expect(expandSpy).toHaveBeenCalledTimes(1);
  });

  it("renders signed-out state message and expand action when token is missing", async () => {
    const { useSpotifySession } = await import("@/hooks/useSpotify");
    vi.mocked(useSpotifySession).mockReturnValueOnce({ data: null } as any);

    render(<WidgetPlayer />);

    expect(screen.getByText("NOT SIGNED IN")).toBeDefined();
    expect(screen.getByText("Open the full app to sign in")).toBeDefined();
    expect(screen.getByRole("button", { name: /open full app/i })).toBeDefined();
  });
});
