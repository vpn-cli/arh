import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import MusicWorld from "../MusicWorld";
import { useMusicView } from "../hooks/useMusicView";

vi.mock("@/lib/gameState", () => ({
  useGameState: () => ({ goHome: vi.fn(), currentWorld: "music" }),
}));

vi.mock("@/lib/audio", () => ({
  sfx: { select: vi.fn() },
}));

vi.mock("gsap", () => ({
  default: {
    fromTo: vi.fn(),
  },
}));

vi.mock("../SpotifyPlayerUI", () => ({
  default: () => <div data-testid="spotify-player-ui">Full Player</div>,
}));

vi.mock("../widget/WidgetPlayer", () => ({
  WidgetPlayer: () => <div data-testid="widget-player">Widget Player</div>,
}));

describe("MusicWorld view switching", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?world=music");
  });

  it("switches from full player to widget and back without hook errors", () => {
    let controls: ReturnType<typeof useMusicView> | null = null;
    function TestController() {
      controls = useMusicView();
      return null;
    }

    render(
      <>
        <TestController />
        <MusicWorld />
      </>
    );

    // Initial state: full player
    expect(screen.getByTestId("spotify-player-ui")).toBeDefined();
    expect(screen.queryByTestId("widget-player")).toBeNull();

    // Switch to widget view in the same window
    act(() => {
      controls?.switchToWidget();
    });

    expect(screen.getByTestId("widget-player")).toBeDefined();
    expect(screen.queryByTestId("spotify-player-ui")).toBeNull();

    // Switch back to full player view
    act(() => {
      controls?.expandToFull();
    });

    expect(screen.getByTestId("spotify-player-ui")).toBeDefined();
    expect(screen.queryByTestId("widget-player")).toBeNull();
  });
});
