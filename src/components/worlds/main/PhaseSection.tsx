"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface PhaseSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export default function PhaseSection({
  id,
  children,
  className = "",
}: PhaseSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // If IntersectionObserver is unavailable or prefersReducedMotion is active, start revealed
  const hasIO = typeof window !== "undefined" && typeof window.IntersectionObserver !== "undefined";
  const [isRevealed, setIsRevealed] = useState<boolean>(!hasIO || prefersReducedMotion);
  const [hasEntered, setHasEntered] = useState<boolean>(!hasIO || prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsRevealed(true);
      setHasEntered(true);
      return;
    }

    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      setIsRevealed(true);
      setHasEntered(true);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    // IntersectionObserver with threshold 0 and rootMargin '0px 0px -10% 0px'
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0) {
            setIsRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(section);

    // Listen for direct jump clicks from PhaseTracker
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ phaseId: string }>;
      if (customEvent.detail?.phaseId === id) {
        setIsRevealed(true);
      }
    };

    window.addEventListener("phase-tracker-jump", handleJump);

    return () => {
      observer.disconnect();
      window.removeEventListener("phase-tracker-jump", handleJump);
    };
  }, [id, prefersReducedMotion]);

  // Once revealed, remove transform after entrance transition so it doesn't trap fixed children
  useEffect(() => {
    if (isRevealed && !hasEntered && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        setHasEntered(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, hasEntered, prefersReducedMotion]);

  // Handle animation classes according to prefers-reduced-motion, reveal, and completion state
  let animationClasses = "";
  if (prefersReducedMotion || hasEntered) {
    animationClasses = "opacity-100";
  } else if (isRevealed) {
    animationClasses = "opacity-100 translate-y-0 transition-[opacity,transform] duration-700 ease-out";
  } else {
    animationClasses = "opacity-0 translate-y-[20px] transition-[opacity,transform] duration-700 ease-out";
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      data-testid={`phase-section-${id}`}
      data-phase-section="true"
      style={hasEntered ? { transform: "none" } : undefined}
      className={`w-full flex flex-col items-center py-12 md:py-16 px-3 sm:px-6 relative z-10 scroll-mt-28 sm:scroll-mt-32 snap-start ${animationClasses} ${className}`}
    >
      {children}
    </section>
  );
}
