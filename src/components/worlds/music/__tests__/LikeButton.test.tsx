import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LikeButton } from "../LikeButton";

describe("LikeButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders outline star when not saved with Save to Liked Songs aria-label", () => {
    render(<LikeButton isSaved={false} onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Save to Liked Songs" });
    expect(button).toBeDefined();
    expect(button.getAttribute("title")).toBe("Save to Liked Songs");

    const svg = button.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("none");
  });

  it("renders filled star when saved with Remove from Liked Songs aria-label and thin dark outline", () => {
    render(<LikeButton isSaved={true} onToggle={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Remove from Liked Songs" });
    expect(button).toBeDefined();
    expect(button.getAttribute("title")).toBe("Remove from Liked Songs");

    const svg = button.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("stroke")).toBe("var(--color-dark)");
    expect(svg?.getAttribute("stroke-width")).toBe("1");
  });

  it("does not show Snoopy pop when disableSnoopyPop is true", () => {
    const toggleSpy = vi.fn();
    const { container } = render(
      <LikeButton isSaved={false} onToggle={toggleSpy} disableSnoopyPop={true} />
    );

    const button = screen.getByRole("button", { name: "Save to Liked Songs" });
    act(() => {
      fireEvent.click(button);
    });

    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toBeNull();
  });

  it("triggers onToggle and saving animation (sparkles and Snoopy pop) when clicked while unsaved", async () => {

    const toggleSpy = vi.fn();
    const { container } = render(<LikeButton isSaved={false} onToggle={toggleSpy} />);

    const button = screen.getByRole("button", { name: "Save to Liked Songs" });
    act(() => {
      fireEvent.click(button);
    });

    expect(toggleSpy).toHaveBeenCalledTimes(1);

    // Snoopy sticker should be rendered
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/stickers/snoopy-v1/r2c1.png");

    // Fast forward past animation duration (< 1 second)
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Snoopy sticker should fade / unmount
    expect(container.querySelector("img")).toBeNull();
  });

  it("triggers onToggle and does not show Snoopy pop when clicked while saved (un-saving)", () => {
    const toggleSpy = vi.fn();
    const { container } = render(<LikeButton isSaved={true} onToggle={toggleSpy} />);

    const button = screen.getByRole("button", { name: "Remove from Liked Songs" });
    act(() => {
      fireEvent.click(button);
    });

    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not trigger onToggle or animation when disabled", () => {
    const toggleSpy = vi.fn();
    const { container } = render(<LikeButton isSaved={false} onToggle={toggleSpy} disabled={true} />);

    const button = screen.getByRole("button", { name: "Save to Liked Songs" });
    expect(button.hasAttribute("disabled")).toBe(true);

    act(() => {
      fireEvent.click(button);
    });
    expect(toggleSpy).not.toHaveBeenCalled();
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not show sparkles or Snoopy pop when prefers-reduced-motion is active", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const toggleSpy = vi.fn();
    const { container } = render(<LikeButton isSaved={false} onToggle={toggleSpy} />);

    const button = screen.getByRole("button", { name: "Save to Liked Songs" });
    act(() => {
      fireEvent.click(button);
    });

    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toBeNull();
  });
});
