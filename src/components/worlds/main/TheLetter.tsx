"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { sfx } from "@/lib/audio";
import confetti from "canvas-confetti";
import PhaseHeader from "./PhaseHeader";
import TheLetterEnvelope from "./TheLetterEnvelope";
import TheLetterStationery from "./TheLetterStationery";
import TheLetterAmbientFloaters from "./TheLetterAmbientFloaters";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export default function TheLetter() {
  const [isOpen, setIsOpen] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const lastTrailPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Heart cursor trail over the letter card section
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !trailContainerRef.current) return;

      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastTrailPos.current.x, e.clientY - lastTrailPos.current.y);

      // Throttle: minimum 45ms and 14px movement
      if (now - lastTrailPos.current.time < 45 || dist < 14) return;
      lastTrailPos.current = { x: e.clientX, y: e.clientY, time: now };

      const rect = trailContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hearts = ["♡", "💖", "🌸", "✨", "🎀"];
      const char = hearts[Math.floor(Math.random() * hearts.length)];
      const heartEl = document.createElement("span");
      heartEl.className = "letter-cursor-heart";
      heartEl.textContent = char;
      heartEl.style.left = `${x}px`;
      heartEl.style.top = `${y}px`;
      heartEl.style.color = Math.random() > 0.5 ? "#FF7597" : "#FF8FB3";

      trailContainerRef.current.appendChild(heartEl);
      setTimeout(() => {
        heartEl.remove();
      }, 700);
    },
    [prefersReducedMotion]
  );

  const handleOpen = () => {
    if (isOpen) return;
    sfx.pop();
    setIsOpen(true);

    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.65 },
        colors: ["#FF7597", "#FFEAA7", "#FFB6C1", "#FFF0F5", "#B8E6D0", "#C8B8F1"],
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => {
      if (letterRef.current) {
        const yOffset = -30;
        const y = letterRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    }, 380);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.paper();
    setIsOpen(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full relative z-10 flex flex-col items-center pt-6 sm:pt-10 pb-2 sm:pb-3 px-3 sm:px-4"
    >
      {/* ═══ KAWAII GOOGLE FONTS & SCRAPBOOK CSS SYSTEM ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fredoka:wght@400;500;600;700&family=Pacifico&display=swap');

        .font-letter-title {
          font-family: 'Pacifico', cursive;
        }
        .font-letter-ui {
          font-family: 'Fredoka', cursive, system-ui, sans-serif;
        }
        .font-letter-handwritten {
          font-family: 'Caveat', cursive;
        }

        /* Faint pink ruled paper lines */
        .stationery-vintage-lines {
          background-image: repeating-linear-gradient(
            transparent,
            transparent 37px,
            rgba(255, 182, 193, 0.35) 37px,
            rgba(255, 182, 193, 0.35) 38px
          );
        }

        /* Pink Gingham Pattern & Melted Edge Fading Masks */
        .kawaii-gingham-bg {
          background-image: 
            linear-gradient(90deg, rgba(255, 182, 193, 0.25) 50%, transparent 50%),
            linear-gradient(rgba(255, 182, 193, 0.25) 50%, transparent 50%);
          background-size: 28px 28px;
        }

        .kawaii-gingham-fade-y {
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
        }

        .kawaii-gingham-fade-x {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        .kawaii-gingham-bg-layer {
          position: absolute;
          inset: 0;
          background-color: #FFFDF8;
          background-image: 
            linear-gradient(90deg, rgba(255, 182, 193, 0.20) 50%, transparent 50%),
            linear-gradient(rgba(255, 182, 193, 0.20) 50%, transparent 50%);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Washi tape accents */
        .washi-tape--yellow {
          background: rgba(255, 234, 167, 0.92);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .washi-tape--pink {
          background: rgba(255, 182, 193, 0.92);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .washi-tape--mint {
          background: rgba(184, 230, 208, 0.92);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        /* Bobbing envelope */
        @keyframes envelopeBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }
        .animate-envelope-bob {
          animation: envelopeBob 3.6s ease-in-out infinite;
        }

        /* Floating kawaii particles */
        @keyframes kawaiiFloat {
          0% {
            transform: translateY(110%) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          85% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(-110%) rotate(20deg);
            opacity: 0;
          }
        }
        .animate-kawaii-float {
          animation: kawaiiFloat 16s linear infinite;
        }

        /* Bouncy spring in for stationery card */
        @keyframes stationerySpringIn {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(24px);
          }
          65% {
            opacity: 1;
            transform: scale(1.02) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .stationery-spring-in {
          animation: stationerySpringIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Staggered poem line slide-in */
        @keyframes poemLineSlideIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .poem-line-enter {
          animation: poemLineSlideIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Heart cursor trail */
        .letter-cursor-heart {
          position: absolute;
          pointer-events: none;
          user-select: none;
          font-size: 15px;
          animation: cursorHeartFade 0.7s ease-out forwards;
          transform: translate(-50%, -50%);
          z-index: 50;
        }
        @keyframes cursorHeartFade {
          0% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -70%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.5);
          }
        }

        /* Prefers-reduced-motion overrides */
        @media (prefers-reduced-motion: reduce) {
          .animate-envelope-bob,
          .animate-kawaii-float,
          .stationery-spring-in,
          .poem-line-enter,
          .floating-particles-layer {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .letter-cursor-heart {
            display: none !important;
          }
        }
      `}</style>

      {/* ═══ PINK GINGHAM MELTED FADED BACKGROUND LAYER ═══ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden kawaii-gingham-fade-y"
      >
        <div className="absolute inset-0 kawaii-gingham-fade-x kawaii-gingham-bg-layer" />
      </div>

      {/* Floating Kawaii Upward Particles (Hearts, Flowers, Sparkles, Bows) */}
      <TheLetterAmbientFloaters />

      {/* Heart Cursor Trail Mount */}
      <div ref={trailContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-40" />

      {/* Phase 04 Header */}
      <PhaseHeader
        icon={<span>💌</span>}
        phase="PHASE 04 ✦ THE LETTER"
        title="ONE LAST THING"
        subtitle="airmail to Japan • the obligatory sentimental section"
      />

      {/* Envelope / Letter Container */}
      <div
        ref={letterRef}
        role={!isOpen ? "button" : undefined}
        tabIndex={!isOpen ? 0 : undefined}
        aria-expanded={isOpen}
        aria-label="Open birthday letter"
        data-cursor={!isOpen ? "peel" : undefined}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`relative w-full max-w-[740px] md:max-w-[780px] mx-auto transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#881337] focus-visible:ring-offset-4 rounded-[36px] ${!isOpen
            ? "h-[310px] sm:h-[350px] cursor-pointer hover:scale-[1.015] active:scale-[0.99]"
            : "min-h-[550px]"
          }`}
        onClick={handleOpen}
      >
        {/* ═══ UNOPENED CUTE BOBBING AIRMAIL ENVELOPE ═══ */}
        <TheLetterEnvelope isOpen={isOpen} />

        {/* ═══ OPENED JAPANESE PASTEL STATIONERY LETTER ═══ */}
        <TheLetterStationery isOpen={isOpen} onClose={handleClose} />
      </div>
    </div>
  );
}
