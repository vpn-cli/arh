/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { slideshowSlides, type SlideItem } from "@/config/slideshow";
import { CurrentlyPlayingHero } from "./CurrentlyPlayingHero";
import { SlideLayer } from "./SlideLayer";
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

export interface HeroSlideshowProps {
  currentTrack: any;
  isPaused: boolean;
  heroArt: string;
  birthdayMixTracks: any[];
  likedTracks: any[];
  onNavigate: (tab: any) => void;
  playTracks: (uris: string[], tracks?: any[]) => void;
  togglePlay: () => void;
}

export const HeroSlideshow = React.memo(function HeroSlideshow(props: HeroSlideshowProps) {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDocHidden, setIsDocHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const nextReadyRef = useRef(false);
  const timerExpiredRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slidesRef = useRef<SlideItem[]>([]);
  slidesRef.current = slides;

  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const nextIndexRef = useRef<number | null>(null);
  nextIndexRef.current = nextIndex;

  const isFadingRef = useRef(false);
  isFadingRef.current = isFading;

  // 3 & 8. Shuffle once per mount inside effect (Fisher-Yates) and filter reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionReduced = mediaQuery.matches;
    setReducedMotion(motionReduced);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const handleVisibility = () => {
      setIsDocHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let pool = [...slideshowSlides];
    if (motionReduced) {
      pool = pool.filter((s) => !s.animated);
    }

    if (pool.length > 0) {
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setSlides(shuffled);
    } else {
      setSlides([]);
    }

    setHasInitialized(true);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const triggerCrossfade = useCallback(() => {
    if (isFadingRef.current || nextIndexRef.current === null) return;
    setIsFading(true);

    fadeTimerRef.current = setTimeout(() => {
      const finishedIndex = nextIndexRef.current;
      if (finishedIndex !== null) {
        setCurrentIndex(finishedIndex);
      }
      setNextIndex(null);
      setIsFading(false);
      nextReadyRef.current = false;
      timerExpiredRef.current = false;
    }, 600);
  }, []);

  const handleNextReady = useCallback(() => {
    nextReadyRef.current = true;
    if (timerExpiredRef.current) {
      triggerCrossfade();
    }
  }, [triggerCrossfade]);

  const handleNextError = useCallback(() => {
    const count = slidesRef.current.length;
    if (count <= 1 || nextIndexRef.current === null) return;
    const skipped = (nextIndexRef.current + 1) % count;
    nextReadyRef.current = false;
    setNextIndex(skipped);
  }, []);

  // 12. Preload next slide only after current one has finished fading in
  useEffect(() => {
    if (!hasInitialized || slides.length <= 1 || isFading || nextIndex !== null) {
      return;
    }
    const upcoming = (currentIndex + 1) % slides.length;
    nextReadyRef.current = false;
    timerExpiredRef.current = false;
    setNextIndex(upcoming);
  }, [hasInitialized, slides.length, isFading, nextIndex, currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    if (
      !hasInitialized ||
      slides.length <= 1 ||
      isFading ||
      isHovered ||
      isDocHidden ||
      reducedMotion
    ) {
      return;
    }

    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;

    // 6. Still images stay 6s, animated stay 10s
    const stayDuration = currentSlide.animated ? 10000 : 6000;

    autoTimerRef.current = setTimeout(() => {
      if (nextReadyRef.current) {
        triggerCrossfade();
      } else {
        timerExpiredRef.current = true;
      }
    }, stayDuration);

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [
    hasInitialized,
    slides,
    currentIndex,
    isFading,
    isHovered,
    isDocHidden,
    reducedMotion,
    triggerCrossfade,
  ]);

  const handleNext = useCallback(() => {
    if (isFadingRef.current || slidesRef.current.length <= 1) return;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    if (nextReadyRef.current) {
      triggerCrossfade();
    } else {
      timerExpiredRef.current = true;
    }
  }, [triggerCrossfade]);

  const handlePrev = useCallback(() => {
    if (isFadingRef.current || slidesRef.current.length <= 1) return;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    const count = slidesRef.current.length;
    const prev = (currentIndexRef.current - 1 + count) % count;
    nextReadyRef.current = false;
    timerExpiredRef.current = true;
    setNextIndex(prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  const handlePlayClick = () => {
    if (props.currentTrack) {
      props.togglePlay();
    } else {
      const tracksToPlay =
        props.birthdayMixTracks.length > 0
          ? props.birthdayMixTracks
          : props.likedTracks;
      if (tracksToPlay.length > 0) {
        props.playTracks(
          tracksToPlay.map((t: any) => t.uri),
          tracksToPlay
        );
      } else {
        props.onNavigate("mix");
      }
    }
  };

  // 2. If the slideshow list is empty, render the existing hero unchanged
  if (!hasInitialized || slides.length === 0) {
    return <CurrentlyPlayingHero {...props} />;
  }

  const currentSlide = slides[currentIndex];
  const nextSlide = nextIndex !== null ? slides[nextIndex] : null;

  return (
    <section
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pinterest Board Slideshow"
      className="group relative h-[220px] sm:h-[260px] overflow-hidden rounded-[24px] border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-vibrant)] select-none"
    >
      {/* 4. Only two img elements exist at a time: current and next */}
      {currentSlide && (
        <SlideLayer
          key={currentSlide.src}
          slide={currentSlide}
          isPriority={true}
          opacity={1}
          isFading={false}
        />
      )}

      {nextSlide && (
        <SlideLayer
          key={nextSlide.src}
          slide={nextSlide}
          isPriority={false}
          opacity={isFading ? 1 : 0}
          isFading={isFading}
          onReady={handleNextReady}
          onError={handleNextError}
        />
      )}

      {/* 9. Navigation controls shown on hover and focus */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 min-w-[32px] min-h-[32px] rounded-full bg-[var(--color-light)]/85 hover:bg-[var(--color-light)] text-[var(--color-dark)] border border-[var(--color-muted)] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer mw-btn"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 min-w-[32px] min-h-[32px] rounded-full bg-[var(--color-light)]/85 hover:bg-[var(--color-light)] text-[var(--color-dark)] border border-[var(--color-muted)] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer mw-btn"
          >
            <ChevronRightIcon size={18} />
          </button>
        </>
      )}

      {/* 10. Now-playing chip in bottom-left corner with high contrast backing */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 max-w-[calc(100%-88px)] sm:max-w-md rounded-2xl border-2 border-[var(--color-muted)] bg-[var(--color-light)]/90 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-md flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayClick}
          className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-[var(--color-vibrant)] text-[var(--on-vibrant)] flex items-center justify-center shrink-0 shadow-sm mw-btn cursor-pointer"
          aria-label={
            props.currentTrack
              ? props.isPaused
                ? "Resume playback"
                : "Pause playback"
              : "Play mix"
          }
        >
          {props.currentTrack ? (
            props.isPaused ? (
              <PlayIcon size={14} />
            ) : (
              <PauseIcon size={14} />
            )
          ) : (
            <PlayIcon size={14} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-pixel text-caption sm:text-meta font-bold text-[var(--color-dark)] leading-snug">
            {props.currentTrack ? props.currentTrack.name : "Let's listen together ♡"}
          </div>
          <div className="truncate font-pixel text-caption font-medium text-[var(--color-dark-muted)] leading-tight mt-0.5">
            {props.currentTrack
              ? props.currentTrack.artists?.map((a: any) => a.name).join(", ")
              : "What are we listening to today?"}
          </div>
        </div>
      </div>
    </section>
  );
});
