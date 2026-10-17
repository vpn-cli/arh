"use client";

import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/audio";
import { dispatchPuzzleSolved, dispatchPuzzleSkipped } from "@/components/ui/cursorUtils";
import { parseIntegerAnswer } from "@/lib/kittyos/calculusGenerator";
import {
  Difficulty,
  TerminalQuestion,
  getQuestionsForDifficulty,
  getBootLogs,
  LogLine,
  Q2_DATA,
  Q2_REVEAL_LINES,
  Q3_DATA,
  Q3_VPN_ROTATION,
  Q3_CORRECT_LINE,
  PITY_LINES,
} from "./terminalQuestions";

interface UseKittyTerminalEngineProps {
  onUnlock?: () => void;
  onReset?: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export type TerminalStage = "difficulty" | "quiz" | "cleared";

export function useKittyTerminalEngine({
  onUnlock,
  onReset,
  inputRef,
}: UseKittyTerminalEngineProps) {
  const [stage, setStage] = useState<TerminalStage>("difficulty");
  const [, setDifficulty] = useState<Difficulty>("easy");
  const [questions, setQuestions] = useState<TerminalQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [, setWrongAttempts] = useState(0);
  const [q3VpnCount, setQ3VpnCount] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>(() => getBootLogs());
  const [inputVal, setInputVal] = useState("");
  const [internalUnlocked, setInternalUnlocked] = useState(false);

  const usedPromptsRef = useRef<Set<string>>(new Set());

  const triggerConfetti = () => {
    try {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#FF8FB3", "#FFEAA7", "#C8EADE", "#FFB6C1", "#FFD166"],
      });
    } catch {}
  };

  const handleReset = () => {
    sfx.click.play();
    setStage("difficulty");
    setQuestions([]);
    setQuestionIndex(0);
    setWrongAttempts(0);
    setQ3VpnCount(0);
    setSelectedOptionIndex(0);
    setLogs(getBootLogs());
    setInputVal("");
    setInternalUnlocked(false);
    onReset?.();
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  };

  const handleSkip = () => {
    sfx.select();
    dispatchPuzzleSkipped();
    setLogs((prev) => [
      ...prev,
      {
        id: `skip-${Date.now()}`,
        type: "system",
        text: PITY_LINES.skipButton,
      },
    ]);
    setInternalUnlocked(true);
    setStage("cleared");
    onUnlock?.();
  };

  const navigateOptions = (dir: "up" | "down") => {
    const activeQ = questions[questionIndex];
    const opts = activeQ?.options;
    if (!opts || opts.length === 0) return;
    const len = opts.length;
    setSelectedOptionIndex((prev) => (dir === "up" ? (prev - 1 + len) % len : (prev + 1) % len));
  };

  const selectOption = (optIndex: number) => {
    if (stage !== "quiz") return;

    if (questionIndex === 1) {
      // Q2: Option selection
      const optText = Q2_DATA.options[optIndex] ?? "Option";
      sfx.pop();

      const userLine: LogLine = {
        id: `user-${Date.now()}`,
        type: "user",
        text: `guest@kittyOS:~$ ${optIndex + 1}) ${optText}`,
      };

      setQuestionIndex(2);
      setSelectedOptionIndex(0);
      setLogs((prev) => [
        ...prev,
        userLine,
        { id: `q2-rev1-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[0] },
        { id: `q2-rev2-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[1] },
        { id: `q2-rev3-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[2] },
        {
          id: `q3-prompt-${Date.now()}`,
          type: "question",
          text: `[Q3/3 ✦ ${Q3_DATA.topic}] ${Q3_DATA.prompt}`,
        },
      ]);
      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      return;
    }

    if (questionIndex === 2) {
      // Q3: Option selection
      if (optIndex === 1) {
        // VPN selected: cycle through sarcastic lines, retry
        sfx.error();
        const line = Q3_VPN_ROTATION[q3VpnCount % Q3_VPN_ROTATION.length];
        setQ3VpnCount((c) => c + 1);

        const userLine: LogLine = {
          id: `user-${Date.now()}`,
          type: "user",
          text: `guest@kittyOS:~$ 2) VPN`,
        };

        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q3-err-${Date.now()}`,
            type: "error",
            text: line,
          },
        ]);
        setInputVal("");
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
        return;
      }

      if (optIndex === 0) {
        // Arhana selected: Correct!
        sfx.pop();
        const userLine: LogLine = {
          id: `user-${Date.now()}`,
          type: "user",
          text: `guest@kittyOS:~$ 1) Arhana`,
        };

        sfx.select();
        triggerConfetti();
        dispatchPuzzleSolved();

        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q3-ok-${Date.now()}`,
            type: "success",
            text: Q3_CORRECT_LINE,
          },
          {
            id: `quiz-complete-${Date.now()}`,
            type: "success",
            text: "> [✓] ALL 3 CLEARANCE QUESTIONS COMPLETED! 🎉 DEPLOYING MAXIMUM BIRTHDAY ENERGY 🎀",
          },
        ]);
        setInternalUnlocked(true);
        setStage("cleared");
        onUnlock?.();
        setInputVal("");
      }
    }
  };

  const submitAnswer = (rawAnswer: string) => {
    const trimmed = rawAnswer.trim();
    if (!trimmed && stage !== "cleared" && questionIndex === 0) return;

    if (trimmed.toLowerCase() === "reboot" || trimmed.toLowerCase() === "restart") {
      handleReset();
      return;
    }

    if (trimmed.toLowerCase() === "skip" || trimmed.toLowerCase() === "bypass") {
      handleSkip();
      setInputVal("");
      return;
    }

    const lower = trimmed.toLowerCase();

    if (stage === "difficulty") {
      sfx.click.play();
      const userLine: LogLine = {
        id: `user-${Date.now()}`,
        type: "user",
        text: `guest@kittyOS:~$ ${trimmed}`,
      };

      let selectedDiff: Difficulty | null = null;
      if (lower === "1" || lower === "easy" || lower === "e") selectedDiff = "easy";
      else if (lower === "2" || lower === "med" || lower === "medium" || lower === "m") selectedDiff = "medium";
      else if (lower === "3" || lower === "hard" || lower === "h") selectedDiff = "hard";

      if (!selectedDiff) {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `diff-err-${Date.now()}`,
            type: "error",
            text: "> [!] Please choose: easy, med, or hard (or 1, 2, 3).",
          },
        ]);
        setInputVal("");
        return;
      }

      sfx.pop();
      const qList = getQuestionsForDifficulty(selectedDiff, usedPromptsRef.current);
      usedPromptsRef.current.add(qList[0].prompt);

      setDifficulty(selectedDiff);
      setQuestions(qList);
      setQuestionIndex(0);
      setWrongAttempts(0);
      setQ3VpnCount(0);
      setSelectedOptionIndex(0);
      setStage("quiz");

      const firstQ = qList[0];
      setLogs((prev) => [
        ...prev,
        userLine,
        {
          id: `diff-ok-${Date.now()}`,
          type: "success",
          text: `> [✓] DIFFICULTY LEVEL: ${selectedDiff.toUpperCase()} 🎓 Clearance protocol activated. 3 questions loaded.`,
        },
        {
          id: `q1-prompt-${Date.now()}`,
          type: "question",
          text: `[Q1/3 ✦ ${firstQ.topic}] ${firstQ.prompt}`,
        },
        {
          id: `q1-hint-${Date.now()}`,
          type: "system",
          text: ">> Enter your integer answer into the terminal prompt below:",
        },
      ]);
      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      return;
    }

    if (stage === "quiz") {
      const currentQ = questions[questionIndex];
      if (!currentQ) return;

      // Q1: Numerical Calculus
      if (questionIndex === 0) {
        sfx.click.play();
        const userLine: LogLine = {
          id: `user-${Date.now()}`,
          type: "user",
          text: `guest@kittyOS:~$ ${trimmed}`,
        };

        if (lower === "hint" || lower === "help") {
          sfx.select();
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `hint-${Date.now()}`,
              type: "system",
              text: `> [hint] ${currentQ.hint}`,
            },
          ]);
          setInputVal("");
          return;
        }

        if (lower === "give up" || lower === "pass" || lower === "idk" || lower === "surrender") {
          sfx.error();
          setQuestionIndex(1);
          setSelectedOptionIndex(0);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `giveup-1-${Date.now()}`,
              type: "system",
              text: PITY_LINES.giveUpQ1orQ2,
            },
            {
              id: `q2-prompt-${Date.now()}`,
              type: "question",
              text: `[Q2/3 ✦ ${Q2_DATA.topic}] ${Q2_DATA.prompt}`,
            },
          ]);
          setInputVal("");
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
          return;
        }

        const parsed = parseIntegerAnswer(trimmed);
        const isCorrect = parsed !== null && parsed === currentQ.answer;

        if (isCorrect) {
          sfx.pop();
          setQuestionIndex(1);
          setSelectedOptionIndex(0);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-ok-${Date.now()}`,
              type: "success",
              text: `> [✓] Correct: ${currentQ.answer}! Nicely done! 🧠✨`,
            },
            {
              id: `q2-prompt-${Date.now()}`,
              type: "question",
              text: `[Q2/3 ✦ ${Q2_DATA.topic}] ${Q2_DATA.prompt}`,
            },
          ]);
        } else {
          sfx.error();
          setWrongAttempts((w) => w + 1);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-err-${Date.now()}`,
              type: "error",
              text: PITY_LINES.q1Wrong,
            },
          ]);
        }

        setInputVal("");
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
        return;
      }

      // Q2: Option Selector
      if (questionIndex === 1) {
        if (lower === "hint" || lower === "help") {
          sfx.select();
          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            { id: `hint-${Date.now()}`, type: "system", text: `> [hint] ${Q2_DATA.hint}` },
          ]);
          setInputVal("");
          return;
        }

        if (lower === "give up" || lower === "pass" || lower === "idk" || lower === "surrender") {
          sfx.error();
          setQuestionIndex(2);
          setSelectedOptionIndex(0);
          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            { id: `giveup-2-${Date.now()}`, type: "system", text: PITY_LINES.giveUpQ1orQ2 },
            { id: `q2-rev1-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[0] },
            { id: `q2-rev2-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[1] },
            { id: `q2-rev3-${Date.now()}`, type: "system", text: Q2_REVEAL_LINES[2] },
            {
              id: `q3-prompt-${Date.now()}`,
              type: "question",
              text: `[Q3/3 ✦ ${Q3_DATA.topic}] ${Q3_DATA.prompt}`,
            },
          ]);
          setInputVal("");
          setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
          return;
        }

        let optIdx = selectedOptionIndex;
        if (trimmed === "1" || lower === "batman") optIdx = 0;
        else if (trimmed === "2" || lower === "gentleman") optIdx = 1;
        else if (trimmed === "3" || lower === "bevkoof") optIdx = 2;
        else if (trimmed !== "") {
          sfx.error();
          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            {
              id: `q2-err-${Date.now()}`,
              type: "error",
              text: "> [!] Please choose an option (1, 2, or 3) or use ↑/↓ arrows + Enter.",
            },
          ]);
          setInputVal("");
          return;
        }

        selectOption(optIdx);
        return;
      }

      // Q3: Option Selector
      if (questionIndex === 2) {
        if (lower === "hint" || lower === "help") {
          sfx.select();
          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            { id: `hint-${Date.now()}`, type: "system", text: `> [hint] ${Q3_DATA.hint}` },
          ]);
          setInputVal("");
          return;
        }

        if (lower === "give up" || lower === "pass" || lower === "idk" || lower === "surrender") {
          sfx.error();
          sfx.select();
          triggerConfetti();
          dispatchPuzzleSolved();

          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            { id: `giveup-3-${Date.now()}`, type: "system", text: PITY_LINES.giveUpQ3 },
            {
              id: `quiz-complete-${Date.now()}`,
              type: "success",
              text: "> [✓] ALL 3 CLEARANCE QUESTIONS COMPLETED! 🎉 DEPLOYING MAXIMUM BIRTHDAY ENERGY 🎀",
            },
          ]);
          setInternalUnlocked(true);
          setStage("cleared");
          onUnlock?.();
          setInputVal("");
          return;
        }

        let optIdx = selectedOptionIndex;
        if (trimmed === "1" || lower === "arhana") optIdx = 0;
        else if (trimmed === "2" || lower === "vpn") optIdx = 1;
        else if (trimmed !== "") {
          sfx.error();
          setLogs((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, type: "user", text: `guest@kittyOS:~$ ${trimmed}` },
            {
              id: `q3-err-${Date.now()}`,
              type: "error",
              text: "> [!] Please choose an option (1 or 2) or use ↑/↓ arrows + Enter.",
            },
          ]);
          setInputVal("");
          return;
        }

        selectOption(optIdx);
      }
    }
  };

  const getPlaceholder = () => {
    if (stage === "difficulty") return "Choose difficulty: easy, med, or hard...";
    if (stage === "quiz") {
      if (questionIndex === 0) return "Type your integer answer (or 'hint' / 'give up')...";
      if (questionIndex === 1) return "Use ↑/↓ + Enter or type 1-3 (or 'hint' / 'give up')...";
      return "Use ↑/↓ + Enter or type 1-2 (or 'hint' / 'give up')...";
    }
    return "All cleared! 🎀";
  };

  return {
    stage,
    logs,
    inputVal,
    setInputVal,
    internalUnlocked,
    questionIndex,
    questions,
    selectedOptionIndex,
    setSelectedOptionIndex,
    navigateOptions,
    selectOption,
    submitAnswer,
    handleReset,
    handleSkip,
    getPlaceholder,
  };
}
