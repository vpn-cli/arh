"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface TypewriterIntroProps {
  onComplete: () => void;
}

const introLines = [
  "psst...",
  "yeah, you.",
  "don't pretend you didn't click this link.",
  "ready for your surprise?",
];

export default function TypewriterIntro({ onComplete }: TypewriterIntroProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);

  useEffect(() => {
    let charIndex = 0;
    const targetLine = introLines[currentLineIndex];
    setDisplayedText("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (skipRef.current) {
        clearInterval(typeInterval);
        return;
      }

      if (charIndex <= targetLine.length) {
        setDisplayedText(targetLine.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);

        const nextTimeout = setTimeout(() => {
          if (skipRef.current) return;

          if (currentLineIndex < introLines.length - 1) {
            setCurrentLineIndex((prev) => prev + 1);
          } else {
            handleComplete();
          }
        }, 1200);

        return () => clearTimeout(nextTimeout);
      }
    }, 45);

    return () => clearInterval(typeInterval);
  }, [currentLineIndex]);

  const handleComplete = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -20,
        scale: 0.96,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: onComplete,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    skipRef.current = true;
    handleComplete();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-parchment px-4 select-none cursor-pointer"
      onClick={handleSkip}
      role="region"
      aria-label="Welcome intro"
    >
      {/* System version tag */}
      <div className="absolute top-6 left-6 font-retro text-[8px] text-pink opacity-60 tracking-wider">
        ✦ BIRTHDAY_OS v1.0 ✦
      </div>
      <div className="absolute bottom-6 right-6 font-terminal text-base text-dark/50">
        [ click anywhere to skip ]
      </div>

      {/* Dialog box */}
      <div className="w-full max-w-lg pixel-window pixel-window--pink relative">
        {/* Washi tape on top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 washi-tape washi-tape--pink -rotate-1 border border-border/20 z-10" />

        {/* Title bar */}
        <div className="pixel-window__bar">
          <div className="pixel-window__dots">
            <span />
            <span />
            <span />
          </div>
          <span>MESSAGE_INCOMING</span>
          <span className="ml-auto text-blue-soft">
            0{currentLineIndex + 1}/0{introLines.length}
          </span>
        </div>

        {/* Content */}
        <div className="pixel-window__content">
          {/* Typewriter text */}
          <div className="min-h-[90px] flex items-center justify-center py-4">
            <p className="font-pixel text-2xl sm:text-3xl text-center text-dark font-semibold tracking-wide">
              {displayedText}
              <span
                className={`inline-block w-3 h-7 ml-1 bg-pink align-middle ${
                  isTyping ? "opacity-100" : "animate-blink"
                }`}
              />
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t-2 border-dashed border-dark/15 flex items-center justify-between">
            <span className="font-handwriting text-xl text-dark/60 font-bold">
              made with love & chaos ♡
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="pixel-btn pixel-btn--yellow px-3 py-1.5 font-retro text-[9px]"
            >
              SKIP →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
