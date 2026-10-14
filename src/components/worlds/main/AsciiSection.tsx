"use client";

import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { sfx } from "@/lib/audio";
import {
  CalculusQuestion,
  getRandomCalculusQuestion,
  fetchOutsourcedQuestion,
  getInitialLogs,
  LogLine,
} from "./terminalQuestions";
import KittyMascot from "@/components/kitty/KittyMascot";

interface AsciiSectionProps {
  onUnlock?: () => void;
  onReset?: () => void;
  isUnlocked?: boolean;
}

export default function AsciiSection({
  onUnlock,
  onReset,
  isUnlocked: externalUnlocked,
}: AsciiSectionProps) {
  const [calculusQ, setCalculusQ] = useState<CalculusQuestion>(() => getRandomCalculusQuestion());
  const [logs, setLogs] = useState<LogLine[]>(() => getInitialLogs(calculusQ));
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputVal, setInputVal] = useState("");
  const [internalUnlocked, setInternalUnlocked] = useState(false);

  const isUnlocked = externalUnlocked ?? internalUnlocked;
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetchOutsourcedQuestion().then((q) => {
      if (!active) return;
      setCalculusQ(q);
      setLogs((prev) => {
        if (prev.length <= 3 && prev.some((l) => l.id === "q1-q")) {
          return getInitialLogs(q);
        }
        return prev;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, currentStep, isUnlocked]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#FF8FB3", "#FFEAA7", "#C8EADE", "#FFB6C1", "#FFD166"],
      });
    } catch {
      // safe fallback
    }
  };

  const handleReset = async () => {
    sfx.click.play();
    const nextQ = await fetchOutsourcedQuestion();
    setCalculusQ(nextQ);
    setLogs(getInitialLogs(nextQ));
    setCurrentStep(1);
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
      { id: `skip-ok-${Date.now()}`, type: "success", text: "> [✓] ACCESS GRANTED! Unlocking all storyline phases... 🎀" },
    ]);
    setInternalUnlocked(true);
    setCurrentStep(4);
    onUnlock?.();
  };

  const submitAnswer = (rawAnswer: string) => {
    const trimmed = rawAnswer.trim();
    if (!trimmed && currentStep !== 4) return;

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

    if (currentStep === 1) {
      const parsed = parseInt(trimmed, 10);
      const isCorrect = parsed === calculusQ.answer || trimmed.toLowerCase() === String(calculusQ.answer);

      if (isCorrect) {
        sfx.pop();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q1-ans-${Date.now()}`,
            type: "success",
            text: `> [✓] NUMERICAL VERIFIED: Exact answer ${calculusQ.answer}! Math brain confirmed. 🎓✨`,
          },
          {
            id: `q2-q-${Date.now()}`,
            type: "question",
            text: "[Q2/3 ✦ ASSESSMENT] Considering you know VPN for a long time. How would you describe him?",
          },
          {
            id: `q2-hint-${Date.now()}`,
            type: "system",
            text: ">> Options: [A] bevkoof   |   [B] gentleman (Type your choice below):",
          },
        ]);
        setCurrentStep(2);
      } else {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q1-err-${Date.now()}`,
            type: "error",
            text: `> [!] Incorrect! Check your math 💅 (Hint: ${calculusQ.hint})`,
          },
        ]);
      }
    } else if (currentStep === 2) {
      const lower = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (lower === "gentleman" || lower === "b" || lower === "2") {
        sfx.pop();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q2-ans-${Date.now()}`,
            type: "success",
            text: "> [✓] IDENTITY CONFIRMED: 100% verified gentleman. Flattery accepted! 🎩✨",
          },
          {
            id: `q3-q-${Date.now()}`,
            type: "question",
            text: "[Q3/3 ✦ SURPRISE] He made you something that he'd like you to see.",
          },
          { id: `q3-hint-${Date.now()}`, type: "system", text: ">> Type YESSSS to move forward:" },
        ]);
        setCurrentStep(3);
      } else if (lower === "bevkoof" || lower === "a" || lower === "1") {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q2-err-${Date.now()}`,
            type: "error",
            text: "> [!] 🚨 ERROR 403: SYSTEM REJECTION! VPN is NOT a bevkoof. Type the accurate option: \"gentleman\" 😉",
          },
        ]);
      } else {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          { id: `q2-err2-${Date.now()}`, type: "error", text: "> [!] Please type either \"bevkoof\" or \"gentleman\" into the terminal prompt." },
        ]);
      }
    } else if (currentStep === 3) {
      const isYes = /^y+e+s+$/i.test(trimmed);

      if (isYes) {
        sfx.select();
        triggerConfetti();
        setLogs((prev) => [
          ...prev,
          userLine,
          {
            id: `q3-suc-${Date.now()}`,
            type: "success",
            text: "> [✓] CLEARANCE ACCEPTED! ACCESS GRANTED! 🎉 DEPLOYING MAXIMUM BIRTHDAY ENERGY 🎀",
          },
        ]);
        setInternalUnlocked(true);
        setCurrentStep(4);
        onUnlock?.();
      } else if (/^n+o+$/i.test(trimmed) || trimmed.toLowerCase() === "nah" || trimmed.toLowerCase() === "nope") {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          { id: `q3-err1-${Date.now()}`, type: "error", text: "> [!] Error: The option \"No\" is disabled in KittyOS! Type YESSSS! 🥺" },
        ]);
      } else {
        sfx.error();
        setLogs((prev) => [
          ...prev,
          userLine,
          { id: `q3-err2-${Date.now()}`, type: "error", text: "> [!] Please type YESSSS to unlock what he made for you! 🎁" },
        ]);
      }
    }

    setInputVal("");
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer(inputVal);
  };

  const scrollToVault = () => {
    sfx.select();
    const vault = document.getElementById("phase-02-vault");
    if (vault) vault.scrollIntoView({ behavior: "smooth" });
  };

  const getPlaceholder = () => {
    if (currentStep === 1) return "Type integer answer & press Enter...";
    if (currentStep === 2) return "Type 'gentleman' or 'bevkoof'...";
    if (currentStep === 3) return "Type YESSSS...";
    return "All cleared! 🎀";
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-10 sm:my-14 px-3 sm:px-6 relative z-10">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#8C5D76] font-bold bg-[#FFF0F5] px-3 py-1 rounded-full border border-[#FF8FB3]/40 shadow-xs">
          PHASE 01 ✦ KITTY TERMINAL
        </span>
      </div>

      <div className="bg-[#FFF6F9] border-2 border-[#3A2440] p-4 sm:p-6 rounded-2xl shadow-[6px_6px_0_#3A2440] relative overflow-hidden group">
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#3A2440]/15">
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF8FB3] border border-[#3A2440]/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FFE27A] border border-[#3A2440]/40" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#B9D7C0] border border-[#3A2440]/40" />
          </div>
          <span className="font-pixel text-xs sm:text-sm text-[#3A2440] tracking-widest uppercase font-bold">
            kittyOS v1.0.4 🎀
          </span>
          <div className="flex items-center gap-2">
            {!isUnlocked && (
              <button
                type="button"
                onClick={handleSkip}
                aria-label="Skip Terminal Questions"
                className="text-xs font-terminal uppercase text-[#3A2440] hover:text-[#2D1B36] px-2.5 py-1 min-h-[32px] rounded border border-[#3A2440]/35 hover:bg-[#FFEAA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] transition-colors cursor-pointer"
              >
                ⏭ SKIP
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reboot Terminal"
              className="text-xs font-terminal uppercase text-[#3A2440] hover:text-[#2D1B36] px-2.5 py-1 min-h-[32px] rounded border border-[#3A2440]/35 hover:bg-[#FFEAA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] transition-colors cursor-pointer"
            >
              ↺ REBOOT
            </button>
          </div>
        </div>

        <div
          onClick={() => inputRef.current?.focus()}
          className="bg-[#1C1221] rounded-xl p-4 sm:p-6 border-2 border-[#3A2440] shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)] relative overflow-hidden min-h-[320px] max-h-[480px] flex flex-col justify-between cursor-text select-text"
        >
          <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-15 pointer-events-none" aria-hidden="true" />

          <div
            ref={logsContainerRef}
            className="font-terminal text-[15px] sm:text-base md:text-[17px] leading-relaxed flex flex-col gap-1.5 relative z-10 overflow-y-auto pr-1 flex-1 max-h-[360px]"
          >
            {logs.map((log) => {
              let colorClass = "text-[#FFE27A]";
              if (log.type === "question") colorClass = "text-[#FF8FB3] font-semibold";
              else if (log.type === "user") colorClass = "text-[#8BE9FD]";
              else if (log.type === "success") colorClass = "text-[#50FA7B] font-semibold";
              else if (log.type === "error") colorClass = "text-[#FF6E6E] font-semibold";
              else if (log.type === "system") colorClass = "text-[#FFE27A]/90";

              return (
                <div key={log.id} className="animate-slide-up origin-left">
                  <span className={colorClass}>{log.text}</span>
                </div>
              );
            })}

            {isUnlocked && (
              <div className="mt-4 flex flex-col items-center animate-slide-up text-center w-full">
                <KittyMascot
                  size={180}
                  className="mx-auto"
                />

                <div className="mt-2 text-[#FFE27A] font-pixel text-xl sm:text-2xl tracking-wider font-extrabold animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  ✦ HAPPY BIRTHDAY! ✦
                </div>

                <button
                  type="button"
                  onClick={scrollToVault}
                  className="mt-3 min-h-[44px] px-5 py-2.5 bg-[#FF8FB3] hover:bg-[#FF7396] text-[#2D1B36] font-retro text-xs sm:text-[13px] tracking-wider font-bold rounded-xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span aria-hidden="true">🎁</span>
                  <span>OPEN PHASE 02: BIRTHDAY VAULT</span>
                  <span aria-hidden="true">▼</span>
                </button>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#FFE27A]/20 relative z-10"
            >
              <span className="text-[#FF8FB3] font-terminal text-[15px] sm:text-base md:text-[17px] select-none shrink-0 font-bold" aria-hidden="true">
                guest@kittyOS:~$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={getPlaceholder()}
                aria-label="kittyOS terminal command input"
                className="flex-1 bg-transparent text-[#FFE27A] font-terminal text-[15px] sm:text-base md:text-[17px] outline-none border-none p-0 focus:ring-0 placeholder:text-[#FFE27A]/40 caret-[#FF8FB3]"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                aria-label="Submit command"
                className="min-h-[36px] px-3.5 py-1 bg-[#FF8FB3]/25 hover:bg-[#FF8FB3]/45 border border-[#FF8FB3]/70 text-[#FF8FB3] rounded font-terminal text-sm sm:text-base shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8FB3] transition-colors cursor-pointer font-bold"
              >
                ENTER ⏎
              </button>
            </form>
          )}
        </div>

        <div aria-hidden="true" className="absolute -bottom-2 -right-2 text-3xl rotate-12 drop-shadow-xs pointer-events-none">🌸</div>
        <div aria-hidden="true" className="absolute -top-2 -left-2 text-3xl -rotate-12 drop-shadow-xs pointer-events-none">🎀</div>
      </div>
    </div>
  );
}
