"use client";

import React, { useRef, useState } from "react";
import { sfx } from "@/lib/audio";

export default function TheEdit() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        sfx.pop();
      } else {
        videoRef.current.play();
        sfx.select();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-12 sm:my-16 px-4 relative z-10">
      {/* Milestone tag */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="font-retro text-[9px] uppercase tracking-[3px] text-[#C24075] font-bold bg-[#FFF5F8] px-3 py-1 rounded-full border border-[#FF8FB3]/40 shadow-xs">
          PHASE 03 ✦ THE EDIT
        </span>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-pixel text-2xl sm:text-3xl font-bold text-[#2D1B36] tracking-wider mb-1">
          THE EDIT
        </h2>
        <p className="font-baloo text-xs sm:text-sm text-[#6E5D78] font-semibold tracking-wide">
          proof that we actually hang out outside the internet
        </p>
      </div>

      <div className="relative mx-auto max-w-2xl mt-24 sm:mt-28">
        {/* Hello Kitty Peeking over the TV Frame */}
        <div className="absolute -top-[70px] sm:-top-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center z-0 pointer-events-none drop-shadow-[0_4px_8px_rgba(58,36,64,0.15)]">
          {/* Authentic Pixel Art Hello Kitty */}
          <svg
            width="120"
            height="80"
            viewBox="0 0 18 12"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform hover:scale-105"
          >
            {[
              "  00          00  ",
              " 0110000000000110 ",
              "011111111111111110",
              "011111111111122110",
              "011111111111222210",
              "011111111111122110",
              "001110111101111100",
              "001110111101111100",
              "001111133111111100",
              "011111133111111110",
              " 0111111111111110 ",
              "  00000000000000  ",
            ].map((row, y) =>
              row.split("").map((char, x) =>
                char !== " " ? (
                  <rect
                    key={`hk-${x}-${y}`}
                    x={x}
                    y={y}
                    width="1.05"
                    height="1.05"
                    fill={
                      {
                        "0": "#2D1B36",
                        "1": "#FFFFFF",
                        "2": "#FF6584",
                        "3": "#FFEAA7",
                      }[char]
                    }
                  />
                ) : null
              )
            )}
          </svg>

          {/* Cute Pixel Paws holding the frame */}
          <div className="absolute -bottom-2 -left-4 -rotate-12 z-20">
            <svg
              width="36"
              height="30"
              viewBox="0 0 6 5"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xs"
            >
              {[
                " 0000 ",
                "011110",
                "011110",
                "010010",
                " 0000 ",
              ].map((row, y) =>
                row.split("").map((char, x) =>
                  char !== " " ? (
                    <rect
                      key={`pl-${x}-${y}`}
                      x={x}
                      y={y}
                      width="1.05"
                      height="1.05"
                      fill={{ "0": "#2D1B36", "1": "#FFFFFF" }[char]}
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-4 rotate-12 z-20">
            <svg
              width="36"
              height="30"
              viewBox="0 0 6 5"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-xs -scale-x-100"
            >
              {[
                " 0000 ",
                "011110",
                "011110",
                "010010",
                " 0000 ",
              ].map((row, y) =>
                row.split("").map((char, x) =>
                  char !== " " ? (
                    <rect
                      key={`pr-${x}-${y}`}
                      x={x}
                      y={y}
                      width="1.05"
                      height="1.05"
                      fill={{ "0": "#2D1B36", "1": "#FFFFFF" }[char]}
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
        </div>

        {/* Vintage Pastel Cinema TV Chassis */}
        <div className="bg-[#FFFDF8] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-3 border-[#3A2440] shadow-[8px_8px_0_#3A2440] relative z-10">
          {/* Screen Bezel */}
          <div className="relative bg-[#FFEFF4] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-[#3A2440]/20">
            {/* The Screen */}
            <div className="relative aspect-video bg-[#1F1724] rounded-lg sm:rounded-xl overflow-hidden group border-2 border-[#3A2440]">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover relative z-10 transition-all duration-700 ${
                  isPlaying ? "scale-100" : "scale-105 saturate-[0.85]"
                }`}
                loop
                playsInline
                poster="/images/loading_bg_pixel.jpg"
              >
                <source src="/videos/real_vid.mp4" type="video/mp4" />
                <source src="/Arh.mp4" type="video/mp4" />
              </video>

              {/* Play / Pause Interactive Overlay */}
              <div
                className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 ${
                  isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                }`}
              >
                <div
                  className="absolute inset-0 bg-[#2D1B36]/30 backdrop-blur-[2px]"
                  onClick={togglePlay}
                />
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFF0F5] border-3 border-[#3A2440] flex items-center justify-center text-[#FF4F9A] hover:scale-110 active:scale-95 transition-transform z-40 shadow-[4px_4px_0_#3A2440] cursor-pointer"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <span
                    className={`text-2xl sm:text-3xl font-pixel ${
                      isPlaying ? "ml-0" : "ml-1"
                    }`}
                  >
                    {isPlaying ? "II" : "▶"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Note on Corner */}
          <div className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 w-24 h-24 bg-[#FFEAA7] rotate-6 shadow-[3px_3px_0_#3A2440] p-2 flex flex-col items-center justify-center pointer-events-none border-2 border-[#3A2440] rounded-sm">
            <span className="font-retro text-[9px] text-[#4A3510] text-center font-bold uppercase leading-tight">
              oscar winner tbh
            </span>
            <span className="text-lg mt-0.5">💖</span>
            {/* Washi tape strip */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-[#FF8FB3]/70 rotate-2 border border-black/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
