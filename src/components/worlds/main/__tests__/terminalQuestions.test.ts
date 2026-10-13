import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getRandomNumericalQuestion,
  getRandomCalculusQuestion,
  fetchOutsourcedQuestion,
  getInitialLogs,
  INITIAL_NUMERICAL_QUESTIONS,
} from "../terminalQuestions";

describe("terminalQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a valid question from the fallback pool with integer answer", () => {
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

  it("formats initial logs with clearance boot sequence and question prompt", () => {
    const q = INITIAL_NUMERICAL_QUESTIONS[0];
    const logs = getInitialLogs(q);

    expect(logs).toHaveLength(3);
    expect(logs[0].type).toBe("system");
    expect(logs[0].text).toContain("kittyOS");
    expect(logs[1].type).toBe("question");
    expect(logs[1].text).toContain(q.prompt);
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

  it("gracefully falls back to local numerical question when network fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const result = await fetchOutsourcedQuestion();
    expect(result).toBeDefined();
    expect(typeof result.answer).toBe("number");
    expect(Number.isInteger(result.answer)).toBe(true);
  });
});
