"use client";

import React, { useState, useEffect } from "react";
import PixelWindow from "./PixelWindow";

interface GameboyLoadingScreenProps {
  onComplete: () => void;
}

/* ═══════════════════════════════════════════════════════
   CHILL PIXEL FLOWERS (Feebly waving in the gentle breeze)
   ═══════════════════════════════════════════════════════ */

/* Pixel-art flora. Colours sampled from loading_bg.jpg; drawn as integer
   rects with shapeRendering="crispEdges" so they sit on the same pixel
   grid as the background art instead of reading as smooth vector stickers. */

/* Pixel-art flora. Colours sampled from loading_bg.jpg; drawn as integer
   rects with shapeRendering="crispEdges" so they sit on the same pixel
   grid as the background art instead of reading as smooth vector stickers. */

function DaisyFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 7 18" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="1" height="1" fill="#034910" />
      <rect x="2" y="1" width="3" height="1" fill="#fefde8" />
      <rect x="1" y="2" width="5" height="1" fill="#fefde8" />
      <rect x="0" y="3" width="3" height="1" fill="#fefde8" />
      <rect x="3" y="3" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="3" width="2" height="1" fill="#fefde8" />
      <rect x="0" y="4" width="2" height="1" fill="#fefde8" />
      <rect x="2" y="4" width="3" height="1" fill="#ffda36" />
      <rect x="5" y="4" width="2" height="1" fill="#fefde8" />
      <rect x="0" y="5" width="3" height="1" fill="#fefde8" />
      <rect x="3" y="5" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="5" width="2" height="1" fill="#fefde8" />
      <rect x="1" y="6" width="5" height="1" fill="#fefde8" />
      <rect x="2" y="7" width="3" height="1" fill="#fefde8" />
      <rect x="3" y="8" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="10" width="1" height="1" fill="#034910" />
      <rect x="3" y="10" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="11" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="12" width="1" height="1" fill="#034910" />
      <rect x="3" y="13" width="1" height="1" fill="#034910" />
      <rect x="1" y="14" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="14" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="15" width="1" height="1" fill="#367224" />
      <rect x="2" y="15" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="15" width="1" height="1" fill="#367224" />
      <rect x="0" y="16" width="1" height="1" fill="#367224" />
      <rect x="1" y="16" width="5" height="1" fill="#1a6a11" />
      <rect x="6" y="16" width="1" height="1" fill="#367224" />
      <rect x="0" y="17" width="1" height="1" fill="#1a6a11" />
      <rect x="1" y="17" width="5" height="1" fill="#034910" />
      <rect x="6" y="17" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function ButtercupFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 7 16" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="2" height="1" fill="#fade3c" />
      <rect x="2" y="1" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="1" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="1" width="1" height="1" fill="#fade3c" />
      <rect x="1" y="2" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="2" width="4" height="1" fill="#ffda36" />
      <rect x="6" y="2" width="1" height="1" fill="#fade3c" />
      <rect x="1" y="3" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="3" width="1" height="1" fill="#ffda36" />
      <rect x="3" y="3" width="2" height="1" fill="#f8b566" />
      <rect x="5" y="3" width="1" height="1" fill="#ffda36" />
      <rect x="6" y="3" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="4" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="4" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="4" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="5" width="2" height="1" fill="#f8b566" />
      <rect x="3" y="6" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="7" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="8" width="1" height="1" fill="#034910" />
      <rect x="3" y="8" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="10" width="1" height="1" fill="#034910" />
      <rect x="3" y="11" width="1" height="1" fill="#034910" />
      <rect x="1" y="12" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="12" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="13" width="1" height="1" fill="#367224" />
      <rect x="2" y="13" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="13" width="1" height="1" fill="#367224" />
      <rect x="0" y="14" width="1" height="1" fill="#367224" />
      <rect x="1" y="14" width="5" height="1" fill="#1a6a11" />
      <rect x="6" y="14" width="1" height="1" fill="#367224" />
      <rect x="0" y="15" width="1" height="1" fill="#1a6a11" />
      <rect x="1" y="15" width="5" height="1" fill="#034910" />
      <rect x="6" y="15" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function PinkWildflower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 7 15" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="1" height="1" fill="#fd9ee0" />
      <rect x="2" y="1" width="1" height="1" fill="#fd9ee0" />
      <rect x="3" y="1" width="1" height="1" fill="#ff9be1" />
      <rect x="4" y="1" width="1" height="1" fill="#fd9ee0" />
      <rect x="1" y="2" width="1" height="1" fill="#fd9ee0" />
      <rect x="2" y="2" width="2" height="1" fill="#ff9be1" />
      <rect x="4" y="2" width="2" height="1" fill="#fd9ee0" />
      <rect x="2" y="3" width="1" height="1" fill="#fd9ee0" />
      <rect x="3" y="3" width="1" height="1" fill="#ff9be1" />
      <rect x="4" y="3" width="1" height="1" fill="#fd9ee0" />
      <rect x="3" y="4" width="1" height="1" fill="#fd9ee0" />
      <rect x="3" y="5" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="6" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="7" width="1" height="1" fill="#034910" />
      <rect x="3" y="7" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="8" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#034910" />
      <rect x="3" y="10" width="1" height="1" fill="#034910" />
      <rect x="1" y="11" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="11" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="12" width="1" height="1" fill="#367224" />
      <rect x="2" y="12" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="12" width="1" height="1" fill="#367224" />
      <rect x="0" y="13" width="1" height="1" fill="#367224" />
      <rect x="1" y="13" width="5" height="1" fill="#1a6a11" />
      <rect x="6" y="13" width="1" height="1" fill="#367224" />
      <rect x="0" y="14" width="1" height="1" fill="#1a6a11" />
      <rect x="1" y="14" width="5" height="1" fill="#034910" />
      <rect x="6" y="14" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function CloverPlant({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 10 18" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="2" y="0" width="2" height="1" fill="#5ea92f" />
      <rect x="6" y="0" width="2" height="1" fill="#5ea92f" />
      <rect x="1" y="1" width="8" height="1" fill="#5ea92f" />
      <rect x="0" y="2" width="2" height="1" fill="#5ea92f" />
      <rect x="2" y="2" width="1" height="1" fill="#367224" />
      <rect x="3" y="2" width="4" height="1" fill="#5ea92f" />
      <rect x="7" y="2" width="1" height="1" fill="#367224" />
      <rect x="8" y="2" width="2" height="1" fill="#5ea92f" />
      <rect x="0" y="3" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="3" width="3" height="1" fill="#367224" />
      <rect x="4" y="3" width="2" height="1" fill="#5ea92f" />
      <rect x="6" y="3" width="3" height="1" fill="#367224" />
      <rect x="9" y="3" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="4" width="1" height="1" fill="#5ea92f" />
      <rect x="2" y="4" width="2" height="1" fill="#367224" />
      <rect x="6" y="4" width="2" height="1" fill="#367224" />
      <rect x="8" y="4" width="1" height="1" fill="#5ea92f" />
      <rect x="3" y="5" width="4" height="1" fill="#5ea92f" />
      <rect x="3" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="4" y="6" width="2" height="1" fill="#367224" />
      <rect x="6" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="4" y="7" width="2" height="1" fill="#1a6a11" />
      <rect x="4" y="8" width="2" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#034910" />
      <rect x="4" y="9" width="2" height="1" fill="#1a6a11" />
      <rect x="4" y="10" width="2" height="1" fill="#1a6a11" />
      <rect x="4" y="11" width="1" height="1" fill="#034910" />
      <rect x="5" y="11" width="1" height="1" fill="#1a6a11" />
      <rect x="4" y="12" width="1" height="1" fill="#034910" />
      <rect x="4" y="13" width="1" height="1" fill="#034910" />
      <rect x="2" y="14" width="1" height="1" fill="#5ea92f" />
      <rect x="6" y="14" width="1" height="1" fill="#5ea92f" />
      <rect x="2" y="15" width="1" height="1" fill="#367224" />
      <rect x="3" y="15" width="3" height="1" fill="#1a6a11" />
      <rect x="6" y="15" width="1" height="1" fill="#367224" />
      <rect x="1" y="16" width="1" height="1" fill="#367224" />
      <rect x="2" y="16" width="5" height="1" fill="#1a6a11" />
      <rect x="7" y="16" width="1" height="1" fill="#367224" />
      <rect x="1" y="17" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="17" width="5" height="1" fill="#034910" />
      <rect x="7" y="17" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function BluebellFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 7 15" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="1" height="1" fill="#7270d1" />
      <rect x="2" y="1" width="1" height="1" fill="#7270d1" />
      <rect x="3" y="1" width="1" height="1" fill="#6f6dce" />
      <rect x="4" y="1" width="1" height="1" fill="#7270d1" />
      <rect x="2" y="2" width="1" height="1" fill="#7270d1" />
      <rect x="3" y="2" width="2" height="1" fill="#6f6dce" />
      <rect x="5" y="2" width="1" height="1" fill="#7270d1" />
      <rect x="2" y="3" width="2" height="1" fill="#7270d1" />
      <rect x="4" y="3" width="1" height="1" fill="#6f6dce" />
      <rect x="5" y="3" width="1" height="1" fill="#7270d1" />
      <rect x="3" y="4" width="2" height="1" fill="#7270d1" />
      <rect x="3" y="5" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="6" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="7" width="1" height="1" fill="#034910" />
      <rect x="3" y="7" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="8" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#034910" />
      <rect x="3" y="10" width="1" height="1" fill="#034910" />
      <rect x="1" y="11" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="11" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="12" width="1" height="1" fill="#367224" />
      <rect x="2" y="12" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="12" width="1" height="1" fill="#367224" />
      <rect x="0" y="13" width="1" height="1" fill="#367224" />
      <rect x="1" y="13" width="5" height="1" fill="#1a6a11" />
      <rect x="6" y="13" width="1" height="1" fill="#367224" />
      <rect x="0" y="14" width="1" height="1" fill="#1a6a11" />
      <rect x="1" y="14" width="5" height="1" fill="#034910" />
      <rect x="6" y="14" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function GoldenPoppyFlower({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 7 16" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="2" height="1" fill="#fade3c" />
      <rect x="2" y="1" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="1" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="1" width="1" height="1" fill="#fade3c" />
      <rect x="1" y="2" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="2" width="1" height="1" fill="#ffda36" />
      <rect x="3" y="2" width="1" height="1" fill="#f8b566" />
      <rect x="4" y="2" width="1" height="1" fill="#d48e50" />
      <rect x="5" y="2" width="1" height="1" fill="#ffda36" />
      <rect x="6" y="2" width="1" height="1" fill="#fade3c" />
      <rect x="1" y="3" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="3" width="1" height="1" fill="#ffda36" />
      <rect x="3" y="3" width="2" height="1" fill="#f8b566" />
      <rect x="5" y="3" width="1" height="1" fill="#ffda36" />
      <rect x="6" y="3" width="1" height="1" fill="#fade3c" />
      <rect x="2" y="4" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="4" width="2" height="1" fill="#ffda36" />
      <rect x="5" y="4" width="1" height="1" fill="#fade3c" />
      <rect x="3" y="5" width="2" height="1" fill="#fade3c" />
      <rect x="3" y="6" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="7" width="1" height="1" fill="#1a6a11" />
      <rect x="2" y="8" width="1" height="1" fill="#034910" />
      <rect x="3" y="8" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="9" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="10" width="1" height="1" fill="#034910" />
      <rect x="3" y="11" width="1" height="1" fill="#034910" />
      <rect x="1" y="12" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="12" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="13" width="1" height="1" fill="#367224" />
      <rect x="2" y="13" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="13" width="1" height="1" fill="#367224" />
      <rect x="0" y="14" width="1" height="1" fill="#367224" />
      <rect x="1" y="14" width="5" height="1" fill="#1a6a11" />
      <rect x="6" y="14" width="1" height="1" fill="#367224" />
      <rect x="0" y="15" width="1" height="1" fill="#1a6a11" />
      <rect x="1" y="15" width="5" height="1" fill="#034910" />
      <rect x="6" y="15" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function LushForegroundClover({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 15 20" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <rect x="3" y="0" width="2" height="1" fill="#5ea92f" />
      <rect x="9" y="0" width="2" height="1" fill="#5ea92f" />
      <rect x="2" y="1" width="4" height="1" fill="#5ea92f" />
      <rect x="8" y="1" width="4" height="1" fill="#5ea92f" />
      <rect x="1" y="2" width="6" height="1" fill="#5ea92f" />
      <rect x="8" y="2" width="6" height="1" fill="#5ea92f" />
      <rect x="0" y="3" width="2" height="1" fill="#5ea92f" />
      <rect x="2" y="3" width="1" height="1" fill="#367224" />
      <rect x="3" y="3" width="4" height="1" fill="#5ea92f" />
      <rect x="8" y="3" width="4" height="1" fill="#5ea92f" />
      <rect x="12" y="3" width="1" height="1" fill="#367224" />
      <rect x="13" y="3" width="2" height="1" fill="#5ea92f" />
      <rect x="0" y="4" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="4" width="3" height="1" fill="#367224" />
      <rect x="4" y="4" width="6" height="1" fill="#5ea92f" />
      <rect x="10" y="4" width="3" height="1" fill="#367224" />
      <rect x="13" y="4" width="1" height="1" fill="#5ea92f" />
      <rect x="1" y="5" width="1" height="1" fill="#5ea92f" />
      <rect x="2" y="5" width="2" height="1" fill="#367224" />
      <rect x="5" y="5" width="4" height="1" fill="#5ea92f" />
      <rect x="10" y="5" width="2" height="1" fill="#367224" />
      <rect x="12" y="5" width="1" height="1" fill="#5ea92f" />
      <rect x="3" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="5" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="6" y="6" width="2" height="1" fill="#367224" />
      <rect x="8" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="10" y="6" width="1" height="1" fill="#5ea92f" />
      <rect x="4" y="7" width="2" height="1" fill="#5ea92f" />
      <rect x="6" y="7" width="2" height="1" fill="#367224" />
      <rect x="8" y="7" width="2" height="1" fill="#5ea92f" />
      <rect x="5" y="8" width="3" height="1" fill="#1a6a11" />
      <rect x="4" y="9" width="1" height="1" fill="#034910" />
      <rect x="5" y="9" width="3" height="1" fill="#1a6a11" />
      <rect x="5" y="10" width="3" height="1" fill="#1a6a11" />
      <rect x="4" y="11" width="1" height="1" fill="#034910" />
      <rect x="5" y="11" width="2" height="1" fill="#1a6a11" />
      <rect x="5" y="12" width="2" height="1" fill="#1a6a11" />
      <rect x="5" y="13" width="1" height="1" fill="#034910" />
      <rect x="6" y="13" width="1" height="1" fill="#1a6a11" />
      <rect x="5" y="14" width="1" height="1" fill="#034910" />
      <rect x="5" y="15" width="1" height="1" fill="#034910" />
      <rect x="3" y="16" width="1" height="1" fill="#5ea92f" />
      <rect x="7" y="16" width="1" height="1" fill="#5ea92f" />
      <rect x="3" y="17" width="1" height="1" fill="#367224" />
      <rect x="4" y="17" width="3" height="1" fill="#1a6a11" />
      <rect x="7" y="17" width="1" height="1" fill="#367224" />
      <rect x="2" y="18" width="1" height="1" fill="#367224" />
      <rect x="3" y="18" width="5" height="1" fill="#1a6a11" />
      <rect x="8" y="18" width="1" height="1" fill="#367224" />
      <rect x="2" y="19" width="1" height="1" fill="#1a6a11" />
      <rect x="3" y="19" width="5" height="1" fill="#034910" />
      <rect x="8" y="19" width="1" height="1" fill="#1a6a11" />
    </svg>
  );
}

function GrassTuft({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 42" shapeRendering="crispEdges" fill="none" className={`pointer-events-none select-none ${className}`} style={style}>
      <g className="grass-blade" style={{ animationDelay: "0s", animationDuration: "4.2s" }}>
        <rect x="6" y="4" width="2" height="1" fill="#5ea92f" />
        <rect x="6" y="5" width="3" height="1" fill="#5ea92f" />
        <rect x="7" y="6" width="2" height="1" fill="#5ea92f" />
        <rect x="7" y="7" width="2" height="1" fill="#5ea92f" />
        <rect x="7" y="8" width="3" height="1" fill="#5ea92f" />
        <rect x="8" y="9" width="2" height="1" fill="#5ea92f" />
        <rect x="8" y="10" width="2" height="1" fill="#5ea92f" />
        <rect x="8" y="11" width="3" height="1" fill="#5ea92f" />
        <rect x="9" y="12" width="2" height="1" fill="#5ea92f" />
        <rect x="9" y="13" width="2" height="1" fill="#367224" />
        <rect x="9" y="14" width="3" height="1" fill="#367224" />
        <rect x="10" y="15" width="2" height="1" fill="#367224" />
        <rect x="10" y="16" width="2" height="1" fill="#367224" />
        <rect x="10" y="17" width="3" height="1" fill="#367224" />
        <rect x="11" y="18" width="2" height="1" fill="#367224" />
        <rect x="11" y="19" width="2" height="1" fill="#367224" />
        <rect x="11" y="20" width="3" height="1" fill="#367224" />
        <rect x="12" y="21" width="2" height="1" fill="#367224" />
        <rect x="12" y="22" width="2" height="1" fill="#1a6a11" />
        <rect x="12" y="23" width="2" height="1" fill="#1a6a11" />
        <rect x="12" y="24" width="3" height="1" fill="#1a6a11" />
        <rect x="13" y="25" width="3" height="1" fill="#1a6a11" />
        <rect x="13" y="26" width="3" height="1" fill="#1a6a11" />
        <rect x="13" y="27" width="3" height="1" fill="#1a6a11" />
        <rect x="13" y="28" width="4" height="1" fill="#1a6a11" />
        <rect x="14" y="29" width="3" height="1" fill="#1a6a11" />
        <rect x="14" y="30" width="3" height="1" fill="#1a6a11" />
        <rect x="14" y="31" width="3" height="1" fill="#1a6a11" />
        <rect x="14" y="32" width="3" height="1" fill="#034910" />
        <rect x="14" y="33" width="4" height="1" fill="#034910" />
        <rect x="15" y="34" width="3" height="1" fill="#034910" />
        <rect x="15" y="35" width="3" height="1" fill="#034910" />
        <rect x="15" y="36" width="3" height="1" fill="#034910" />
        <rect x="15" y="37" width="3" height="1" fill="#034910" />
        <rect x="15" y="38" width="3" height="1" fill="#034910" />
        <rect x="16" y="39" width="3" height="1" fill="#034910" />
        <rect x="16" y="40" width="3" height="1" fill="#034910" />
        <rect x="16" y="41" width="3" height="1" fill="#034910" />
        <rect x="16" y="42" width="3" height="1" fill="#034910" />
      </g>
      <g className="grass-blade grass-blade--gust" style={{ animationDelay: "0.5s", animationDuration: "4.9s" }}>
        <rect x="27" y="7" width="2" height="1" fill="#5ea92f" />
        <rect x="26" y="8" width="3" height="1" fill="#5ea92f" />
        <rect x="26" y="9" width="2" height="1" fill="#5ea92f" />
        <rect x="25" y="10" width="3" height="1" fill="#5ea92f" />
        <rect x="25" y="11" width="2" height="1" fill="#5ea92f" />
        <rect x="25" y="12" width="2" height="1" fill="#5ea92f" />
        <rect x="24" y="13" width="2" height="1" fill="#5ea92f" />
        <rect x="24" y="14" width="2" height="1" fill="#5ea92f" />
        <rect x="23" y="15" width="1" height="1" fill="#367224" />
        <rect x="24" y="15" width="2" height="1" fill="#5ea92f" />
        <rect x="23" y="16" width="2" height="1" fill="#367224" />
        <rect x="23" y="17" width="2" height="1" fill="#367224" />
        <rect x="22" y="18" width="2" height="1" fill="#367224" />
        <rect x="22" y="19" width="2" height="1" fill="#367224" />
        <rect x="22" y="20" width="2" height="1" fill="#367224" />
        <rect x="21" y="21" width="2" height="1" fill="#367224" />
        <rect x="21" y="22" width="2" height="1" fill="#367224" />
        <rect x="20" y="23" width="1" height="1" fill="#1a6a11" />
        <rect x="21" y="23" width="2" height="1" fill="#367224" />
        <rect x="20" y="24" width="2" height="1" fill="#1a6a11" />
        <rect x="20" y="25" width="2" height="1" fill="#1a6a11" />
        <rect x="20" y="26" width="3" height="1" fill="#1a6a11" />
        <rect x="19" y="27" width="3" height="1" fill="#1a6a11" />
        <rect x="19" y="28" width="3" height="1" fill="#1a6a11" />
        <rect x="19" y="29" width="3" height="1" fill="#1a6a11" />
        <rect x="18" y="30" width="4" height="1" fill="#1a6a11" />
        <rect x="18" y="31" width="3" height="1" fill="#1a6a11" />
        <rect x="18" y="32" width="3" height="1" fill="#1a6a11" />
        <rect x="18" y="33" width="3" height="1" fill="#034910" />
        <rect x="17" y="34" width="4" height="1" fill="#034910" />
        <rect x="17" y="35" width="3" height="1" fill="#034910" />
        <rect x="17" y="36" width="3" height="1" fill="#034910" />
        <rect x="17" y="37" width="3" height="1" fill="#034910" />
        <rect x="17" y="38" width="3" height="1" fill="#034910" />
        <rect x="16" y="39" width="4" height="1" fill="#034910" />
        <rect x="16" y="40" width="3" height="1" fill="#034910" />
        <rect x="16" y="41" width="3" height="1" fill="#034910" />
        <rect x="16" y="42" width="3" height="1" fill="#034910" />
      </g>
      <g className="grass-blade" style={{ animationDelay: "1.1s", animationDuration: "3.7s" }}>
        <rect x="2" y="14" width="1" height="1" fill="#5ea92f" />
        <rect x="2" y="15" width="2" height="1" fill="#5ea92f" />
        <rect x="3" y="16" width="2" height="1" fill="#5ea92f" />
        <rect x="4" y="17" width="1" height="1" fill="#5ea92f" />
        <rect x="5" y="18" width="1" height="1" fill="#5ea92f" />
        <rect x="5" y="19" width="2" height="1" fill="#5ea92f" />
        <rect x="6" y="20" width="1" height="1" fill="#5ea92f" />
        <rect x="7" y="21" width="1" height="1" fill="#367224" />
        <rect x="7" y="22" width="2" height="1" fill="#367224" />
        <rect x="8" y="23" width="1" height="1" fill="#367224" />
        <rect x="8" y="24" width="2" height="1" fill="#367224" />
        <rect x="9" y="25" width="1" height="1" fill="#367224" />
        <rect x="10" y="26" width="1" height="1" fill="#367224" />
        <rect x="10" y="27" width="1" height="1" fill="#1a6a11" />
        <rect x="11" y="28" width="1" height="1" fill="#1a6a11" />
        <rect x="11" y="29" width="1" height="1" fill="#1a6a11" />
        <rect x="12" y="30" width="2" height="1" fill="#1a6a11" />
        <rect x="12" y="31" width="2" height="1" fill="#1a6a11" />
        <rect x="12" y="32" width="3" height="1" fill="#1a6a11" />
        <rect x="13" y="33" width="2" height="1" fill="#1a6a11" />
        <rect x="13" y="34" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="34" width="1" height="1" fill="#034910" />
        <rect x="14" y="35" width="2" height="1" fill="#034910" />
        <rect x="14" y="36" width="2" height="1" fill="#034910" />
        <rect x="14" y="37" width="3" height="1" fill="#034910" />
        <rect x="15" y="38" width="2" height="1" fill="#034910" />
        <rect x="15" y="39" width="2" height="1" fill="#034910" />
        <rect x="15" y="40" width="3" height="1" fill="#034910" />
        <rect x="16" y="41" width="2" height="1" fill="#034910" />
        <rect x="16" y="42" width="2" height="1" fill="#034910" />
      </g>
      <g className="grass-blade" style={{ animationDelay: "0.3s", animationDuration: "5.4s" }}>
        <rect x="30" y="16" width="1" height="1" fill="#5ea92f" />
        <rect x="29" y="17" width="1" height="1" fill="#5ea92f" />
        <rect x="28" y="18" width="2" height="1" fill="#5ea92f" />
        <rect x="27" y="19" width="2" height="1" fill="#5ea92f" />
        <rect x="27" y="20" width="1" height="1" fill="#5ea92f" />
        <rect x="26" y="21" width="1" height="1" fill="#5ea92f" />
        <rect x="25" y="22" width="1" height="1" fill="#367224" />
        <rect x="26" y="22" width="1" height="1" fill="#5ea92f" />
        <rect x="25" y="23" width="1" height="1" fill="#367224" />
        <rect x="24" y="24" width="1" height="1" fill="#367224" />
        <rect x="23" y="25" width="2" height="1" fill="#367224" />
        <rect x="23" y="26" width="1" height="1" fill="#367224" />
        <rect x="22" y="27" width="2" height="1" fill="#367224" />
        <rect x="22" y="28" width="1" height="1" fill="#367224" />
        <rect x="21" y="29" width="1" height="1" fill="#1a6a11" />
        <rect x="21" y="30" width="2" height="1" fill="#1a6a11" />
        <rect x="20" y="31" width="2" height="1" fill="#1a6a11" />
        <rect x="20" y="32" width="2" height="1" fill="#1a6a11" />
        <rect x="19" y="33" width="2" height="1" fill="#1a6a11" />
        <rect x="19" y="34" width="2" height="1" fill="#1a6a11" />
        <rect x="18" y="35" width="1" height="1" fill="#034910" />
        <rect x="19" y="35" width="2" height="1" fill="#1a6a11" />
        <rect x="18" y="36" width="2" height="1" fill="#034910" />
        <rect x="17" y="37" width="3" height="1" fill="#034910" />
        <rect x="17" y="38" width="2" height="1" fill="#034910" />
        <rect x="17" y="39" width="2" height="1" fill="#034910" />
        <rect x="16" y="40" width="3" height="1" fill="#034910" />
        <rect x="16" y="41" width="2" height="1" fill="#034910" />
        <rect x="16" y="42" width="2" height="1" fill="#034910" />
      </g>
      <g className="grass-blade grass-blade--gust" style={{ animationDelay: "1.6s", animationDuration: "4.0s" }}>
        <rect x="16" y="2" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="3" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="4" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="5" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="6" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="7" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="8" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="9" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="10" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="11" width="2" height="1" fill="#5ea92f" />
        <rect x="16" y="12" width="2" height="1" fill="#367224" />
        <rect x="16" y="13" width="2" height="1" fill="#367224" />
        <rect x="16" y="14" width="2" height="1" fill="#367224" />
        <rect x="16" y="15" width="2" height="1" fill="#367224" />
        <rect x="16" y="16" width="2" height="1" fill="#367224" />
        <rect x="16" y="17" width="2" height="1" fill="#367224" />
        <rect x="16" y="18" width="2" height="1" fill="#367224" />
        <rect x="16" y="19" width="2" height="1" fill="#367224" />
        <rect x="16" y="20" width="2" height="1" fill="#367224" />
        <rect x="16" y="21" width="2" height="1" fill="#1a6a11" />
        <rect x="16" y="22" width="2" height="1" fill="#1a6a11" />
        <rect x="16" y="23" width="2" height="1" fill="#1a6a11" />
        <rect x="16" y="24" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="25" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="26" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="27" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="28" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="29" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="30" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="31" width="3" height="1" fill="#1a6a11" />
        <rect x="16" y="32" width="3" height="1" fill="#034910" />
        <rect x="16" y="33" width="3" height="1" fill="#034910" />
        <rect x="16" y="34" width="3" height="1" fill="#034910" />
        <rect x="16" y="35" width="3" height="1" fill="#034910" />
        <rect x="16" y="36" width="3" height="1" fill="#034910" />
        <rect x="16" y="37" width="3" height="1" fill="#034910" />
        <rect x="16" y="38" width="3" height="1" fill="#034910" />
        <rect x="16" y="39" width="3" height="1" fill="#034910" />
        <rect x="16" y="40" width="3" height="1" fill="#034910" />
        <rect x="16" y="41" width="3" height="1" fill="#034910" />
        <rect x="16" y="42" width="3" height="1" fill="#034910" />
      </g>
      <g className="grass-blade" style={{ animationDelay: "0.8s", animationDuration: "6.1s" }}>
        <rect x="9" y="9" width="1" height="1" fill="#5ea92f" />
        <rect x="9" y="10" width="1" height="1" fill="#5ea92f" />
        <rect x="10" y="11" width="1" height="1" fill="#5ea92f" />
        <rect x="10" y="12" width="1" height="1" fill="#5ea92f" />
        <rect x="10" y="13" width="1" height="1" fill="#5ea92f" />
        <rect x="10" y="14" width="2" height="1" fill="#5ea92f" />
        <rect x="11" y="15" width="1" height="1" fill="#5ea92f" />
        <rect x="11" y="16" width="1" height="1" fill="#5ea92f" />
        <rect x="11" y="17" width="1" height="1" fill="#367224" />
        <rect x="12" y="18" width="1" height="1" fill="#367224" />
        <rect x="12" y="19" width="1" height="1" fill="#367224" />
        <rect x="12" y="20" width="1" height="1" fill="#367224" />
        <rect x="12" y="21" width="1" height="1" fill="#367224" />
        <rect x="13" y="22" width="1" height="1" fill="#367224" />
        <rect x="13" y="23" width="1" height="1" fill="#367224" />
        <rect x="13" y="24" width="1" height="1" fill="#367224" />
        <rect x="13" y="25" width="1" height="1" fill="#1a6a11" />
        <rect x="13" y="26" width="2" height="1" fill="#1a6a11" />
        <rect x="14" y="27" width="2" height="1" fill="#1a6a11" />
        <rect x="14" y="28" width="2" height="1" fill="#1a6a11" />
        <rect x="14" y="29" width="2" height="1" fill="#1a6a11" />
        <rect x="14" y="30" width="2" height="1" fill="#1a6a11" />
        <rect x="14" y="31" width="3" height="1" fill="#1a6a11" />
        <rect x="15" y="32" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="33" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="34" width="2" height="1" fill="#034910" />
        <rect x="15" y="35" width="2" height="1" fill="#034910" />
        <rect x="15" y="36" width="2" height="1" fill="#034910" />
        <rect x="15" y="37" width="2" height="1" fill="#034910" />
        <rect x="15" y="38" width="3" height="1" fill="#034910" />
        <rect x="16" y="39" width="2" height="1" fill="#034910" />
        <rect x="16" y="40" width="2" height="1" fill="#034910" />
        <rect x="16" y="41" width="2" height="1" fill="#034910" />
        <rect x="16" y="42" width="2" height="1" fill="#034910" />
      </g>
      <g className="grass-blade" style={{ animationDelay: "2.1s", animationDuration: "3.4s" }}>
        <rect x="24" y="20" width="1" height="1" fill="#5ea92f" />
        <rect x="23" y="21" width="2" height="1" fill="#5ea92f" />
        <rect x="23" y="22" width="1" height="1" fill="#5ea92f" />
        <rect x="22" y="23" width="2" height="1" fill="#5ea92f" />
        <rect x="22" y="24" width="1" height="1" fill="#5ea92f" />
        <rect x="21" y="25" width="1" height="1" fill="#367224" />
        <rect x="22" y="25" width="1" height="1" fill="#5ea92f" />
        <rect x="21" y="26" width="1" height="1" fill="#367224" />
        <rect x="20" y="27" width="2" height="1" fill="#367224" />
        <rect x="20" y="28" width="1" height="1" fill="#367224" />
        <rect x="20" y="29" width="1" height="1" fill="#367224" />
        <rect x="19" y="30" width="1" height="1" fill="#367224" />
        <rect x="19" y="31" width="1" height="1" fill="#1a6a11" />
        <rect x="19" y="32" width="2" height="1" fill="#1a6a11" />
        <rect x="18" y="33" width="2" height="1" fill="#1a6a11" />
        <rect x="18" y="34" width="2" height="1" fill="#1a6a11" />
        <rect x="18" y="35" width="2" height="1" fill="#1a6a11" />
        <rect x="17" y="36" width="2" height="1" fill="#1a6a11" />
        <rect x="17" y="37" width="2" height="1" fill="#034910" />
        <rect x="17" y="38" width="2" height="1" fill="#034910" />
        <rect x="17" y="39" width="2" height="1" fill="#034910" />
        <rect x="16" y="40" width="2" height="1" fill="#034910" />
        <rect x="16" y="41" width="2" height="1" fill="#034910" />
        <rect x="16" y="42" width="2" height="1" fill="#034910" />
      </g>
      <g className="grass-blade" style={{ animationDelay: "1.3s", animationDuration: "5.7s" }}>
        <rect x="11" y="22" width="1" height="1" fill="#5ea92f" />
        <rect x="11" y="23" width="1" height="1" fill="#5ea92f" />
        <rect x="12" y="24" width="1" height="1" fill="#5ea92f" />
        <rect x="12" y="25" width="1" height="1" fill="#5ea92f" />
        <rect x="12" y="26" width="2" height="1" fill="#5ea92f" />
        <rect x="13" y="27" width="1" height="1" fill="#367224" />
        <rect x="13" y="28" width="1" height="1" fill="#367224" />
        <rect x="13" y="29" width="1" height="1" fill="#367224" />
        <rect x="14" y="30" width="1" height="1" fill="#367224" />
        <rect x="14" y="31" width="1" height="1" fill="#367224" />
        <rect x="14" y="32" width="1" height="1" fill="#1a6a11" />
        <rect x="14" y="33" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="34" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="35" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="36" width="2" height="1" fill="#1a6a11" />
        <rect x="15" y="37" width="2" height="1" fill="#034910" />
        <rect x="15" y="38" width="2" height="1" fill="#034910" />
        <rect x="16" y="39" width="2" height="1" fill="#034910" />
        <rect x="16" y="40" width="2" height="1" fill="#034910" />
        <rect x="16" y="41" width="2" height="1" fill="#034910" />
        <rect x="16" y="42" width="2" height="1" fill="#034910" />
      </g>
    </svg>
  );
}

export default function GameboyLoadingScreen({ onComplete }: GameboyLoadingScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = New Game, 1 = Continue
  const [showPopup, setShowPopup] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Parallax cursor tracking with smooth lerp damping.
  // The lerp writes --mx/--my straight to the DOM instead of setState:
  // this subtree is ~1700 SVG rects, and re-rendering it every frame was
  // the whole source of the lag. Layers read the vars via calc().
  const rootRef = React.useRef<HTMLDivElement>(null);
  const targetOffsetRef = React.useRef({ x: 0, y: 0 });
  const currentOffsetRef = React.useRef({ x: 0, y: 0 });
  const animFrameRef = React.useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const ny = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      targetOffsetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateParallax = () => {
      const current = currentOffsetRef.current;
      const target = targetOffsetRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      // Park the loop once settled; it restarts on the next mousemove.
      if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
        animFrameRef.current = null;
        return;
      }
      current.x += dx * 0.08;
      current.y += dy * 0.08;
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--mx", current.x.toFixed(4));
        el.style.setProperty("--my", current.y.toFixed(4));
      }
      animFrameRef.current = requestAnimationFrame(updateParallax);
    };

    const onMove = (e: MouseEvent) => {
      if (reduced) return;
      handleMouseMove(e);
      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const menuItems = ["START NEW GAME", "CONTINUE"];

  const handleSelect = (index: number) => {
    if (index === 0) {
      // Start New Game
      setIsTransitioning(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else {
      // Continue
      setShowPopup(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (showPopup || isTransitioning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setSelectedIndex(0);
      } else if (e.key === "ArrowDown") {
        setSelectedIndex(1);
      } else if (e.key === "Enter") {
        handleSelect(selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, showPopup, isTransitioning]);

  return (
    <div 
      ref={rootRef}
      className={`fixed inset-0 z-50 flex items-start justify-start p-8 sm:p-12 transition-opacity duration-1000 ${
        isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ ["--mx" as string]: "0", ["--my" as string]: "0" } as React.CSSProperties}
    >
      {/* Background Scene Container with Locked 16:9 Aspect Ratio */}
      <div className="absolute inset-0 -z-10 overflow-hidden flex items-center justify-center bg-[#8db356]">
        <div 
          className="relative flex-shrink-0 select-none"
          style={{
            width: 'max(100vw, calc(100vh * 16 / 9))',
            height: 'max(100vh, calc(100vw * 9 / 16))',
          }}
        >
          {/* Base 16:9 Image (z-0) */}
          <img 
            src="/images/loading_bg.jpg" 
            alt="Retro Meadow" 
            className="w-full h-full object-fill pixelated pointer-events-none will-change-transform"
            style={{
              transform: "scale(1.06) translate3d(calc(var(--mx, 0) * -9px), calc(var(--my, 0) * -4px), 0)",
            }}
          />

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 1 (z-[5]): Distant Hillside Wildflowers
              Very gentle parallax: x * -8px, y * -4px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[5] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -11px), calc(var(--my, 0) * -5px), 0)",
            }}
          >
            <ButtercupFlower className="absolute bottom-[28%] left-[23%] w-4 h-6 opacity-75 animate-flower-sway-slow" style={{ animationDelay: '0.8s' }} />
            <DaisyFlower className="absolute bottom-[26%] left-[32%] w-4 h-6 opacity-80 animate-flower-sway" style={{ animationDelay: '1.9s' }} />
            <PinkWildflower className="absolute bottom-[30%] left-[57%] w-4 h-6 opacity-75 animate-flower-sway-fast" style={{ animationDelay: '0.3s' }} />
            <BluebellFlower className="absolute bottom-[27%] left-[64%] w-4 h-6 opacity-80 animate-flower-sway" style={{ animationDelay: '1.4s' }} />
            <ButtercupFlower className="absolute bottom-[25%] left-[81%] w-4 h-6 opacity-75 animate-flower-sway-slow" style={{ animationDelay: '2.2s' }} />
            <PinkWildflower className="absolute bottom-[29%] left-[87%] w-4 h-6 opacity-70 animate-flower-sway" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              IN-PLACE ANIMATIONS FOR PIXEL MEMES (z-10)
              Subtle midground parallax: x * -12px, y * -6px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none z-10 will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -13px), calc(var(--my, 0) * -6px), 0)",
            }}
          >
            {/* 1. Grass Nyan Cat (Bottom Right): Animated pixel stars & rainbow sparkles */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '80.0%', top: '66.0%' }}
            >
              <span className="text-yellow-200 text-xs sm:text-sm animate-sparkle" style={{ animationDelay: '0s' }}>
                ✨
              </span>
              <span className="text-pink-300 text-[10px] animate-bounce-soft -mt-1" style={{ animationDelay: '0.4s' }}>
                ✦
              </span>
            </div>

            {/* 2. Pop Cat in the grass: Animated POP! speech bubble & mouth bounce */}
            <div 
              className="absolute flex flex-col items-center pointer-events-auto cursor-pointer group"
              style={{ left: '69.0%', top: '78.0%' }}
              title="Pop Cat!"
            >
              <span className="font-retro text-[8px] sm:text-[9px] text-white bg-black/80 px-2 py-0.5 border border-yellow-300/80 rounded shadow-md group-hover:scale-110 animate-bounce">
                POP!
              </span>
              <span className="text-yellow-300 text-xs animate-pulse -mt-1">
                ▼
              </span>
            </div>

            {/* 3. Smudge Cat at the Table: Steam rising from salad plate */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '74.5%', top: '46.0%', width: '8.5%' }}
            >
              <span className="text-yellow-300 font-retro text-[10px] sm:text-xs animate-bounce-soft">
                ?_?
              </span>
              <div className="flex gap-1 -mt-0.5 opacity-75">
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '0s' }}>~</span>
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '0.6s' }}>~</span>
                <span className="text-white text-xs animate-steam-rise" style={{ animationDelay: '1.2s' }}>~</span>
              </div>
            </div>

            {/* 4. Hello Kitty in the Meadow: Floating sparkles & pulsing heart */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center animate-chill-breathe"
              style={{ left: '63.5%', top: '44.5%', width: '6.0%' }}
            >
              <span className="text-pink-300 text-sm sm:text-base animate-bounce-soft">
                💖
              </span>
              <span className="text-yellow-200 text-xs animate-sparkle -mt-1" style={{ animationDelay: '0.5s' }}>
                ✨
              </span>
            </div>

            {/* 5. Screaming Cat in the Mid-Ground: Soundwave scream */}
            <div 
              className="absolute pointer-events-none flex flex-col items-center"
              style={{ left: '54.0%', top: '43.0%' }}
            >
              <span className="font-retro text-[8px] sm:text-[9px] text-white bg-black/70 px-1 py-0.5 border border-white/40 rounded shadow animate-pulse">
                AAA!
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 2 (z-[15]): Midground Meadow Flowers
              Moderate parallax: x * -22px, y * -11px
              Around Game Boy, Cartridge, Pokeballs, and Hello Kitty
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[15] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -16px), calc(var(--my, 0) * -6px), 0)",
            }}
          >
            <ButtercupFlower className="absolute bottom-[17%] left-[27%] w-6 h-9 animate-flower-sway-slow" style={{ animationDelay: '1.5s' }} />
            <DaisyFlower className="absolute bottom-[15%] left-[35%] w-7 h-10 animate-flower-sway" style={{ animationDelay: '0.4s' }} />
            <BluebellFlower className="absolute bottom-[14%] left-[43%] w-6 h-9 animate-flower-sway-slow" style={{ animationDelay: '1.8s' }} />
            <GoldenPoppyFlower className="absolute bottom-[17%] left-[51%] w-6 h-9 animate-flower-sway-fast" style={{ animationDelay: '2.4s' }} />
            <DaisyFlower className="absolute bottom-[13%] left-[61%] w-7 h-10 animate-flower-sway-slow" style={{ animationDelay: '0.9s' }} />
            <PinkWildflower className="absolute bottom-[16%] left-[71%] w-6 h-9 animate-flower-sway" style={{ animationDelay: '1.2s' }} />
            <ButtercupFlower className="absolute bottom-[15%] left-[83%] w-6 h-9 animate-flower-sway-fast" style={{ animationDelay: '0.6s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 3 (z-[22]): Foreground Blooming Flowers & Clovers
              Strong parallax: x * -44px, y * -20px
              Lower screen framing with swaying wildflowers
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[22] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -20px), calc(var(--my, 0) * -7px), 0)",
            }}
          >
            {/* Left lower meadow clovers & blossoms */}
            <CloverPlant className="absolute bottom-[3%] left-[4%] w-9 h-12 animate-flower-sway-slow" style={{ animationDelay: '0.2s' }} />
            <DaisyFlower className="absolute bottom-[2%] left-[9%] w-8 h-12 animate-flower-sway" style={{ animationDelay: '1.2s' }} />
            <ButtercupFlower className="absolute bottom-[5%] left-[15%] w-7 h-10 animate-flower-sway-fast" style={{ animationDelay: '0.6s' }} />
            <CloverPlant className="absolute bottom-[1%] left-[21%] w-10 h-13 animate-flower-sway" style={{ animationDelay: '2.1s' }} />

            {/* Center lower framing */}
            <GoldenPoppyFlower className="absolute bottom-[4%] left-[40%] w-8 h-11 animate-flower-sway-slow" style={{ animationDelay: '1.1s' }} />
            <PinkWildflower className="absolute bottom-[2%] left-[47%] w-8 h-11 animate-flower-sway-fast" style={{ animationDelay: '2.5s' }} />
            <BluebellFlower className="absolute bottom-[3%] left-[55%] w-7 h-10 animate-flower-sway" style={{ animationDelay: '0.7s' }} />

            {/* Right lower meadow */}
            <DaisyFlower className="absolute bottom-[2%] right-[12%] w-9 h-13 animate-flower-sway" style={{ animationDelay: '1.4s' }} />
            <PinkWildflower className="absolute bottom-[4%] right-[6%] w-7 h-11 animate-flower-sway-slow" style={{ animationDelay: '2.0s' }} />
            <CloverPlant className="absolute bottom-[1%] right-[2%] w-10 h-13 animate-flower-sway-fast" style={{ animationDelay: '0.7s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 4 (z-[28]): Atmospheric Petals, Dandelions & Pollen
              Drifting air parallax: x * -30px, y * -14px
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden z-[28] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -30px), calc(var(--my, 0) * -14px), 0)",
            }}
          >
            {/* Wind Gust Breeze Lines */}
            <div className="absolute top-[28%] left-0 w-64 sm:w-96 h-1 bg-gradient-to-r from-transparent via-white/50 via-yellow-100/40 to-transparent rounded-full animate-wind-gust" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[48%] left-0 w-72 sm:w-[28rem] h-1.5 bg-gradient-to-r from-transparent via-white/60 via-emerald-100/40 to-transparent rounded-full animate-wind-gust-fast" style={{ animationDelay: '2.8s' }} />
            <div className="absolute top-[68%] left-0 w-80 sm:w-[32rem] h-1 bg-gradient-to-r from-transparent via-yellow-100/50 via-white/40 to-transparent rounded-full animate-wind-gust" style={{ animationDelay: '5.2s' }} />

            {/* Dandelion Fluffs drifting across on the wind */}
            <span className="absolute top-[20%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float" style={{ animationDelay: '0s' }} />
            <span className="absolute top-[35%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] animate-dandelion-float" style={{ animationDelay: '3.8s' }} />
            <span className="absolute top-[50%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float" style={{ animationDelay: '7.5s' }} />
            <span className="absolute top-[65%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] animate-dandelion-float" style={{ animationDelay: '11.2s' }} />
            <span className="absolute top-[80%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float" style={{ animationDelay: '14.5s' }} />

            {/* Golden Sunlit Pollen Motes */}
            <span className="absolute top-[24%] left-0 w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fde047,0_0_16px_#ca8a04] animate-pollen-swirl" style={{ animationDelay: '0.8s' }} />
            <span className="absolute top-[38%] left-0 w-2 h-2 bg-amber-200 rounded-full shadow-[0_0_8px_#fde047] animate-pollen-swirl" style={{ animationDelay: '2.5s' }} />
            <span className="absolute top-[46%] left-0 w-2.5 h-2.5 bg-yellow-200 rounded-full shadow-[0_0_10px_#fef08a] animate-pollen-swirl" style={{ animationDelay: '5.4s' }} />
            <span className="absolute top-[62%] left-0 w-3 h-3 bg-yellow-300 rounded-full shadow-[0_0_12px_#fde047,0_0_20px_#eab308] animate-pollen-swirl" style={{ animationDelay: '7.8s' }} />
            <span className="absolute top-[76%] left-0 w-2 h-2 bg-amber-300 rounded-full shadow-[0_0_8px_#fde047] animate-pollen-swirl" style={{ animationDelay: '4.1s' }} />

            {/* Wildflower & cherry petals fluttering across */}
            <span className="absolute top-[26%] left-0 w-3.5 h-2.5 bg-pink-200/90 rounded-[40%_60%_70%_30%] shadow-[0_0_6px_rgba(255,182,193,0.6)] animate-petal-drift" style={{ animationDelay: '1.2s' }} />
            <span className="absolute top-[42%] left-0 w-4 h-2.5 bg-yellow-200/95 rounded-[50%_50%_30%_70%] shadow-[0_0_6px_rgba(254,240,138,0.7)] animate-petal-drift" style={{ animationDelay: '5.0s' }} />
            <span className="absolute top-[56%] left-0 w-3 h-2 bg-white/95 rounded-[60%_40%_50%_50%] shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-petal-drift" style={{ animationDelay: '8.8s' }} />
            <span className="absolute top-[72%] left-0 w-3.5 h-2.5 bg-pink-300/85 rounded-[30%_70%_60%_40%] shadow-[0_0_6px_rgba(244,114,182,0.6)] animate-petal-drift" style={{ animationDelay: '12.4s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 5 (z-[35]): Extreme Foreground Lens Framing
              Dramatic parallax: x * -72px, y * -32px
              Lush oversized corner plants closest to the camera lens
              ═══════════════════════════════════════════════════════ */}
          <div 
            className="fixed inset-0 pointer-events-none rooted-flora z-[35] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -26px), calc(26px + var(--my, 0) * -8px), 0)",
              ["--lean" as string]: "calc(var(--mx, 0) * 0.9deg)",
            } as React.CSSProperties}
          >
            {/* Left corner close-up framing */}
            <LushForegroundClover className="absolute bottom-[0%] -left-[1%] w-16 h-24 sm:w-24 sm:h-33 opacity-95 animate-flower-sway-slow" style={{ animationDelay: '0.5s' }} />
            <DaisyFlower className="absolute bottom-[1%] left-[4%] w-12 h-21 animate-flower-sway" style={{ animationDelay: '1.7s' }} />
            <GoldenPoppyFlower className="absolute bottom-[0%] left-[9%] w-11 h-19 animate-flower-sway-fast" style={{ animationDelay: '0.9s' }} />
            <PinkWildflower className="absolute bottom-[2%] left-[14%] w-10 h-18 animate-flower-sway-slow" style={{ animationDelay: '2.6s' }} />
            <BluebellFlower className="absolute bottom-[0%] left-[19%] w-10 h-18 animate-flower-sway" style={{ animationDelay: '1.1s' }} />
            <DaisyFlower className="absolute bottom-[1%] left-[25%] w-9 h-17 animate-flower-sway-fast" style={{ animationDelay: '3.1s' }} />

            {/* Right corner close-up framing */}
            <ButtercupFlower className="absolute bottom-[1%] right-[7%] w-12 h-20 animate-flower-sway" style={{ animationDelay: '1.3s' }} />
            <PinkWildflower className="absolute bottom-[2%] right-[13%] w-10 h-18 animate-flower-sway-fast" style={{ animationDelay: '0.4s' }} />
            <GoldenPoppyFlower className="absolute bottom-[0%] right-[19%] w-11 h-19 animate-flower-sway-slow" style={{ animationDelay: '2.3s' }} />
            <DaisyFlower className="absolute bottom-[1%] right-[25%] w-9 h-17 animate-flower-sway" style={{ animationDelay: '1.9s' }} />
            <LushForegroundClover className="absolute bottom-[0%] -right-[1%] w-16 h-24 sm:w-24 sm:h-33 opacity-95 animate-flower-sway-fast" style={{ animationDelay: '2.1s' }} />
          </div>

          {/* ═══════════════════════════════════════════════════════
              PARALLAX LAYER 6 (z-[40]): Side grass right against the lens
              Strongest parallax: x * -110px, y * -44px
              ═══════════════════════════════════════════════════════ */}
          <div
            className="fixed inset-0 pointer-events-none rooted-flora z-[40] will-change-transform"
            style={{
              transform: "translate3d(calc(var(--mx, 0) * -36px), calc(30px + var(--my, 0) * -10px), 0)",
              ["--lean" as string]: "calc(var(--mx, 0) * 1.4deg)",
            } as React.CSSProperties}
          >
            {/* Left edge */}
            <GrassTuft className="absolute bottom-[1%] -left-[5%] w-44 h-56 sm:w-60 sm:h-72 opacity-95" />
            <GrassTuft className="absolute bottom-[4%] left-[5%] w-36 h-48 sm:w-48 sm:h-60 opacity-90" />
            <GrassTuft className="absolute bottom-[7%] left-[14%] w-28 h-40 sm:w-36 sm:h-48 opacity-85" />
            <GoldenPoppyFlower className="absolute bottom-[2%] left-[2%] w-12 h-21 animate-flower-sway-fast" style={{ animationDelay: '0.7s' }} />
            <PinkWildflower className="absolute bottom-[3%] left-[10%] w-11 h-19 animate-flower-sway-slow" style={{ animationDelay: '2.2s' }} />
            <DaisyFlower className="absolute bottom-[1%] left-[19%] w-12 h-21 animate-flower-sway" style={{ animationDelay: '1.4s' }} />

            {/* Right edge */}
            <GrassTuft className="absolute bottom-[1%] -right-[5%] w-44 h-56 sm:w-60 sm:h-72 opacity-95" />
            <GrassTuft className="absolute bottom-[4%] right-[5%] w-36 h-48 sm:w-48 sm:h-60 opacity-90" />
            <GrassTuft className="absolute bottom-[7%] right-[14%] w-28 h-40 sm:w-36 sm:h-48 opacity-85" />
            <BluebellFlower className="absolute bottom-[2%] right-[2%] w-12 h-21 animate-flower-sway" style={{ animationDelay: '1.8s' }} />
            <DaisyFlower className="absolute bottom-[3%] right-[10%] w-11 h-19 animate-flower-sway-fast" style={{ animationDelay: '0.5s' }} />
            <ButtercupFlower className="absolute bottom-[1%] right-[20%] w-12 h-21 animate-flower-sway-slow" style={{ animationDelay: '2.7s' }} />
          </div>
        </div>
      </div>

      {/* Animated Scanlines / Screen Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMDA4wBBE/wDAAAAAASUVORK5CYII=')] opacity-20 mix-blend-overlay -z-10" />

      {/* Flying Nyan Cat across the sky (enlarged, natural rainbow without extra block) */}
      <div className="absolute top-6 sm:top-10 left-0 pointer-events-none z-10 animate-nyan-fly flex items-center">
        <img 
          src="/images/nyan-cat.gif" 
          alt="Nyan Cat" 
          className="w-32 h-20 sm:w-48 sm:h-28 md:w-56 md:h-32 pixelated object-contain drop-shadow-xl"
        />
      </div>

      {/* Prominent Glowing Fireflies dancing across the meadow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {/* Left side fireflies */}
        <span className="absolute bottom-[26%] left-[14%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#eab308] animate-firefly-prominent" style={{ animationDelay: '0s' }} />
        <span className="absolute bottom-[38%] left-[22%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a,0_0_20px_#ca8a04] animate-firefly-prominent" style={{ animationDelay: '1.6s' }} />
        <span className="absolute bottom-[16%] left-[28%] w-3 h-3 bg-lime-200 rounded-full shadow-[0_0_12px_#a3e635,0_0_22px_#65a30d] animate-firefly-prominent" style={{ animationDelay: '3.2s' }} />

        {/* Center / Near Game Boy, Pokeballs, and Hello Kitty */}
        <span className="absolute bottom-[32%] left-[42%] w-3.5 h-3.5 bg-yellow-200 rounded-full shadow-[0_0_14px_#fde047,0_0_28px_#facc15] animate-firefly-prominent" style={{ animationDelay: '0.8s' }} />
        <span className="absolute bottom-[22%] left-[52%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent" style={{ animationDelay: '2.4s' }} />
        <span className="absolute bottom-[44%] left-[62%] w-3 h-3 bg-amber-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#d97706] animate-firefly-prominent" style={{ animationDelay: '4.0s' }} />

        {/* Right side fireflies */}
        <span className="absolute bottom-[28%] right-[22%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#ca8a04] animate-firefly-prominent" style={{ animationDelay: '1.2s' }} />
        <span className="absolute bottom-[40%] right-[14%] w-2.5 h-2.5 bg-lime-200 rounded-full shadow-[0_0_10px_#a3e635] animate-firefly-prominent" style={{ animationDelay: '2.8s' }} />
        <span className="absolute bottom-[18%] right-[8%] w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-[0_0_14px_#fde047,0_0_26px_#eab308] animate-firefly-prominent" style={{ animationDelay: '3.6s' }} />
        <span className="absolute bottom-[48%] right-[32%] w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent" style={{ animationDelay: '4.8s' }} />
      </div>

      {/* Top Left Menu Row: Menu Box + Hovering Arrow Navigation Hint */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 z-20">
        {/* Retro Menu Box */}
        <div className="relative border-4 border-white bg-black/65 backdrop-blur-xs p-5 sm:p-6 font-retro text-white text-sm sm:text-base leading-loose tracking-widest uppercase inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]">
          {menuItems.map((item, idx) => (
            <div 
              key={item} 
              className="flex items-center gap-4 cursor-pointer mb-4 last:mb-0 select-none group"
              onClick={() => {
                setSelectedIndex(idx);
                handleSelect(idx);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span 
                className={`transition-opacity duration-100 text-yellow-300 ${
                  selectedIndex === idx ? "opacity-100 animate-pulse" : "opacity-0"
                }`}
              >
                ▶
              </span>
              <span 
                className={`transition-colors duration-100 ${
                  selectedIndex === idx ? "text-yellow-200 font-bold" : "text-white/60 group-hover:text-white"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Hovering / Floating Navigation Hint beside the menu */}
        <div className="animate-retro-float flex items-center gap-2.5 px-3.5 py-2.5 bg-black/75 border-2 border-yellow-300 text-yellow-300 font-retro text-xs sm:text-sm tracking-wider uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,0.7)] backdrop-blur-xs rounded-sm select-none">
          <span className="text-yellow-400 text-sm animate-pulse">▲▼</span>
          <span className="text-white drop-shadow">USE ARROWS TO NAVIGATE</span>
          <span className="text-pink-300 text-[10px] bg-white/10 px-2 py-0.5 border border-white/20">ENTER ⏎</span>
        </div>
      </div>

      {/* Popup for "Continue" */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm">
          <div className="animate-slide-up">
            <PixelWindow title="OOPS" variant="pink">
              <div className="p-8 text-center flex flex-col items-center gap-6 min-w-[280px]">
                <span className="text-5xl animate-bounce-soft">🥺</span>
                <p className="font-pixel text-3xl text-dark font-bold leading-relaxed">
                  press new game <br/>
                  <span className="text-pink">bestie ♡</span>
                </p>
                <button 
                  className="pixel-btn pixel-btn--pink px-8 py-3 text-lg mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPopup(false);
                    setSelectedIndex(0); // Reset selection to New Game
                  }}
                >
                  OKAY
                </button>
              </div>
            </PixelWindow>
          </div>
        </div>
      )}
    </div>
  );
}
