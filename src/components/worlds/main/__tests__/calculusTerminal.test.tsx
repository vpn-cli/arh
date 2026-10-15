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

describe("Calculus Terminal Workflow", () => {
  it("boots with difficulty selection prompt by default", () => {
    render(<AsciiSection />);
    expect(screen.getByText(/SELECT DIFFICULTY/i)).toBeDefined();
    expect(screen.getByText(/\[1\] Easy/i)).toBeDefined();
    expect(screen.getByText(/\[2\] Medium/i)).toBeDefined();
    expect(screen.getByText(/\[3\] Hard/i)).toBeDefined();
  });

  it("selects difficulty and loads calculus question", () => {
    render(<AsciiSection />);
    const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
    const form = input.closest("form")!;

    // Select easy
    fireEvent.change(input, { target: { value: "easy" } });
    fireEvent.submit(form);

    expect(screen.getByText(/DIFFICULTY LEVEL: EASY/i)).toBeDefined();
    expect(screen.getByText(/\[Q1\/3/i)).toBeDefined();
  });

  it("provides progressive hints and says 'tsk tsk tsk ts chii' on 3rd failure", () => {
    render(<AsciiSection />);
    const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
    const form = input.closest("form")!;

    // Select hard
    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.submit(form);

    expect(screen.getByText(/DIFFICULTY LEVEL: HARD/i)).toBeDefined();

    // 1st wrong attempt -> Hint 1
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.submit(form);
    expect(screen.getByText(/Hint 1:/i)).toBeDefined();

    // 2nd wrong attempt -> Hint 2
    fireEvent.change(input, { target: { value: "8888" } });
    fireEvent.submit(form);
    expect(screen.getByText(/Hint 2:/i)).toBeDefined();

    // 3rd wrong attempt -> reveals answer with "tsk tsk tsk ts chii"
    fireEvent.change(input, { target: { value: "7777" } });
    fireEvent.submit(form);
    expect(screen.getByText(/tsk tsk tsk ts chii/i)).toBeDefined();
    // Moved to Q2
    expect(screen.getByText(/\[Q2\/3/i)).toBeDefined();
  });

  it("allows user to request hint without wrong answer penalty", () => {
    render(<AsciiSection />);
    const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "med" } });
    fireEvent.submit(form);

    fireEvent.change(input, { target: { value: "hint" } });
    fireEvent.submit(form);

    expect(screen.getByText(/\[💡\] Hint 1:/i)).toBeDefined();
  });

  it("reboot button resets terminal to difficulty selection screen", () => {
    render(<AsciiSection />);
    const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
    const form = input.closest("form")!;

    // Select easy
    fireEvent.change(input, { target: { value: "easy" } });
    fireEvent.submit(form);
    expect(screen.getByText(/\[Q1\/3/i)).toBeDefined();

    // Click REBOOT
    const rebootBtn = screen.getByRole("button", { name: /Reboot Terminal/i });
    fireEvent.click(rebootBtn);

    // Back to difficulty prompt
    expect(screen.getByText(/SELECT DIFFICULTY/i)).toBeDefined();
  });
});
