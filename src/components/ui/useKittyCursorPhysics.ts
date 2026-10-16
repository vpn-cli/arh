"use client";

import { useEffect, useRef, useState } from "react";
import { useCursor } from "@/context/CursorContext";
import {
  resolveCursorState,
  KITTY_CURSOR_HOTSPOT,
  KITTY_PUZZLE_SOLVED_EVENT,
  KITTY_PUZZLE_SKIPPED_EVENT,
  CursorMode,
  resolveKittyExpression,
  mapExpressionToCoreFrame,
  canBlink,
} from "./cursorUtils";
import { sfx } from "@/lib/audio";
import { ParticleType, spawnCursorParticle } from "./CursorParticles";

const PARTICLE_COLORS = ["#FF7597", "#FF8FB3", "#FFEAA7", "#B9D7C0", "#C8B8F1"];
const DEFAULT_PARTICLE_TYPES: ParticleType[] = ["heart", "star", "sakura", "bow"];
const MUSIC_PARTICLE_TYPES: ParticleType[] = ["note_single", "note_double", "note_beam"];

interface UseKittyCursorPhysicsOptions {
  activeMode: CursorMode;
  isMusicWorld: boolean;
  isMusicPlaying: boolean;
  isScrapbookWorld?: boolean;
  isWarping: boolean;
}

export function useKittyCursorPhysics({
  activeMode,
  isMusicWorld,
  isMusicPlaying,
  isScrapbookWorld = false,
  isWarping,
}: UseKittyCursorPhysicsOptions) {
  const {
    cursorMode: contextMode,
    setCursorMode,
    isFinePointer,
    prefersReducedMotion,
  } = useCursor();

  const kittyRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const innerImgRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isClickPopping, setIsClickPopping] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isIdleSleep, setIsIdleSleep] = useState(false);
  const isIdleSleepRef = useRef(false);
  const [isWaking, setIsWaking] = useState(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isShrugging, setIsShrugging] = useState(false);

  // Coordinate tracking refs
  const coords = useRef({ x: -100, y: -100 });
  const prevCoords = useRef({ x: -100, y: -100 });
  const glowCoords = useRef({ x: -100, y: -100 });
  const lastRafTime = useRef(performance.now());
  const lastPointerMoveTime = useRef(performance.now());
  const pressStartTime = useRef(0);
  const minHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const puzzleSolvedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shrugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for state accessed inside event listeners without re-subscribing
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const isMusicWorldRef = useRef(isMusicWorld);
  isMusicWorldRef.current = isMusicWorld;
  const isMusicPlayingRef = useRef(isMusicPlaying);
  isMusicPlayingRef.current = isMusicPlaying;
  const isScrapbookWorldRef = useRef(isScrapbookWorld);
  isScrapbookWorldRef.current = isScrapbookWorld;
  const isWarpingRef = useRef(isWarping);
  isWarpingRef.current = isWarping;
  const isPressedRef = useRef(isPressed);
  isPressedRef.current = isPressed;

  // RAF Spring state refs for velocity lean & squash/stretch
  const currentLean = useRef(0);
  const leanSpringVel = useRef(0);
  const currentScaleX = useRef(1.0);
  const scaleXSpringVel = useRef(0);
  const currentScaleY = useRef(1.0);
  const scaleYSpringVel = useRef(0);
  const swayAngleRef = useRef<number>(0);
  const shrugAngleRef = useRef<number>(0);
  const isHoveringPrecisionRef = useRef<boolean>(false);

  // Throttled particle spawn refs
  const lastHoverMode = useRef<CursorMode>("default");
  const lastParticleSpawn = useRef<number>(0);
  const lastParticlePos = useRef({ x: -100, y: -100 });

  // 1. Resolve Active Expression
  const activeExpression = resolveKittyExpression({
    mode: activeMode,
    isPressed,
    isClickPopping,
    isBlinking,
    isIdleSleep,
    isMusicPlaying,
    isPuzzleSolved,
  });
  const activeCoreFrame = mapExpressionToCoreFrame(activeExpression);
  const activeExpressionRef = useRef(activeExpression);
  activeExpressionRef.current = activeExpression;

  // Development logger for expression transitions
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[HelloKittyCursor] activeExpression: "${activeExpression}" | coreFrame: "${activeCoreFrame}" | mode: "${activeMode}" | blinking: ${isBlinking} | sleep: ${isIdleSleep}`
      );
    }
  }, [activeExpression, activeCoreFrame, activeMode, isBlinking, isIdleSleep]);

  // 2. Clean up timers and puzzle-solve event listener
  useEffect(() => {
    const handlePuzzleSolved = () => {
      setIsPuzzleSolved(true);
      if (puzzleSolvedTimer.current) clearTimeout(puzzleSolvedTimer.current);
      puzzleSolvedTimer.current = setTimeout(() => {
        setIsPuzzleSolved(false);
      }, 2500);

      // Burst ~12 confetti particles from cursor position directly to DOM (0 React re-renders)
      if (!prefersReducedMotion) {
        for (let i = 0; i < 12; i++) {
          spawnCursorParticle({
            x: coords.current.x + (Math.random() - 0.5) * 80,
            y: coords.current.y + (Math.random() - 0.5) * 80,
            type: DEFAULT_PARTICLE_TYPES[Math.floor(Math.random() * DEFAULT_PARTICLE_TYPES.length)],
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            rotation: (Math.random() - 0.5) * 60,
          });
        }
      }
    };

    const handlePuzzleSkipped = () => {
      setIsShrugging(true);
      if (shrugTimer.current) clearTimeout(shrugTimer.current);
      shrugTimer.current = setTimeout(() => {
        setIsShrugging(false);
      }, 950);
    };

    window.addEventListener(KITTY_PUZZLE_SOLVED_EVENT, handlePuzzleSolved);
    window.addEventListener(KITTY_PUZZLE_SKIPPED_EVENT, handlePuzzleSkipped);

    return () => {
      window.removeEventListener(KITTY_PUZZLE_SOLVED_EVENT, handlePuzzleSolved);
      window.removeEventListener(KITTY_PUZZLE_SKIPPED_EVENT, handlePuzzleSkipped);
      if (minHoldTimer.current) clearTimeout(minHoldTimer.current);
      if (popTimer.current) clearTimeout(popTimer.current);
      if (puzzleSolvedTimer.current) clearTimeout(puzzleSolvedTimer.current);
      if (shrugTimer.current) clearTimeout(shrugTimer.current);
    };
  }, [prefersReducedMotion]);

  // 3. Blinking Timer: Uses refs to prevent re-triggering cleanup and locking on blink
  useEffect(() => {
    if (prefersReducedMotion) return;

    let blinkTimeout: ReturnType<typeof setTimeout>;
    let closeTimeout: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const scheduleNextBlink = () => {
      if (isCancelled) return;
      const delay = Math.random() * 3000 + 2500; // 2.5s - 5.5s
      blinkTimeout = setTimeout(() => {
        if (isCancelled) return;
        if (canBlink(activeExpressionRef.current, isPressedRef.current, activeModeRef.current === "drag")) {
          setIsBlinking(true);
          closeTimeout = setTimeout(() => {
            if (isCancelled) return;
            setIsBlinking(false);
            scheduleNextBlink();
          }, 120);
        } else {
          scheduleNextBlink();
        }
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      isCancelled = true;
      clearTimeout(blinkTimeout);
      clearTimeout(closeTimeout);
    };
  }, [prefersReducedMotion]);

  // 4. Core Pointer Listeners and RAF Spring Loop
  useEffect(() => {
    if (!isFinePointer) {
      document.documentElement.classList.remove("custom-cursor-active");
      return;
    }
    document.documentElement.classList.add("custom-cursor-active");

    let animationFrameId: number;

    const handlePointerMove = (e: PointerEvent) => {
      // Coalesced hardware events for latest sub-millisecond coordinates
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      const latest = events.length > 0 ? events[events.length - 1] : e;
      const clientX = latest.clientX;
      const clientY = latest.clientY;

      coords.current.x = clientX;
      coords.current.y = clientY;

      // Zero-latency position write directly to DOM (NO RAF, NO spring, NO lerp)
      if (kittyRef.current) {
        kittyRef.current.style.transform = `translate3d(${clientX - KITTY_CURSOR_HOTSPOT.x}px, ${
          clientY - KITTY_CURSOR_HOTSPOT.y
        }px, 0)`;
      }

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }

      // Idle sleep wake-up startle
      lastPointerMoveTime.current = performance.now();
      if (isIdleSleepRef.current) {
        isIdleSleepRef.current = false;
        setIsIdleSleep(false);
        if (!prefersReducedMotion) {
          setIsWaking(true);
          setTimeout(() => setIsWaking(false), 140);
        }
      }

      // Direct DOM particle spawn (zero React re-renders)
      const now = performance.now();
      const isDrag = activeModeRef.current === "drag";
      const spawnInterval = isScrapbookWorldRef.current ? 70 : 45;

      const sel = typeof window !== "undefined" && window.getSelection ? window.getSelection() : null;
      const hasRealSelection = !!(sel && !sel.isCollapsed && sel.toString().trim().length > 0);

      if (
        !prefersReducedMotion &&
        !hasRealSelection &&
        !isDrag &&
        !isWarpingRef.current &&
        now - lastParticleSpawn.current >= spawnInterval
      ) {
        const dist = Math.hypot(clientX - lastParticlePos.current.x, clientY - lastParticlePos.current.y);
        if (dist >= 15) {
          lastParticleSpawn.current = now;
          lastParticlePos.current = { x: clientX, y: clientY };
          const typePool = isMusicWorldRef.current ? MUSIC_PARTICLE_TYPES : DEFAULT_PARTICLE_TYPES;
          const chosenType = typePool[Math.floor(Math.random() * typePool.length)];

          spawnCursorParticle({
            x: clientX,
            y: clientY,
            type: chosenType,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            rotation: (Math.random() - 0.5) * 40,
          });
        }
      }
    };

    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      isHoveringPrecisionRef.current = !!target.closest(
        "[data-precision='true'], .volume-slider, [role='slider'], .mw-volume-control button, .mw-volume-control input"
      );
      const resolved = resolveCursorState(target);
      if (resolved !== lastHoverMode.current) {
        setCursorMode(resolved);
        lastHoverMode.current = resolved;
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as Element | null;
      isHoveringPrecisionRef.current = !!related?.closest(
        "[data-precision='true'], .volume-slider, [role='slider'], .mw-volume-control button, .mw-volume-control input"
      );
      const nextMode = resolveCursorState(related);
      if (nextMode !== lastHoverMode.current) {
        setCursorMode(nextMode);
        lastHoverMode.current = nextMode;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        pressStartTime.current = performance.now();
        if (minHoldTimer.current) clearTimeout(minHoldTimer.current);
        if (popTimer.current) clearTimeout(popTimer.current);
        setIsPressed(true);
        setIsClickPopping(false);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 0) {
        const elapsed = performance.now() - pressStartTime.current;
        const remaining = Math.max(0, 100 - elapsed);

        if (remaining > 0) {
          minHoldTimer.current = setTimeout(() => {
            setIsPressed(false);
            setIsClickPopping(true);
            popTimer.current = setTimeout(() => setIsClickPopping(false), 160);
          }, remaining);
        } else {
          setIsPressed(false);
          setIsClickPopping(true);
          popTimer.current = setTimeout(() => setIsClickPopping(false), 160);
        }
      }
    };

    const renderLoop = (time: number) => {
      const now = performance.now();
      const dtSeconds = Math.min(Math.max((now - lastRafTime.current) / 1000, 0.001), 1 / 30);
      lastRafTime.current = now;
      const step = dtSeconds * 60;

      // 1. Idle sleep check (8s+)
      if (!isIdleSleepRef.current && now - lastPointerMoveTime.current > 8000) {
        isIdleSleepRef.current = true;
        setIsIdleSleep(true);
      }

      // 2. Velocity calculations for springs & glow snap
      const dx = coords.current.x - prevCoords.current.x;
      const dy = coords.current.y - prevCoords.current.y;
      prevCoords.current = { x: coords.current.x, y: coords.current.y };

      const vx = dx / step;
      const vy = dy / step;
      const moveSpeed = Math.hypot(vx, vy);

      // 3. Fast snappy glow follow (lerp ~0.52; snaps during fast flick so it NEVER drifts visibly behind)
      if (!prefersReducedMotion) {
        const glowLerpFactor = 1 - Math.pow(1 - 0.52, step);
        if (moveSpeed > 18) {
          glowCoords.current.x = coords.current.x;
          glowCoords.current.y = coords.current.y;
        } else {
          glowCoords.current.x += (coords.current.x - glowCoords.current.x) * glowLerpFactor;
          glowCoords.current.y += (coords.current.y - glowCoords.current.y) * glowLerpFactor;
        }
      } else {
        glowCoords.current.x = coords.current.x;
        glowCoords.current.y = coords.current.y;
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${
          glowCoords.current.x - KITTY_CURSOR_HOTSPOT.x
        }px, ${glowCoords.current.y - KITTY_CURSOR_HOTSPOT.y}px, 0)`;
      }

      // 4. Velocity Lean & Squash/Stretch Springs (inner image wrapper only)
      let targetLean = 0;
      let targetScaleX = 1.0;
      let targetScaleY = 1.0;

      const isDrag = activeModeRef.current === "drag";
      if (!prefersReducedMotion && !isPressedRef.current && !isDrag && !isWarpingRef.current) {
        if (moveSpeed > 0.5) {
          targetLean = Math.max(-6, Math.min(6, vx * 0.35));
          targetScaleX = Math.max(0.97, Math.min(1.03, 1.0 + (Math.abs(vx) * 0.003 - Math.abs(vy) * 0.002)));
          targetScaleY = Math.max(0.97, Math.min(1.03, 1.0 + (Math.abs(vy) * 0.003 - Math.abs(vx) * 0.002)));
        }
      }

      const leanStiffness = 0.22;
      const leanDamping = 0.72;
      leanSpringVel.current += (targetLean - currentLean.current) * (leanStiffness * step);
      currentLean.current += leanSpringVel.current * step;
      leanSpringVel.current *= Math.pow(leanDamping, step);

      const scaleStiffness = 0.25;
      const scaleDamping = 0.70;
      scaleXSpringVel.current += (targetScaleX - currentScaleX.current) * (scaleStiffness * step);
      currentScaleX.current += scaleXSpringVel.current * step;
      scaleXSpringVel.current *= Math.pow(scaleDamping, step);

      scaleYSpringVel.current += (targetScaleY - currentScaleY.current) * (scaleStiffness * step);
      currentScaleY.current += scaleYSpringVel.current * step;
      scaleYSpringVel.current *= Math.pow(scaleDamping, step);

      // Music World simulated sway
      const isPrecisionHover = isHoveringPrecisionRef.current;
      if (isMusicWorldRef.current && isMusicPlayingRef.current && !prefersReducedMotion && !isPrecisionHover) {
        const targetSway = Math.sin((time / 1000) * ((115 / 60) * Math.PI)) * 6.5;
        const swayFactor = 1 - Math.pow(1 - 0.15, step);
        swayAngleRef.current += (targetSway - swayAngleRef.current) * swayFactor;
      } else {
        const returnFactor = 1 - Math.pow(1 - 0.12, step);
        swayAngleRef.current += (0 - swayAngleRef.current) * returnFactor;
        if (Math.abs(swayAngleRef.current) < 0.05) swayAngleRef.current = 0;
      }

      // Shrug tilt on quiz skip
      const targetShrug = isShrugging ? 11 : 0;
      const shrugFactor = 1 - Math.pow(1 - 0.18, step);
      shrugAngleRef.current += (targetShrug - shrugAngleRef.current) * shrugFactor;
      if (!isShrugging && Math.abs(shrugAngleRef.current) < 0.05) shrugAngleRef.current = 0;

      if (innerImgRef.current) {
        const totalRotate = currentLean.current + swayAngleRef.current + shrugAngleRef.current;
        innerImgRef.current.style.transform = `rotate(${totalRotate.toFixed(2)}deg) scale(${currentScaleX.current.toFixed(
          3
        )}, ${currentScaleY.current.toFixed(3)})`;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", () => setIsVisible(false));
    document.addEventListener("mouseenter", () => setIsVisible(true));
    window.addEventListener("blur", () => setIsVisible(false));
    window.addEventListener("focus", () => setIsVisible(true));

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isFinePointer,
    prefersReducedMotion,
    setCursorMode,
  ]);

  return {
    kittyRef,
    glowRef,
    innerImgRef,
    isVisible,
    isPressed,
    isClickPopping,
    isIdleSleep,
    isWaking,
    activeExpression,
    activeCoreFrame,
    isFinePointer,
    prefersReducedMotion,
  };
}
