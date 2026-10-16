import React from "react";

export type ParticleType =
  | "heart"
  | "star"
  | "sakura"
  | "bow"
  | "note_single"
  | "note_double"
  | "note_beam";

export interface Particle {
  id: number;
  x: number;
  y: number;
  type: ParticleType;
  color: string;
  rotation: number;
  bornAt: number;
}

interface CursorParticlesProps {
  particles: Particle[];
}

export function CursorParticles({ particles }: CursorParticlesProps) {
  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999998] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed top-0 left-0 pointer-events-none will-change-transform animate-cursor-particle"
          style={{
            transform: `translate3d(${p.x - 6}px, ${p.y - 6}px, 0) rotate(${p.rotation}deg)`,
          }}
        >
          {p.type === "heart" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={p.color}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
          {p.type === "star" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={p.color}>
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          )}
          {p.type === "sakura" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={p.color}>
              <circle cx="12" cy="7" r="4" />
              <circle cx="17" cy="11" r="4" />
              <circle cx="15" cy="17" r="4" />
              <circle cx="9" cy="17" r="4" />
              <circle cx="7" cy="11" r="4" />
              <circle cx="12" cy="12" r="2.5" fill="#FFF9E6" />
            </svg>
          )}
          {p.type === "bow" && (
            <svg width="13" height="10" viewBox="0 0 26 20" fill={p.color}>
              <path d="M7 3C3 1 0 3 0 6C0 10 4 11 8 8L13 11L18 8C22 11 26 10 26 6C26 3 23 1 19 3C16 4 14 7 13 8C12 7 10 4 7 3Z" />
              <circle cx="13" cy="9.5" r="2.8" fill="#FFEAA7" />
            </svg>
          )}
          {/* Musical Notes: Pure SVG vector paths (no OS-dependent text glyphs) */}
          {p.type === "note_single" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill={p.color}>
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          )}
          {p.type === "note_double" && (
            <svg width="13" height="12" viewBox="0 0 24 24" fill={p.color}>
              <path d="M21 3L9 6.5V17c-.8-.5-1.9-.7-3-.4-2 .5-3.2 2.2-2.7 3.9.5 1.7 2.5 2.7 4.5 2.2 1.7-.4 2.8-1.7 2.8-3.2V9.5l8-2.3V14c-.8-.5-1.9-.7-3-.4-2 .5-3.2 2.2-2.7 3.9.5 1.7 2.5 2.7 4.5 2.2 1.7-.4 2.8-1.7 2.8-3.2V3z" />
            </svg>
          )}
          {p.type === "note_beam" && (
            <svg width="13" height="12" viewBox="0 0 24 24" fill={p.color}>
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              <circle cx="17" cy="11" r="3" fill={p.color} />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
