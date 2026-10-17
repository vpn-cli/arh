"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/audio";
import { dispatchPuzzleSolved, dispatchPuzzleSkipped } from "@/components/ui/cursorUtils";
import { parseIntegerAnswer } from "@/lib/kittyos/calculusGenerator";
import {
  Difficulty, TerminalQuestion, getQuestionsForDifficulty, getBootLogs, LogLine,
  Q2_DATA, Q2_REVEAL_LINES, Q3_DATA, Q3_VPN_ROTATION, Q3_CORRECT_LINE, PITY_LINES,
} from "./terminalQuestions";

interface UseKittyTerminalEngineProps {
  onUnlock?: () => void;
  onReset?: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export type TerminalStage = "difficulty" | "quiz" | "cleared";

let logSeq = 0;
const logEntry = (type: LogLine["type"], text: string, prefix = "log"): LogLine => ({
  id: `${prefix}-${Date.now()}-${++logSeq}`,
  type,
  text,
});

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
  const [isSkipping, setIsSkipping] = useState(false);

  const isSkippingRef = useRef(false);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usedPromptsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, []);

  const triggerConfetti = () => {
    try {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors: ["#FF8FB3", "#FFEAA7", "#C8EADE", "#FFB6C1", "#FFD166"] });
    } catch {}
  };

  const handleReset = () => {
    if (isSkippingRef.current) return;
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
    isSkippingRef.current = false;
    setIsSkipping(false);
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
    if (isSkippingRef.current || internalUnlocked || stage === "cleared") return;
    isSkippingRef.current = true;
    setIsSkipping(true);

    sfx.select();
    dispatchPuzzleSkipped();
    setLogs((prev) => [...prev, logEntry("system", PITY_LINES.skipButton, "skip")]);
    setInputVal("");

    skipTimerRef.current = setTimeout(() => {
      setInternalUnlocked(true);
      setStage("cleared");
      setIsSkipping(false);
      isSkippingRef.current = false;
      onUnlock?.();
    }, 2500);
  };

  const navigateOptions = (dir: "up" | "down") => {
    if (isSkippingRef.current) return;
    const opts = questions[questionIndex]?.options;
    if (!opts || opts.length === 0) return;
    const len = opts.length;
    setSelectedOptionIndex((prev) => (dir === "up" ? (prev - 1 + len) % len : (prev + 1) % len));
  };

  const finishClearance = (extraLines: LogLine[]) => {
    sfx.select();
    triggerConfetti();
    dispatchPuzzleSolved();
    setLogs((prev) => [...prev, ...extraLines]);
    setInternalUnlocked(true);
    setStage("cleared");
    onUnlock?.();
    setInputVal("");
  };

  const selectOption = (optIndex: number) => {
    if (stage !== "quiz" || isSkippingRef.current) return;

    if (questionIndex === 1) {
      const optText = Q2_DATA.options[optIndex] ?? "Option";
      sfx.pop();
      setQuestionIndex(2);
      setSelectedOptionIndex(0);
      setLogs((prev) => [
        ...prev,
        logEntry("user", `guest@kittyOS:~$ ${optIndex + 1}) ${optText}`, "user"),
        logEntry("system", Q2_REVEAL_LINES[0], "q2-rev1"),
        logEntry("system", Q2_REVEAL_LINES[1], "q2-rev2"),
        logEntry("system", Q2_REVEAL_LINES[2], "q2-rev3"),
        logEntry("question", `[Q3/3 ✦ ${Q3_DATA.topic}] ${Q3_DATA.prompt}`, "q3-prompt"),
      ]);
      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      return;
    }

    if (questionIndex === 2) {
      if (optIndex === 1) {
        sfx.error();
        const line = Q3_VPN_ROTATION[q3VpnCount % Q3_VPN_ROTATION.length];
        setQ3VpnCount((c) => c + 1);
        setLogs((prev) => [
          ...prev,
          logEntry("user", `guest@kittyOS:~$ 2) VPN`, "user"),
          logEntry("error", line, "q3-err"),
        ]);
        setInputVal("");
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
        return;
      }

      if (optIndex === 0) {
        sfx.pop();
        finishClearance([
          logEntry("user", `guest@kittyOS:~$ 1) Arhana`, "user"),
          logEntry("success", Q3_CORRECT_LINE, "q3-ok"),
        ]);
      }
    }
  };

  const submitDifficulty = (trimmed: string, lower: string) => {
    sfx.click.play();
    const userLine = logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user");

    let selectedDiff: Difficulty | null = null;
    if (lower === "1" || lower === "easy" || lower === "e") selectedDiff = "easy";
    else if (lower === "2" || lower === "med" || lower === "medium" || lower === "m") selectedDiff = "medium";
    else if (lower === "3" || lower === "hard" || lower === "h") selectedDiff = "hard";

    if (!selectedDiff) {
      sfx.error();
      setLogs((prev) => [
        ...prev,
        userLine,
        logEntry("error", "> [!] Please choose: easy, med, or hard (or 1, 2, 3).", "diff-err"),
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
      logEntry("success", `> [✓] DIFFICULTY LEVEL: ${selectedDiff.toUpperCase()} 🎓 Clearance protocol activated. 3 questions loaded.`, "diff-ok"),
      logEntry("question", `[Q1/3 ✦ ${firstQ.topic}] ${firstQ.prompt}`, "q1-prompt"),
      logEntry("system", ">> Enter your integer answer into the terminal prompt below:", "q1-hint"),
    ]);
    setInputVal("");
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  };

  const submitQ1 = (trimmed: string, lower: string, currentQ: TerminalQuestion) => {
    sfx.click.play();
    const userLine = logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user");

    if (lower === "hint" || lower === "help") {
      sfx.select();
      setLogs((prev) => [...prev, userLine, logEntry("system", `> [hint] ${currentQ.hint}`, "hint")]);
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
        logEntry("system", PITY_LINES.giveUpQ1orQ2, "giveup-1"),
        logEntry("question", `[Q2/3 ✦ ${Q2_DATA.topic}] ${Q2_DATA.prompt}`, "q2-prompt"),
      ]);
      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      return;
    }

    const parsed = parseIntegerAnswer(trimmed);
    if (parsed !== null && parsed === currentQ.answer) {
      sfx.pop();
      setQuestionIndex(1);
      setSelectedOptionIndex(0);
      setLogs((prev) => [
        ...prev,
        userLine,
        logEntry("success", `> [✓] Correct: ${currentQ.answer}! Nicely done! 🧠✨`, "ans-ok"),
        logEntry("question", `[Q2/3 ✦ ${Q2_DATA.topic}] ${Q2_DATA.prompt}`, "q2-prompt"),
      ]);
    } else {
      sfx.error();
      setWrongAttempts((w) => w + 1);
      setLogs((prev) => [...prev, userLine, logEntry("error", PITY_LINES.q1Wrong, "ans-err")]);
    }
    setInputVal("");
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  };

  const submitQ2 = (trimmed: string, lower: string) => {
    if (lower === "hint" || lower === "help") {
      sfx.select();
      setLogs((prev) => [
        ...prev,
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("system", `> [hint] ${Q2_DATA.hint}`, "hint"),
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
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("system", PITY_LINES.giveUpQ1orQ2, "giveup-2"),
        logEntry("system", Q2_REVEAL_LINES[0], "q2-rev1"),
        logEntry("system", Q2_REVEAL_LINES[1], "q2-rev2"),
        logEntry("system", Q2_REVEAL_LINES[2], "q2-rev3"),
        logEntry("question", `[Q3/3 ✦ ${Q3_DATA.topic}] ${Q3_DATA.prompt}`, "q3-prompt"),
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
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("error", "> [!] Please choose an option (1, 2, or 3) or use ↑/↓ arrows + Enter.", "q2-err"),
      ]);
      setInputVal("");
      return;
    }

    selectOption(optIdx);
  };

  const submitQ3 = (trimmed: string, lower: string) => {
    if (lower === "hint" || lower === "help") {
      sfx.select();
      setLogs((prev) => [
        ...prev,
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("system", `> [hint] ${Q3_DATA.hint}`, "hint"),
      ]);
      setInputVal("");
      return;
    }

    if (lower === "give up" || lower === "pass" || lower === "idk" || lower === "surrender") {
      sfx.error();
      finishClearance([
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("system", PITY_LINES.giveUpQ3, "giveup-3"),
      ]);
      return;
    }

    let optIdx = selectedOptionIndex;
    if (trimmed === "1" || lower === "arhana") optIdx = 0;
    else if (trimmed === "2" || lower === "vpn") optIdx = 1;
    else if (trimmed !== "") {
      sfx.error();
      setLogs((prev) => [
        ...prev,
        logEntry("user", `guest@kittyOS:~$ ${trimmed}`, "user"),
        logEntry("error", "> [!] Please choose an option (1 or 2) or use ↑/↓ arrows + Enter.", "q3-err"),
      ]);
      setInputVal("");
      return;
    }

    selectOption(optIdx);
  };

  const submitAnswer = (rawAnswer: string) => {
    if (isSkippingRef.current) return;
    const trimmed = rawAnswer.trim();
    if (!trimmed && stage !== "cleared" && questionIndex === 0) return;

    const lower = trimmed.toLowerCase();
    if (lower === "reboot" || lower === "restart") {
      handleReset();
      return;
    }
    if (lower === "skip" || lower === "bypass") {
      handleSkip();
      setInputVal("");
      return;
    }

    if (stage === "difficulty") {
      submitDifficulty(trimmed, lower);
      return;
    }

    if (stage === "quiz") {
      const currentQ = questions[questionIndex];
      if (!currentQ) return;
      if (questionIndex === 0) submitQ1(trimmed, lower, currentQ);
      else if (questionIndex === 1) submitQ2(trimmed, lower);
      else if (questionIndex === 2) submitQ3(trimmed, lower);
    }
  };

  const getPlaceholder = () => {
    if (isSkipping) return "Clearance skipped...";
    if (stage === "difficulty") return "Choose difficulty: easy, med, or hard...";
    if (stage === "quiz") {
      if (questionIndex === 0) return "Type your integer answer (or 'hint' / 'give up')...";
      if (questionIndex === 1) return "Use ↑/↓ + Enter or type 1-3 (or 'hint' / 'give up')...";
      return "Use ↑/↓ + Enter or type 1-2 (or 'hint' / 'give up')...";
    }
    return "All cleared! 🎀";
  };

  return {
    stage, logs, inputVal, setInputVal, internalUnlocked, isSkipping,
    questionIndex, questions, selectedOptionIndex, setSelectedOptionIndex,
    navigateOptions, selectOption, submitAnswer, handleReset, handleSkip, getPlaceholder,
  };
}
