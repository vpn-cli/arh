/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { slideshowSlides, type SlideItem } from "@/config/slideshow";
import { CurrentlyPlayingHero } from "./CurrentlyPlayingHero";
import { SlideLayer } from "./SlideLayer";
import { PlayIcon, PauseIcon } from "../icons";

// Timing constants
export const STILL_MS = 6000;
export const ANIMATED_MS = 10000;
export const FADE_MS = 800;

// Visual tuning constants for background slideshow & scrim
export const BG_OPACITY = 0.55;
export const BG_BLUR = "1px";
export const SCRIM_GRADIENT =
  "linear-gradient(to right, color-mix(in srgb, var(--color-bg, #ffffff) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg, #ffffff) 92%, transparent) 40%, transparent 75%)";

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
  const [isDocHidden, setIsDocHidden] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
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

  // Initialize slides: shuffle on mount, or pick one random still image for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionReduced = mediaQuery.matches;
    setReducedMotion(motionReduced);

    const setupSlides = (isReduced: boolean) => {
      if (isReduced) {
        const stillSlides = slideshowSlides.filter((s) => !s.animated);
        if (stillSlides.length > 0) {
          const randomIndex = Math.floor(Math.random() * stillSlides.length);
          setSlides([stillSlides[randomIndex]]);
        } else {
          setSlides([]);
        }
      } else {
        if (slideshowSlides.length > 0) {
          const shuffled = [...slideshowSlides];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          setSlides(shuffled);
        } else {
          setSlides([]);
        }
      }
      setCurrentIndex(0);
      setNextIndex(null);
      setIsFading(false);
    };

    setupSlides(motionReduced);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      setupSlides(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const handleVisibility = () => {
      setIsDocHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    setHasInitialized(true);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // IntersectionObserver to pause when the hero card is not shown in the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
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
    }, FADE_MS);
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

  // Preload next slide only after current one has finished fading in
  useEffect(() => {
    if (!hasInitialized || slides.length <= 1 || isFading || nextIndex !== null || reducedMotion) {
      return;
    }
    const upcoming = (currentIndex + 1) % slides.length;
    nextReadyRef.current = false;
    timerExpiredRef.current = false;
    setNextIndex(upcoming);
  }, [hasInitialized, slides.length, isFading, nextIndex, currentIndex, reducedMotion]);

  // Auto-advance timer: 6s for still images, 10s for animated
  useEffect(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    if (
      !hasInitialized ||
      slides.length <= 1 ||
      isFading ||
      isDocHidden ||
      !isIntersecting ||
      reducedMotion
    ) {
      return;
    }

    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;

    const stayDuration = currentSlide.animated ? ANIMATED_MS : STILL_MS;

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
    isDocHidden,
    isIntersecting,
    reducedMotion,
    triggerCrossfade,
  ]);

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

  // If the slideshow list is empty, render the existing hero unchanged
  if (!hasInitialized || slides.length === 0) {
    return <CurrentlyPlayingHero {...props} />;
  }

  const currentSlide = slides[currentIndex];
  const nextSlide = nextIndex !== null ? slides[nextIndex] : null;

  return (
    <section
      ref={sectionRef}
      className="relative h-[220px] sm:h-[260px] overflow-hidden rounded-[24px] border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-sm"
    >
      {/* Background Slideshow Layer: softened with opacity and blur */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
        style={{
          opacity: BG_OPACITY,
          filter: `blur(${BG_BLUR})`,
          transform: "scale(1.02)",
        }}
      >
        {currentSlide && (
          <SlideLayer
            key={currentSlide.src}
            slide={currentSlide}
            isPriority={true}
            opacity={1}
            isFading={false}
            fadeMs={FADE_MS}
          />
        )}

        {nextSlide && (
          <SlideLayer
            key={nextSlide.src}
            slide={nextSlide}
            isPriority={false}
            opacity={isFading ? 1 : 0}
            isFading={isFading}
            fadeMs={FADE_MS}
            onReady={handleNextReady}
            onError={handleNextError}
          />
        )}
      </div>

      {/* Scrim: horizontal gradient from var(--color-bg) at ~92% opacity to transparent at ~75% width */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: SCRIM_GRADIENT,
        }}
      />

      {/* Foreground Hero Content: restored from CurrentlyPlayingHero */}
      <div className="relative z-10 flex h-full items-center px-6 sm:px-8 py-6 sm:py-8">
        <div className="max-w-lg">
          <p className="font-pixel text-caption sm:text-body font-bold tracking-widest text-[var(--color-dark)] uppercase">
            {props.currentTrack ? "CURRENTLY PLAYING" : "GOOD EVENING"}
          </p>
          <h2 className="mt-2 font-pixel text-display font-extrabold leading-tight text-[var(--color-dark)] drop-shadow-[0_2px_0_#FFFFFF]">
            {props.currentTrack ? props.currentTrack.name : "Let's listen together ♡"}
          </h2>
          <p className="mt-2 sm:mt-3 font-pixel text-body sm:text-title font-medium text-[var(--color-dark)] opacity-90 truncate">
            {props.currentTrack
              ? props.currentTrack.artists?.map((a: any) => a.name).join(", ")
              : "What are we listening to today?"}
          </p>
          <button
            type="button"
            onClick={handlePlayClick}
            className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-5 sm:px-6 py-2 sm:py-2.5 font-pixel text-body font-bold text-[var(--on-vibrant)] shadow-md mw-btn group cursor-pointer"
          >
            <span>
              {props.currentTrack ? (
                props.isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />
              ) : (
                <PlayIcon size={16} />
              )}
            </span>
            {props.currentTrack ? (props.isPaused ? "Resume" : "Playing") : "Play Mix"}
          </button>
        </div>
      </div>
    </section>
  );
});
