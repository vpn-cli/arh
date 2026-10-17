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

// Mock usePrefersReducedMotion default to false
const mockPrefersReducedMotion = vi.fn().mockReturnValue(false);
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion(),
}));

describe("TheAdventureHero mascot speech bubble", () => {
  const FULL_GREETING =
    "Watashi wa Hello Kitty! Anata wa Arhana-chan desho? Hajimemashite~ ♡";

  beforeEach(() => {
    vi.useFakeTimers();
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders exactly ONE speech bubble and reveals Romaji greeting via typewriter effect", () => {
    render(<TheAdventureHero />);

    const bubble = screen.getByTestId("mascot-speech-bubble");
    expect(bubble).toBeDefined();

    // Before timer advances, typewriter is at beginning
    expect(bubble.textContent?.trim()).toBe("");

    // Advance 500ms (~20 characters)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(bubble.textContent).toContain("Watashi wa Hello");

    // Advance to full completion (~25ms * 66 chars = 1650ms, advance 2000ms)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");
    expect(bubble.textContent).toContain("Anata wa Arhana-chan desho?");
    expect(bubble.textContent).toContain("Hajimemashite~");
    expect(bubble.textContent).toContain("♡");

    // Verify there are no duplicate/other mascot bubbles
    const avatarBtn = document.getElementById("guide-cat-avatar");
    expect(avatarBtn).toBeDefined();
    expect(avatarBtn?.getAttribute("title")).toBeNull();
    expect(avatarBtn?.querySelector("[data-testid='mascot-speech-bubble']")).toBeNull();
  });

  it("renders heart '♡' with fallback emoji font stack", () => {
    render(<TheAdventureHero />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    const heartSpan = screen.getByText("♡");
    expect(heartSpan).toBeDefined();
    expect(heartSpan.style.fontFamily).toContain("Apple Color Emoji");
    expect(heartSpan.style.fontFamily).toContain("Segoe UI Emoji");
  });

  it("swaps text to 'aur bhai' on mascot hover and reverts on leave", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");

    // Hover
    fireEvent.mouseEnter(avatarBtn);
    expect(bubble.textContent).toBe("aur bhai");

    // Leave
    fireEvent.mouseLeave(avatarBtn);
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");
    expect(bubble.textContent).toContain("♡");
  });

  it("swaps text to 'aur bhai' on focus and reverts on blur", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");

    // Focus
    fireEvent.focus(avatarBtn);
    expect(bubble.textContent).toBe("aur bhai");

    // Blur
    fireEvent.blur(avatarBtn);
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");
    expect(bubble.textContent).toContain("♡");
  });

  it("touch/tap: shows 'aur bhai' for 2s, then reverts", () => {
    render(<TheAdventureHero />);
    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    const bubble = screen.getByTestId("mascot-speech-bubble");

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");

    // Click / tap avatar
    act(() => {
      fireEvent.click(avatarBtn);
    });

    expect(bubble.textContent).toBe("aur bhai");

    // Advance 1.9s -> still "aur bhai"
    act(() => {
      vi.advanceTimersByTime(1900);
    });
    expect(bubble.textContent).toBe("aur bhai");

    // Advance remaining 100ms (total 2000ms) -> reverts
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");
    expect(bubble.textContent).toContain("♡");
  });

  it("displays full text immediately when prefers-reduced-motion is true", () => {
    mockPrefersReducedMotion.mockReturnValue(true);
    render(<TheAdventureHero />);

    const bubble = screen.getByTestId("mascot-speech-bubble");
    // Without any timer advancement, full text is already present
    expect(bubble.textContent).toContain("Watashi wa Hello Kitty!");
    expect(bubble.textContent).toContain("♡");
  });

  it("provides full accessible text via aria-label with aria-hidden animated span and no aria-live", () => {
    render(<TheAdventureHero />);

    const bubble = screen.getByTestId("mascot-speech-bubble");
    expect(bubble.getAttribute("aria-label")).toBe(FULL_GREETING);
    expect(bubble.getAttribute("aria-live")).toBeNull();

    // The animated typewriter span is aria-hidden so screen readers only hear the aria-label
    const animatedSpan = bubble.querySelector(".bubble-squish-in");
    expect(animatedSpan?.getAttribute("aria-hidden")).toBe("true");

    const avatarBtn = document.getElementById("guide-cat-avatar")!;
    fireEvent.mouseEnter(avatarBtn);
    expect(bubble.getAttribute("aria-label")).toBe("aur bhai");

    fireEvent.mouseLeave(avatarBtn);
    expect(bubble.getAttribute("aria-label")).toBe(FULL_GREETING);
  });

  it("renders the <h1> title 'CONGRATULATIONS, YOU’RE OLD' with bow on C", () => {
    render(<TheAdventureHero />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("CONGRATULATIONS,");
    expect(heading.textContent).toContain("YOU’RE OLD");

    // Bow perched on C
    const bowImg = heading.querySelector("img[src*='bow_satin']");
    expect(bowImg).not.toBeNull();
  });

  it("renders the official notice description card with accessible tab and hidden decorative accents", () => {
    render(<TheAdventureHero />);

    // Official notice tab
    expect(screen.getByText("OFFICIAL NOTICE")).toBeDefined();

    // Sarcastic copy
    expect(
      screen.getByText(/to celebrate your slow decline, here are 4 phases of/i)
    ).toBeDefined();
    expect(screen.getByText("mild inconvenience")).toBeDefined();

    // Approved stamp
    expect(screen.getByText("APPROVED")).toBeDefined();

    // Decorative items (stamp, hearts, tab emoji) are aria-hidden
    const hiddenElements = document.querySelectorAll("[aria-hidden='true']");
    const stampEl = Array.from(hiddenElements).find((el) =>
      el.textContent?.includes("APPROVED")
    );
    expect(stampEl).toBeDefined();

    const warningEmoji = Array.from(hiddenElements).find(
      (el) => el.textContent === "⚠"
    );
    expect(warningEmoji).toBeDefined();
  });
});
