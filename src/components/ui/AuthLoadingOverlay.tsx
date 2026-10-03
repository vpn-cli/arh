"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AuthLoadingOverlayProps {
  onComplete: () => void;
}

export default function AuthLoadingOverlay({ onComplete }: AuthLoadingOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      }
    });

    // Start fully opaque, then fade out after a short delay
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.8,
      delay: 1.2,
      ease: "power2.inOut"
    });

  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-[#0C0A15] flex flex-col items-center justify-center text-[#FFEBB3] font-pixel"
    >
      <style>{`
        @keyframes auth-dot-wave {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          50%       { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      <div className="relative w-16 h-16 flex items-center justify-center mb-6">
        <div className="text-5xl text-[#FFD0DC] animate-spin select-none" style={{ animationDuration: '3s' }}>✿</div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl text-[#FFE4A1] animate-ping select-none" style={{ animationDuration: '2s' }}>✦</div>
      </div>
      
      <div className="animate-pulse tracking-widest font-bold text-lg mb-4 text-[#FFB6C1]">
        LOGGING IN...
      </div>
      
      <div className="flex gap-2">
        {[0,1,2,3,4].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#FFB6C1]"
            style={{ animation: `auth-dot-wave 1.2s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
