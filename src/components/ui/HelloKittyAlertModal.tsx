"use client";

import React, { useEffect, useRef } from "react";
import IndiePixelWindow from "./IndiePixelWindow";
import HelloKittyPixel from "./HelloKittyPixel";

interface HelloKittyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelloKittyAlertModal({ isOpen, onClose }: HelloKittyAlertModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Use capturing phase so we intercept before GameboyLoadingScreen handles it
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Scrim */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative animate-in zoom-in-95 duration-300 flex flex-col items-center"
      >
        <IndiePixelWindow 
          title="⚠ SYSTEM ALERT ⚠" 
          className="w-[320px] sm:w-[360px]"
          onClose={onClose}
        >
          <div className="flex flex-col items-center px-4 py-8 bg-gradient-to-b from-[#1F1C38] via-[#16152B] to-[#121124]">
            {/* Hello Kitty Character */}
            <div className="mb-6 animate-bounce-soft">
              <HelloKittyPixel className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_4px_0_#0B0A14]" />
            </div>

            {/* Error Message */}
            <div className="text-center space-y-4 mb-8">
              <p className="font-retro text-[#FFD6DD] text-[10px] sm:text-xs tracking-wider drop-shadow-[0_2px_0_#000]">
                ERROR: Player has changed location.
              </p>
              <div className="inline-block bg-[#280E1C] border border-[#FF5C77]/40 px-3 py-1.5 rounded-sm shadow-[inset_0_0_8px_rgba(255,92,119,0.1)]">
                <p className="font-retro text-[#FFD166] text-[9px] sm:text-[10px] tracking-widest drop-shadow-[0_1px_0_#000]">
                  CURRENT_LOCATION: JP 🇯🇵
                </p>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={onClose}
              className="group relative inline-flex items-center justify-center px-4 py-2.5 bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[3px_3px_0px_#0B0A14] active:shadow-[1px_1px_0px_#0B0A14] active:translate-y-[2px] active:translate-x-[2px] transition-all hover:bg-[#FFF] outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C77]"
            >
              <span className="font-retro text-[9px] sm:text-[10px] font-bold text-[#2A2338] tracking-widest group-hover:text-[#000]">
                ↵ BACK TO MENU
              </span>
            </button>
          </div>
        </IndiePixelWindow>
      </div>
    </div>
  );
}
