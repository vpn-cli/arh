"use client";

import React from "react";

interface BowKnotProps {
  className?: string;
  size?: number;
}

export default function BowKnot({ className = "", size = 26 }: BowKnotProps) {
  return (
    <svg
      role="img"
      aria-label="Decorative ribbon bow"
      viewBox="0 0 32 24"
      width={size}
      height={Math.round((size * 24) / 32)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none drop-shadow-xs select-none ${className}`}
    >
      {/* Left Loop */}
      <path
        d="M16 11 C10 3 2 5 3 10 C4 15 13 13 16 11 Z"
        fill="#FF8FB3"
        stroke="#3A2440"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Right Loop */}
      <path
        d="M16 11 C22 3 30 5 29 10 C28 15 19 13 16 11 Z"
        fill="#FF8FB3"
        stroke="#3A2440"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Left Ribbon Tail */}
      <path
        d="M14 12 C12 16 9 19 8 21"
        stroke="#FF8FB3"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Right Ribbon Tail */}
      <path
        d="M18 12 C20 16 23 19 24 21"
        stroke="#FF8FB3"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Center Ribbon Knot */}
      <circle
        cx="16"
        cy="11"
        r="2.8"
        fill="#FFEAA7"
        stroke="#3A2440"
        strokeWidth="1.2"
      />
    </svg>
  );
}
