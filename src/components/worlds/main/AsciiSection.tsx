"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { sfx } from "@/lib/audio";
import { useKittyTerminalEngine } from "./useKittyTerminalEngine";
import KittyMascot from "@/components/kitty/KittyMascot";
import PhaseHeader from "./PhaseHeader";

interface AsciiSectionProps {
  onUnlock?: () => void;
  onReset?: () => void;
  isUnlocked?: boolean;
}

const EMOJI_FONT_STACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function renderTextWithEmojiSpan(text: string) {
  const parts = text.split(
    /([\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2728}])/u
  );
  if (parts.length <= 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <span
          key={i}
          className="font-sans inline-block"
          style={{ fontFamily: EMOJI_FONT_STACK }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function AsciiSection({
  onUnlock,
  onReset,
  isUnlocked: externalUnlocked,
}: AsciiSectionProps) {
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsContentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    stage,
    logs,
    inputVal,
    setInputVal,
    internalUnlocked,
    isSkipping,
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
  } = useKittyTerminalEngine({ onUnlock, onReset, inputRef });

  const isUnlocked = externalUnlocked ?? internalUnlocked;
  const activeQuestion = questions[questionIndex];
  const hasOptions =
    !isUnlocked &&
    stage === "quiz" &&
    (questionIndex === 1 || questionIndex === 2) &&
    Boolean(activeQuestion?.options?.length);

  const checkOverflow = useCallback(() => {
    const container = logsContainerRef.current;
    if (!container) return;
    const overflowing = container.scrollHeight > container.clientHeight;
    setIsOverflowing((prev) => (prev !== overflowing ? overflowing : prev));
  }, []);

  useEffect(() => {
    const container = logsContainerRef.current;
    const content = logsContentRef.current;
    if (!container) return;

    checkOverflow();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });

    observer.observe(container);
    if (content) observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, [checkOverflow]);

  useEffect(() => {
    checkOverflow();
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, questionIndex, selectedOptionIndex, isUnlocked, isOverflowing, checkOverflow]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer(inputVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (hasOptions) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateOptions("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateOptions("down");
      }
    }
  };

  const scrollToVault = () => {
    sfx.select();
    const vault = document.getElementById("phase-02-vault");
    if (vault) vault.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 relative z-10">
      <PhaseHeader
        phase="PHASE 01 ✦ KITTY TERMINAL"
        title="THE TERMINAL"
        subtitle="answer three questions. no googling. (we'll know.)"
      />

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
                disabled={isSkipping}
                data-cursor="pointer"
                aria-label="Skip Terminal Questions"
                className={`kitty-pill-bounce text-xs font-terminal uppercase text-[#3A2440] hover:text-[#2D1B36] px-2.5 py-1 min-h-[32px] rounded border border-[#3A2440]/35 hover:bg-[#FFEAA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] transition-colors cursor-pointer ${
                  isSkipping ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
                }`}
              >
                ⏭ SKIP
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              disabled={isSkipping}
              data-cursor="pointer"
              aria-label="Reboot Terminal"
              className={`kitty-pill-bounce text-xs font-terminal uppercase text-[#3A2440] hover:text-[#2D1B36] px-2.5 py-1 min-h-[32px] rounded border border-[#3A2440]/35 hover:bg-[#FFEAA7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] transition-colors cursor-pointer ${
                isSkipping ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
              }`}
            >
              ↺ REBOOT
            </button>
          </div>
        </div>

        <div
          onClick={() => inputRef.current?.focus()}
          data-cursor="puzzle"
          className="bg-[#1C1221] rounded-xl p-4 sm:p-6 border-2 border-[#3A2440] shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)] relative overflow-hidden min-h-[320px] max-h-[480px] flex flex-col justify-between cursor-text select-text"
        >
          <div
            className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-15 pointer-events-none"
            aria-hidden="true"
          />

          <div
            ref={logsContainerRef}
            data-testid="terminal-logs-container"
            style={{ overscrollBehaviorY: "auto" }}
            className={`font-terminal text-[15px] sm:text-base md:text-[17px] leading-relaxed relative z-10 pr-1 flex-1 max-h-[360px] ${
              isOverflowing ? "overflow-y-auto" : "overflow-y-visible"
            }`}
          >
            <div ref={logsContentRef} className="flex flex-col gap-1.5 w-full">
              {logs.map((log) => {
                let colorClass = "text-[#FFE27A]";
                if (log.type === "question") colorClass = "text-[#FF8FB3] font-semibold";
                else if (log.type === "user") colorClass = "text-[#8BE9FD]";
                else if (log.type === "success") colorClass = "text-[#50FA7B] font-semibold";
                else if (log.type === "error") colorClass = "text-[#FF6E6E] font-semibold";
                else if (log.type === "system") colorClass = "text-[#FFE27A]/90";

                return (
                  <div key={log.id} className="animate-slide-up origin-left">
                    <span className={colorClass}>{renderTextWithEmojiSpan(log.text)}</span>
                  </div>
                );
              })}

              {hasOptions && (
                <div
                  role="listbox"
                  id="kitty-options-listbox"
                  aria-label="Question options"
                  className="flex flex-col gap-1 my-1 pl-1"
                >
                  {activeQuestion.options?.map((opt, idx) => {
                    const isSelected = idx === selectedOptionIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="option"
                        id={`kitty-option-${idx}`}
                        disabled={isSkipping}
                        aria-selected={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSkipping) selectOption(idx);
                        }}
                        onMouseEnter={() => {
                          if (!isSkipping) setSelectedOptionIndex(idx);
                        }}
                        className={`flex items-center gap-2 text-left font-terminal text-[15px] sm:text-base md:text-[17px] py-1 px-2 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF8FB3] ${
                          isSelected
                            ? "text-[#FF8FB3] font-bold bg-[#FF8FB3]/15"
                            : "text-[#FFE27A] hover:text-[#FFE27A]/90 hover:bg-[#FFE27A]/5"
                        } ${isSkipping ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}`}
                      >
                        <span className="w-3 text-center select-none" aria-hidden="true">
                          {isSelected ? "▸" : " "}
                        </span>
                        <span>
                          {idx + 1}) {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isUnlocked && (
                <div className="mt-4 flex flex-col items-center animate-slide-up text-center w-full">
                  <div
                    data-cursor="puzzle"
                    className="inline-block pointer-events-auto cursor-pointer"
                    aria-label="Kitty Mascot"
                  >
                    <KittyMascot size={180} className="mx-auto" />
                  </div>
                  <div className="mt-2 text-[#FFE27A] font-pixel text-xl sm:text-2xl tracking-wider font-extrabold animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    ✦ HAPPY BIRTHDAY! ✦
                  </div>
                  <button
                    type="button"
                    onClick={scrollToVault}
                    data-cursor="pointer"
                    className="mt-3 min-h-[44px] px-5 py-2.5 bg-[#FF8FB3] hover:bg-[#FF7396] text-[#2D1B36] font-retro text-xs sm:text-[13px] tracking-wider font-bold rounded-xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span aria-hidden="true">🎁</span>
                    <span>OPEN PHASE 02: BIRTHDAY VAULT</span>
                    <span aria-hidden="true">▼</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isUnlocked && (
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#FFE27A]/20 relative z-10"
            >
              <span
                className="text-[#FF8FB3] font-terminal text-[15px] sm:text-base md:text-[17px] select-none shrink-0 font-bold"
                aria-hidden="true"
              >
                guest@kittyOS:~$
              </span>
              <input
                ref={inputRef}
                type="text"
                disabled={isSkipping}
                data-cursor="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                aria-label="kittyOS terminal command input"
                aria-controls={hasOptions ? "kitty-options-listbox" : undefined}
                aria-activedescendant={hasOptions ? `kitty-option-${selectedOptionIndex}` : undefined}
                className={`flex-1 bg-transparent text-[#FFE27A] font-terminal text-[15px] sm:text-base md:text-[17px] outline-none border-none p-0 focus:ring-0 placeholder:text-[#FFE27A]/40 caret-[#FF8FB3] ${
                  isSkipping ? "opacity-50 cursor-not-allowed" : ""
                }`}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={isSkipping}
                data-cursor="pointer"
                aria-label="Submit command"
                className={`min-h-[36px] px-3.5 py-1 bg-[#FF8FB3]/25 hover:bg-[#FF8FB3]/45 border border-[#FF8FB3]/70 text-[#FF8FB3] rounded font-terminal text-sm sm:text-base shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8FB3] transition-colors cursor-pointer font-bold ${
                  isSkipping ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
                }`}
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
