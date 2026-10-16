"use client";

import React from "react";

interface TheEditTvHardwareProps {
  isPlaying: boolean;
  hasStarted: boolean;
  isMuted?: boolean;
  onToggleFullscreen: () => void;
  onToggleMute?: () => void;
  onTogglePlay?: () => void;
  onReplay?: () => void;
}

export default function TheEditTvHardware({
  isPlaying,
  hasStarted,
  isMuted = false,
  onToggleFullscreen,
  onToggleMute,
  onTogglePlay,
  onReplay,
}: TheEditTvHardwareProps) {
  return (
    <div className="sm:w-16 flex sm:flex-col items-center justify-between sm:justify-center gap-2.5 sm:gap-3 py-2 px-2 sm:px-1.5 bg-[#F7F2E6] rounded-2xl border-2 border-[#3A2440]/30 shadow-inner select-none">
      {/* Status LED Jewel */}
      <div
        className="w-4 h-4 rounded-full bg-[#E5DBC7] border border-[#3A2440]/40 flex items-center justify-center shadow-inner"
        title={isPlaying ? "Status: Playing" : hasStarted ? "Status: Paused" : "Status: Ready"}
      >
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isPlaying
              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
              : hasStarted
              ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
              : "bg-[#FF6584] shadow-[0_0_6px_#FF6584]"
          }`}
        />
      </div>

      {/* Tactile Fullscreen Push-Button */}
      <button
        type="button"
        data-cursor="pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFullscreen();
        }}
        className="group relative w-8 h-8 rounded-xl bg-gradient-to-b from-[#FFEAA7] to-[#F7D674] hover:from-[#FFF1BC] hover:to-[#E8C55A] active:from-[#E8C55A] active:to-[#D4B34A] text-[#3A2440] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
        title="Toggle Fullscreen (F)"
        aria-label="Toggle Fullscreen"
      >
        <svg
          className="w-4 h-4 fill-current group-hover:scale-110 transition-transform"
          viewBox="0 0 24 24"
        >
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
        </svg>
      </button>

      {/* Tactile Replay Button */}
      {onReplay && (
        <button
          type="button"
          data-cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            onReplay();
          }}
          className="group relative w-8 h-8 rounded-xl bg-[#FFF0F5] hover:bg-[#FFE0EC] active:bg-[#FFD0E2] text-[#FF4F9A] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          title="Replay Video (R)"
          aria-label="Replay Video"
        >
          <svg className="w-3.5 h-3.5 fill-current group-hover:-rotate-45 transition-transform" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </button>
      )}

      {/* Tactile Sound / Mute Button */}
      {onToggleMute && (
        <button
          type="button"
          data-cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="group relative w-8 h-8 rounded-xl bg-[#EFE6D5] hover:bg-[#E5DBC7] active:bg-[#DACDB8] text-[#3A2440] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          title={isMuted ? "Unmute Sound (M)" : "Mute Sound (M)"}
          aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.46 4.46H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      )}

      {/* Tactile Play / Pause Button */}
      {onTogglePlay && (
        <button
          type="button"
          data-cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="group relative w-8 h-8 rounded-xl bg-[#EFE6D5] hover:bg-[#E5DBC7] active:bg-[#DACDB8] text-[#3A2440] border-2 border-[#3A2440] shadow-[2px_2px_0_#3A2440] hover:shadow-[1px_1px_0_#3A2440] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Speaker Acoustic Grille Vents */}
      <div className="flex sm:flex-col gap-1 py-1">
        <div className="w-5 sm:w-6 h-0.5 bg-[#3A2440]/25 rounded-full" />
        <div className="w-5 sm:w-6 h-0.5 bg-[#3A2440]/25 rounded-full" />
        <div className="w-5 sm:w-6 h-0.5 bg-[#3A2440]/25 rounded-full" />
      </div>
    </div>
  );
}
