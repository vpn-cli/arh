"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface PhaseSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  minHeightClassName?: string;
  deferMount?: boolean;
  forceMount?: boolean;
}

export default function PhaseSection({
  id,
  children,
  className = "",
  minHeight,
  minHeightClassName = "",
  deferMount = false,
  forceMount = false,
}: PhaseSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Content mounting: if deferMount is active and forceMount is false, defer mounting
  const [isContentMounted, setIsContentMounted] = useState<boolean>(() => {
    if (!deferMount || forceMount) return true;
    if (typeof window === "undefined") return false;
    if (typeof window.IntersectionObserver === "undefined") return true;
    return false;
  });

  // If IntersectionObserver is unavailable or prefersReducedMotion is active, start revealed
  const hasIO = typeof window !== "undefined" && typeof window.IntersectionObserver !== "undefined";
  const [isRevealed, setIsRevealed] = useState<boolean>(!hasIO || prefersReducedMotion);
  const [hasEntered, setHasEntered] = useState<boolean>(!hasIO || prefersReducedMotion);

  // Update mounted state when forceMount prop changes
  useEffect(() => {
    if (forceMount && !isContentMounted) {
      setIsContentMounted(true);
    }
  }, [forceMount, isContentMounted]);

  // Entrance reveal observer & jump listener
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
        setIsContentMounted(true);
      }
    };

    window.addEventListener("phase-tracker-jump", handleJump);

    return () => {
      observer.disconnect();
      window.removeEventListener("phase-tracker-jump", handleJump);
    };
  }, [id, prefersReducedMotion]);

  // Deferred content mount observer (~1.5 viewports of scroll position)
  useEffect(() => {
    if (!deferMount || isContentMounted) return;
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") return;

    const section = sectionRef.current;
    if (!section) return;

    let mountObserver: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContentMounted(true);
            if (mountObserver) {
              mountObserver.disconnect();
              mountObserver = null;
            }
          }
        });
      },
      {
        rootMargin: "150% 0px 150% 0px",
        threshold: 0,
      }
    );

    // Activate observer when user starts scrolling or if already scrolled
    if (window.scrollY > 0) {
      mountObserver.observe(section);
    } else {
      const handleFirstScroll = () => {
        if (mountObserver && section) {
          mountObserver.observe(section);
        }
        window.removeEventListener("scroll", handleFirstScroll);
      };
      window.addEventListener("scroll", handleFirstScroll, { passive: true, once: true });
    }

    return () => {
      if (mountObserver) {
        mountObserver.disconnect();
      }
    };
  }, [deferMount, isContentMounted]);

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
      style={{
        ...(minHeight && !isContentMounted ? { minHeight: `${minHeight}px` } : {}),
        ...(hasEntered ? { transform: "none" } : {}),
      }}
      className={`w-full flex flex-col items-center py-12 md:py-16 px-3 sm:px-6 relative z-10 scroll-mt-28 sm:scroll-mt-32 snap-start ${
        !isContentMounted && minHeightClassName ? minHeightClassName : ""
      } ${animationClasses} ${className}`}
    >
      {isContentMounted ? children : null}
    </section>
  );
}
