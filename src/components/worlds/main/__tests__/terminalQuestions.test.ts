import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getRandomNumericalQuestion,
  getRandomCalculusQuestion,
  getQuestionsForDifficulty,
  Q2_DATA,
  Q3_DATA,
  Q2_REVEAL_LINES,
  Q3_VPN_ROTATION,
  Q3_CORRECT_LINE,
  PITY_LINES,
  fetchOutsourcedQuestion,
  getInitialLogs,
  ASCII_FRAMES,
} from "../terminalQuestions";

describe("terminalQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid question from generator with integer answer", () => {
    const q = getRandomNumericalQuestion();
    expect(q).toBeDefined();
    expect(typeof q.answer).toBe("number");
    expect(Number.isInteger(q.answer)).toBe(true);
    expect(q.prompt).toBeTruthy();
    expect(q.topic).toBeTruthy();
    expect(q.hint).toBeTruthy();
  });

  it("supports backwards compatibility alias getRandomCalculusQuestion", () => {
    const q = getRandomCalculusQuestion();
    expect(q).toBeDefined();
    expect(typeof q.answer).toBe("number");
  });

  it("returns 1 math question followed by Q2 (VPN LORE) and Q3 (THE TRUTH)", () => {
    const questions = getQuestionsForDifficulty("easy");
    expect(questions).toHaveLength(3);

    // Q1 is math/calculus
    expect(questions[0].difficulty).toBe("easy");
    expect(typeof questions[0].answer).toBe("number");
    expect(Number.isInteger(questions[0].answer)).toBe(true);

    // Q2 is VPN LORE option question
    expect(questions[1].id).toBe(Q2_DATA.id);
    expect(questions[1].topic).toBe("VPN LORE");
    expect(questions[1].prompt).toBe("Which of these best describes VPN?");
    expect(questions[1].options).toEqual(["Batman", "Gentleman", "Bevkoof"]);
    expect(questions[1].hint).toBe("think bigger.");

    // Q3 is THE TRUTH option question
    expect(questions[2].id).toBe(Q3_DATA.id);
    expect(questions[2].topic).toBe("THE TRUTH");
    expect(questions[2].prompt).toBe("In every argument, who should apologize?");
    expect(questions[2].options).toEqual(["Arhana", "VPN"]);
    expect(questions[2].hint).toBe("it's you. it's always been you.");
  });

  it("verifies exact copy for sarcastic and reveal lines", () => {
    expect(Q2_REVEAL_LINES).toEqual([
      "> [~] partially correct.",
      "> [!] the full answer is: ALL OF THE ABOVE.",
      "> [!] it wasn't an option, because no single option could handle him.",
    ]);

    expect(Q3_VPN_ROTATION).toEqual([
      "> [✗] ERROR: answer rejected. VPN has never been wrong in recorded history.",
      "> [✗] interesting choice. wrong, but interesting. try again.",
      "> [✗] the system refuses to process this lie.",
      "> [✗] you can keep picking it. it will keep being wrong.",
    ]);

    expect(Q3_CORRECT_LINE).toBe(
      "> [✓] correct. glad we finally agree. apology accepted in advance."
    );

    expect(PITY_LINES.giveUpQ1orQ2).toBe(
      "> [💔] giving up? after he built an entire operating system for you? wow. noted. VPN will remember this."
    );
    expect(PITY_LINES.giveUpQ3).toBe(
      "> [💔] you'd rather give up than apologize. honestly, that tracks."
    );
    expect(PITY_LINES.skipButton).toBe("> [💔] mehnat ki kadr hi nhi hai");
    expect(PITY_LINES.q1Wrong).toBe("> [✗] chii chii hag diya");
  });

  it("formats initial logs with clearance boot sequence and question prompt", () => {
    const questions = getQuestionsForDifficulty("easy");
    const logs = getInitialLogs(questions[0]);

    expect(logs).toHaveLength(3);
    expect(logs[0].type).toBe("system");
    expect(logs[0].text).toContain("kittyOS");
    expect(logs[1].type).toBe("question");
    expect(logs[1].text).toContain(questions[0].prompt);
    expect(logs[2].type).toBe("system");
    expect(logs[2].text).toContain("integer answer");
  });

  it("fetches outsourced question from /api/terminal/question successfully", async () => {
    const mockQuestion = {
      id: "mock-123",
      topic: "WEB MATH TRIVIA",
      prompt: "What is 7 × 7 = ?",
      answer: 49,
      hint: "Square of 7",
      source: "opentdb",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuestion,
    } as Response);

    const result = await fetchOutsourcedQuestion();
    expect(result.id).toBe("mock-123");
    expect(result.answer).toBe(49);
    expect(result.prompt).toBe("What is 7 × 7 = ?");
    expect(result.topic).toBe("WEB MATH TRIVIA");
  });

  it("exports valid Hello Kitty ASCII frames with blinking animation and bow", () => {
    expect(ASCII_FRAMES).toHaveLength(2);
    expect(ASCII_FRAMES[0]).toContain("🎀");
    expect(ASCII_FRAMES[1]).toContain("🎀");
    expect(ASCII_FRAMES[0]).toContain("/\\_____/\\");
    expect(ASCII_FRAMES[0]).toContain("o   o");
    expect(ASCII_FRAMES[1]).toContain("^   ^");
  });
});
