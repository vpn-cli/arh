"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { sfx } from "@/lib/audio";
import confetti from "canvas-confetti";

export default function BirthdayVault() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerConfetti = () => {
    try {
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
    }, 1000);
  };

  const handleClose = () => {
    sfx.hover();
    setIsOpen(false);
  };

  // Lock scroll when vault modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalContent = isOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D1B36]/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FFFDF8] border-3 border-[#3A2440] rounded-2xl shadow-[8px_8px_0_#3A2440] p-6 sm:p-8 flex flex-col items-center text-center animate-slide-up z-10">
        {/* Cute top washi tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#FFEAA7] border border-black/10 shadow-xs -rotate-1 pointer-events-none" />

        <span className="text-6xl mb-4 animate-bounce-soft">🎂</span>

        <span className="font-retro text-[10px] tracking-[3px] text-[#A66E2E] font-bold uppercase mb-1">
          VAULT UNLOCKED ✦
        </span>

        <h2 className="font-pixel text-2xl sm:text-3xl font-extrabold text-[#2D1B36] tracking-wide mb-3">
          HAPPY BIRTHDAY!
        </h2>

        <div className="h-[2px] w-32 bg-[#FF8FB3]/50 mx-auto mb-4" />

        <p className="font-baloo text-sm sm:text-base text-[#5C4D6B] font-medium leading-relaxed max-w-md mb-6">
          You actually cracked it! Happy birthday to someone who has witnessed all my questionable decisions and somehow hasn&apos;t disowned me yet.
        </p>

        <button
          onClick={handleClose}
          className="px-6 py-2.5 bg-[#FF8FB3] hover:bg-[#FF6584] text-[#2D1B36] font-retro font-bold text-xs tracking-wider rounded-xl border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          RETURN TO ADVENTURE ✦
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full max-w-xl mx-auto my-12 sm:my-16 px-4 relative z-10 flex flex-col items-center">
      {/* Milestone tag */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#A66E2E] font-bold bg-[#FFFDF5] px-3 py-1 rounded-full border border-[#E5B25D]/40 shadow-xs">
          PHASE 02 ✦ SECRET VAULT
        </span>
      </div>

      {/* The Vault Chest Box */}
      <div
        className="w-full cursor-pointer group relative hover:-translate-y-1.5 transition-transform duration-300"
        onClick={handleOpen}
      >
        <div className="bg-[#FFFDF6] border-2 border-[#3A2440] p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0_#3A2440] flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle craft pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#3A2440 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Icon */}
          <div
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

          <p className="font-retro text-[9px] text-[#7A6388] font-bold tracking-[2px] mb-6">
            TOP SECRET CLEARANCE (OR EXCESSIVE PATIENCE)
          </p>

          {!isUnlocking && (
            <div className="px-5 py-2.5 bg-[#FFEAA7] group-hover:bg-[#FFD868] border-2 border-[#3A2440] text-[#4A3510] font-retro text-[10px] font-bold tracking-[2px] uppercase rounded-xl shadow-[3px_3px_0_#3A2440] group-hover:shadow-[2px_2px_0_#3A2440] group-hover:translate-x-[1px] group-hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2">
              <span>▶</span>
              <span>OPEN THE CHEST</span>
            </div>
          )}

          {/* Corner ribbon decor */}
          <div className="absolute top-3 right-3 text-xl opacity-70 pointer-events-none">
            ⭐
          </div>
          <div className="absolute bottom-3 left-3 text-xl opacity-70 pointer-events-none">
            🎀
          </div>
        </div>
      </div>

      {/* Portal overlay */}
      {mounted && typeof document !== "undefined"
        ? ReactDOM.createPortal(modalContent, document.body)
        : modalContent}
    </div>
  );
}
