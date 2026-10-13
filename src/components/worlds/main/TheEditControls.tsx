"use client";

import React from "react";

interface TheEditControlsProps {
  isFullscreen: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  showControls: boolean;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  timeDisplayRef: React.RefObject<HTMLSpanElement | null>;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onReplay: () => void;
}

export default function TheEditControls({
  isFullscreen,
  isPlaying,
  isMuted,
  showControls,
  progressBarRef,
  timeDisplayRef,
  onTogglePlay,
  onToggleFullscreen,
  onToggleMute,
  onSeek,
  onReplay,
}: TheEditControlsProps) {
  return (
    <div
      className={`absolute bottom-0 inset-x-0 z-40 transition-all duration-300 select-none ${
        isFullscreen
          ? "px-6 sm:px-14 pb-5 pt-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          : "px-2.5 sm:px-3 pb-2 pt-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
      } ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
    >
      {/* Sleek, Low-Profile Scrubber with Cute Heart Thumb */}
      <div
        className="w-full h-1 hover:h-1.5 bg-white/25 hover:bg-white/35 rounded-full cursor-pointer relative transition-all group/scrubber mb-1.5 backdrop-blur-xs"
        onClick={onSeek}
        title="Seek video"
      >
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-[#FF8FB3] via-[#FF6584] to-[#FF4F9A] rounded-full transition-all relative w-0 shadow-[0_0_8px_#FF8FB3]"
        >
          {/* Cute Little Heart Scrubber Thumb */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white border border-[#FF4F9A] rounded-full shadow-md flex items-center justify-center scale-0 group-hover/scrubber:scale-100 transition-transform">
            <span className="text-[6px] text-[#FF4F9A] leading-none select-none">♥</span>
          </div>
        </div>
      </div>

      {/* Slim Cute Controls Row */}
      <div className="flex items-center justify-between text-white text-xs gap-1.5">
        {/* Left: Play/Pause, Cute Replay Button, Timestamp */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Strawberry Play / Pause Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-tr from-[#FF6584] to-[#FF8FB3] text-white border border-white/50 shadow-xs hover:scale-110 active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Cute Compact Replay Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReplay();
            }}
            className="px-2.5 h-6.5 sm:h-7 rounded-full bg-[#FFF0F5]/90 hover:bg-[#FFE0EC] active:scale-95 text-[#C24075] border border-[#FF8FB3]/60 shadow-xs hover:scale-105 transition-all flex items-center gap-1 cursor-pointer font-retro text-[8px] sm:text-[9px] font-bold tracking-wider"
            title="Replay from start (R)"
            aria-label="Replay video"
          >
            <svg className="w-3 h-3 fill-[#C24075]" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            <span>REPLAY ✨</span>
          </button>

          {/* Cute Timestamp Display */}
          <div className="hidden xs:flex items-center gap-1 font-pixel text-[8px] sm:text-[9px] text-[#FFEAA7] bg-black/40 px-2 py-0.5 rounded-full border border-white/10 tracking-wider select-none">
            <span className="text-[#FF8FB3] text-[7px]">♥</span>
            <span ref={timeDisplayRef}>0:00 / 0:00</span>
          </div>
        </div>

        {/* Right: Audio Mute & Cute Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cute Sound / Mute Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white/10 hover:bg-[#FF8FB3]/25 border border-white/25 hover:border-[#FF8FB3] text-white hover:text-[#FF8FB3] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
            title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.46 4.46H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>

          {/* Cute Jewel Fullscreen Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className={`group relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-90 ${
              isFullscreen
                ? "bg-[#FFEAA7]/30 border border-[#FFEAA7] text-[#FFEAA7] hover:bg-[#FFEAA7]/50 shadow-[0_0_8px_rgba(255,234,167,0.5)]"
                : "bg-[#FFF0F5]/15 hover:bg-[#FF8FB3]/30 border border-[#FF8FB3]/50 hover:border-[#FF8FB3] text-[#FFEAA7] hover:text-white shadow-[0_0_6px_rgba(255,143,179,0.3)] hover:scale-110"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc / F)" : "Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
