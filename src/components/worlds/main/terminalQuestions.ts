export type LogLine = {
  id: string;
  type: "system" | "user" | "success" | "error" | "question";
  text: string;
};

export type NumericalQuestion = {
  id: string;
  topic: string;
  prompt: string;
  answer: number;
  hint: string;
};

// Kept for backwards compatibility
export type CalculusQuestion = NumericalQuestion;

export const INITIAL_NUMERICAL_QUESTIONS: NumericalQuestion[] = [
  {
    id: "num-1",
    topic: "ARITHMETIC",
    prompt: "Solve for the integer:  12 × 4  =  ?",
    answer: 48,
    hint: "Think: 12 × 2 is 24, double that is 48!",
  },
  {
    id: "num-2",
    topic: "MENTAL MATH",
    prompt: "Evaluate:  150 - 65  =  ?",
    answer: 85,
    hint: "150 - 60 is 90, then minus 5 is 85!",
  },
  {
    id: "num-3",
    topic: "ARITHMETIC",
    prompt: "Solve for the integer:  9 × 8  =  ?",
    answer: 72,
    hint: "Recall times tables: 9 × 8 = 72!",
  },
  {
    id: "num-4",
    topic: "NUMERICAL TRIVIA",
    prompt: "How many sides does an octagon have  =  ?",
    answer: 8,
    hint: "Think of an octopus (8 tentacles)!",
  },
  {
    id: "num-5",
    topic: "EXPONENTS",
    prompt: "Evaluate:  2⁴ (2 to the power of 4)  =  ?",
    answer: 16,
    hint: "2 × 2 × 2 × 2 = 16!",
  },
  {
    id: "num-6",
    topic: "NUMERICAL TRIVIA",
    prompt: "How many degrees are in a right angle  =  ?",
    answer: 90,
    hint: "One quarter of a 360° circle!",
  },
  {
    id: "num-7",
    topic: "MENTAL MATH",
    prompt: "Evaluate:  35 + 47  =  ?",
    answer: 82,
    hint: "35 + 40 = 75, then + 7 = 82!",
  },
  {
    id: "num-8",
    topic: "ARITHMETIC",
    prompt: "Evaluate:  144 ÷ 12  =  ?",
    answer: 12,
    hint: "12 squared is 144!",
  },
];

export function getRandomNumericalQuestion(): NumericalQuestion {
  const index = Math.floor(Math.random() * INITIAL_NUMERICAL_QUESTIONS.length);
  return INITIAL_NUMERICAL_QUESTIONS[index];
}

export const getRandomCalculusQuestion = getRandomNumericalQuestion;

/**
 * Fetch an outsourced question from /api/terminal/question (OpenTDB + generator fallback).
 */
export async function fetchOutsourcedQuestion(): Promise<NumericalQuestion> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("/api/terminal/question", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.answer === "number" && data.prompt) {
        return {
          id: data.id || `web-${Date.now()}`,
          topic: data.topic || "WEB TRIVIA",
          prompt: data.prompt,
          answer: data.answer,
          hint: data.hint || "It's an easy numerical answer!",
        };
      }
    }
  } catch {
    // Network offline or aborted, fallback gracefully
  }

  return getRandomNumericalQuestion();
}

export function getInitialLogs(q: NumericalQuestion): LogLine[] {
  return [
    { id: "boot-1", type: "system", text: "kittyOS v1.0.4 (tty1) ── [ARH Clearance Protocol: ACTIVE]" },
    { id: "q1-q", type: "question", text: `[Q1/3 ✦ ${q.topic}] ${q.prompt}` },
    { id: "q1-hint", type: "system", text: ">> Enter your integer answer into the terminal prompt below:" },
  ];
}

export const ASCII_FRAMES = [
  `     /\\_____/\\   🎀\n   //  o   o  \\\\\n ==(     .     )==\n   \\\\  _____  //\n     /|     |\\\n    ( |  ♥  | )\n     (__) (__)`,
  `     /\\_____/\\   🎀\n   //  ^   ^  \\\\\n ==(     v     )==\n   \\\\  _____  //\n     /|     |\\\n    ( |  ♥  | )\n     (__) (__)`,
];
