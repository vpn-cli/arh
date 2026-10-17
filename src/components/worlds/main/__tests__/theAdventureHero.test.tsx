import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import TheAdventureHero from "../TheAdventureHero";

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ""} />;
  },
}));

// Mock audio sfx
vi.mock("@/lib/audio", () => ({
  sfx: {
    hover: vi.fn(),
    pop: vi.fn(),
    select: vi.fn(),
  },
}));

describe("TheAdventureHero mascot speech bubble", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders exactly ONE speech bubble with default text 'psst… scroll ↓'", () => {
    render(<TheAdventureHero />);

    const bubble = screen.getByTestId("mascot-speech-bubble");
    expect(bubble).toBeDefined();
    expect(bubble.textContent).toContain("psst… scroll ↓");

    // Verify there are no duplicate/other mascot bubbles
    const avatarBtn = document.getElementById("guide-cat-avatar");
    expect(avatarBtn).toBeDefined();
    expect(avatarBtn?.getAttribute("title")).toBeNull();
    expect(avatarBtn?.querySelector("[data-testid='mascot-speech-bubble']")).toBeNull();
  });

  it("swaps text to 'aur bhai' on mascot hover and reverts on leave", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    expect(bubble.textContent).toContain("psst… scroll ↓");

    // Hover
    fireEvent.mouseEnter(avatarBtn);
    expect(bubble.textContent).toContain("aur bhai");

    // Leave
    fireEvent.mouseLeave(avatarBtn);
    expect(bubble.textContent).toContain("psst… scroll ↓");
  });

  it("swaps text to 'aur bhai' on focus and reverts on blur", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    expect(bubble.textContent).toContain("psst… scroll ↓");

    // Focus
    fireEvent.focus(avatarBtn);
    expect(bubble.textContent).toContain("aur bhai");

    // Blur
    fireEvent.blur(avatarBtn);
    expect(bubble.textContent).toContain("psst… scroll ↓");
  });

  it("touch/tap: shows 'aur bhai' for 2s, then reverts", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    expect(bubble.textContent).toContain("psst… scroll ↓");

    // Click / tap avatar
    act(() => {
      fireEvent.click(avatarBtn);
    });

    expect(bubble.textContent).toContain("aur bhai");

    // Advance 1.9s -> still "aur bhai"
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(bubble.textContent).toContain("aur bhai");

    // Advance remaining 100ms (total 2000ms) -> reverts
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(bubble.textContent).toContain("psst… scroll ↓");
  });
});
