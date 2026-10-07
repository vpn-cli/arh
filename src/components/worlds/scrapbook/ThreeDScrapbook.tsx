"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { sfx, getAudioContext } from "@/lib/audio";

let flipAudioBuffer: AudioBuffer | null = null;
let flipAudioLoading = false;
let flipAudioFallback: HTMLAudioElement | null = null;

function loadFlipAudio() {
  if (typeof window === "undefined" || flipAudioBuffer || flipAudioLoading) return;
  flipAudioLoading = true;
  try {
    flipAudioFallback = new Audio("/flip.mp3");
    flipAudioFallback.volume = 0.5;
    flipAudioFallback.preload = "auto";
  } catch { }

  fetch("/flip.mp3")
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const ctx = getAudioContext();
      if (ctx) return ctx.decodeAudioData(buf);
    })
    .then((decoded) => {
      if (decoded) flipAudioBuffer = decoded;
    })
    .catch(() => { });
}

if (typeof window !== "undefined") {
  loadFlipAudio();
}

const decodedImagesCache = new Set<HTMLImageElement>();

function playFlipSound() {
  try {
    const ctx = getAudioContext();
    if (ctx && flipAudioBuffer) {
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = 0.6;
      source.buffer = flipAudioBuffer;
      source.connect(gain).connect(ctx.destination);
      source.start(0);
      return;
    }
  } catch { }

  try {
    if (flipAudioFallback) {
      flipAudioFallback.currentTime = 0;
      flipAudioFallback.play().catch(() => {
        sfx.paper();
      });
    } else {
      const audio = new Audio("/flip.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => sfx.paper());
    }
  } catch {
    sfx.paper();
  }
}

interface BentoItem {
  src: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  tapeColor?: string;
  tapeAngle?: number;
  sticker?: "star" | "note" | "flower" | "sparkle";
  pos?: string;
}

interface PageData {
  items: BentoItem[];
  pageTitle?: string;
}

interface SpreadData {
  left: PageData;
  right: PageData;
}

import scrapbookData from "@/data/scrapbook-data.json";
const SPREADS = scrapbookData as SpreadData[];

const toWebp = (p: string) => p.replace(/\.\w+$/, ".webp");

const gridSrc = (src: string) => {
  if (!src) return src;
  const lower = src.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) return src;
  if (src.startsWith("/arh/")) {
    return toWebp(src.replace("/arh/", "/arh/grid/"));
  }
  if (src.startsWith("/images/")) {
    return toWebp(src.replace("/images/", "/images/grid/"));
  }
  return src;
};

const fullSrc = (src: string) => {
  if (!src) return src;
  const lower = src.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) return src;
  if (src.startsWith("/arh/")) {
    return toWebp(src.replace("/arh/", "/arh/full/"));
  }
  if (src.startsWith("/images/")) {
    return toWebp(src.replace("/images/", "/images/full/"));
  }
  return src;
};


const SvgWrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <svg width="36" height="36" viewBox="-1 -1 9 9" shapeRendering="crispEdges">
      {children}
    </svg>
  </div>
);

const Sticker = React.memo(({ type, active = true }: { type: string; active?: boolean }) => {
  if (type === "star") return <SvgWrap className={`${active ? "animate-[spin_4s_linear_infinite]" : ""} origin-center`}><rect x="3" y="0" width="1" height="2" fill="#FFE4A1" /><rect x="2" y="2" width="3" height="1" fill="#FFE4A1" /><rect x="0" y="3" width="7" height="1" fill="#FFE4A1" /><rect x="1" y="4" width="5" height="1" fill="#FFE4A1" /><rect x="2" y="5" width="3" height="1" fill="#FFE4A1" /><rect x="1" y="6" width="1" height="1" fill="#FFE4A1" /><rect x="5" y="6" width="1" height="1" fill="#FFE4A1" /></SvgWrap>;
  if (type === "note") return <SvgWrap className={active ? "animate-bounce" : ""}><rect x="4" y="0" width="3" height="1" fill="#A1C4FD" /><rect x="3" y="1" width="1" height="4" fill="#A1C4FD" /><rect x="6" y="1" width="1" height="2" fill="#A1C4FD" /><rect x="1" y="4" width="3" height="1" fill="#A1C4FD" /><rect x="0" y="5" width="4" height="2" fill="#A1C4FD" /></SvgWrap>;
  if (type === "sparkle") return <SvgWrap className={active ? "animate-pulse" : ""}><rect x="3" y="0" width="1" height="2" fill="#DFD5F5" /><rect x="3" y="5" width="1" height="2" fill="#DFD5F5" /><rect x="0" y="3" width="2" height="1" fill="#DFD5F5" /><rect x="5" y="3" width="2" height="1" fill="#DFD5F5" /><rect x="2" y="2" width="3" height="3" fill="#DFD5F5" /></SvgWrap>;
  if (type === "flower") return <SvgWrap className={`${active ? "animate-[spin_6s_linear_infinite_reverse]" : ""} origin-center`}><rect x="2" y="0" width="3" height="2" fill="#FF8FB3" /><rect x="0" y="2" width="2" height="3" fill="#FF8FB3" /><rect x="5" y="2" width="2" height="3" fill="#FF8FB3" /><rect x="2" y="5" width="3" height="2" fill="#FF8FB3" /><rect x="2" y="2" width="3" height="3" fill="#FFE4A1" /></SvgWrap>;
  if (type === "banana") return <div className="text-4xl font-sans select-none origin-center mt-2">🍌</div>;
  return null;
});
Sticker.displayName = "Sticker";

interface DraggableCropImageProps {
  item: BentoItem;
  onImageClick?: (src: string | null) => void;
  positions?: Record<string, { x: number; y: number }>;
  setPosAbsolute?: (src: string, x: number, y: number) => void;
  onCropEnd?: (src: string, x: number, y: number) => void;
  editMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

const DraggableCropImage = React.memo(function DraggableCropImage({ item, onImageClick, positions, setPosAbsolute, onCropEnd, editMode, isSelected, onSelect }: DraggableCropImageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startObj, setStartObj] = useState({ x: 50, y: 50 });

  let currentX = 50;
  let currentY = 50;
  if (positions?.[item.src]) {
    currentX = positions[item.src].x;
    currentY = positions[item.src].y;
  } else if (item.pos) {
    const parts = item.pos.split(' ');
    currentX = parseFloat(parts[0]) || 50;
    currentY = parseFloat(parts[1]) || 50;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editMode) {
      e.stopPropagation();
      onImageClick?.(item.src);
      return;
    }
    setIsDragging(true);
    setHasDragged(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartObj({ x: currentX, y: currentY });
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !editMode) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    // Only register as a drag if moved more than 3 pixels
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasDragged(true);

    // Scale movement to percentage roughly
    const newX = Math.max(0, Math.min(100, startObj.x - dx * 0.25));
    const newY = Math.max(0, Math.min(100, startObj.y - dy * 0.25));
    setPosAbsolute?.(item.src, newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging && editMode) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (hasDragged) {
        const finalX = Math.round(currentX);
        const finalY = Math.round(currentY);
        onCropEnd?.(item.src, finalX, finalY);
      } else {
        // Was a tap in edit mode
        onSelect?.();
      }
    }
  };

  if (item.src?.endsWith('.mp4')) {
    return (
      <div className="relative w-full h-full bg-[#151728] overflow-hidden rounded-lg flex items-center justify-center">
        <video src={item.src} className="w-full h-full object-cover" muted playsInline />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-white overflow-hidden rounded-lg cursor-pointer transition-transform duration-300 ease-out ${isSelected ? 'ring-4 ring-[#FF8FB3] scale-95 opacity-80' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={editMode ? handlePointerMove : undefined}
      onPointerUp={editMode ? handlePointerUp : undefined}
      onPointerCancel={editMode ? handlePointerUp : undefined}
      style={{ touchAction: editMode ? 'none' : 'auto' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gridSrc(item.src)}
        alt="memory"
        className="w-full h-full object-cover"
        style={{
          objectPosition: `${currentX}% ${currentY}%`
        }}
        draggable={false}
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.dataset.fallback) {
            target.dataset.fallback = "full";
            target.src = fullSrc(item.src);
          } else if (target.dataset.fallback === "full") {
            target.dataset.fallback = "orig";
            target.src = item.src;
          }
        }}
      />
      <div className="absolute inset-0 bg-[#FFF0DC]/10 pointer-events-none" />

      {/* Inner 3D Shading on images to make them feel embedded */}
      <div className="absolute inset-0 shadow-[inset_1px_2px_4px_rgba(0,0,0,0.1)] pointer-events-none" />
    </div>
  );
});

const VideoFrame = React.memo(function VideoFrame({
  src,
  isCurrentSpread,
  onGoToCover,
}: {
  src: string;
  isCurrentSpread?: boolean;
  onGoToCover?: () => void;
  editMode?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  // Guarantee sound is unmuted and at 100% volume by default
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
  }, []);

  // Auto-pause video when turned away from this page
  useEffect(() => {
    if (!isCurrentSpread && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isCurrentSpread]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    // Explicitly unmute and set full volume on user interaction
    videoRef.current.muted = false;
    videoRef.current.volume = 1.0;
    setIsMuted(false);

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Playback prevented:", err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !videoRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-1 sm:p-2 min-h-0">
      {/* Massive Retro Camcorder / Video Reel TV Console Chassis */}
      <div
        className="relative bg-[#1A1830] p-2.5 sm:p-3.5 pb-2 sm:pb-3 rounded-[24px] sm:rounded-[32px] border-4 border-[#35305B] shadow-[0_18px_45px_rgba(20,10,35,0.45),inset_0_2px_4px_rgba(255,255,255,0.12)] flex flex-col items-center w-full max-w-[98%] sm:max-w-[96%] h-full max-h-[96%] my-auto min-h-0 overflow-hidden"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Retro Header Bar: REC light, Timecode & Sound badge */}
        <div className="w-full flex items-center justify-between px-2 sm:px-3 py-1 mb-1.5 bg-[#121024] rounded-xl border border-[#2B2748] shrink-0 pointer-events-none">
          <div className="flex items-center gap-1.5 font-pixel text-[9px] sm:text-[10px] text-[#A8FFB2]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4757] animate-pulse inline-block shadow-[0_0_8px_#FF4757]" />
            <span className="font-bold tracking-wider">REC ● 00:24:16</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[8px] sm:text-[9px] text-[#FF8FB3] tracking-widest uppercase font-bold">
              ✦ FINAL REEL ✦
            </span>
            <span className="font-pixel text-[8px] sm:text-[9px] px-1.5 py-0.5 bg-[#2B2748] rounded text-[#FFE4A1] font-bold">
              STEREO 🔊
            </span>
          </div>
        </div>

        {/* Large CRT Screen Bezel (Maximized Screen Size) */}
        <div
          className="relative flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden rounded-2xl border-3 border-[#0D0B1A] bg-black shadow-[inset_0_4px_24px_rgba(0,0,0,0.9)] group cursor-pointer"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={src}
            playsInline
            loop
            preload="metadata"
            muted={false}
            className="w-full h-full object-contain sm:object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
          />

          {/* CRT Scanline & Lens Shimmer */}
          <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px]" />
          <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

          {/* Inviting Play Button Overlay with UNMUTED AUDIO indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-[#0E0B1E]/75 flex items-center justify-center z-30 transition-opacity">
              <button
                onClick={togglePlay}
                className="px-5 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#FF8FB3] hover:bg-[#FF739D] border-3 border-white shadow-[0_8px_25px_rgba(255,143,179,0.5),3px_3px_0_#121024] text-white font-pixel text-xs sm:text-sm flex items-center gap-2.5 [@media(hover:hover)]:hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <span className="text-base sm:text-lg">▶</span>
                <span className="tracking-wider font-bold">PLAY VIDEO (AUDIO ON 🔊)</span>
              </button>
            </div>
          )}

          {/* Floating Retro Controls Bar */}
          <div
            className={`absolute bottom-2 inset-x-2 sm:inset-x-3 z-30 flex items-center justify-between px-3 py-1.5 sm:py-2 bg-[#121024]/95 rounded-xl border border-white/20 transition-opacity duration-300 pointer-events-auto ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#FFE4A1] font-pixel text-xs sm:text-sm px-1 cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>

            {/* Progress Bar */}
            <div
              className="flex-1 mx-2 sm:mx-3 h-2 bg-white/20 hover:h-2.5 transition-all rounded-full overflow-hidden cursor-pointer"
              onClick={handleSeek}
            >
              <div className="h-full bg-gradient-to-r from-[#FF8FB3] to-[#FFE4A1]" style={{ width: `${progress}%` }} />
            </div>

            {/* Mute / Unmute */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#FFE4A1] text-sm px-1 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* Bottom Console Strip: Speaker Grill & Replay */}
        <div className="w-full flex items-center justify-between px-2 pt-2 mt-1 shrink-0">
          <div className="flex items-center gap-1 opacity-60">
            {[0, 1, 2, 3, 4, 5].map((dot) => (
              <span key={dot} className="w-1.5 h-1.5 rounded-full bg-[#35305B]" />
            ))}
          </div>

          <div className="font-pixel text-[10px] sm:text-[12px] text-[#FF8FB3] font-bold tracking-widest uppercase">
            BON JOVI WHO? ✨
          </div>

          {onGoToCover ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGoToCover();
              }}
              className="px-3 py-1 bg-[#282444] hover:bg-[#35305B] border border-[#FF8FB3]/60 rounded-full text-white font-pixel text-[9px] sm:text-[10px] flex items-center gap-1 shadow-sm transition-all [@media(hover:hover)]:hover:-translate-y-0.5 cursor-pointer pointer-events-auto"
            >
              <span>↺</span>
              <span>COVER</span>
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </div>
    </div>
  );
});

const PageContent = React.memo(function PageContent({
  data,
  onImageClick,
  positions,
  setPosAbsolute,
  onCropEnd,
  editMode,
  selectedFrame,
  onFrameClick,
  spreadIdx,
  side,
  onTurnPage,
  totalSpreads,
  isCurrentSpread,
  onGoToCover,
}: {
  data: PageData,
  onImageClick?: (src: string | null) => void,
  positions?: Record<string, { x: number, y: number }>,
  setPosAbsolute?: (src: string, x: number, y: number) => void,
  onCropEnd?: (src: string, x: number, y: number) => void,
  editMode?: boolean,
  selectedFrame?: { spreadIdx: number, side: 'left' | 'right', itemIdx: number } | null,
  onFrameClick?: (spreadIdx: number, side: 'left' | 'right', itemIdx: number) => void,
  spreadIdx: number,
  side: 'left' | 'right',
  onTurnPage?: (dir: number) => void,
  totalSpreads?: number,
  isCurrentSpread?: boolean,
  onGoToCover?: () => void,
}) {
  if (data.pageTitle === "COVER") {
    return (
      <div
        className="absolute inset-0 bg-[#FFB6C1] flex flex-col items-center justify-between p-2 sm:p-3 pb-2 overflow-hidden border-4 border-[#FFD0DC] select-none cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (editMode) return;
          onTurnPage?.(1);
        }}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)", backgroundSize: "24px 24px" }} />

        {/* Top Title Banner */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 shrink-0 pt-0.5 pointer-events-none">
          <span className="font-pixel text-2xl sm:text-4xl text-white drop-shadow-[3px_3px_0_#20233F] rotate-[-2deg] tracking-wider">
            BANANA BOOK
          </span>
          <div className="scale-100 sm:scale-125 -rotate-6">
            <Sticker type="banana" />
          </div>
        </div>

        {/* Center: Deluxe Ornate Keepsake Frame (Enlarged) */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full my-1 pointer-events-none min-h-0">
          <div className="relative bg-[#FFFDF7] p-2.5 sm:p-3.5 pb-3.5 sm:pb-5 rounded-2xl shadow-[0_18px_38px_rgba(32,35,63,0.28),0_4px_14px_rgba(255,143,179,0.4)] border-4 border-[#FFD0DC] ring-4 ring-[#FFE4A1] ring-offset-2 ring-offset-[#FFB6C1] rotate-[-1deg] flex flex-col items-center max-h-full w-auto max-w-[94%] sm:max-w-[90%]">

            {/* Top Deluxe Ribbon & Bow Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-0.5 bg-[#FFE4A1] border-2 border-[#20233F] rounded-full shadow-[2px_2px_0_#20233F] -rotate-1">
              <span className="text-xs">🎀</span>
              <span className="font-pixel text-[9px] sm:text-[10px] text-[#20233F] font-bold tracking-widest uppercase">
                MEMORY CAPSULE
              </span>
              <span className="text-xs">✦</span>
            </div>

            {/* Corner Decorative Accent Gems */}
            <div className="absolute -top-3 -right-3 z-20 scale-95">
              <Sticker type="sparkle" active={isCurrentSpread} />
            </div>
            <div className="absolute -bottom-3 -left-3 z-20 scale-85">
              <Sticker type="flower" active={isCurrentSpread} />
            </div>

            {/* Inner Photo Frame with 4 Vintage Mounting Corners (Enlarged) */}
            <div className="relative overflow-hidden rounded-xl border-3 border-[#20233F]/20 bg-[#20233F]/5 aspect-[2/3] max-h-[50vh] sm:max-h-[55vh] w-auto shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] mt-1">

              {/* 4 Vintage Triangular Photo Mounting Corners */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-[#E5B25D] z-20 pointer-events-none rounded-tl-sm shadow-sm" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-[#E5B25D] z-20 pointer-events-none rounded-tr-sm shadow-sm" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-[#E5B25D] z-20 pointer-events-none rounded-bl-sm shadow-sm" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-[#E5B25D] z-20 pointer-events-none rounded-br-sm shadow-sm" />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/grid/img.webp"
                alt="Scrapbook Cover"
                className="w-full h-full object-cover"
                draggable={false}
                decoding="async"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = "/images/img.jpeg";
                  }
                }}
              />
              <div className="absolute inset-0 bg-[#FFF0DC]/10 pointer-events-none" />
            </div>

            {/* Polaroid Chin Label */}
            <div className="mt-1.5 sm:mt-2 text-center flex items-center justify-center gap-1.5 px-3 py-0.5 bg-[#FFF0F5] border border-[#FFB6C1] rounded-full shadow-sm">
              <span className="font-pixel text-[9px] sm:text-[11px] text-[#881337] font-bold tracking-widest uppercase">
                {"✦ MAAHIVEY -> THIS WAY ✦"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Call-to-action */}
        <div className="relative z-10 font-pixel text-[#20233F] text-xs sm:text-sm drop-shadow-[1px_1px_0_white] bg-white/95 px-6 py-1.5 rounded-full border-2 border-white shadow-[2px_2px_0_#FFB6C1] shrink-0 pointer-events-none mb-0.5 [@media(hover:hover)]:hover:scale-105 transition-transform">
          ✦ ISKO DABAO ✦
        </div>
      </div>
    );
  }

  const isVideoPage = Boolean(
    data.pageTitle === "THE END ✦" ||
    data.items.some(i => i.src?.endsWith('.mp4') || i.src?.endsWith('.webm') || i.src?.includes('vid.mp4'))
  );

  if (isVideoPage) {
    const videoSrc = data.items.find(i => i.src?.endsWith('.mp4'))?.src || "/videos/vid.mp4";
    return (
      <div className="relative w-full h-full p-2 sm:p-3 pb-2 flex flex-col overflow-hidden select-none" style={{ backgroundColor: "#FFB6C1" }}>
        {/* Cute Pastel Pattern overlay */}
        <div className="absolute inset-0 opacity-100 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFE4A1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

        {data.pageTitle && (
          <div className="relative z-10 flex justify-center mb-1 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 sm:px-5 py-0.5 sm:py-1 bg-white/95 rounded-full border-2 border-white shadow-[0_4px_14px_rgba(255,143,179,0.35),2px_2px_0_#FFB6C1] -rotate-1">
              <span className="text-xs sm:text-sm text-[#FF8FB3] select-none">✿</span>
              <h2 className="font-['Fredoka'] text-[#881337] text-xs sm:text-sm font-bold tracking-wider uppercase">
                {data.pageTitle}
              </h2>
              <span className="text-xs sm:text-sm text-[#FFE4A1] select-none">✦</span>
            </div>
          </div>
        )}

        <div className="flex-1 relative z-10 w-full min-h-0 flex items-center justify-center">
          <VideoFrame
            src={videoSrc}
            isCurrentSpread={isCurrentSpread}
            onGoToCover={onGoToCover}
            editMode={editMode}
          />
        </div>

        {/* Page Navigation Buttons */}
        <div className={`absolute bottom-3 sm:bottom-4 ${side === 'left' ? 'left-3 sm:left-4' : 'right-3 sm:right-4'} z-50 pointer-events-none`}>
          {side === 'left' && spreadIdx > 0 && onTurnPage && (
            <button
              onClick={(e) => { e.stopPropagation(); onTurnPage(-1); }}
              className="px-3 py-1.5 bg-white/90 rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] font-pixel text-xs text-[#20233F] hover:bg-[#FFD0DC] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:-rotate-2 transition-all border-2 border-white pointer-events-auto cursor-pointer"
            >
              ◀ PICHE
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden select-none cursor-pointer"
      style={{ backgroundColor: "#FFB6C1" }}
      onClick={() => {
        if (editMode) return;
        if (side === 'right' && onTurnPage && spreadIdx < (totalSpreads || 1) - 1 && data.pageTitle !== "COVER") {
          onTurnPage(1);
        } else if (side === 'left' && onTurnPage && spreadIdx > 0) {
          onTurnPage(-1);
        }
      }}
    >
      {/* Cute Pastel Pattern overlay */}
      <div className="absolute inset-0 opacity-100 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFE4A1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

      {data.pageTitle && (
        <div className="relative z-10 flex justify-center mb-3 sm:mb-4 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-1 sm:py-1.5 bg-white/95 rounded-full border-2 border-white shadow-[0_4px_14px_rgba(255,143,179,0.35),2px_2px_0_#FFB6C1] -rotate-1">
            <span className="text-xs sm:text-sm text-[#FF8FB3] select-none">✿</span>
            <h2 className="font-['Fredoka'] text-[#881337] text-xs sm:text-sm lg:text-base font-bold tracking-wider uppercase">
              {data.pageTitle}
            </h2>
            <span className="text-xs sm:text-sm text-[#FFE4A1] select-none">✦</span>
          </div>
        </div>
      )}

      <div className="flex-1 relative z-10 w-full">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4">
          {data.items.map((item, idx) => (
            <div
              key={idx}
              className="relative p-1.5 sm:p-2 bg-white shadow-[2px_4px_12px_rgba(255,182,193,0.3)] rounded-xl border-2 border-[#FFD0DC]/40 group [@media(hover:hover)]:hover:scale-[1.02] [@media(hover:hover)]:hover:-rotate-1 transition-transform duration-300"
              style={{
                gridColumn: `${item.col + 1} / span ${item.colSpan}`,
                gridRow: `${item.row + 1} / span ${item.rowSpan}`,
              }}
            >
              <DraggableCropImage
                item={item}
                onImageClick={onImageClick}
                positions={positions}
                setPosAbsolute={setPosAbsolute}
                onCropEnd={onCropEnd}
                editMode={editMode}
                isSelected={selectedFrame?.spreadIdx === spreadIdx && selectedFrame?.side === side && selectedFrame?.itemIdx === idx}
                onSelect={() => onFrameClick?.(spreadIdx, side, idx)}
              />

              {item.tapeColor && (
                <div
                  className="absolute -top-3 left-1/2 w-12 sm:w-16 h-5 z-20 opacity-90 pointer-events-none"
                  style={{
                    backgroundColor: item.tapeColor,
                    transform: `translateX(-50%) rotate(${item.tapeAngle || 0}deg)`,
                    borderLeft: '3px dotted rgba(255,255,255,0.7)',
                    borderRight: '3px dotted rgba(255,255,255,0.7)'
                  }}
                />
              )}

              {item.sticker && (
                <div className="absolute -bottom-5 -right-5 z-20 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-hover:rotate-12 transition-transform duration-300 pointer-events-none">
                  <Sticker type={item.sticker} active={isCurrentSpread} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Page Navigation Buttons */}
      <div className={`absolute bottom-4 sm:bottom-6 ${side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} z-50 pointer-events-none`}>
        {side === 'left' && spreadIdx > 0 && onTurnPage && (
          <button
            onClick={(e) => { e.stopPropagation(); onTurnPage(-1); }}
            className="px-3 py-1.5 bg-white/90 rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] font-pixel text-xs text-[#20233F] hover:bg-[#FFD0DC] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:-rotate-2 transition-all border-2 border-white pointer-events-auto cursor-pointer"
          >
            ◀ PICHE
          </button>
        )}
        {side === 'right' && totalSpreads && spreadIdx < totalSpreads - 1 && data.pageTitle !== "COVER" && onTurnPage && (
          <button
            onClick={(e) => { e.stopPropagation(); onTurnPage(1); }}
            className="px-3 py-1.5 bg-white/90 rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] font-pixel text-xs text-[#20233F] hover:bg-[#FFD0DC] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:rotate-2 transition-all border-2 border-white pointer-events-auto cursor-pointer"
          >
            AAGE ▶
          </button>
        )}
      </div>
    </div>
  );
});

export default function ThreeDScrapbook() {
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [appSpreads, setAppSpreads] = useState<SpreadData[]>([
    {
      left: { pageTitle: "", items: [] },
      right: { pageTitle: "COVER", items: [] }
    },
    ...SPREADS
  ]);
  const [editMode, setEditMode] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<{ spreadIdx: number, side: 'left' | 'right', itemIdx: number } | null>(null);

  // 2.2-second cute Japanese loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Enable smooth CSS transitions only after initial paint so the book starts rock-solid in closed state
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    let isCancelled = false;
    const logError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'error', data: msg })
      }).catch(() => { });
    };
    const originalError = console.error;
    console.error = (...args) => {
      logError(args.join(' '));
      originalError(...args);
    };
    window.addEventListener('unhandledrejection', (e) => logError(e.reason));
    window.addEventListener('error', (e) => logError(e.message));

    const initScrapbook = async () => {
      let finalLayout = [...appSpreads]; // Fallback to SPREADS

      // Clear any legacy localStorage cache that might hold stale titles
      try {
        localStorage.removeItem('scrapbook_spreads');
      } catch { }

      // Fetch fresh layout from API
      try {
        const res = await fetch('/api/get-scrapbook?t=' + Date.now());
        const serverSpreads = await res.json();
        if (serverSpreads && serverSpreads.length > 0) {
          finalLayout = [
            { left: { pageTitle: "", items: [] }, right: { pageTitle: "COVER", items: [] } },
            ...serverSpreads
          ];
        }
      } catch (e) {
        console.error(`API fetch failed: ${e}`);
      }

      if (!isCancelled) {
        setAppSpreads(finalLayout);

        // Preload first spread images (grid versions)
        const firstImages = [
          gridSrc('/images/img.jpeg'),
          ...((finalLayout[0]?.left.items || []).map(i => gridSrc(i.src))),
          ...((finalLayout[0]?.right.items || []).map(i => gridSrc(i.src))),
          ...((finalLayout[1]?.left.items || []).map(i => gridSrc(i.src))),
          ...((finalLayout[1]?.right.items || []).map(i => gridSrc(i.src)))
        ].filter(src => src && !src.endsWith('.mp4') && !src.endsWith('.webm'));

        firstImages.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      }
    };

    initScrapbook();

    return () => {
      isCancelled = true;
      console.error = originalError;
      window.removeEventListener('unhandledrejection', (e) => logError(e.reason));
      window.removeEventListener('error', (e) => logError(e.message));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentSpread, setCurrentSpread] = useState(0);
  const [flippingIndex, setFlippingIndex] = useState(-1);
  const [flippingDir, setFlippingDir] = useState(0);
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  const [settledSpread, setSettledSpread] = useState(0);
  const [renderRange, setRenderRange] = useState({ min: -2, max: 2 });

  useEffect(() => {
    if (flippingIndex === -1) {
      const timer = setTimeout(() => {
        setSettledSpread(currentSpread);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [flippingIndex, currentSpread]);

  useEffect(() => {
    const cb = () => {
      setRenderRange({ min: currentSpread - 2, max: currentSpread + 2 });
    };
    const handle = (window.requestIdleCallback || ((fn) => setTimeout(fn, 100)))(cb);
    return () => (window.cancelIdleCallback || clearTimeout)(handle);
  }, [currentSpread]);

  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Preload images for spreads around currentSpread so flipping never shows blank pages
  useEffect(() => {
    const cb = () => {
      const aheadSpreads = [currentSpread + 2, currentSpread + 3, currentSpread - 2, currentSpread - 3];
      aheadSpreads.forEach(spreadIdx => {
        const spread = appSpreads[spreadIdx];
        if (spread) {
          const images = [
            ...(spread.left?.items || []).map(i => i.src),
            ...(spread.right?.items || []).map(i => i.src)
          ].filter(src => src && !src.endsWith('.mp4') && !src.endsWith('.webm'));

          images.forEach(src => {
            const targetSrc = gridSrc(src);
            if (!preloadedImagesRef.current.has(targetSrc)) {
              preloadedImagesRef.current.add(targetSrc);
              const img = new Image();
              img.src = targetSrc;
              img.decode().catch(() => { }).then(() => {
                decodedImagesCache.add(img);
              });
            }
          });
        }
      });
    };
    const handle = (window.requestIdleCallback || ((fn) => setTimeout(fn, 100)))(cb);
    return () => (window.cancelIdleCallback || clearTimeout)(handle);
  }, [currentSpread, appSpreads]);

  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Fullscreen image inspect refs & state
  const overlayRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselDragRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [inspectVisible, setInspectVisible] = useState(false);
  const [carouselReady, setCarouselReady] = useState(false);

  // Smooth scroll & momentum physics refs for inspect carousel
  const carouselTargetScrollRef = useRef<number | null>(null);
  const carouselRafRef = useRef<number | null>(null);
  const carouselWheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Scrapbook wheel page-turning refs
  const lastBookWheelRef = useRef<number>(0);
  const bookWheelDeltaRef = useRef<number>(0);

  // Cleanup scroll RAF and timers on unmount
  useEffect(() => {
    return () => {
      if (carouselRafRef.current) cancelAnimationFrame(carouselRafRef.current);
      if (carouselWheelTimeoutRef.current) clearTimeout(carouselWheelTimeoutRef.current);
    };
  }, []);

  const allImages = React.useMemo(() => {
    return appSpreads
      .flatMap(s => [...s.left.items, ...s.right.items].map(i => i.src))
      .filter(src => src && !src.endsWith('.mp4') && !src.endsWith('.webm'));
  }, [appSpreads]);

  const snapToNearestCard = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;

    if (carouselRafRef.current) {
      cancelAnimationFrame(carouselRafRef.current);
      carouselRafRef.current = null;
    }
    carouselTargetScrollRef.current = null;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const items = Array.from(container.children).filter(
      (c) => c.tagName !== 'STYLE' && (c as HTMLElement).offsetLeft !== undefined
    ) as HTMLElement[];

    if (items.length === 0) return;

    let closestItem = items[0];
    let minDiff = Infinity;

    items.forEach((item) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const diff = Math.abs(containerCenter - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestItem = item;
      }
    });

    const targetLeft =
      closestItem.offsetLeft - container.clientWidth / 2 + closestItem.offsetWidth / 2;

    container.scrollTo({ left: targetLeft, behavior: 'smooth' });

    // Re-enable CSS scroll snap after the smooth glide finishes
    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.style.scrollSnapType = '';
        carouselRef.current.style.scrollBehavior = '';
      }
    }, 350);
  }, []);

  const handleCarouselWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = carouselRef.current;
    if (!container) return;

    // Pick dominant delta (mouse wheel deltaY or trackpad deltaX)
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!delta) return;

    // Immediately disable scroll-snap and CSS smooth scrolling so native snap engine doesn't fight the wheel
    if (container.style.scrollSnapType !== 'none') {
      container.style.scrollSnapType = 'none';
      container.style.scrollBehavior = 'auto';
    }

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (carouselTargetScrollRef.current === null) {
      carouselTargetScrollRef.current = container.scrollLeft;
    }

    // Accumulate target with smooth factor
    carouselTargetScrollRef.current = Math.max(
      0,
      Math.min(maxScroll, carouselTargetScrollRef.current + delta * 0.95)
    );

    // Exponential smoothing RAF loop
    if (!carouselRafRef.current) {
      const step = () => {
        if (!carouselRef.current || carouselTargetScrollRef.current === null) {
          carouselRafRef.current = null;
          return;
        }
        const current = carouselRef.current.scrollLeft;
        const target = carouselTargetScrollRef.current;
        const diff = target - current;

        if (Math.abs(diff) > 0.5) {
          carouselRef.current.scrollLeft = current + diff * 0.22;
          carouselRafRef.current = requestAnimationFrame(step);
        } else {
          carouselRef.current.scrollLeft = target;
          carouselRafRef.current = null;
        }
      };
      carouselRafRef.current = requestAnimationFrame(step);
    }

    // Debounced snap settling once wheel events stop
    if (carouselWheelTimeoutRef.current) {
      clearTimeout(carouselWheelTimeoutRef.current);
    }
    carouselWheelTimeoutRef.current = setTimeout(() => {
      snapToNearestCard();
    }, 160);
  }, [snapToNearestCard]);

  const openInspect = useCallback((src: string | null) => {
    if (!src || src.endsWith('.mp4') || src.endsWith('.webm')) return;
    setCarouselReady(false);
    setInspectImage(src);
    setInspectVisible(true);

    // Preload full version only for clicked image and its immediate neighbours (+/-1)
    const idx = allImages.indexOf(src);
    if (idx !== -1) {
      const toPreloadIndices = [idx - 1, idx, idx + 1];
      toPreloadIndices.forEach((i) => {
        if (i >= 0 && i < allImages.length) {
          const fullPath = fullSrc(allImages[i]);
          if (!preloadedImagesRef.current.has(fullPath)) {
            preloadedImagesRef.current.add(fullPath);
            const img = new Image();
            img.src = fullPath;
          }
        }
      });
    }
  }, [allImages]);

  useLayoutEffect(() => {
    if (inspectVisible && inspectImage && carouselRef.current) {
      const idx = allImages.indexOf(inspectImage);
      if (idx !== -1) {
        const el = carouselRef.current.children[idx + 1] as HTMLElement; // +1 to skip style tag
        if (el) {
          carouselRef.current.scrollLeft = el.offsetLeft - (window.innerWidth / 2) + (el.offsetWidth / 2);
        }
      }

      // Request exactly two animation frames to ensure the browser has fully calculated
      // and applied the invisible layout scroll before we apply the visible CSS animations.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCarouselReady(true);
        });
      });
    }
  }, [inspectVisible, inspectImage, allImages]);

  const closeInspect = useCallback(() => {
    if (carouselRafRef.current) {
      cancelAnimationFrame(carouselRafRef.current);
      carouselRafRef.current = null;
    }
    if (carouselWheelTimeoutRef.current) {
      clearTimeout(carouselWheelTimeoutRef.current);
      carouselWheelTimeoutRef.current = null;
    }
    carouselTargetScrollRef.current = null;

    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      overlayRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        setInspectVisible(false);
        setInspectImage(null);
        setCarouselReady(false);
      }, 300);
    } else {
      setInspectVisible(false);
      setInspectImage(null);
      setCarouselReady(false);
    }
  }, []);

  const navigateInspect = useCallback((dir: number) => {
    if (carouselRef.current) {
      // Scroll by roughly 35% of the screen width to safely push the snap point to the next/prev image
      carouselRef.current.scrollBy({ left: dir * (window.innerWidth * 0.35), behavior: 'smooth' });
    }
  }, []);

  const bookStateRef = useRef({ currentSpread, flippingIndex, len: appSpreads.length });
  useEffect(() => {
    bookStateRef.current = { currentSpread, flippingIndex, len: appSpreads.length };
  }, [currentSpread, flippingIndex, appSpreads.length]);

  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
    };
  }, []);

  const setPosAbsolute = useCallback((src: string, x: number, y: number) => {
    setPositions(prev => ({ ...prev, [src]: { x, y } }));
  }, []);

  const handleCropEnd = useCallback((src: string, x: number, y: number) => {
    // Instantly bake the new crop position into appSpreads and localStorage
    setAppSpreads(prev => {
      const newSpreads = JSON.parse(JSON.stringify(prev));
      for (let sIdx = 0; sIdx < newSpreads.length; sIdx++) {
        for (const side of ['left', 'right'] as const) {
          for (const item of newSpreads[sIdx][side].items) {
            if (item.src === src) {
              item.pos = `${x}% ${y}%`;
            }
          }
        }
      }
      return newSpreads;
    });

    // Clear the temporary drag position so it doesn't interfere with swaps
    setPositions(prev => {
      const next = { ...prev };
      delete next[src];
      return next;
    });
  }, []);

  const handleFrameClick = useCallback((spreadIdx: number, side: 'left' | 'right', itemIdx: number) => {
    if (!editMode) return;
    if (!selectedFrame) {
      setSelectedFrame({ spreadIdx, side, itemIdx });
    } else {
      // Swap items
      setAppSpreads(prev => {
        const newSpreads = JSON.parse(JSON.stringify(prev));
        const item1 = newSpreads[selectedFrame.spreadIdx][selectedFrame.side].items[selectedFrame.itemIdx];
        const item2 = newSpreads[spreadIdx][side].items[itemIdx];

        const tempSrc = item1.src;
        const tempPos = item1.pos;

        item1.src = item2.src;
        item1.pos = item2.pos;

        item2.src = tempSrc;
        item2.pos = tempPos;

        return newSpreads;
      });
      setSelectedFrame(null);
    }
  }, [editMode, selectedFrame]);

  const handleSave = useCallback(async () => {
    const newSpreads = JSON.parse(JSON.stringify(appSpreads));

    // Update local state instantly
    setAppSpreads(newSpreads);
    setEditMode(false);

    // Also persist via the new API so the JSON data file updates immediately
    try {
      const dataToSave = newSpreads.length > 0 && newSpreads[0].right?.pageTitle === "COVER"
        ? newSpreads.slice(1) // Remove the temporary COVER spread if it exists
        : newSpreads;

      const res = await fetch('/api/save-scrapbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (!res.ok) {
        const err = await res.json();
        console.log(`API SAVE FAILED: ${err.error || res.statusText}`);
        alert("Failed to save to JSON file: " + (err.error || res.statusText));
      } else {
        console.log(`API SAVE SUCCESS! Layout is now permanent.`);
      }
    } catch (e) {
      console.log(`API SAVE NETWORK ERROR: ${e}`);
      alert("Failed to save to JSON file due to a network error.");
    }
  }, [appSpreads]);

  const handleExportCode = useCallback(() => {
    const finalSpreads = JSON.parse(JSON.stringify(appSpreads));
    const dataToExport = finalSpreads.length > 0 && finalSpreads[0].right?.pageTitle === "COVER"
      ? finalSpreads.slice(1)
      : finalSpreads;

    const code = JSON.stringify(dataToExport, null, 2);
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ JSON data copied to clipboard!\n\nPaste it into src/data/scrapbook-data.json before deploying.');
    }).catch(() => {
      // Fallback: open in a new window
      const win = window.open('');
      if (win) {
        win.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;white-space:pre-wrap">${code}</pre>`);
      }
    });
  }, [appSpreads]);

  const turnPage = useCallback((dir: number) => {
    const { currentSpread, flippingIndex, len } = bookStateRef.current;
    if (flippingIndex !== -1) return;
    const targetIdx = currentSpread + dir;
    if (targetIdx < 0 || targetIdx >= len) {
      return;
    }

    const leafIdx = dir > 0 ? currentSpread : targetIdx;

    setFlippingIndex(leafIdx);
    setFlippingDir(dir);
    setCurrentSpread(targetIdx);

    queueMicrotask(() => {
      playFlipSound();
    });

    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
    }
    flipTimeoutRef.current = setTimeout(() => {
      setFlippingIndex(-1);
      flipTimeoutRef.current = null;
    }, 720);
  }, []);

  const handleBookWheel = useCallback((e: React.WheelEvent) => {
    if (inspectVisible || editMode) return;
    const now = Date.now();
    // Cooldown during flip animation (750ms) to prevent collision
    if (now - lastBookWheelRef.current < 800 || bookStateRef.current.flippingIndex !== -1) {
      return;
    }
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    bookWheelDeltaRef.current += delta;

    if (Math.abs(bookWheelDeltaRef.current) > 30) {
      if (bookWheelDeltaRef.current > 0) {
        turnPage(1);
      } else {
        turnPage(-1);
      }
      bookWheelDeltaRef.current = 0;
      lastBookWheelRef.current = now;
    }
  }, [inspectVisible, editMode, turnPage]);

  const goToCover = useCallback(() => {
    const { currentSpread, flippingIndex } = bookStateRef.current;
    if (flippingIndex !== -1 || currentSpread === 0) return;
    playFlipSound();
    setFlippingIndex(0);
    setFlippingDir(-1);
    setCurrentSpread(0);
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
    }
    flipTimeoutRef.current = setTimeout(() => {
      setFlippingIndex(-1);
      flipTimeoutRef.current = null;
    }, 750);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inspectVisible) {
        if (e.key === "ArrowRight") navigateInspect(1);
        if (e.key === "ArrowLeft") navigateInspect(-1);
        if (e.key === "Escape") closeInspect();
      } else if (!editMode) {
        if (e.key === "ArrowRight") turnPage(1);
        if (e.key === "ArrowLeft") turnPage(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectVisible, editMode, navigateInspect, closeInspect, turnPage]);

  if (!mounted) {
    return (
      <div className="w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-center font-pixel text-[#20233F]">
        <style>{`
          @keyframes scrapbook-dot-wave {
            0%, 100% { transform: translateY(0px); opacity: 0.5; }
            50%       { transform: translateY(-6px); opacity: 1; }
          }
          @keyframes border-draw-h {
            from { width: 0; }
            to { width: 100%; }
          }
          @keyframes border-draw-v {
            from { height: 0; }
            to { height: 100%; }
          }
          .scrapbook-loader-card {
            position: relative;
            background: #FFFBFD;
            border-radius: 24px;
            padding: 52px 72px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            box-shadow: 0 8px 32px rgba(255,182,193,0.18);
            border: 4px solid #FFE4E8;
          }
        `}</style>

        {/* Viewport borders progress bar */}
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          <div className="absolute top-0 left-0 h-2 sm:h-3 bg-[#FFB6C1] w-0" style={{ animation: 'border-draw-h 0.55s linear forwards' }} />
          <div className="absolute top-0 right-0 w-2 sm:w-3 bg-[#FFE4A1] h-0" style={{ animation: 'border-draw-v 0.55s linear 0.55s forwards' }} />
          <div className="absolute bottom-0 right-0 h-2 sm:h-3 bg-[#A1C4FD] w-0" style={{ animation: 'border-draw-h 0.55s linear 1.1s forwards' }} />
          <div className="absolute bottom-0 left-0 w-2 sm:w-3 bg-[#B8E6D0] h-0" style={{ animation: 'border-draw-v 0.55s linear 1.65s forwards' }} />
        </div>

        <div className="scrapbook-loader-card">
          {/* Spinning flower + ping star */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="text-5xl text-[#FFD0DC] animate-spin select-none" style={{ animationDuration: '3s' }}>✿</div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-[#FFE4A1] animate-ping select-none" style={{ animationDuration: '2s' }}>✦</div>
          </div>

          {/* Label */}
          <div className="animate-pulse tracking-widest font-bold text-base text-[#20233F]">
            ちょっと待って...
          </div>

          {/* Dots row */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-[#FFB6C1]"
                style={{ animation: `scrapbook-dot-wave 1.2s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalLeaves = appSpreads.length - 1;

  return (
    <div
      className="relative w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-center overflow-visible"
      style={{
        animation: mounted ? "scrapbook-fade-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards" : "none"
      }}
    >
      <style>{`
        @keyframes scrapbook-fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      {/* Fullscreen Image Inspect Modal — Native Scroll Carousel via Portal */}
      {inspectVisible && inspectImage && typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-[99999] bg-[#101223]/95 flex items-center justify-center cursor-zoom-out transition-all duration-300 ${carouselReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          onClick={() => { closeInspect(); }}
          style={{ overscrollBehaviorX: 'none', overscrollBehaviorY: 'none' }}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-[999999] cursor-pointer"
            onClick={(e) => { e.stopPropagation(); closeInspect(); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {/* Navigation Controls on Overlay - REMOVED PER USER REQUEST */}

          <div
            ref={carouselRef}
            className={`w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory items-center px-[50vw] gap-2 sm:gap-4 ${carouselReady ? 'scroll-smooth' : ''} cursor-grab active:cursor-grabbing`}
            style={{ overscrollBehaviorX: 'none', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onWheel={handleCarouselWheel}
            onPointerDown={(e) => {
              carouselDragRef.current.isDragging = true;
              carouselDragRef.current.startX = e.pageX;
              carouselDragRef.current.scrollLeft = carouselRef.current?.scrollLeft || 0;
              if (carouselRef.current) {
                carouselRef.current.style.scrollSnapType = 'none';
                carouselRef.current.style.scrollBehavior = 'auto';
              }
              if (carouselRafRef.current) {
                cancelAnimationFrame(carouselRafRef.current);
                carouselRafRef.current = null;
              }
              carouselTargetScrollRef.current = null;
            }}
            onPointerLeave={() => {
              if (!carouselDragRef.current.isDragging) return;
              carouselDragRef.current.isDragging = false;
              snapToNearestCard();
            }}
            onPointerUp={() => {
              if (!carouselDragRef.current.isDragging) return;
              carouselDragRef.current.isDragging = false;
              snapToNearestCard();
            }}
            onPointerMove={(e) => {
              if (!carouselDragRef.current.isDragging || !carouselRef.current) return;
              e.preventDefault();
              const walk = e.pageX - carouselDragRef.current.startX;
              carouselRef.current.scrollLeft = carouselDragRef.current.scrollLeft - walk;
            }}
          >
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {allImages.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="flex-none snap-center flex items-center justify-center pointer-events-none"
              >
                <div
                  className={`relative max-w-[90vw] sm:max-w-[75vw] max-h-[90vh] p-1.5 sm:p-2 bg-white/95 shadow-[0_10px_40px_rgba(255,190,210,0.4)] rounded-2xl border-2 border-white/60 pointer-events-auto transition-all duration-300 [@media(hover:hover)]:hover:scale-[1.02] cursor-zoom-out flex flex-col items-center group ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                  onClick={() => { closeInspect(); }}
                >
                  {/* Randomized Kawaii Washi Tapes */}
                  {i % 2 === 0 ? (
                    <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#FFD0DC] -rotate-6 shadow-sm z-10 rounded-sm" />
                  ) : (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-4 sm:h-5 bg-[#FFE4A1] rotate-2 shadow-sm z-10 rounded-sm" />
                  )}
                  {i % 3 === 0 ? (
                    <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#A1C4FD] rotate-3 shadow-sm z-10 rounded-sm" />
                  ) : i % 3 === 1 ? (
                    <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#B8E6D0] -rotate-4 shadow-sm z-10 rounded-sm" />
                  ) : null}

                  {/* Randomized Hover Pixel Symbols! */}
                  <div className="absolute -top-6 right-1 text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 [@media(hover:hover)]:hover:scale-125 -translate-y-4 group-hover:translate-y-0 pointer-events-none z-20 font-pixel drop-shadow-md text-[#FFE4A1] animate-bounce">
                    {i % 4 === 0 ? '★' : i % 4 === 1 ? '✦' : i % 4 === 2 ? '⚡' : '☁'}
                  </div>
                  <div className="absolute -bottom-6 left-1 text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 [@media(hover:hover)]:hover:-rotate-12 translate-y-4 group-hover:translate-y-0 pointer-events-none z-20 font-pixel drop-shadow-md text-[#FF8FB3] animate-pulse">
                    {i % 3 === 0 ? '✿' : i % 3 === 1 ? '♪' : '✸'}
                  </div>

                  {/* Inner Photo Frame */}
                  <div className="overflow-hidden rounded-xl border border-white/40 bg-white/20 shadow-sm pointer-events-auto" onContextMenu={(e) => e.stopPropagation()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fullSrc(src)}
                      alt="Memory"
                      className="w-auto h-auto max-w-[85vw] sm:max-w-[70vw] max-h-[80vh] object-contain rounded-lg pointer-events-auto"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = "grid";
                          target.src = gridSrc(src);
                        } else if (target.dataset.fallback === "grid") {
                          target.dataset.fallback = "orig";
                          target.src = src;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 px-4 py-2 bg-[#FFD0DC] border-4 border-[#20233F] shadow-[4px_4px_0_#20233F] font-pixel text-[#20233F] font-bold text-xs sm:text-sm rotate-[4deg] pointer-events-none z-[999999]">
            CLICK ANYWHERE TO CLOSE
          </div>

          {/* Scroll Hint Popup */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#FFD0DC] px-6 py-2 rounded-full text-[#20233F] font-pixel text-xs tracking-wider shadow-[0_4px_12px_rgba(255,182,193,0.4)] border border-white/50 pointer-events-none z-[999999]">
            ✦ SCROLL OR GESTURES TO NAVIGATE ✦
          </div>
        </div>,
        document.body
      )}

      <div
        className="relative w-[95%] max-w-[1300px] aspect-[1.75/1] z-10"
        onWheel={handleBookWheel}
        style={{
          perspective: "3500px",
          transformStyle: "preserve-3d",
          transform: `rotateX(6deg) rotateY(-2deg) ${currentSpread === 0 ? 'translateX(-25%)' : 'translateX(0%)'} translateZ(0)`,
          transition: isReady ? "transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)" : "none"
        }}
      >
        {/* Right Book Base (Thick Stack of Pages) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#FFB6C1] rounded-r-xl border-y-2 border-r-2 border-white/40"
          style={{
            transform: "translateZ(-3px)",
            boxShadow: `
              inset -2px 0 6px rgba(0,0,0,0.05),
              2px 1px 0px #FDFBF7, 2px 2px 0px #E5E0D8, 
              4px 3px 0px #FDFBF7, 4px 4px 0px #E5E0D8, 
              6px 5px 0px #FDFBF7, 6px 6px 0px #E5E0D8, 
              8px 7px 0px #FDFBF7, 8px 8px 0px #E5E0D8, 
              10px 9px 0px #FDFBF7, 10px 10px 0px #E5E0D8, 
              18px 25px 45px rgba(20,10,30,0.2)`
          }}
        />

        {/* Left Book Base Container */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/2 origin-right z-0"
          style={{
            visibility: currentSpread > 0 ? "visible" : "hidden",
            pointerEvents: currentSpread === 0 ? "none" : "auto",
            transform: "rotateY(0deg) translateZ(-2px)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Left Base Background with shadow (Thick Stack of Pages) */}
          <div
            className="absolute inset-0 bg-[#FFB6C1] rounded-l-xl border-y-2 border-l-2 border-white/40"
            style={{
              transform: "translateZ(-3px)",
              boxShadow: `
                inset 2px 0 6px rgba(0,0,0,0.05),
                -2px 1px 0px #FDFBF7, -2px 2px 0px #E5E0D8, 
                -4px 3px 0px #FDFBF7, -4px 4px 0px #E5E0D8, 
                -6px 5px 0px #FDFBF7, -6px 6px 0px #E5E0D8, 
                -8px 7px 0px #FDFBF7, -8px 8px 0px #E5E0D8, 
                -10px 9px 0px #FDFBF7, -10px 10px 0px #E5E0D8, 
                -18px 25px 45px rgba(20,10,30,0.2)`
            }}
          />

          {/* Static Base Left (Spread 0 Left) */}
          <div className="absolute inset-0 bg-[#FFB6C1]" style={{ transform: "translateZ(0px)", backfaceVisibility: 'hidden' }}>
            <PageContent data={appSpreads[0].left} onImageClick={openInspect} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={0} side="left" onTurnPage={turnPage} totalSpreads={appSpreads.length} isCurrentSpread={currentSpread === 0} onGoToCover={goToCover} />
          </div>
        </div>

        {/* Binder Rings (Spine) */}
        <div
          className="absolute left-1/2 top-[5%] bottom-[5%] w-6 sm:w-8 -translate-x-1/2 flex flex-col justify-evenly z-[100] pointer-events-none"
          style={{ transform: "translateZ(10px)" }}
        >
          {Array.from({ length: 9 }).map((_, r) => (
            <div key={r} className="w-full h-3 sm:h-4 bg-[#FFD0DC] border-[3px] border-white rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] relative flex items-center justify-center overflow-hidden">
              <div className="absolute top-0.5 left-1 w-2 h-1 bg-white opacity-80 rounded-full" />
            </div>
          ))}
        </div>

        {/* Spine Crease Shadows (Static) */}
        <div className="absolute right-0 w-1/2 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to left, transparent 85%, rgba(0,0,0,0.08) 100%)", transform: "translateZ(0.1px)" }} />

        {/* Static Base Right (Spread N-1 Right) */}
        <div className="absolute right-0 w-1/2 h-full origin-left bg-[#FFB6C1]" style={{ transform: "translateZ(0px)" }}>
          <PageContent data={appSpreads[appSpreads.length - 1].right} onImageClick={openInspect} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={appSpreads.length - 1} side="right" onTurnPage={turnPage} totalSpreads={appSpreads.length} isCurrentSpread={currentSpread === appSpreads.length - 1} onGoToCover={goToCover} />
        </div>

        {/* Flippable Leaves */}
        {Array.from({ length: totalLeaves }).map((_, i) => {
          const isFlipped = currentSpread > i;
          const isFlipping = flippingIndex === i;

          // Visibility culling: keep active leaves visible to eliminate Z-fighting & repaint jitter
          const isVisible =
            i === currentSpread ||
            i === currentSpread - 1 ||
            (flippingIndex !== -1 && (
              (flippingDir > 0 && i === currentSpread - 2) ||
              (flippingDir < 0 && i === currentSpread + 1)
            ));

          const zIndex = isFlipping ? 50 : 10;
          const renderContent = i >= renderRange.min && i <= renderRange.max;

          const isWillChange = isFlipping || Math.abs(i - currentSpread) <= 1 || Math.abs(i - settledSpread) <= 1;

          const isFrontVisible =
            (!isFlipped && i === currentSpread) ||
            isFlipping ||
            (flippingIndex !== -1 && flippingDir < 0 && i === currentSpread + 1);

          const isBackVisible =
            (isFlipped && i === currentSpread - 1) ||
            isFlipping ||
            (flippingIndex !== -1 && flippingDir > 0 && i === currentSpread - 2);

          return (
            <div
              key={i}
              className="absolute right-0 w-1/2 h-full origin-left"
              onClick={() => {
                if (currentSpread === 0 && i === 0) {
                  turnPage(1);
                }
              }}
              style={{
                zIndex,
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)",
                transition: isReady ? 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                cursor: (currentSpread === 0 && i === 0) ? 'pointer' : 'auto',
                pointerEvents: (isFlipping || (currentSpread === i) || (currentSpread === i + 1) || (currentSpread === 0 && i === 0)) ? "auto" : "none",
                visibility: isVisible ? 'visible' : 'hidden',
                willChange: isWillChange ? 'transform' : 'auto',
              }}
            >
              {/* Front of Leaf (Spread i Right) */}
              <div
                className="absolute inset-0 bg-[#FFB6C1]"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg) translateZ(0.5px)',
                  pointerEvents: isFlipped ? 'none' : 'auto'
                }}
              >
                {/* Spine crease shadow on the left side of the right page */}
                {isFrontVisible && <div className="absolute left-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />}

                {renderContent ? (
                  <PageContent data={appSpreads[i].right} onImageClick={openInspect} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i} side="right" onTurnPage={turnPage} totalSpreads={appSpreads.length} isCurrentSpread={currentSpread === i} onGoToCover={goToCover} />
                ) : null}
              </div>

              {/* Back of Leaf (Spread i+1 Left) */}
              <div
                className="absolute inset-0 bg-[#FFB6C1]"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(0.5px)',
                  pointerEvents: !isFlipped ? 'none' : 'auto'
                }}
              >
                {/* Spine crease shadow on the right side of the left page */}
                {isBackVisible && <div className="absolute right-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />}

                {renderContent ? (
                  <PageContent data={appSpreads[i + 1].left} onImageClick={openInspect} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i + 1} side="left" onTurnPage={turnPage} totalSpreads={appSpreads.length} isCurrentSpread={currentSpread === i + 1} onGoToCover={goToCover} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Hint Text */}
      <div className={`mt-6 sm:mt-10 bg-[#20233F] px-4 py-2 sm:px-6 sm:py-3 rounded-full text-white font-pixel text-[10px] sm:text-xs tracking-widest text-center shadow-[4px_4px_0_rgba(0,0,0,0.1)] border-2 border-white/50 whitespace-nowrap pointer-events-none z-[20] transition-opacity duration-1000 ${currentSpread === 0 ? 'opacity-0' : 'opacity-100'}`}>
        PRESS BUTTONS TO NAVIGATE • CLICK IMAGES TO ENTER FULL VIEW • CLICK ANY
      </div>

      {/* Edit Mode Toggle & Save UI */}
      <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
        {editMode ? (
          <>
            <button
              className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#FFE4A1] text-[#20233F]"
              onClick={handleExportCode}
              title="Copies final SPREADS code to clipboard — paste into source before deploying"
            >
              📋 EXPORT FOR PROD
            </button>
            <button
              className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#B8E6D0] text-[#20233F]"
              onClick={handleSave}
            >
              ✓ DONE
            </button>
          </>
        ) : (
          <button
            className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#FFD0DC] text-[#20233F]"
            onClick={() => setEditMode(true)}
          >
            {'EDIT MODE (FOR VPN ONLY)'}
          </button>
        )}
      </div>

    </div>
  );
}
