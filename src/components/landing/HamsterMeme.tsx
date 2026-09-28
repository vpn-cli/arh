"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export interface HampterMood {
  id: string;
  sticker: string;
  speech: string;
  mood: string;
}

// Curated selection of the best hampter stickers mapped to moods
export const HAMPTER_MOODS: HampterMood[] = [
  {
    id: "greeting",
    sticker: "/images/hampters/hampter_00.png",
    speech: "psst... yeah you.\nclick me. ♡",
    mood: "Curious",
  },
  {
    id: "rose",
    sticker: "/images/hampters/hampter_05.png",
    speech: "for you, my\nfavourite human 🌹",
    mood: "Romantic",
  },
  {
    id: "screaming",
    sticker: "/images/hampters/hampter_08.png",
    speech: "AAAAAA HAPPY\nBIRTHDAYYYY!!",
    mood: "Excited",
  },
  {
    id: "party",
    sticker: "/images/hampters/hampter_14.png",
    speech: "BIRTHDAY PARTY\nACTIVATED! ✦",
    mood: "Party",
  },
  {
    id: "wizard",
    sticker: "/images/hampters/hampter_10.png",
    speech: "i cast: unlimited\nhappiness spell!",
    mood: "Magic",
  },
  {
    id: "crying",
    sticker: "/images/hampters/hampter_06.png",
    speech: "you're growing\nup so fast ;_; ♡",
    mood: "Sentimental",
  },
  {
    id: "thumbsup",
    sticker: "/images/hampters/hampter_02.png",
    speech: "10/10 best friend.\nkeep shining",
    mood: "Proud",
  },
  {
    id: "glasses",
    sticker: "/images/hampters/hampter_11.png",
    speech: "i did some research:\nyou're 100% cooler",
    mood: "Genius",
  },
  {
    id: "hearthands",
    sticker: "/images/hampters/hampter_03.png",
    speech: "built with hamster\nenergy & pure love ♡",
    mood: "Sweet",
  },
  {
    id: "smug",
    sticker: "/images/hampters/hampter_22.png",
    speech: "oh you thought this\nwas it? keep clicking",
    mood: "Smug",
  },
  {
    id: "sleeping",
    sticker: "/images/hampters/hampter_16.png",
    speech: "zzz... five more\nminutes... zzz",
    mood: "Sleepy",
  },
  {
    id: "superhero",
    sticker: "/images/hampters/hampter_20.png",
    speech: "SUPER BIRTHDAY\nPOWERS ACTIVATE!",
    mood: "Heroic",
  },
];

interface HamsterMemeProps {
  className?: string;
  onBoop?: (count: number) => void;
  onQuoteChange?: (quote: string) => void;
  onMoodChange?: (mood: string) => void;
}

export default function HamsterMeme({
  className = "",
  onBoop,
  onQuoteChange,
  onMoodChange,
}: HamsterMemeProps) {
  const [moodIndex, setMoodIndex] = useState(0);
  const [boopCount, setBoopCount] = useState(0);
  const [showBoopPing, setShowBoopPing] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number }[]
  >([]);

  const hampterRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentMood = HAMPTER_MOODS[moodIndex];

  const playBoopSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 520 + Math.random() * 160;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * 1.7,
        ctx.currentTime + 0.1
      );
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio fallback — silent
    }
  };

  const handleClick = () => {
    const nextCount = boopCount + 1;
    const nextIndex = (moodIndex + 1) % HAMPTER_MOODS.length;

    setBoopCount(nextCount);
    setMoodIndex(nextIndex);
    setShowBoopPing(true);
    setTimeout(() => setShowBoopPing(false), 500);

    const nextMood = HAMPTER_MOODS[nextIndex];
    onQuoteChange?.(nextMood.speech);
    onMoodChange?.(nextMood.mood);
    onBoop?.(nextCount);

    // Floating heart
    const heartId = Date.now() + Math.random();
    setFloatingHearts((prev) => [
      ...prev.slice(-4),
      { id: heartId, x: (Math.random() - 0.5) * 60 },
    ]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 900);

    playBoopSound();

    // GSAP squash/stretch
    if (hampterRef.current) {
      gsap
        .timeline()
        .to(hampterRef.current, {
          scaleY: 0.85,
          scaleX: 1.15,
          duration: 0.08,
          ease: "power1.in",
        })
        .to(hampterRef.current, {
          scaleY: 1.1,
          scaleX: 0.92,
          duration: 0.12,
          ease: "back.out(2)",
        })
        .to(hampterRef.current, {
          scaleY: 1,
          scaleX: 1,
          duration: 0.1,
          ease: "power1.out",
        });
    }
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Floating Hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          style={{ left: `calc(50% + ${heart.x}px)` }}
          className="absolute -top-4 text-lg text-pink pointer-events-none animate-heart-pop z-10"
        >
          ♡
        </div>
      ))}

      {/* BOOP ping */}
      {showBoopPing && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-pink text-dark font-retro text-[7px] px-2 py-0.5 border-2 border-border z-20 whitespace-nowrap shadow-[2px_2px_0_0_#3A2E50]">
          BOOP!
        </div>
      )}

      {/* Hampter Sticker */}
      <div
        ref={hampterRef}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            handleClick();
        }}
        aria-label={`Hampter mood: ${currentMood.mood} — click to boop`}
        className="cursor-pointer select-none transition-transform duration-75 hover:brightness-110 active:scale-95"
        title="Click to boop Hampter!"
        data-cursor="hamster"
      >
        <Image
          src={currentMood.sticker}
          alt={`Hampter: ${currentMood.mood}`}
          width={140}
          height={140}
          className="pixelated drop-shadow-[3px_3px_0px_rgba(58,46,80,0.25)] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] md:w-[160px] md:h-[160px]"
          priority
        />
      </div>

      {/* Boop counter */}
      {boopCount > 0 && (
        <div className="mt-1 font-terminal text-sm text-dark-muted">
          boops: {boopCount}
        </div>
      )}
    </div>
  );
}
