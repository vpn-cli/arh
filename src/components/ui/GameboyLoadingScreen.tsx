"use client";

import React, { useState, useEffect, useRef } from "react";
import IndiePixelWindow from "./IndiePixelWindow";
import HelloKittyAlertModal from "./HelloKittyAlertModal";
import GameboyCartridge from "./gameboy/GameboyCartridge";
import { useGameboyParallax } from "./gameboy/GameboyParallax";
import { sfx, getAudioContext } from "@/lib/audio";

interface GameboyLoadingScreenProps {
  onComplete: () => void;
}

export default function GameboyLoadingScreen({ onComplete }: GameboyLoadingScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = Continue, 1 = Start New Game
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [popupError, setPopupError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showKittyModal, setShowKittyModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGameboyParallax(rootRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  const menuItems = ["CONTINUE", "START NEW GAME"];

  const handleSelect = () => {
    if (isTransitioning) return;
    if (selectedIndex === 0) {
      sfx.error();
      setPopupError(true);
      setShakeKey((k) => k + 1);
      setShowKittyModal(true);
      return;
    }
    sfx.select();
    setIsTransitioning(true);

    try {
      const videos = document.querySelectorAll<HTMLVideoElement>("video");
      videos.forEach((v) => {
        v.muted = true;
        v.pause();
      });
    } catch {
      // ignore
    }

    setTimeout(onComplete, 700);
  };

  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    sfx.move();
    if (selectedIndex === 1) {
      setPopupError(false);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (isTransitioning || showKittyModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      getAudioContext();

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 1 ? 0 : 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, isTransitioning, showKittyModal]);

  const closeKittyModal = () => {
    setShowKittyModal(false);
    sfx.move();
  };

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-8 sm:p-12 transition-all duration-700 ease-in cursor-none [&_*]:cursor-none select-none ${
        isTransitioning ? "opacity-0 scale-105 blur-sm pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ ["--mx" as string]: "0", ["--my" as string]: "0", cursor: "none" } as React.CSSProperties}
    >
      {/* Background Scene Container with Locked 16:9 Aspect Ratio */}
      <div className="absolute inset-0 -z-10 overflow-hidden flex items-center justify-center bg-[#8db356]">
        <div
          className="relative flex-shrink-0 select-none"
          style={{
            width: "max(100vw, calc(100vh * 16 / 9))",
            height: "max(100vh, calc(100vw * 9 / 16))",
          }}
          suppressHydrationWarning
        >
          {/* Base 16:9 Video (z-0) */}
          {isMounted && (
            <video
              ref={videoRef}
              data-gameboy-video="true"
              src="/videos/real_vid.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none will-change-transform"
              style={{
                transform: "scale(1.02) translate3d(calc(var(--mx, 0) * -15px), calc(var(--my, 0) * -10px), 0)",
              }}
            />
          )}

          {/* Glowing Overlays */}
          <div className="absolute top-[41%] right-[24%] w-12 h-12 bg-[#ffe875]/40 rounded-full mix-blend-overlay blur-md animate-pulse z-[1] pointer-events-none" style={{ animationDuration: "0.4s" }} />
          <div className="absolute top-[39%] right-[8%] w-10 h-10 bg-[#ffe875]/50 rounded-full mix-blend-overlay blur-sm animate-pulse z-[1] pointer-events-none" style={{ animationDuration: "0.3s", animationDelay: "0.1s" }} />
          <div className="absolute top-[31%] left-[29%] w-10 h-10 bg-[#ffb75]/40 rounded-full mix-blend-overlay blur-md animate-pulse z-[1] pointer-events-none" style={{ animationDuration: "0.5s", animationDelay: "0.2s" }} />
          <div className="absolute bottom-[35%] left-[38%] w-8 h-8 bg-[#ffee75]/50 rounded-full mix-blend-overlay blur-sm animate-pulse z-[1] pointer-events-none" style={{ animationDuration: "0.35s" }} />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none z-[2] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_30%,rgba(0,0,0,0.5)_100%)]" />
        </div>
      </div>

      {/* Cartridge seal & atmospheric parallax artwork */}
      <GameboyCartridge />

      {/* Flying Nyan Cat across the sky */}
      <div className="absolute top-6 sm:top-10 left-0 pointer-events-none z-10 animate-nyan-fly flex items-center">
        <img
          src="/images/nyan-cat.gif"
          alt="Nyan Cat"
          className="w-32 h-20 sm:w-48 sm:h-28 md:w-56 md:h-32 pixelated object-contain drop-shadow-xl"
        />
      </div>

      {/* Title screen menu: Handcrafted Indie RPG Game Frame */}
      <div className="absolute top-8 sm:top-12 left-8 sm:left-12 origin-top-left z-50 flex flex-col items-start scale-95 sm:scale-100">
        <div className="absolute inset-0 bg-[#100f1f]/30 blur-[15px] rounded-lg -z-10" />
        <IndiePixelWindow title="MAIN MENU" className="min-w-[275px] sm:min-w-[315px] shadow-[0_15px_40px_rgba(0,0,0,0.8)] bg-[#100f1f]/95 backdrop-blur-sm">
          <div className="p-2 sm:p-2.5">
            <ul
              className="list-none m-0 p-0 flex flex-col gap-1.5 focus-visible:outline-none"
              role="listbox"
              aria-label="Main menu"
              aria-activedescendant={`gb-menu-${selectedIndex}`}
              tabIndex={0}
            >
              {menuItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <li
                    key={item}
                    id={`gb-menu-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedIndex(idx);
                      handleSelect();
                    }}
                    className={`group relative flex items-center gap-3 px-3 py-2 select-none transition-all duration-150 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#FF8FB3]/25 via-[#FFD166]/15 to-transparent border-l-4 border-[#FF8FB3] border-t border-b border-r border-[#FF8FB3]/30 shadow-[inset_0_0_12px_rgba(255,143,179,0.15)]"
                        : "border-l-4 border-transparent hover:bg-[#252244]/70 border border-transparent"
                    }`}
                  >
                    <div className="w-3.5 flex items-center justify-center flex-shrink-0">
                      {isSelected ? (
                        <span className="text-[#FF8FB3] text-[11px] font-bold drop-shadow-[0_0_6px_#FF8FB3] animate-pulse">
                          ▶
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-none bg-[#383359] group-hover:bg-[#FFD166]/60 transition-colors" />
                      )}
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] tracking-[1.2px] transition-colors ${
                        isSelected
                          ? "text-[#FFF3D8] font-bold drop-shadow-[0_2px_0px_#100E21] drop-shadow-[0_0_8px_rgba(255,209,102,0.6)]"
                          : "text-[#D2CBE6] group-hover:text-[#FFF3D8] drop-shadow-[0_1px_0px_#0C0B17]"
                      }`}
                    >
                      {item}
                    </span>

                    {isSelected && (
                      <span className="ml-auto text-[#FFD166] text-[8px] animate-bounce-soft">
                        ✦
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 px-4 py-0.5">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#E5B25D]/50 to-[#E5B25D]/10" />
            <span className="text-[#FFE27A] text-[6px] opacity-80">◆</span>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#E5B25D]/50 to-[#E5B25D]/10" />
          </div>

          <div className="flex items-center justify-between px-3.5 py-2 bg-[#100F1F]/60 select-none">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ▲
              </span>
              <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ▼
              </span>
              <span className="text-[7px] text-[#FFD166] tracking-wider ml-1 drop-shadow-[0_1px_0px_#0A0912]">
                MOVE
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center h-[19px] px-2 bg-[#EBE4D8] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#8A7F73] shadow-[2px_2px_0px_#0B0A14] text-[8px] font-retro font-bold text-[#2A2338]">
                ENTER
              </span>
              <span className="text-[7px] text-[#FFD166] tracking-wider drop-shadow-[0_1px_0px_#0A0912]">
                SELECT
              </span>
            </div>
          </div>
        </IndiePixelWindow>

        <div
          key={shakeKey}
          className={`relative mt-2.5 w-full max-w-[275px] sm:max-w-[315px] p-[2px] rounded-sm select-none transition-all duration-200 ${
            popupError
              ? "bg-[#FF5C77] animate-pixel-shake shadow-[0_0_14px_rgba(255,92,119,0.5),3px_3px_0px_#100E1C]"
              : "bg-gradient-to-r from-[#E5B25D] via-[#FFE27A] to-[#E5B25D] shadow-[3px_3px_0px_rgba(16,14,28,0.6)]"
          }`}
        >
          <div
            className={`relative px-3 py-2 flex items-center gap-2 rounded-[1px] ${
              popupError
                ? "bg-[#280E1C] border border-[#FF5C77]/60"
                : "bg-gradient-to-b from-[#1C1A33] via-[#16152B] to-[#121124] border border-[#383359]"
            }`}
          >
            <div
              className={`absolute -top-1.5 left-7 w-2.5 h-2.5 rotate-45 border-t border-l ${
                popupError
                  ? "bg-[#280E1C] border-[#FF5C77]/60"
                  : "bg-[#1C1A33] border-[#383359]"
              }`}
            />

            <span
              className={`text-[9px] flex-shrink-0 ${
                popupError ? "text-[#FF5C77] font-bold animate-pulse" : "text-[#FFD166]"
              }`}
            >
              {popupError ? "⚠" : "✦"}
            </span>

            <span
              className={`font-retro text-[8px] leading-relaxed tracking-wider ${
                popupError
                  ? "text-[#FFD6DD] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  : selectedIndex === 1
                  ? "text-[#FFEBB3] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                  : "text-[#FFEBB3] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
              }`}
            >
              {popupError
                ? "ERROR: player has changed location"
                : selectedIndex === 1
                ? "PRESS ENTER TO BEGIN"
                : "USE ARROW KEYS TO TOGGLE"}
            </span>
          </div>
        </div>
      </div>

      <HelloKittyAlertModal isOpen={showKittyModal} onClose={closeKittyModal} />
    </div>
  );
}
