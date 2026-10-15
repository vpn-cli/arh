export type LogLine = {
  id: string;
  type: "system" | "user" | "success" | "error" | "question";
  text: string;
};

export type Difficulty = "easy" | "medium" | "hard";

export type CalculusQuestion = {
  id: string;
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  answer: number;
  hint1: string;
  hint2: string;
  hint: string;
};

export type NumericalQuestion = CalculusQuestion;

export const CALCULUS_QUESTIONS: Record<Difficulty, CalculusQuestion[]> = {
  easy: [
    {
      id: "calc-e1",
      difficulty: "easy",
      topic: "DERIVATIVES",
      prompt: "Find dy/dx of y = 4x² + 5x at x = 2:",
      answer: 21,
      hint1: "Use the power rule: d/dx(ax^n) = a·n·x^(n-1). The derivative is 8x + 5.",
      hint2: "Substitute x = 2 into 8x + 5: 8(2) + 5 = 16 + 5 = 21.",
      hint: "Use the power rule: d/dx(ax^n) = a·n·x^(n-1). The derivative is 8x + 5.",
    },
    {
      id: "calc-e2",
      difficulty: "easy",
      topic: "DEFINITE INTEGRAL",
      prompt: "Evaluate: ∫ from 0 to 4 of (2x + 1) dx =",
      answer: 20,
      hint1: "Find the antiderivative: ∫(2x + 1) dx = x² + x.",
      hint2: "Evaluate at bounds [0, 4]: (4² + 4) - 0 = 16 + 4 = 20.",
      hint: "Find the antiderivative: ∫(2x + 1) dx = x² + x.",
    },
    {
      id: "calc-e3",
      difficulty: "easy",
      topic: "LIMITS",
      prompt: "Evaluate the limit: lim (x → 3) of (x² - 9) / (x - 3) =",
      answer: 6,
      hint1: "Factor the numerator as difference of squares: (x - 3)(x + 3).",
      hint2: "Cancel (x - 3) to get (x + 3), then evaluate 3 + 3 = 6.",
      hint: "Factor the numerator as difference of squares: (x - 3)(x + 3).",
    },
    {
      id: "calc-e4",
      difficulty: "easy",
      topic: "TANGENT SLOPES",
      prompt: "Find the slope of y = x³ - 2x at x = 2:",
      answer: 10,
      hint1: "The slope is the derivative: dy/dx = 3x² - 2.",
      hint2: "Plug in x = 2: 3(2)² - 2 = 12 - 2 = 10.",
      hint: "The slope is the derivative: dy/dx = 3x² - 2.",
    },
    {
      id: "calc-e5",
      difficulty: "easy",
      topic: "EXPONENTIALS",
      prompt: "If f(x) = 5e^(2x), evaluate f'(0) =",
      answer: 10,
      hint1: "Chain rule: d/dx(e^(2x)) = 2e^(2x). So f'(x) = 10e^(2x).",
      hint2: "At x = 0, e^0 = 1, so 10 · 1 = 10.",
      hint: "Chain rule: d/dx(e^(2x)) = 2e^(2x). So f'(x) = 10e^(2x).",
    },
  ],
  medium: [
    {
      id: "calc-m1",
      difficulty: "medium",
      topic: "DEFINITE INTEGRAL",
      prompt: "Evaluate: ∫ from 1 to 3 of (3x² - 4x + 2) dx =",
      answer: 14,
      hint1: "The antiderivative F(x) = x³ - 2x² + 2x.",
      hint2: "F(3) = 27 - 18 + 6 = 15; F(1) = 1 - 2 + 2 = 1; 15 - 1 = 14.",
      hint: "The antiderivative F(x) = x³ - 2x² + 2x.",
    },
    {
      id: "calc-m2",
      difficulty: "medium",
      topic: "CRITICAL POINTS",
      prompt: "Find the value of x > 0 where f(x) = 2x³ - 9x² + 12x has a local minimum:",
      answer: 2,
      hint1: "Set f'(x) = 6x² - 18x + 12 = 6(x - 1)(x - 2) = 0.",
      hint2: "Check x = 1 and x = 2 with f''(x) = 12x - 18. f''(2) = 6 > 0 (local min at x = 2).",
      hint: "Set f'(x) = 6x² - 18x + 12 = 6(x - 1)(x - 2) = 0.",
    },
    {
      id: "calc-m3",
      difficulty: "medium",
      topic: "L'HÔPITAL'S RULE",
      prompt: "Evaluate: lim (x → 0) of (e^(4x) - 1 - 4x) / x² =",
      answer: 8,
      hint1: "0/0 indeterminate form: apply L'Hôpital's rule by differentiating numerator and denominator.",
      hint2: "Second derivative gives (16e^(4x)) / 2. As x → 0, 16 / 2 = 8.",
      hint: "0/0 indeterminate form: apply L'Hôpital's rule.",
    },
    {
      id: "calc-m4",
      difficulty: "medium",
      topic: "HIGHER DERIVATIVES",
      prompt: "Find f''(1) if f(x) = x⁴ - 3x³ + 7x² - 5:",
      answer: 8,
      hint1: "f'(x) = 4x³ - 9x² + 14x. Differentiate again for f''(x).",
      hint2: "f''(x) = 12x² - 18x + 14. At x = 1: 12 - 18 + 14 = 8.",
      hint: "First find f'(x) = 4x³ - 9x² + 14x, then differentiate again.",
    },
    {
      id: "calc-m5",
      difficulty: "medium",
      topic: "INTEGRATION BY PARTS",
      prompt: "Evaluate: ∫ from 0 to 1 of 6x·e^(x) dx =",
      answer: 6,
      hint1: "Use ∫u dv = uv - ∫v du with u = 6x, dv = e^x dx. Antiderivative is 6(x - 1)e^x.",
      hint2: "Evaluate from 0 to 1: 6(0·e^1 - (-1)·e^0) = 6(0 - (-1)) = 6.",
      hint: "Use integration by parts with u = 6x and dv = e^x dx.",
    },
  ],
  hard: [
    {
      id: "calc-h1",
      difficulty: "hard",
      topic: "OPTIMIZATION",
      prompt: "Find the absolute max value of f(x) = 2x³ - 15x² + 24x + 30 on [0, 5]:",
      answer: 41,
      hint1: "Critical points: f'(x) = 6(x - 1)(x - 4) = 0 gives x = 1 and x = 4.",
      hint2: "Evaluate: f(0)=30, f(1)=41, f(4)=14, f(5)=25. The max value is 41.",
      hint: "Find critical points where f'(x) = 6(x - 1)(x - 4) = 0 and compare with endpoints.",
    },
    {
      id: "calc-h2",
      difficulty: "hard",
      topic: "U-SUBSTITUTION",
      prompt: "Evaluate: ∫ from 0 to 3 of (2x) / √(x² + 16) dx =",
      answer: 2,
      hint1: "Let u = x² + 16, du = 2x dx. Limits become u = 16 to u = 25.",
      hint2: "∫ u^(-1/2) du = [2√u] from 16 to 25 = 2(5 - 4) = 2.",
      hint: "Substitute u = x² + 16 with du = 2x dx.",
    },
    {
      id: "calc-h3",
      difficulty: "hard",
      topic: "AREA BETWEEN CURVES",
      prompt: "Find the area enclosed between y = 6x and y = 3x²:",
      answer: 4,
      hint1: "Intersections: 6x = 3x² gives x = 0 and x = 2.",
      hint2: "Integrate ∫ from 0 to 2 (6x - 3x²) dx = [3x² - x³] from 0 to 2 = 12 - 8 = 4.",
      hint: "Find intersection bounds 6x = 3x² and integrate top minus bottom.",
    },
    {
      id: "calc-h4",
      difficulty: "hard",
      topic: "TAYLOR SERIES",
      prompt: "Evaluate: lim (x → 0) of [12·(e^(2x) - 1 - 2x - 2x²)] / x³ =",
      answer: 16,
      hint1: "Expand e^(2x) = 1 + 2x + 2x² + (4/3)x³ + ...",
      hint2: "Subtract 1 + 2x + 2x² to get (4/3)x³. Multiply by 12: 12 · 4/3 = 16.",
      hint: "Use Taylor expansion of e^(2x) up to x³.",
    },
    {
      id: "calc-h5",
      difficulty: "hard",
      topic: "TRIG INTEGRAL",
      prompt: "Evaluate: ∫ from 0 to π/2 of (40·sin(x)·cos³(x)) dx =",
      answer: 10,
      hint1: "Let u = cos(x), du = -sin(x) dx. Limits: x=0 -> u=1, x=π/2 -> u=0.",
      hint2: "Integral becomes ∫ from 0 to 1 of 40·u³ du = [10·u⁴] from 0 to 1 = 10.",
      hint: "Substitute u = cos(x) with du = -sin(x) dx.",
    },
  ],
};

export const INITIAL_NUMERICAL_QUESTIONS: NumericalQuestion[] = CALCULUS_QUESTIONS.easy;

export function getRandomNumericalQuestion(): NumericalQuestion {
  const all = [...CALCULUS_QUESTIONS.easy, ...CALCULUS_QUESTIONS.medium];
  const index = Math.floor(Math.random() * all.length);
  return all[index];
}

export const getRandomCalculusQuestion = getRandomNumericalQuestion;

export const PERSONAL_QUESTIONS: CalculusQuestion[] = [
  {
    id: "personal-1",
    difficulty: "easy",
    topic: "OUR LORE",
    prompt: "In which college year did we first cross paths? (Enter integer year 1, 2, 3, or 4):",
    answer: 2,
    hint1: "Think back to the sophomore era when we first met...",
    hint2: "We met in 2nd year! Type 2.",
    hint: "Think back to the sophomore era when we first met...",
  },
  {
    id: "personal-2",
    difficulty: "easy",
    topic: "OUR LORE",
    prompt: "In which college year did our friendship actually level up? (Enter integer year 1, 2, 3, or 4):",
    answer: 3,
    hint1: "When the late-night banter, chaotic inside jokes, and real bond formed...",
    hint2: "We became good friends in 3rd year! Type 3.",
    hint: "When the late-night banter, chaotic inside jokes, and real bond formed...",
  },
];

export function getQuestionsForDifficulty(difficulty: Difficulty): CalculusQuestion[] {
  const mathPool = [...(CALCULUS_QUESTIONS[difficulty] || CALCULUS_QUESTIONS.easy)];
  const mathQ = mathPool[Math.floor(Math.random() * mathPool.length)];
  return [mathQ, PERSONAL_QUESTIONS[0], PERSONAL_QUESTIONS[1]];
}

export function getBootLogs(): LogLine[] {
  return [
    { id: "boot-1", type: "system", text: "kittyOS v1.0.4 (tty1) ── [CALCULUS PROTOCOL: ACTIVE]" },
    { id: "boot-select", type: "question", text: ">> SELECT DIFFICULTY:  [1] Easy   |   [2] Medium   |   [3] Hard" },
    { id: "boot-hint", type: "system", text: ">> Type easy, med, or hard (or 1, 2, 3) below to begin:" },
  ];
}

export function getInitialLogs(q: CalculusQuestion): LogLine[] {
  return [
    { id: "boot-1", type: "system", text: "kittyOS v1.0.4 (tty1) ── [CALCULUS PROTOCOL: ACTIVE]" },
    { id: "q1-q", type: "question", text: `[Q1/3 ✦ ${q.topic}] ${q.prompt}` },
    { id: "q1-hint", type: "system", text: ">> Enter your integer answer into the terminal prompt below:" },
  ];
}

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
          difficulty: "easy",
          topic: data.topic || "WEB TRIVIA",
          prompt: data.prompt,
          answer: data.answer,
          hint1: data.hint || "It's an easy numerical answer!",
          hint2: data.hint || "It's an easy numerical answer!",
          hint: data.hint || "It's an easy numerical answer!",
        };
      }
    }
  } catch {
    // Network offline or aborted, fallback gracefully
  }

  return getRandomNumericalQuestion();
}

export const ASCII_FRAMES = [
  `     /\\_____/\\   🎀\n   //  o   o  \\\\\n ==(     .     )==\n   \\\\  _____  //\n     /|     |\\\n    ( |  ♥  | )\n     (__) (__)`,
  `     /\\_____/\\   🎀\n   //  ^   ^  \\\\\n ==(     v     )==\n   \\\\  _____  //\n     /|     |\\\n    ( |  ♥  | )\n     (__) (__)`,
];
