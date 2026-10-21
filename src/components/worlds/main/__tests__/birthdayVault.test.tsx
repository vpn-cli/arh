import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import BirthdayVault from "../BirthdayVault";

vi.mock("@/lib/audio", () => ({
  sfx: {
    select: vi.fn(),
    move: vi.fn(),
    pop: vi.fn(),
    hover: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/components/ui/cursorUtils", () => ({
  dispatchPuzzleSolved: vi.fn(),
}));

describe("BirthdayVault Phase 02 Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders phase header and unopened chest", () => {
    render(<BirthdayVault />);
    expect(screen.getByText("PHASE 02")).toBeDefined();
    expect(screen.getByText("THE VAULT")).toBeDefined();
    expect(screen.getByRole("button", { name: /open mystery birthday vault/i })).toBeDefined();
    expect(screen.getByText("OPEN THE CHEST")).toBeDefined();
  });

  it("opens modal with rewritten sarcastic copy on chest click", () => {
    render(<BirthdayVault />);
    const chestButton = screen.getByRole("button", { name: /open mystery birthday vault/i });

    fireEvent.click(chestButton);

    expect(screen.getByText("UNLOCKING CHEST...")).toBeDefined();

    // Fast forward sequence of unlock sounds (300ms, 600ms, 1000ms)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Eyebrow
    expect(screen.getByText("ACCESS GRANTED · reluctantly ✦")).toBeDefined();

    // Title
    expect(screen.getByRole("heading", { level: 2, name: "WOW. YOU DID SOMETHING." })).toBeDefined();

    // Body
    expect(
      screen.getByText(
        "first time for everything, i guess. don’t let it go to your head. there’s not much room up there anyway."
      )
    ).toBeDefined();

    // Closing line
    const closingLine = screen.getByText(/okay, one nice thing: thanks for existing\. genuinely\./i);
    expect(closingLine).toBeDefined();
    expect(closingLine.className).toContain("font-letter-handwritten");
    expect(closingLine.className).toContain("text-[#C8436A]");
    expect(closingLine.className).toContain("mt-3");

    // Emoji span
    const emojiSpan = screen.getByText("💗");
    expect(emojiSpan).toBeDefined();
    expect(emojiSpan.style.fontFamily).toContain("Apple Color Emoji");

    // Close button
    const returnButton = screen.getByRole("button", { name: "CONTINUE YOUR DECLINE ✦" });
    expect(returnButton).toBeDefined();

    // Close on click
    fireEvent.click(returnButton);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes modal on Escape key press", () => {
    render(<BirthdayVault />);
    const chestButton = screen.getByRole("button", { name: /open mystery birthday vault/i });
    fireEvent.click(chestButton);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("dialog")).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
