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
import { Particle, ParticleType } from "./CursorParticles";

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
    soundEnabled,
    isFinePointer,
    prefersReducedMotion,
    hasInteracted,
  } = useCursor();

  const kittyRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const innerImgRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isClickPopping, setIsClickPopping] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isIdleSleep, setIsIdleSleep] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isShrugging, setIsShrugging] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

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

  // Throttled element check & particle spawn refs
  const lastElementCheck = useRef<number>(0);
  const lastHoverMode = useRef<CursorMode>("default");
  const lastParticleSpawn = useRef<number>(0);
  const lastParticlePos = useRef({ x: -100, y: -100 });
  const nextParticleId = useRef<number>(0);

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

  // 2. Clean up timers and puzzle-solve event listener
  useEffect(() => {
    const handlePuzzleSolved = () => {
      setIsPuzzleSolved(true);
      if (puzzleSolvedTimer.current) clearTimeout(puzzleSolvedTimer.current);
      puzzleSolvedTimer.current = setTimeout(() => {
        setIsPuzzleSolved(false);
      }, 2500);

      // Burst ~12 confetti particles from cursor position if reduced motion is disabled
      if (!prefersReducedMotion) {
        const now = performance.now();
        const burst: Particle[] = Array.from({ length: 12 }).map(() => ({
          id: nextParticleId.current++,
          x: coords.current.x + (Math.random() - 0.5) * 80,
          y: coords.current.y + (Math.random() - 0.5) * 80,
          type: DEFAULT_PARTICLE_TYPES[Math.floor(Math.random() * DEFAULT_PARTICLE_TYPES.length)],
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          rotation: (Math.random() - 0.5) * 60,
          bornAt: now,
        }));
        setParticles((prev) => [...prev.slice(-16), ...burst]);
      }
    };

    const handlePuzzleSkipped = () => {
      // Quick cute shrug / head tilt reaction on quiz skip (no confetti)
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

  // 3. Blinking Timer (Only while eyes open, paused on press/drag)
  useEffect(() => {
    if (prefersReducedMotion) return;

    let blinkTimeout: ReturnType<typeof setTimeout>;
    let closeTimeout: ReturnType<typeof setTimeout>;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 2500; // 2.5s - 5.0s
      blinkTimeout = setTimeout(() => {
        if (canBlink(activeExpression, isPressed, activeMode === "drag")) {
          setIsBlinking(true);
          closeTimeout = setTimeout(() => {
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
      clearTimeout(blinkTimeout);
      clearTimeout(closeTimeout);
    };
  }, [activeExpression, isPressed, activeMode, prefersReducedMotion]);

  // 4. Core Pointer Listeners and RAF Spring Loop
  useEffect(() => {
    if (!isFinePointer) {
      document.documentElement.classList.remove("custom-cursor-active");
      return;
    }
    document.documentElement.classList.add("custom-cursor-active");

    let animationFrameId: number;

    const handlePointerMove = (e: PointerEvent) => {
      coords.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Instant hardware-accelerated follow
      if (kittyRef.current) {
        kittyRef.current.style.transform = `translate3d(${e.clientX - KITTY_CURSOR_HOTSPOT.x}px, ${
          e.clientY - KITTY_CURSOR_HOTSPOT.y
        }px, 0)`;
      }

      // Idle sleep wake-up startle
      lastPointerMoveTime.current = performance.now();
      if (isIdleSleep) {
        setIsIdleSleep(false);
        if (!prefersReducedMotion) {
          setIsWaking(true);
          setTimeout(() => setIsWaking(false), 140);
        }
      }

      const sel = typeof window !== "undefined" && window.getSelection ? window.getSelection() : null;
      const hasRealSelection = !!(sel && !sel.isCollapsed && sel.toString().trim().length > 0);
      const now = performance.now();

      // Throttled elementFromPoint (every 65ms) for disabled elements
      if (now - lastElementCheck.current > 65) {
        lastElementCheck.current = now;
        const topEl = document.elementFromPoint(e.clientX, e.clientY);
        if (topEl && resolveCursorState(topEl) === "disabled" && contextMode !== "disabled") {
          setCursorMode("disabled");
        }
      }

      // Spawn light particle trail (throttled to 70ms and capped at 8 on Scrapbook page)
      const isDrag = activeMode === "drag";
      const spawnInterval = isScrapbookWorld ? 70 : 45;
      const maxTrailCap = isScrapbookWorld ? 8 : 13;

      if (!prefersReducedMotion && !hasRealSelection && !isDrag && !isWarping && now - lastParticleSpawn.current >= spawnInterval) {
        const dist = Math.hypot(e.clientX - lastParticlePos.current.x, e.clientY - lastParticlePos.current.y);
        if (dist >= 15) {
          lastParticleSpawn.current = now;
          lastParticlePos.current = { x: e.clientX, y: e.clientY };
          const typePool = isMusicWorld ? MUSIC_PARTICLE_TYPES : DEFAULT_PARTICLE_TYPES;
          const chosenType = typePool[Math.floor(Math.random() * typePool.length)];

          setParticles((prev) => [
            ...prev.slice(-(maxTrailCap - 1)),
            {
              id: nextParticleId.current++,
              x: e.clientX,
              y: e.clientY,
              type: chosenType,
              color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
              rotation: (Math.random() - 0.5) * 40,
              bornAt: now,
            },
          ]);
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
      setCursorMode(resolved);

      if (
        (resolved === "hover" || resolved === "puzzle" || resolved === "music") &&
        lastHoverMode.current !== resolved &&
        soundEnabled &&
        hasInteracted
      ) {
        sfx.hover();
      }
      lastHoverMode.current = resolved;
    };

    const handlePointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as Element | null;
      isHoveringPrecisionRef.current = !!related?.closest(
        "[data-precision='true'], .volume-slider, [role='slider'], .mw-volume-control button, .mw-volume-control input"
      );
      const nextMode = resolveCursorState(related);
      setCursorMode(nextMode);
      lastHoverMode.current = nextMode;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        pressStartTime.current = performance.now();
        if (minHoldTimer.current) clearTimeout(minHoldTimer.current);
        if (popTimer.current) clearTimeout(popTimer.current);
        setIsPressed(true);
        setIsClickPopping(false);
        if (soundEnabled && hasInteracted) sfx.pop();
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

    let lastCullTime = 0;
    const renderLoop = (time: number) => {
      const now = performance.now();
      // Delta time in seconds, clamped between 1ms and 1/30s (approx 33.3ms) to prevent tab switch jumps
      const dtSeconds = Math.min(Math.max((now - lastRafTime.current) / 1000, 0.001), 1 / 30);
      lastRafTime.current = now;
      // Step ratio normalized to standard 60Hz frame (1.0 at 60Hz, 0.5 at 120Hz, 0.4167 at 144Hz)
      const step = dtSeconds * 60;

      // 1. Idle sleep check (8s+)
      if (!isIdleSleep && now - lastPointerMoveTime.current > 8000) {
        setIsIdleSleep(true);
      }

      // 2. Glow lerp follow (frame-rate independent exponential interpolation)
      if (!prefersReducedMotion) {
        const glowLerpFactor = 1 - Math.pow(1 - 0.22, step);
        glowCoords.current.x += (coords.current.x - glowCoords.current.x) * glowLerpFactor;
        glowCoords.current.y += (coords.current.y - glowCoords.current.y) * glowLerpFactor;
      } else {
        glowCoords.current.x = coords.current.x;
        glowCoords.current.y = coords.current.y;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${
          glowCoords.current.x - KITTY_CURSOR_HOTSPOT.x
        }px, ${glowCoords.current.y - KITTY_CURSOR_HOTSPOT.y}px, 0)`;
      }

      // 3. Velocity Lean & Squash/Stretch Springs
      const dx = coords.current.x - prevCoords.current.x;
      const dy = coords.current.y - prevCoords.current.y;
      prevCoords.current = { x: coords.current.x, y: coords.current.y };

      // Velocity in pixels per 60Hz frame
      const vx = dx / step;
      const vy = dy / step;

      let targetLean = 0;
      let targetScaleX = 1.0;
      let targetScaleY = 1.0;

      // Rule 9: Cap at ±6°, squash/stretch at 0.97/1.03, disable during press & drag
      const isDrag = activeMode === "drag";
      if (!prefersReducedMotion && !isPressed && !isDrag && !isWarping) {
        const speed = Math.hypot(vx, vy);
        if (speed > 0.5) {
          targetLean = Math.max(-6, Math.min(6, vx * 0.35));
          targetScaleX = Math.max(0.97, Math.min(1.03, 1.0 + (Math.abs(vx) * 0.003 - Math.abs(vy) * 0.002)));
          targetScaleY = Math.max(0.97, Math.min(1.03, 1.0 + (Math.abs(vy) * 0.003 - Math.abs(vx) * 0.002)));
        }
      }

      // Integrate RAF springs with dt-scaled stiffness and exponential decay damping
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

      // 4. Music World 115 BPM simulated sway (frame-rate independent, pauses over precision controls)
      const isPrecisionHover = isHoveringPrecisionRef.current;
      if (isMusicWorld && isMusicPlaying && !prefersReducedMotion && !isPrecisionHover) {
        const targetSway = Math.sin((time / 1000) * ((115 / 60) * Math.PI)) * 6.5;
        const swayFactor = 1 - Math.pow(1 - 0.15, step);
        swayAngleRef.current += (targetSway - swayAngleRef.current) * swayFactor;
      } else {
        const returnFactor = 1 - Math.pow(1 - 0.12, step);
        swayAngleRef.current += (0 - swayAngleRef.current) * returnFactor;
        if (Math.abs(swayAngleRef.current) < 0.05) swayAngleRef.current = 0;
      }

      // Shrug tilt on quiz skip (eases to 11° then smoothly returns to 0°)
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

      // Cull expired particles
      if (time - lastCullTime > 80) {
        lastCullTime = time;
        setParticles((prev) => {
          const fresh = prev.filter((p) => time - p.bornAt < 650);
          return fresh.length === prev.length ? prev : fresh;
        });
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
    contextMode,
    activeMode,
    setCursorMode,
    soundEnabled,
    hasInteracted,
    isVisible,
    isWarping,
    isMusicWorld,
    isMusicPlaying,
    isIdleSleep,
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
    particles,
    activeExpression,
    activeCoreFrame,
    isFinePointer,
    prefersReducedMotion,
  };
}
