"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { sfx } from "@/lib/audio";
import confetti from "canvas-confetti";
import PhaseHeader from "./PhaseHeader";
import { dispatchPuzzleSolved } from "@/components/ui/cursorUtils";

export default function BirthdayVault() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerConfetti = () => {
    try {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#FF8FB3", "#FFEAA7", "#C8EADE", "#FFB6C1", "#FFD166"],
      });
    } catch {
      // safe fallback
    }
  };

  const handleOpen = () => {
    if (isOpen || isUnlocking) return;
    setIsUnlocking(true);
    sfx.select();

    // Sequence of unlock clicks
    setTimeout(() => sfx.move(), 300);
    setTimeout(() => sfx.move(), 600);
    setTimeout(() => {
      sfx.pop();
      setIsOpen(true);
      setIsUnlocking(false);
      triggerConfetti();
      dispatchPuzzleSolved();
    }, 1000);
  };

  const handleClose = () => {
    sfx.hover();
    setIsOpen(false);
  };

  // Lock scroll and handle Escape key when vault modal is open
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modalContent = isOpen && mounted ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      aria-describedby="vault-modal-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D1B36]/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        data-cursor="zoom-out"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FFFDF8] border-3 border-[#3A2440] rounded-2xl shadow-[8px_8px_0_#3A2440] p-6 sm:p-8 flex flex-col items-center text-center animate-slide-up z-10">
        {/* Cute top washi tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#FFEAA7] border border-black/10 shadow-xs -rotate-1 pointer-events-none" aria-hidden="true" />

        <span className="text-6xl mb-4 animate-bounce-soft" aria-hidden="true">🎂</span>

        <span className="font-retro text-[10px] tracking-[3px] text-[#7A4B16] font-bold uppercase mb-1">
          VAULT UNLOCKED ✦
        </span>

        <h2 id="vault-modal-title" className="font-pixel text-2xl sm:text-3xl font-extrabold text-[#2D1B36] tracking-wide mb-3">
          HAPPY BIRTHDAY!
        </h2>

        <div className="h-[2px] w-32 bg-[#FF8FB3]/50 mx-auto mb-4" aria-hidden="true" />

        <p id="vault-modal-desc" className="font-baloo text-sm sm:text-base text-[#3A2440] font-medium leading-relaxed max-w-md mb-6">
          You actually cracked it! Happy birthday to someone who has witnessed all my questionable decisions and somehow hasn&apos;t disowned me yet. 😂💖
        </p>

        <button
          type="button"
          onClick={handleClose}
          data-cursor="pointer"
          className="min-h-[44px] px-6 py-2.5 bg-[#FF8FB3] hover:bg-[#FF6584] text-[#2D1B36] font-retro font-bold text-xs tracking-wider rounded-xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          RETURN TO ADVENTURE ✦
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 relative z-10 flex flex-col items-center">
      <PhaseHeader
        phase="PHASE 02"
        title="THE VAULT"
        subtitle="something's locked in here. you earned it."
      />

      {/* The Vault Chest Box */}
      <button
        type="button"
        onClick={handleOpen}
        data-cursor="puzzle"
        aria-label="Open Mystery Birthday Vault"
        aria-haspopup="dialog"
        className="w-full text-left cursor-pointer group relative hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-4 rounded-2xl transition-all duration-300"
      >
        <div className="bg-[#FFFDF6] border-2 border-[#3A2440] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0_#3A2440] flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle craft pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(#3A2440 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Icon */}
          <div
            aria-hidden="true"
            className={`text-6xl mb-4 transition-transform duration-300 drop-shadow-sm ${
              isUnlocking
                ? "animate-pixel-shake scale-110"
                : "group-hover:scale-110 group-hover:rotate-6"
            }`}
          >
            🎁
          </div>

          <h3 className="font-pixel text-xl sm:text-2xl text-[#2D1B36] font-bold tracking-wider mb-1">
            {isUnlocking ? "UNLOCKING CHEST..." : "MYSTERY VAULT"}
          </h3>

          <p className="font-retro text-[10px] text-[#4A3855] font-bold tracking-[2px] mb-6">
            TOP SECRET CLEARANCE (OR EXCESSIVE PATIENCE)
          </p>

          {!isUnlocking && (
            <div className="min-h-[44px] px-5 py-2.5 bg-[#FFEAA7] group-hover:bg-[#FFD868] border-2 border-[#3A2440] text-[#3A2440] font-retro text-[10px] font-bold tracking-[2px] uppercase rounded-xl shadow-[3px_3px_0_#3A2440] group-hover:shadow-[2px_2px_0_#3A2440] group-hover:translate-x-[1px] group-hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2">
              <span aria-hidden="true">▶</span>
              <span>OPEN THE CHEST</span>
            </div>
          )}

          {/* Corner ribbon decor */}
          <div aria-hidden="true" className="absolute top-3 right-3 text-xl opacity-70 pointer-events-none">
            ⭐
          </div>
          <div aria-hidden="true" className="absolute bottom-3 left-3 text-xl opacity-70 pointer-events-none">
            🎀
          </div>
        </div>
      </button>

      {/* Portal overlay */}
      {mounted && typeof document !== "undefined"
        ? ReactDOM.createPortal(modalContent, document.body)
        : modalContent}
    </div>
  );
}
