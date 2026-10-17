import {
  CalculusDifficulty,
  generateCalculusQuestion,
} from "@/lib/kittyos/calculusGenerator";

export type LogLine = {
  id: string;
  type: "system" | "user" | "success" | "error" | "question";
  text: string;
};

export type Difficulty = CalculusDifficulty;

export type TerminalQuestion = {
  id: string;
  topic: string;
  prompt: string;
  answer?: number;
  options?: string[];
  hint: string;
  difficulty?: Difficulty;
};

export type CalculusQuestion = TerminalQuestion;
export type NumericalQuestion = TerminalQuestion;

export interface OptionQuestion extends TerminalQuestion {
  options: string[];
}

export const Q2_DATA: OptionQuestion = {
  id: "q2-vpn-lore",
  topic: "VPN LORE",
  prompt: "Which of these best describes VPN?",
  options: ["Batman", "Gentleman", "Bevkoof"],
  hint: "think bigger.",
};

export const Q2_REVEAL_LINES = [
  "> [~] partially correct.",
  "> [!] the full answer is: ALL OF THE ABOVE.",
  "> [!] it wasn't an option, because no single option could handle him.",
];

export const Q3_DATA: OptionQuestion = {
  id: "q3-the-truth",
  topic: "THE TRUTH",
  prompt: "In every argument, who should apologize?",
  options: ["Arhana", "VPN"],
  hint: "it's you. it's always been you.",
};

export const Q3_VPN_ROTATION = [
  "> [✗] ERROR: answer rejected. VPN has never been wrong in recorded history.",
  "> [✗] interesting choice. wrong, but interesting. try again.",
  "> [✗] the system refuses to process this lie.",
  "> [✗] you can keep picking it. it will keep being wrong.",
];

export const Q3_CORRECT_LINE = "> [✓] correct. glad we finally agree. apology accepted in advance.";

export const PITY_LINES = {
  giveUpQ1orQ2:
    "> [💔] giving up? after he built an entire operating system for you? wow. noted. VPN will remember this.",
  giveUpQ3: "> [💔] you'd rather give up than apologize. honestly, that tracks.",
  skipButton:
    "> [💔] skipped. weeks of effort, gone in one click. it's fine. he's fine. everything is fine.",
  q1Wrong: "> [✗] chii chii hag diya",
};

export function getRandomNumericalQuestion(): NumericalQuestion {
  const q = generateCalculusQuestion("easy");
  return {
    id: `calc-${Date.now()}`,
    difficulty: "easy",
    topic: q.topic,
    prompt: q.prompt,
    answer: q.answer,
    hint: q.hint,
  };
}

export const getRandomCalculusQuestion = getRandomNumericalQuestion;

export function getQuestionsForDifficulty(
  difficulty: Difficulty,
  sessionPrompts?: Set<string>
): TerminalQuestion[] {
  const generated = generateCalculusQuestion(difficulty, { excludePrompts: sessionPrompts });
  const q1: TerminalQuestion = {
    id: `calc-${difficulty}-${Date.now()}`,
    difficulty,
    topic: generated.topic,
    prompt: generated.prompt,
    answer: generated.answer,
    hint: generated.hint,
  };

  return [q1, Q2_DATA, Q3_DATA];
}

export function getBootLogs(): LogLine[] {
  return [
    { id: "boot-1", type: "system", text: "kittyOS v1.0.4 (tty1) ── [CALCULUS PROTOCOL: ACTIVE]" },
    { id: "boot-select", type: "question", text: ">> SELECT DIFFICULTY:  [1] Easy   |   [2] Medium   |   [3] Hard" },
    { id: "boot-hint", type: "system", text: ">> Type easy, med, or hard (or 1, 2, 3) below to begin:" },
  ];
}

export function getInitialLogs(q: TerminalQuestion): LogLine[] {
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
