import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LandingPage from "../LandingPage";
import { GameStateProvider, useGameState } from "@/lib/gameState";

vi.mock("../../worlds/WorldRouter", () => ({
  default: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { currentWorld } = useGameState();
    return <div data-testid="world-router">World: {currentWorld}</div>;
  },
}));

vi.mock("@/providers/SpotifyPlayerProvider", () => ({
  SpotifyPlayerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="spotify-provider">{children}</div>
  ),
}));

vi.mock("../../ui/ClickToEnterScreen", () => ({
  default: ({ onEnter }: { onEnter: () => void }) => (
    <div data-testid="click-to-enter">
      <button onClick={onEnter}>Click to Enter</button>
    </div>
  ),
}));

vi.mock("../../ui/GameboyLoadingScreen", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="gameboy-loading">
      <button onClick={onComplete}>Complete Loading</button>
    </div>
  ),
}));

vi.mock("../StoryFlow", () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="story-flow">
      <button onClick={onComplete}>Finish Story Flow</button>
    </div>
  ),
}));

describe("LandingPage Gates", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("skips ClickToEnterScreen, GameboyLoadingScreen, and StoryFlow when ?world= is valid AND story_complete === 'true'", () => {
    window.localStorage.setItem("story_complete", "true");
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=music",
      pathname: "/",
      href: "http://localhost:3000/?world=music",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Gates are skipped
    expect(screen.queryByTestId("click-to-enter")).toBeNull();
    expect(screen.queryByTestId("gameboy-loading")).toBeNull();
    expect(screen.queryByTestId("story-flow")).toBeNull();

    // World system is directly active and rendered
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: music")).toBeDefined();
  });

  it("runs the normal flow when ?world= is valid BUT story_complete !== 'true'", () => {
    window.localStorage.removeItem("story_complete");
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=music",
      pathname: "/",
      href: "http://localhost:3000/?world=music",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Normal flow runs: initial gate is displayed
    expect(screen.getByTestId("click-to-enter")).toBeDefined();
    expect(screen.queryByTestId("world-router")).toBeNull();
  });

  it("navigates to the world named in ?world= instead of default home when the story completes", async () => {
    vi.useFakeTimers();
    window.localStorage.removeItem("story_complete");
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=scrapbook",
      pathname: "/",
      href: "http://localhost:3000/?world=scrapbook",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Gate 1: ClickToEnter
    expect(screen.getByTestId("click-to-enter")).toBeDefined();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /click to enter/i }));
    });

    // Gate 2: GameboyLoading
    expect(screen.getByTestId("gameboy-loading")).toBeDefined();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /complete loading/i }));
    });

    // Gate 3: StoryFlow
    expect(screen.getByTestId("story-flow")).toBeDefined();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /finish story flow/i }));
    });

    // Advance transition timer in GameStateProvider
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Check localStorage saved
    expect(window.localStorage.getItem("story_complete")).toBe("true");

    // Check that we navigated to scrapbook instead of default home
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: scrapbook")).toBeDefined();

    vi.useRealTimers();
  });
});
