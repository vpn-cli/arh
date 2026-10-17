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

function expectTerminalLog(pattern: string | RegExp) {
  const container = screen.getByTestId("terminal-logs-container");
  if (typeof pattern === "string") {
    expect(container.textContent).toContain(pattern);
  } else {
    expect(container.textContent).toMatch(pattern);
  }
}

describe("KittyOS Terminal Quiz Workflow", () => {
  it("boots with difficulty selection prompt by default", () => {
    render(<AsciiSection />);
    expect(screen.getByText(/SELECT DIFFICULTY/i)).toBeDefined();
    expect(screen.getByText(/\[1\] Easy/i)).toBeDefined();
    expect(screen.getByText(/\[2\] Medium/i)).toBeDefined();
    expect(screen.getByText(/\[3\] Hard/i)).toBeDefined();
  });

  describe("Q1: Generated Calculus Question & Retry Flow", () => {
    it("on wrong answer, prints exact sarcasm line and allows retrying", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      // Select easy
      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);

      expect(screen.getByText(/DIFFICULTY LEVEL: EASY/i)).toBeDefined();
      expect(screen.getByText(/\[Q1\/3/i)).toBeDefined();

      // Submit wrong answer attempt 1
      fireEvent.change(input, { target: { value: "9999" } });
      fireEvent.submit(form);

      expectTerminalLog("> [✗] chii chii hag diya");
      // Still on Q1, not advanced
      expect(screen.queryByText(/\[Q2\/3/i)).toBeNull();

      // Submit wrong answer attempt 2
      fireEvent.change(input, { target: { value: "-8888" } });
      fireEvent.submit(form);

      const logsText = screen.getByTestId("terminal-logs-container").textContent || "";
      const matches = logsText.split("> [✗] chii chii hag diya").length - 1;
      expect(matches).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText(/\[Q2\/3/i)).toBeNull();
    });

    it("displays template hint on 'hint' command", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.submit(form);

      fireEvent.change(input, { target: { value: "hint" } });
      fireEvent.submit(form);

      expectTerminalLog("> [hint]");
    });

    it("moves to Q2 on 'give up' with pity note", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.submit(form);

      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      expectTerminalLog(
        "> [💔] giving up? after he built an entire operating system for you? wow. noted. VPN will remember this."
      );

      // Advanced to Q2
      expect(screen.getByText(/\[Q2\/3 ✦ VPN LORE\] Which of these best describes VPN\?/i)).toBeDefined();
    });
  });

  describe("Q2: Option Selector & Reveal Flow", () => {
    it("renders options with listbox role and supports arrow navigation and number input", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      // Advance to Q2 via Q1 give up
      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      // Verify listbox and options
      const listbox = screen.getByRole("listbox", { name: /Question options/i });
      expect(listbox).toBeDefined();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0].textContent).toContain("1) Batman");
      expect(options[1].textContent).toContain("2) Gentleman");
      expect(options[2].textContent).toContain("3) Bevkoof");

      // Default highlight is first option
      expect(options[0].getAttribute("aria-selected")).toBe("true");

      // Down arrow moves highlight to option 2
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(options[1].getAttribute("aria-selected")).toBe("true");

      // Up arrow moves highlight back to option 1
      fireEvent.keyDown(input, { key: "ArrowUp" });
      expect(options[0].getAttribute("aria-selected")).toBe("true");

      // Selecting option via typing '2' + Enter
      fireEvent.change(input, { target: { value: "2" } });
      fireEvent.submit(form);

      // Verify 3 reveal lines printed
      expectTerminalLog("> [~] partially correct.");
      expectTerminalLog("> [!] the full answer is: ALL OF THE ABOVE.");
      expectTerminalLog(
        "> [!] it wasn't an option, because no single option could handle him."
      );

      // Moved to Q3
      expect(
        screen.getByText(/\[Q3\/3 ✦ THE TRUTH\] In every argument, who should apologize\?/i)
      ).toBeDefined();
    });

    it("tapping an option selects it directly", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      const options = screen.getAllByRole("option");
      // Tap "3) Bevkoof"
      fireEvent.click(options[2]);

      expectTerminalLog("> [~] partially correct.");
      expectTerminalLog("> [!] the full answer is: ALL OF THE ABOVE.");
      expect(
        screen.getByText(/\[Q3\/3 ✦ THE TRUTH\] In every argument, who should apologize\?/i)
      ).toBeDefined();
    });

    it("Q2 accepts 'hint' command", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      fireEvent.change(input, { target: { value: "hint" } });
      fireEvent.submit(form);

      expectTerminalLog("> [hint] think bigger.");
    });

    it("Q2 'give up' prints pity note AND the 3 reveal lines, then advances to Q3", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      // Give up on Q2
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      expectTerminalLog(
        "> [💔] giving up? after he built an entire operating system for you? wow. noted. VPN will remember this."
      );
      expectTerminalLog("> [~] partially correct.");
      expectTerminalLog("> [!] the full answer is: ALL OF THE ABOVE.");
      expect(
        screen.getByText(/\[Q3\/3 ✦ THE TRUTH\] In every argument, who should apologize\?/i)
      ).toBeDefined();
    });
  });

  describe("Q3: Apology Question, VPN Rotation & Completion", () => {
    it("cycles through all 4 VPN rotation lines when VPN is chosen, then loops", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      // Advance through Q1 and Q2
      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.submit(form);

      expect(
        screen.getByText(/\[Q3\/3 ✦ THE TRUTH\] In every argument, who should apologize\?/i)
      ).toBeDefined();

      const options = screen.getAllByRole("option");
      expect(options[0].textContent).toContain("1) Arhana");
      expect(options[1].textContent).toContain("2) VPN");

      // Pick VPN rotation 1
      fireEvent.click(options[1]);
      expectTerminalLog(
        "> [✗] ERROR: answer rejected. VPN has never been wrong in recorded history."
      );

      // Pick VPN rotation 2
      fireEvent.click(options[1]);
      expectTerminalLog("> [✗] interesting choice. wrong, but interesting. try again.");

      // Pick VPN rotation 3
      fireEvent.click(options[1]);
      expectTerminalLog("> [✗] the system refuses to process this lie.");

      // Pick VPN rotation 4
      fireEvent.click(options[1]);
      expectTerminalLog("> [✗] you can keep picking it. it will keep being wrong.");

      // Pick VPN rotation 5 (loops back to 1)
      fireEvent.click(options[1]);
      const logsText = screen.getByTestId("terminal-logs-container").textContent || "";
      const matches =
        logsText.split(
          "> [✗] ERROR: answer rejected. VPN has never been wrong in recorded history."
        ).length - 1;
      expect(matches).toBeGreaterThanOrEqual(2);

      // Now pick Arhana -> Correct!
      fireEvent.click(options[0]);
      expectTerminalLog(
        "> [✓] correct. glad we finally agree. apology accepted in advance."
      );
      expect(screen.getByText(/ALL 3 CLEARANCE QUESTIONS COMPLETED/i)).toBeDefined();
    });

    it("Q3 hint prints 'it's you. it's always been you.'", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.submit(form);

      fireEvent.change(input, { target: { value: "hint" } });
      fireEvent.submit(form);

      expectTerminalLog("> [hint] it's you. it's always been you.");
    });

    it("Q3 give up prints pity note and finishes clearance", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);
      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.submit(form);

      fireEvent.change(input, { target: { value: "give up" } });
      fireEvent.submit(form);

      expectTerminalLog(
        "> [💔] you'd rather give up than apologize. honestly, that tracks."
      );
      expect(screen.getByText(/ALL 3 CLEARANCE QUESTIONS COMPLETED/i)).toBeDefined();
    });
  });

  describe("SKIP and REBOOT Operations", () => {
    it("SKIP button prints exact pity note and bypasses clearance without confetti", () => {
      render(<AsciiSection />);
      const skipBtn = screen.getByRole("button", { name: /Skip Terminal Questions/i });
      fireEvent.click(skipBtn);

      expectTerminalLog(
        "> [💔] skipped. weeks of effort, gone in one click. it's fine. he's fine. everything is fine."
      );

      // Unlocked
      expect(screen.getByText(/✦ HAPPY BIRTHDAY! ✦/i)).toBeDefined();
    });

    it("REBOOT button resets terminal to difficulty selection screen and generates a fresh Q1 on next attempt", () => {
      render(<AsciiSection />);
      const input = screen.getByRole("textbox", { name: /kittyOS terminal command input/i });
      const form = input.closest("form")!;

      // 1st attempt: start easy
      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);

      const q1PromptEl = screen.getByText(/\[Q1\/3/i);
      const prompt1 = q1PromptEl.textContent;

      // Click reboot
      const rebootBtn = screen.getByRole("button", { name: /Reboot Terminal/i });
      fireEvent.click(rebootBtn);

      // Back to difficulty selection
      expect(screen.getByText(/SELECT DIFFICULTY/i)).toBeDefined();

      // 2nd attempt: start easy again
      fireEvent.change(input, { target: { value: "easy" } });
      fireEvent.submit(form);

      const q1PromptEl2 = screen.getAllByText(/\[Q1\/3/i);
      const prompt2 = q1PromptEl2[q1PromptEl2.length - 1].textContent;

      // Guaranteed fresh question within the session
      expect(prompt2).not.toBe(prompt1);
    });
  });
});
