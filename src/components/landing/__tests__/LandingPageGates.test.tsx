/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LandingPage from "../LandingPage";
import * as gameStateModule from "@/lib/gameState";
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

describe("LandingPage Gates", () => {
  const originalLocation = window.location;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    window.localStorage.clear();
    (process.env as any).NODE_ENV = "test";
  });

  afterEach(() => {
    window.localStorage.clear();
    (process.env as any).NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("always plays intro on '/' even if legacy story_complete === 'true' is in localStorage", () => {
    window.localStorage.setItem("story_complete", "true");
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/",
      href: "http://localhost:3000/",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Intro is NOT skipped; Click to Enter gate is rendered
    expect(screen.getByTestId("click-to-enter")).toBeDefined();
    expect(screen.queryByTestId("world-router")).toBeNull();

    // Legacy localStorage key was purged on mount
    expect(window.localStorage.getItem("story_complete")).toBeNull();
  });

  it("always plays intro on '/?world=main' even if legacy story_complete === 'true' is in localStorage", () => {
    window.localStorage.setItem("story_complete", "true");
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=main",
      pathname: "/",
      href: "http://localhost:3000/?world=main",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Intro is NOT skipped; Click to Enter gate is rendered
    expect(screen.getByTestId("click-to-enter")).toBeDefined();
    expect(screen.queryByTestId("world-router")).toBeNull();
  });

  it("after intro on '/' does not call goToWorld with already-current world and renders 'home'", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/",
      href: "http://localhost:3000/",
    } as any;

    const realUseGameState = gameStateModule.useGameState;
    const goToWorldSpy = vi.fn();
    vi.spyOn(gameStateModule, "useGameState").mockImplementation(() => {
      const ctx = realUseGameState();
      return {
        ...ctx,
        goToWorld: goToWorldSpy,
      };
    });

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /click to enter/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /complete loading/i }));
    });

    // goToWorld must NOT be called because target is 'home' and current is already 'home'
    expect(goToWorldSpy).not.toHaveBeenCalled();

    // Renders home immediately without flash or delay
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: home")).toBeDefined();
  });

  it("after intro on '/?world=main' does not call goToWorld with already-current world and renders 'main'", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=main",
      pathname: "/",
      href: "http://localhost:3000/?world=main",
    } as any;

    const realUseGameState = gameStateModule.useGameState;
    const goToWorldSpy = vi.fn();
    vi.spyOn(gameStateModule, "useGameState").mockImplementation(() => {
      const ctx = realUseGameState();
      return {
        ...ctx,
        goToWorld: goToWorldSpy,
      };
    });

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /click to enter/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /complete loading/i }));
    });

    // goToWorld must NOT be called because target is 'main' and current is already 'main'
    expect(goToWorldSpy).not.toHaveBeenCalled();

    // Renders main immediately without flash or delay
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: main")).toBeDefined();
  });

  it("navigates to deep-linked world in ?world= after intro ends", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?world=main",
      pathname: "/",
      href: "http://localhost:3000/?world=main",
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

    // World system active and navigated to 'main'
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: main")).toBeDefined();
  });

  it("navigates to default home world after intro ends when no ?world= is specified", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/",
      href: "http://localhost:3000/",
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

    // World system active and in 'home'
    expect(screen.getByTestId("world-router")).toBeDefined();
    expect(screen.getByText("World: home")).toBeDefined();
  });

  it("bypasses intro when spotify_auth= is in URL (OAuth callback)", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?spotify_auth=success",
      pathname: "/",
      href: "http://localhost:3000/?spotify_auth=success",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Intro gates are bypassed on OAuth callback
    expect(screen.queryByTestId("click-to-enter")).toBeNull();
    expect(screen.queryByTestId("gameboy-loading")).toBeNull();
    expect(screen.getByTestId("world-router")).toBeDefined();
  });

  it("bypasses intro with ?skipIntro=1 in development environment", () => {
    (process.env as any).NODE_ENV = "development";
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?skipIntro=1",
      pathname: "/",
      href: "http://localhost:3000/?skipIntro=1",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Intro is skipped in development with flag
    expect(screen.queryByTestId("click-to-enter")).toBeNull();
    expect(screen.queryByTestId("gameboy-loading")).toBeNull();
    expect(screen.getByTestId("world-router")).toBeDefined();
  });

  it("does NOT bypass intro with ?skipIntro=1 in production environment", () => {
    (process.env as any).NODE_ENV = "production";
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "?skipIntro=1",
      pathname: "/",
      href: "http://localhost:3000/?skipIntro=1",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Must still show intro in production despite ?skipIntro=1
    expect(screen.getByTestId("click-to-enter")).toBeDefined();
    expect(screen.queryByTestId("world-router")).toBeNull();
  });

  it("does not render any story components anywhere", async () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/",
      href: "http://localhost:3000/",
    } as any;

    render(
      <GameStateProvider>
        <LandingPage />
      </GameStateProvider>
    );

    // Advance through the intro
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /click to enter/i }));
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /complete loading/i }));
    });

    // StoryFlow must not exist
    expect(screen.queryByTestId("story-flow")).toBeNull();
    expect(screen.queryByText(/hamster/i)).toBeNull();
  });

  it("maintains SiteLoadOverlay video element identity before and after isReady flips", () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/",
      href: "http://localhost:3000/",
    } as any;

    let triggerMountEffect: (() => void) | null = null;
    const realUseEffect = React.useEffect;
    const effectSpy = vi.spyOn(React, "useEffect").mockImplementation((effect, deps) => {
      // Intercept mount effect with empty dependency array
      if (Array.isArray(deps) && deps.length === 0) {
        triggerMountEffect = () => {
          effect();
        };
      } else {
        realUseEffect(effect, deps);
      }
    });

    try {
      render(
        <GameStateProvider>
          <LandingPage />
        </GameStateProvider>
      );

      // Phase 1: Rendered with isReady = false (mount effect has not executed yet)
      const videoBeforeFlip = screen.getByTestId("site-load-video");
      expect(videoBeforeFlip).toBeDefined();

      // Phase 2: Trigger mount effect to flip isReady from false to true
      act(() => {
        triggerMountEffect?.();
      });

      // Phase 3: Assert the exact same DOM node instance remains mounted
      const videoAfterFlip = screen.getByTestId("site-load-video");
      expect(videoBeforeFlip).toBe(videoAfterFlip);
    } finally {
      effectSpy.mockRestore();
    }
  });
});
