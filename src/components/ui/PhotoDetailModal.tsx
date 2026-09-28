"use client";

import React from "react";
import Image from "next/image";

export interface PhotoData {
  id: string;
  title: string;
  caption: string;
  date: string;
  themeColor: string;
  sceneType: string;
  imageSrc: string;
}

interface PhotoDetailModalProps {
  photo: PhotoData | null;
  onClose: () => void;
}

export default function PhotoDetailModal({ photo, onClose }: PhotoDetailModalProps) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo memory detail"
    >
      <div
        className="pixel-window pixel-window--pink max-w-md w-full -rotate-1 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Washi tape */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 washi-tape washi-tape--pink rotate-1 border border-border/20 z-10" />

        {/* Title bar */}
        <div className="pixel-window__bar">
          <div className="pixel-window__dots">
            <span />
            <span />
            <span />
          </div>
          <span>SCRAPBOOK_ENTRY</span>
          <button
            onClick={onClose}
            className="ml-auto w-5 h-5 bg-pink hover:bg-pink-hover border border-white/30 flex items-center justify-center text-dark text-[8px] font-retro cursor-pointer"
            aria-label="Close photo view"
          >
            ✕
          </button>
        </div>

        <div className="pixel-window__content">
          {/* Photo display */}
          <div className="w-full aspect-square border-2 border-border overflow-hidden mb-4 bg-bg-warm flex items-center justify-center p-2">
            {photo.imageSrc ? (
              <Image
                src={photo.imageSrc}
                alt={photo.title}
                width={400}
                height={400}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">
                  {photo.sceneType === "sunset" && "🌅"}
                  {photo.sceneType === "coffee" && "☕"}
                  {photo.sceneType === "stars" && "✨"}
                </span>
                <span className="font-retro text-xs text-dark">{photo.title}</span>
                <span className="font-terminal text-sm text-dark-muted">
                  Recorded: {photo.date}
                </span>
              </div>
            )}
          </div>

          {/* Caption note */}
          <div className="bg-yellow/20 border border-border/20 p-3">
            <p className="font-handwriting text-2xl text-dark font-bold leading-snug">
              &ldquo;{photo.caption}&rdquo;
            </p>
            <p className="font-handwriting text-lg text-dark-muted mt-1">
              — You haven&apos;t changed a bit, still the best troublemaker in town. Happy Birthday! ♡
            </p>
          </div>

          {/* Close button */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="pixel-btn pixel-btn--lavender px-4 py-1.5 font-retro text-[9px]"
            >
              PUT BACK IN SCRAPBOOK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
