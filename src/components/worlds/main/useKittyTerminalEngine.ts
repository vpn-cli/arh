"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/audio";
import {
  CalculusQuestion,
  Difficulty,
  getQuestionsForDifficulty,
  getBootLogs,
  LogLine,
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
  const [questions, setQuestions] = useState<CalculusQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>(() => getBootLogs());
  const [inputVal, setInputVal] = useState("");
  const [internalUnlocked, setInternalUnlocked] = useState(false);

  const triggerConfetti = () => {
    try {
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
    setLogs(getBootLogs());
    setInputVal("");
    setInternalUnlocked(false);
    onReset?.();
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  };

  const handleSkip = () => {
    sfx.select();
    triggerConfetti();
    setLogs((prev) => [
      ...prev,
      { id: `skip-${Date.now()}`, type: "system", text: "> [!] BYPASS PROTOCOL ENGAGED: Terminal clearance skipped." },
      { id: `skip-ok-${Date.now()}`, type: "success", text: "> [✓] ACCESS GRANTED! Security protocol bypassed... Unlocking all phases 🎀" },
    ]);
    setInternalUnlocked(true);
    setStage("cleared");
    onUnlock?.();
  };

  const handleQuestionFailed = (userLine: LogLine, currentQ: CalculusQuestion) => {
    if (questionIndex < 2) {
      const nextIndex = questionIndex + 1;
      const nextQ = questions[nextIndex];
      setQuestionIndex(nextIndex);
      setWrongAttempts(0);
      setLogs((prev) => [
        ...prev,
        userLine,
        {
          id: `ans-fail-${Date.now()}`,
          type: "error",
          text: `> [!] tsk tsk tsk ts chii 🙄 The answer is ${currentQ.answer}! Moving you to the next question...`,
        },
        {
          id: `q-next-${Date.now()}`,
          type: "question",
          text: `[Q${nextIndex + 1}/3 ✦ ${nextQ.topic}] ${nextQ.prompt}`,
        },
        {
          id: `q-next-hint-${Date.now()}`,
          type: "system",
          text: ">> Enter your answer into the terminal prompt below:",
        },
      ]);
    } else {
      sfx.select();
      triggerConfetti();
      setLogs((prev) => [
        ...prev,
        userLine,
        {
          id: `ans-fail-final-${Date.now()}`,
          type: "error",
          text: `> [!] tsk tsk tsk ts chii 🙄 The answer is ${currentQ.answer}! Unlocking final clearance...`,
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
    }
  };

  const submitAnswer = (rawAnswer: string) => {
    const trimmed = rawAnswer.trim();
    if (!trimmed && stage !== "cleared") return;

    if (trimmed.toLowerCase() === "reboot" || trimmed.toLowerCase() === "restart") {
      handleReset();
      return;
    }

    if (trimmed.toLowerCase() === "skip" || trimmed.toLowerCase() === "bypass") {
      handleSkip();
      setInputVal("");
      return;
    }

    sfx.click.play();
    const userLine: LogLine = {
      id: `user-${Date.now()}`,
      type: "user",
      text: `guest@kittyOS:~$ ${trimmed}`,
    };

    if (stage === "difficulty") {
      const lower = trimmed.toLowerCase();
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
      const qList = getQuestionsForDifficulty(selectedDiff);
      setDifficulty(selectedDiff);
      setQuestions(qList);
      setQuestionIndex(0);
      setWrongAttempts(0);
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
          text: ">> Enter your answer into the terminal prompt below:",
        },
      ]);
      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
      return;
    }

    if (stage === "quiz") {
      const currentQ = questions[questionIndex];
      if (!currentQ) return;
      const lower = trimmed.toLowerCase();

      if (lower === "hint" || lower === "help") {
        sfx.select();
        const hintText = wrongAttempts === 0 ? currentQ.hint1 : currentQ.hint2;
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `hint-${Date.now()}`,
            type: "system",
            text: `> [💡] Hint ${wrongAttempts === 0 ? 1 : 2}: ${hintText}`,
          },
        ]);
        setInputVal("");
        return;
      }

      if (lower === "give up" || lower === "pass" || lower === "idk" || lower === "surrender") {
        sfx.error();
        handleQuestionFailed(userLine, currentQ);
        setInputVal("");
        return;
      }

      const parsed = parseInt(trimmed, 10);
      let isCorrect = !isNaN(parsed) && (parsed === currentQ.answer || trimmed === String(currentQ.answer));
      if (!isCorrect) {
        if (currentQ.answer === 2 && (lower === "2nd" || lower === "second" || lower === "year 2")) isCorrect = true;
        if (currentQ.answer === 3 && (lower === "3rd" || lower === "third" || lower === "year 3")) isCorrect = true;
      }

      if (isCorrect) {
        sfx.pop();
        if (questionIndex < 2) {
          const nextIndex = questionIndex + 1;
          const nextQ = questions[nextIndex];
          setQuestionIndex(nextIndex);
          setWrongAttempts(0);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-ok-${Date.now()}`,
              type: "success",
              text: `> [✓] Correct: ${currentQ.answer}! Nicely done! 🧠✨`,
            },
            {
              id: `q-next-${Date.now()}`,
              type: "question",
              text: `[Q${nextIndex + 1}/3 ✦ ${nextQ.topic}] ${nextQ.prompt}`,
            },
            {
              id: `q-next-hint-${Date.now()}`,
              type: "system",
              text: ">> Enter your answer into the terminal prompt below:",
            },
          ]);
        } else {
          sfx.select();
          triggerConfetti();
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-ok-final-${Date.now()}`,
              type: "success",
              text: `> [✓] Exact answer: ${currentQ.answer}! 🎓✨`,
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
        }
      } else {
        sfx.error();
        if (wrongAttempts === 0) {
          setWrongAttempts(1);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-err-1-${Date.now()}`,
              type: "error",
              text: `> [!] Incorrect answer. Try again! (Hint 1: ${currentQ.hint1})`,
            },
          ]);
        } else if (wrongAttempts === 1) {
          setWrongAttempts(2);
          setLogs((prev) => [
            ...prev,
            userLine,
            {
              id: `ans-err-2-${Date.now()}`,
              type: "error",
              text: `> [!] Still not quite right. (Hint 2: ${currentQ.hint2})`,
            },
          ]);
        } else {
          handleQuestionFailed(userLine, currentQ);
        }
      }

      setInputVal("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    }
  };

  const getPlaceholder = () => {
    if (stage === "difficulty") return "Choose difficulty: easy, med, or hard...";
    if (stage === "quiz") return "Type your answer (or 'hint' / 'give up')...";
    return "All cleared! 🎀";
  };

  return {
    stage,
    logs,
    inputVal,
    setInputVal,
    internalUnlocked,
    questionIndex,
    submitAnswer,
    handleReset,
    handleSkip,
    getPlaceholder,
  };
}
