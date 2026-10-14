import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
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
});
