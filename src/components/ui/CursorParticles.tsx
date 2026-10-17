import React, { useEffect, useRef } from "react";

export type ParticleType =
  | "heart"
  | "star"
  | "sakura"
  | "bow"
  | "note_single"
  | "note_double"
  | "note_beam";

export interface ParticleData {
  x: number;
  y: number;
  type: ParticleType;
  color: string;
  rotation: number;
}

const PARTICLE_SVGS: Record<ParticleType, (color: string) => string> = {
  heart: (color) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="${color}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  star: (color) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="${color}"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/></svg>`,
  sakura: (color) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="${color}"><circle cx="12" cy="7" r="4"/><circle cx="17" cy="11" r="4"/><circle cx="15" cy="17" r="4"/><circle cx="9" cy="17" r="4"/><circle cx="7" cy="11" r="4"/><circle cx="12" cy="12" r="2.5" fill="#FFF9E6"/></svg>`,
  bow: (color) =>
    `<svg width="13" height="10" viewBox="0 0 26 20" fill="${color}"><path d="M7 3C3 1 0 3 0 6C0 10 4 11 8 8L13 11L18 8C22 11 26 10 26 6C26 3 23 1 19 3C16 4 14 7 13 8C12 7 10 4 7 3Z"/><circle cx="13" cy="9.5" r="2.8" fill="#FFEAA7"/></svg>`,
  note_single: (color) =>
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="${color}"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  note_double: (color) =>
    `<svg width="13" height="12" viewBox="0 0 24 24" fill="${color}"><path d="M21 3L9 6.5V17c-.8-.5-1.9-.7-3-.4-2 .5-3.2 2.2-2.7 3.9.5 1.7 2.5 2.7 4.5 2.2 1.7-.4 2.8-1.7 2.8-3.2V9.5l8-2.3V14c-.8-.5-1.9-.7-3-.4-2 .5-3.2 2.2-2.7 3.9.5 1.7 2.5 2.7 4.5 2.2 1.7-.4 2.8-1.7 2.8-3.2V3z"/></svg>`,
  note_beam: (color) =>
    `<svg width="13" height="12" viewBox="0 0 24 24" fill="${color}"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/><circle cx="17" cy="11" r="3" fill="${color}"/></svg>`,
};

const SPAWN_EVENT = "kitty-cursor-spawn-particle";

export function spawnCursorParticle(data: ParticleData) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SPAWN_EVENT, { detail: data }));
  }
}

export function CursorParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSpawn = (e: Event) => {
      const customEvt = e as CustomEvent<ParticleData>;
      const p = customEvt.detail;
      if (!p) return;

      const el = document.createElement("div");
      el.className = "fixed pointer-events-none will-change-transform animate-cursor-particle";
      el.style.left = `${p.x - 6}px`;
      el.style.top = `${p.y - 6}px`;
      el.style.transform = `rotate(${p.rotation}deg)`;
      const svgRenderer = PARTICLE_SVGS[p.type] || PARTICLE_SVGS.heart;
      el.innerHTML = svgRenderer(p.color);

      container.appendChild(el);

      const onEnd = () => {
        el.removeEventListener("animationend", onEnd);
        el.remove();
      };
      el.addEventListener("animationend", onEnd);

      setTimeout(() => {
        if (el.parentNode === container) el.remove();
      }, 700);
    };

    window.addEventListener(SPAWN_EVENT, handleSpawn);
    return () => {
      window.removeEventListener(SPAWN_EVENT, handleSpawn);
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[999998] overflow-hidden select-none"
      aria-hidden="true"
    />
  );
}
