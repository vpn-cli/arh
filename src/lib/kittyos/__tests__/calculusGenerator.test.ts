import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  TemplateId,
  createSeededRng,
  parseIntegerAnswer,
  generateCalculusQuestion,
  TEMPLATES_BY_DIFFICULTY,
} from "../calculusGenerator";

describe("Calculus Question Generator", () => {
  describe("Answer Parsing (Section 1)", () => {
    it("trims whitespace and accepts valid integer formats", () => {
      expect(parseIntegerAnswer("3")).toBe(3);
      expect(parseIntegerAnswer("  3  ")).toBe(3);
      expect(parseIntegerAnswer("+3")).toBe(3);
      expect(parseIntegerAnswer("  +3  ")).toBe(3);
      expect(parseIntegerAnswer("-3")).toBe(-3);
      expect(parseIntegerAnswer("  -3  ")).toBe(-3);
      expect(parseIntegerAnswer("−3")).toBe(-3); // Unicode minus \u2212
      expect(parseIntegerAnswer("  −3  ")).toBe(-3);
      expect(parseIntegerAnswer("3.0")).toBe(3);
      expect(parseIntegerAnswer("  3.0  ")).toBe(3);
      expect(parseIntegerAnswer("-3.0")).toBe(-3);
      expect(parseIntegerAnswer("−3.0")).toBe(-3);
      expect(parseIntegerAnswer("+3.0")).toBe(3);
      expect(parseIntegerAnswer("0")).toBe(0);
      expect(parseIntegerAnswer("+0")).toBe(0);
      expect(parseIntegerAnswer("-0")).toBe(0);
      expect(parseIntegerAnswer("0.0")).toBe(0);
      expect(parseIntegerAnswer("120")).toBe(120);
      expect(parseIntegerAnswer("−450")).toBe(-450);
    });

    it("rejects non-integers, floats, malformed input, and garbage", () => {
      expect(parseIntegerAnswer("3.5")).toBeNull();
      expect(parseIntegerAnswer("-3.14")).toBeNull();
      expect(parseIntegerAnswer("3.")).toBeNull();
      expect(parseIntegerAnswer(".3")).toBeNull();
      expect(parseIntegerAnswer("")).toBeNull();
      expect(parseIntegerAnswer("   ")).toBeNull();
      expect(parseIntegerAnswer("abc")).toBeNull();
      expect(parseIntegerAnswer("3a")).toBeNull();
      expect(parseIntegerAnswer("a3")).toBeNull();
      expect(parseIntegerAnswer("3 3")).toBeNull();
      expect(parseIntegerAnswer("++3")).toBeNull();
      expect(parseIntegerAnswer("--3")).toBeNull();
      expect(parseIntegerAnswer("3/4")).toBeNull();
      expect(parseIntegerAnswer(null as unknown as string)).toBeNull();
      expect(parseIntegerAnswer(undefined as unknown as string)).toBeNull();
    });
  });

  describe("Session & Difficulty Pool", () => {
    it("generates questions matching the requested difficulty", () => {
      const easyQ = generateCalculusQuestion("easy");
      expect(TEMPLATES_BY_DIFFICULTY.easy).toContain(easyQ.templateId);

      const medQ = generateCalculusQuestion("medium");
      expect(TEMPLATES_BY_DIFFICULTY.medium).toContain(medQ.templateId);

      const hardQ = generateCalculusQuestion("hard");
      expect(TEMPLATES_BY_DIFFICULTY.hard).toContain(hardQ.templateId);
    });

    it("respects excludePrompts to avoid repeats within a session", () => {
      const rng = createSeededRng(42);
      const seen = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const q = generateCalculusQuestion("easy", { excludePrompts: seen, rng });
        expect(seen.has(q.prompt)).toBe(false);
        seen.add(q.prompt);
      }
    });
  });

  describe("Numerical Verification for all 14 Templates (2,000 samples each)", () => {
    const templateIds = Object.keys(TEMPLATES) as TemplateId[];

    templateIds.forEach((templateId, idx) => {
      const template = TEMPLATES[templateId];

      it(`template '${templateId}' produces 2,000 valid integer answers verified numerically`, () => {
        const rng = createSeededRng(1000 + idx * 777);

        for (let i = 0; i < 2000; i++) {
          const q = template.generate(rng);

          // 1. Must be integer
          expect(Number.isInteger(q.answer)).toBe(true);

          // 2. Reasonably bounded (|answer| <= 500)
          expect(Math.abs(q.answer)).toBeLessThanOrEqual(500);

          // 3. Prompt, hint, topic defined
          expect(q.prompt.length).toBeGreaterThan(0);
          expect(q.hint.length).toBeGreaterThan(0);
          expect(q.topic.length).toBeGreaterThan(0);

          // 4. Numerical verification within 1e-6
          const numerical = template.evaluateNumerical(q);
          const diff = Math.abs(q.answer - numerical);
          expect(
            diff,
            `Template ${templateId} iteration ${i} answer ${q.answer} did not match numerical ${numerical} for prompt "${q.prompt}"`
          ).toBeLessThan(1e-6);
        }
      });
    });
  });
});
