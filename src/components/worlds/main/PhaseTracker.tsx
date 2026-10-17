"use client";

import React, { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface PhaseItem {
  id: string;
  number: string;
  name: string;
  ariaLabel: string;
}

export const MAIN_PHASES: PhaseItem[] = [
  { id: "phase-01-terminal", number: "01", name: "The Terminal", ariaLabel: "Go to Phase 01: The Terminal" },
  { id: "phase-02-vault", number: "02", name: "The Vault", ariaLabel: "Go to Phase 02: The Vault" },
  { id: "phase-03-edit", number: "03", name: "The Edit", ariaLabel: "Go to Phase 03: The Edit" },
  { id: "phase-04-letter", number: "04", name: "The Letter", ariaLabel: "Go to Phase 04: The Letter" },
];

interface PhaseTrackerProps {
  className?: string;
  isUnlocked?: boolean;
}

export default function PhaseTracker({ className = "", isUnlocked = false }: PhaseTrackerProps) {
  const [activePhaseId, setActivePhaseId] = useState<string>("phase-01-terminal");
  const prefersReducedMotion = usePrefersReducedMotion();

  // Track active phase via scroll position and IntersectionObserver
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intersectingMap = new Map<string, number>();

    const updateActivePhase = () => {
      // Check if near bottom of page -> always select the last phase
      if (
        typeof window !== "undefined" &&
        document.documentElement.scrollHeight > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
      ) {
        setActivePhaseId(MAIN_PHASES[MAIN_PHASES.length - 1].id);
        return;
      }

      const targetY = window.innerHeight * 0.35;
      for (let i = MAIN_PHASES.length - 1; i >= 0; i--) {
        const p = MAIN_PHASES[i];
        const el = document.getElementById(p.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // If element spans across targetY reference line
        if (rect.top <= targetY && rect.bottom >= targetY) {
          setActivePhaseId(p.id);
          return;
        }
      }

      // If no section spans targetY directly, find element closest to targetY that is on-screen
      let minDistance = Infinity;
      let currentBestId = "";
      for (const p of MAIN_PHASES) {
        const el = document.getElementById(p.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - targetY);
        if (dist < minDistance && rect.bottom > 0 && rect.top < window.innerHeight) {
          minDistance = dist;
          currentBestId = p.id;
        }
      }

      if (currentBestId) {
        setActivePhaseId(currentBestId);
      }
    };

    updateActivePhase();

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateActivePhase();
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              intersectingMap.set(entry.target.id, entry.intersectionRatio);
            } else {
              intersectingMap.delete(entry.target.id);
            }
          });

          // Check if any phases are actively intersecting the focal zone
          let currentActive = "";
          for (let i = MAIN_PHASES.length - 1; i >= 0; i--) {
            const pid = MAIN_PHASES[i].id;
            if (intersectingMap.has(pid)) {
              currentActive = pid;
              break;
            }
          }

          if (currentActive) {
            setActivePhaseId(currentActive);
          } else {
            // Fallback to geometric check
            updateActivePhase();
          }
        },
        {
          rootMargin: "-20% 0px -40% 0px",
          threshold: [0, 0.25, 0.5, 0.75, 1.0],
        }
      );

      MAIN_PHASES.forEach((p) => {
        const el = document.getElementById(p.id);
        if (el) observer?.observe(el);
      });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [isUnlocked]);

  const handleScrollToPhase = (phaseId: string) => {
    setActivePhaseId(phaseId);

    // Notify any listening phase sections (e.g. for immediate reveal on tracker jump)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("phase-tracker-jump", { detail: { phaseId } }));
    }

    let element = document.getElementById(phaseId);
    if (!element) {
      element = document.getElementById("kitty-terminal") || document.getElementById("phase-01-terminal");
    }

    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav
      aria-label="Storyline phase navigation"
      data-testid="phase-tracker"
      className={`fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3 bg-[#FFFDF8]/90 backdrop-blur-xs p-2.5 rounded-full border-2 border-[#3A2440] shadow-[3px_3px_0_#3A2440] select-none pointer-events-auto transition-transform ${className}`}
    >
      {MAIN_PHASES.map((phase) => {
        const isActive = activePhaseId === phase.id;

        return (
          <button
            key={phase.id}
            data-testid={`phase-tracker-dot-${phase.number}`}
            type="button"
            onClick={() => handleScrollToPhase(phase.id)}
            data-cursor="pointer"
            aria-label={phase.ariaLabel}
            aria-current={isActive ? "step" : undefined}
            className="kitty-nav-dot group relative flex flex-col items-center justify-center p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A2440] focus-visible:ring-offset-2 rounded-full transition-transform"
          >
            {/* Dot indicator */}
            <span
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? "kitty-nav-dot-active w-3.5 h-3.5 bg-[#FF8FB3] border-2 border-[#3A2440] shadow-xs scale-110"
                  : "w-2.5 h-2.5 bg-[#FFF0F5] border border-[#3A2440]/60 group-hover:scale-115 group-hover:bg-[#FFEAA7]"
              }`}
            />

            {/* Tiny phase number label */}
            <span
              className={`font-pixel text-[8px] mt-0.5 tracking-wider transition-colors ${
                isActive
                  ? "text-[#2D1B36] font-extrabold"
                  : "text-[#4A3855]/60 group-hover:text-[#3A2440]"
              }`}
            >
              {phase.number}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
