import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AsciiSection from "../AsciiSection";

// Mock sfx and canvas-confetti
vi.mock("@/lib/audio", () => ({
  sfx: {
    click: { play: vi.fn() },
    pop: vi.fn(),
    select: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("../terminalQuestions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../terminalQuestions")>();
  return {
    ...actual,
    fetchOutsourcedQuestion: vi.fn().mockImplementation(() => new Promise(() => {})),
  };
});

describe("AsciiSection", () => {
  it("renders terminal prompt when locked", () => {
    render(<AsciiSection isUnlocked={false} />);
    expect(screen.getByText("guest@kittyOS:~$")).toBeDefined();
    expect(screen.getByRole("button", { name: /skip terminal questions/i })).toBeDefined();
    expect(screen.queryByRole("img", { name: /Hello Kitty mascot/i })).toBeNull();
  });

  it("renders KittyMascot above birthday greeting and vault button when unlocked", () => {
    render(<AsciiSection isUnlocked={true} />);

    // Kitty mascot SVG rendered
    const mascot = screen.getByRole("img", {
      name: /Hello Kitty mascot/i,
    });
    expect(mascot).toBeDefined();
    expect(mascot.getAttribute("width")).toBe("180");
    expect(mascot.getAttribute("height")).toBe("170");

    // Birthday greeting preserved
    expect(screen.getByText(/✦ HAPPY BIRTHDAY! ✦/i)).toBeDefined();

    // Vault button preserved
    expect(
      screen.getByRole("button", { name: /open phase 02: birthday vault/i })
    ).toBeDefined();

    // Ensure no ASCII pre tag is rendered
    expect(document.querySelector("pre")).toBeNull();
  });

  it("transitions to showing KittyMascot upon clicking skip", () => {
    const handleUnlock = vi.fn();
    render(<AsciiSection onUnlock={handleUnlock} />);

    const skipButton = screen.getByRole("button", { name: /skip terminal questions/i });
    fireEvent.click(skipButton);

    expect(handleUnlock).toHaveBeenCalled();
    expect(
      screen.getByRole("img", { name: /Hello Kitty mascot/i })
    ).toBeDefined();
    expect(screen.getByText(/✦ HAPPY BIRTHDAY! ✦/i)).toBeDefined();
  });

  describe("Terminal log overflow measurements (Prompt M2)", () => {
    let resizeCallback: ResizeObserverCallback | null = null;

    beforeEach(() => {
      class MockResizeObserver {
        constructor(cb: ResizeObserverCallback) {
          resizeCallback = cb;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
      window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    });

    it("content shorter than the container results in overflow-y-visible", () => {
      const { container } = render(<AsciiSection />);
      const logsContainer = container.querySelector('[data-testid="terminal-logs-container"]') as HTMLElement;
      expect(logsContainer).toBeDefined();

      // Shorter content: scrollHeight (200) <= clientHeight (360)
      Object.defineProperty(logsContainer, "scrollHeight", { configurable: true, value: 200 });
      Object.defineProperty(logsContainer, "clientHeight", { configurable: true, value: 360 });

      act(() => {
        resizeCallback?.([], {} as ResizeObserver);
      });

      expect(logsContainer.className).toContain("overflow-y-visible");
      expect(logsContainer.className).not.toContain("overflow-y-auto");
    });

    it("content taller than the container results in overflow-y-auto, even with fewer than 7 log entries", () => {
      const { container } = render(<AsciiSection />);
      const logsContainer = container.querySelector('[data-testid="terminal-logs-container"]') as HTMLElement;
      expect(logsContainer).toBeDefined();

      // Taller content: scrollHeight (450) > clientHeight (360), with fewer than 7 log lines
      Object.defineProperty(logsContainer, "scrollHeight", { configurable: true, value: 450 });
      Object.defineProperty(logsContainer, "clientHeight", { configurable: true, value: 360 });

      act(() => {
        resizeCallback?.([], {} as ResizeObserver);
      });

      expect(logsContainer.className).toContain("overflow-y-auto");
      expect(logsContainer.className).not.toContain("overflow-y-visible");
    });

    it("the flag does not cause a re-render when the measurement doesn't change", () => {
      const { container } = render(<AsciiSection />);
      const logsContainer = container.querySelector('[data-testid="terminal-logs-container"]') as HTMLElement;

      // Mock taller content
      Object.defineProperty(logsContainer, "scrollHeight", { configurable: true, value: 500 });
      Object.defineProperty(logsContainer, "clientHeight", { configurable: true, value: 360 });

      act(() => {
        resizeCallback?.([], {} as ResizeObserver);
      });
      expect(logsContainer.className).toContain("overflow-y-auto");

      const domBefore = logsContainer.outerHTML;

      act(() => {
        // Trigger observer multiple times with same measurement
        resizeCallback?.([], {} as ResizeObserver);
        resizeCallback?.([], {} as ResizeObserver);
      });

      expect(logsContainer.outerHTML).toBe(domBefore);
    });
  });
});

