// FROZEN: do not modify without explicit owner approval. See AGENTS.md.
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TheEdit from "../TheEdit";
import TheEditEndCard from "../TheEditEndCard";
import TheEditControls from "../TheEditControls";
import { requestNativeFullscreen, exitNativeFullscreen } from "../fullscreenUtils";

// Mock sfx
vi.mock("@/lib/audio", () => ({
  sfx: {
    click: { play: vi.fn() },
    pop: vi.fn(),
    select: vi.fn(),
  },
}));

describe("TheEdit and fullscreenUtils", () => {
  let originalFullscreenElement: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFullscreenElement = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
  });

  afterEach(() => {
    if (originalFullscreenElement) {
      Object.defineProperty(document, "fullscreenElement", originalFullscreenElement);
    } else {
      // @ts-expect-error cleanup
      delete document.fullscreenElement;
    }
  });

  it("Clicking fullscreen calls requestFullscreen on the wrapper element synchronously (no await before it)", () => {
    const mockRequestFullscreen = vi.fn().mockReturnValue(Promise.resolve());
    const mockVideoEnterFs = vi.fn();

    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    const { container } = render(<TheEdit />);

    const wrapper = container.querySelector('[data-cinema-player="true"]') as HTMLElement;
    expect(wrapper).toBeDefined();

    wrapper.requestFullscreen = mockRequestFullscreen;

    const video = container.querySelector("video") as HTMLVideoElement;
    (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen = mockVideoEnterFs;

    // Click the TV bezel fullscreen button
    const fsButton = screen.getByTitle(/Toggle Fullscreen/i);
    act(() => {
      fireEvent.click(fsButton);
    });

    // Synchronously called on wrapper
    expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    expect(mockVideoEnterFs).not.toHaveBeenCalled();
  });

  it("Pressing the video to play calls requestFullscreen synchronously and starts playback", async () => {
    const mockRequestFullscreen = vi.fn().mockReturnValue(Promise.resolve());
    const mockPlay = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.play = mockPlay;

    const { container } = render(<TheEdit />);
    const wrapper = container.querySelector('[data-cinema-player="true"]') as HTMLElement;
    wrapper.requestFullscreen = mockRequestFullscreen;

    const playButton = screen.getByTitle("Play Video");
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("With no requestFullscreen but webkitEnterFullscreen on the video, it uses that", () => {
    const mockVideoEnterFs = vi.fn();

    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    const { container } = render(<TheEdit />);

    const wrapper = container.querySelector('[data-cinema-player="true"]') as HTMLElement;
    // @ts-expect-error remove requestFullscreen
    delete wrapper.requestFullscreen;

    const video = container.querySelector("video") as HTMLVideoElement;
    (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen = mockVideoEnterFs;

    const fsButton = screen.getByTitle(/Toggle Fullscreen/i);
    act(() => {
      fireEvent.click(fsButton);
    });

    expect(mockVideoEnterFs).toHaveBeenCalledTimes(1);
  });

  it("fullscreenchange to 'no element' resets the button state", () => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    const { container } = render(<TheEdit />);
    const wrapper = container.querySelector('[data-cinema-player="true"]') as HTMLElement;
    wrapper.requestFullscreen = vi.fn().mockReturnValue(Promise.resolve());

    // Enter fullscreen: simulate fullscreenElement set
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => wrapper,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    // In fullscreen: data-cinema-fullscreen is true
    expect(wrapper.getAttribute("data-cinema-fullscreen")).toBe("true");

    // Fullscreenchange to 'no element' (null)
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    // Reset: data-cinema-fullscreen is no longer true
    expect(wrapper.getAttribute("data-cinema-fullscreen")).toBeNull();
  });

  it("requestNativeFullscreen helper handles synchronous invocation and fallbacks", () => {
    const target = document.createElement("div");
    const video = document.createElement("video");

    const onSuccess = vi.fn();
    const onError = vi.fn();

    target.requestFullscreen = vi.fn().mockReturnValue(Promise.resolve());
    const res = requestNativeFullscreen(target, video, onSuccess, onError);
    expect(res).toBe(true);
    expect(target.requestFullscreen).toHaveBeenCalled();

    // Fallback test
    // @ts-expect-error delete
    delete target.requestFullscreen;
    const mockEnter = vi.fn();
    (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen = mockEnter;
    const res2 = requestNativeFullscreen(target, video, onSuccess, onError);
    expect(res2).toBe(true);
    expect(mockEnter).toHaveBeenCalled();
  });

  it("exitNativeFullscreen handles exit without throwing", () => {
    document.exitFullscreen = vi.fn().mockReturnValue(Promise.resolve());
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => document.createElement("div"),
    });

    expect(() => exitNativeFullscreen()).not.toThrow();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it("TheEditEndCard renders with updated caption and symmetrical action buttons", () => {
    const onPlayAgain = vi.fn();
    const onExit = vi.fn();
    const { container } = render(<TheEditEndCard onPlayAgain={onPlayAgain} onExit={onExit} />);

    expect(screen.getByText("(you liked it, I know)")).toBeDefined();
    const replayBtn = screen.getByRole("button", { name: /REPLAY VIDEO/i });
    const exitBtn = screen.getByRole("button", { name: /BACK TO TV/i });

    expect(replayBtn).toBeDefined();
    expect(exitBtn).toBeDefined();

    const buttonGrid = container.querySelector(".grid.grid-cols-2");
    expect(buttonGrid).not.toBeNull();
  });

  it("TheEditControls allows dragging progress bar slider to seek", () => {
    const onSeekFraction = vi.fn();
    const progressBarRef = React.createRef<HTMLDivElement>();
    const timeDisplayRef = React.createRef<HTMLSpanElement>();

    render(
      <TheEditControls
        isFullscreen={false}
        isPlaying={true}
        isMuted={false}
        showControls={true}
        progressBarRef={progressBarRef}
        timeDisplayRef={timeDisplayRef}
        onTogglePlay={vi.fn()}
        onToggleFullscreen={vi.fn()}
        onToggleMute={vi.fn()}
        onSeekFraction={onSeekFraction}
        onReplay={vi.fn()}
      />
    );

    const slider = screen.getByRole("slider");
    expect(slider).toBeDefined();

    // Mock getBoundingClientRect
    slider.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 100,
      width: 200,
      top: 0,
      bottom: 10,
      right: 300,
    });

    // Pointer down at x=150 (25% progress)
    fireEvent.pointerDown(slider, { clientX: 150 });
    expect(onSeekFraction).toHaveBeenCalledWith(0.25);

    // Pointer move at x=200 (50% progress)
    fireEvent.pointerMove(window, { clientX: 200 });
    expect(onSeekFraction).toHaveBeenCalledWith(0.5);

    // Pointer up
    fireEvent.pointerUp(window);
  });

  it("Video play/pause DOM events keep all UI indicators in lockstep with the real media state", async () => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    const { container } = render(<TheEdit />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).toBeDefined();

    // Initially unstarted: play button exists
    expect(screen.getByTitle("Play Video")).toBeDefined();

    // Click play trigger
    const playButton = screen.getByTitle("Play Video");
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Simulate native DOM 'play' event
    act(() => {
      fireEvent.play(video);
    });

    // In playing state:
    // 1. OSD badge shows REC ●
    expect(screen.getByText(/REC ●/i)).toBeDefined();
    // 2. Big center play trigger is gone
    expect(screen.queryByTitle("Play Video")).toBeNull();
    // 3. Both playback control buttons (inline bar + TV hardware strip) update in lockstep to "Pause"
    const pauseButtons = screen.getAllByRole("button", { name: "Pause" });
    expect(pauseButtons).toHaveLength(2);

    // Simulate native DOM 'pause' event
    act(() => {
      fireEvent.pause(video);
    });

    // In paused state:
    // 1. OSD badge shows PAUSE ❚❚
    expect(screen.getByText(/PAUSE ❚❚/i)).toBeDefined();
    // 2. Both playback control buttons update in lockstep to "Play"
    const playButtons = screen.getAllByRole("button", { name: "Play" });
    expect(playButtons).toHaveLength(2);

    // Simulate video playing while muted -> 'TAP FOR SOUND' affordance appears
    video.muted = true;
    act(() => {
      fireEvent.volumeChange(video);
      fireEvent.play(video);
    });

    const tapForSound = screen.getByRole("button", { name: /Tap to unmute sound/i });
    expect(tapForSound).toBeDefined();

    // Clicking tap for sound un-mutes the video
    act(() => {
      fireEvent.click(tapForSound);
    });
    expect(video.muted).toBe(false);
  });
});
