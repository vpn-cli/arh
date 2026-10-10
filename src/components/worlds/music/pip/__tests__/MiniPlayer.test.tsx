import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { MiniPlayer } from "../MiniPlayer";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

describe("MiniPlayer progress updates in pop-out window", () => {
  let mockPipWindow: any;
  let rafCallbacks: Array<FrameRequestCallback> = [];
  let intervalCallbacks: Array<() => void> = [];
  let sharedClockPosition = 0;

  beforeEach(() => {
    rafCallbacks = [];
    intervalCallbacks = [];
    sharedClockPosition = 0;

    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: "pip-track-1",
        name: "Floating Track",
        artists: [{ name: "Pixel Artist" }],
        album: { name: "Album 1", images: [{ url: "https://example.com/art.png" }] },
      } as any,
      isPaused: false,
      duration: 180000,
      isReady: true,
      isPremium: true,
    });

    mockPipWindow = {
      document: {
        hidden: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      requestAnimationFrame: vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }),
      cancelAnimationFrame: vi.fn(),
      setInterval: vi.fn((cb: () => void, ms: number) => {
        intervalCallbacks.push(cb);
        return intervalCallbacks.length;
      }),
      clearInterval: vi.fn(),
    };
  });

  it("drives progress from pipWindow.requestAnimationFrame and pipWindow.setInterval fallback", () => {
    const getPositionMs = () => sharedClockPosition;
    const onSeek = vi.fn();
    const onDragSeek = vi.fn();

    const { container } = render(
      <MiniPlayer
        getPositionMs={getPositionMs}
        onSeek={onSeek}
        onDragSeek={onDragSeek}
        togglePlay={vi.fn().mockResolvedValue(undefined)}
        prevTrack={vi.fn()}
        nextTrack={vi.fn()}
        isSaved={false}
        toggleSaveTrack={vi.fn().mockResolvedValue(undefined)}
        token="token"
        pipWindow={mockPipWindow}
      />
    );

    // pipWindow.requestAnimationFrame and pipWindow.setInterval must both be invoked
    expect(mockPipWindow.requestAnimationFrame).toHaveBeenCalled();
    expect(mockPipWindow.setInterval).toHaveBeenCalledWith(expect.any(Function), 500);

    const fill = container.querySelector("div[class*='origin-left']");

    // Advance clock to 30,000ms (0:30)
    sharedClockPosition = 30000;
    act(() => {
      // Fire the pipWindow rAF callback
      const cb = rafCallbacks[rafCallbacks.length - 1];
      cb?.(performance.now());
    });

    expect(container.textContent).toContain("0:30");
    expect(fill?.getAttribute("style")).toContain("scaleX(0.166");
  });

  it("updates time label and bar after pause, resume, seek, and track change", () => {
    const getPositionMs = () => sharedClockPosition;
    const onSeek = vi.fn();
    const onDragSeek = vi.fn();

    const { container } = render(
      <MiniPlayer
        getPositionMs={getPositionMs}
        onSeek={onSeek}
        onDragSeek={onDragSeek}
        togglePlay={vi.fn().mockResolvedValue(undefined)}
        prevTrack={vi.fn()}
        nextTrack={vi.fn()}
        isSaved={false}
        toggleSaveTrack={vi.fn().mockResolvedValue(undefined)}
        token="token"
        pipWindow={mockPipWindow}
      />
    );

    const fill = container.querySelector("div[class*='origin-left']");

    // 1. Progress tick while playing
    sharedClockPosition = 60000;
    act(() => {
      const cb = rafCallbacks[rafCallbacks.length - 1];
      cb?.(performance.now());
    });
    expect(container.textContent).toContain("1:00");
    expect(fill?.getAttribute("style")).toContain("scaleX(0.333");

    // 2. Pause: immediately stays correct
    act(() => {
      useSpotifyPlayerStore.setState({ isPaused: true });
    });
    expect(container.textContent).toContain("1:00");

    // 3. Seek while paused
    const slider = container.querySelector('[role="slider"]');
    expect(slider).not.toBeNull();
    vi.spyOn(slider!, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      right: 200,
      bottom: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    sharedClockPosition = 90000; // Seeked to 50%
    act(() => {
      fireEvent.click(slider!, { clientX: 100 });
    });
    expect(onDragSeek).toHaveBeenCalledWith(90000);
    expect(onSeek).toHaveBeenCalledWith(90000);
    expect(container.textContent).toContain("1:30");

    // 4. Resume
    act(() => {
      useSpotifyPlayerStore.setState({ isPaused: false });
    });
    sharedClockPosition = 120000;
    act(() => {
      const cb = rafCallbacks[rafCallbacks.length - 1];
      cb?.(performance.now());
    });
    expect(container.textContent).toContain("2:00");

    // 5. Track change
    act(() => {
      sharedClockPosition = 0;
      useSpotifyPlayerStore.setState({
        currentTrack: {
          id: "pip-track-2",
          name: "Next Song",
          artists: [{ name: "Artist Two" }],
          album: { name: "Album 2", images: [] },
        } as any,
        duration: 240000,
      });
    });
    expect(container.textContent).toContain("0:00");
    expect(container.textContent).toContain("4:00");
    expect(fill?.getAttribute("style")).toContain("scaleX(0)");
  });

  it("keeps ticking via pipWindow.requestAnimationFrame even when opener window is hidden", () => {
    // Opener window is hidden
    Object.defineProperty(document, "hidden", { configurable: true, value: true });

    const getPositionMs = () => sharedClockPosition;
    const { container } = render(
      <MiniPlayer
        getPositionMs={getPositionMs}
        onSeek={vi.fn()}
        togglePlay={vi.fn().mockResolvedValue(undefined)}
        prevTrack={vi.fn()}
        nextTrack={vi.fn()}
        isSaved={false}
        toggleSaveTrack={vi.fn().mockResolvedValue(undefined)}
        token="token"
        pipWindow={mockPipWindow}
      />
    );

    // Pop-out window is visible (mockPipWindow.document.hidden is false)
    expect(mockPipWindow.requestAnimationFrame).toHaveBeenCalled();

    // Advance clock
    sharedClockPosition = 45000;
    act(() => {
      const cb = rafCallbacks[rafCallbacks.length - 1];
      cb?.(performance.now());
    });

    // Bar and label still move because it's driven by pipWindow
    expect(container.textContent).toContain("0:45");
  });
});
