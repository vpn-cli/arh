"use client";

import React from "react";

export default function GameboyCartridge() {
  return (
    <>
      {/* ═══ OPAQUE ROTATING COPYRIGHT BADGE (Covers Watermark / Cartridge Seal) ═══ */}
      {/* Locked to 16:9 aspect-ratio video content so it centers exactly on the watermark across all viewports */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none z-[60]">
        <div
          className="relative flex-shrink-0 select-none w-full h-full"
          style={{
            width: "max(100vw, calc(100vh * 16 / 9))",
            height: "max(100vh, calc(100vw * 9 / 16))",
          }}
        >
          <div
            className="w-full h-full relative will-change-transform"
            style={{
              transform: "scale(1.02) translate3d(calc(var(--mx, 0) * -15px), calc(var(--my, 0) * -10px), 0)",
            }}
          >
            <div
              className="absolute flex items-center justify-center drop-shadow-xl"
              style={{
                left: "90.74%",
                top: "84%",
                width: "140px",
                height: "140px",
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Frosted Glass Background Plate */}
              <div className="absolute inset-0 bg-[#0C0A15]/70 backdrop-blur-lg rounded-full shadow-[inset_0_0_25px_rgba(0,0,0,0.9),0_4px_10px_rgba(0,0,0,0.3)] z-0" />

              {/* Rotating Text */}
              <svg
                className="w-[130px] h-[130px] absolute z-10 opacity-90"
                viewBox="0 0 100 100"
                style={{ animation: "spin 15s linear infinite" }}
              >
                <defs>
                  <path
                    id="circlePath"
                    d="M 50, 50
                       m -38, 0
                       a 38,38 0 1,1 76,0
                       a 38,38 0 1,1 -76,0"
                  />
                </defs>
                <text className="font-retro text-[9px] fill-[#FFEBB3] tracking-[0.2em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <textPath href="#circlePath" startOffset="0%">
                    © VPN COPYRIGHT • VPN COPYRIGHT •
                  </textPath>
                </text>
              </svg>

              {/* Center Logo */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className="text-[#FFEBB3] text-4xl font-retro leading-none animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,1)] opacity-80">
                  V
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PARALLAX LAYER 4 (z-[28]): Atmospheric Effects, Butterflies & Pollen
          ═══════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-[28] will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mx, 0) * -25px), calc(var(--my, 0) * -12px), 0)",
        }}
      >
        {/* Background Petals */}
        {[...Array(8)].map((_, i) => (
          <span
            key={`bg-petal-${i}`}
            className="absolute w-[4px] h-[3px] bg-[#ffb7d5] rounded-full animate-petal-drift-bg"
            style={{
              top: `${10 + i * 12}%`,
              left: `${-5 + (i % 3) * 10}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}

        {/* Midground Petals */}
        {[...Array(10)].map((_, i) => (
          <span
            key={`mid-petal-${i}`}
            className="absolute w-[8px] h-[5px] bg-[#ff8eb4] rounded-[40%_60%_70%_30%] shadow-[0_0_4px_rgba(255,142,180,0.4)] animate-petal-drift"
            style={{
              top: `${5 + i * 9}%`,
              left: `${-10 + (i % 4) * 15}%`,
              animationDelay: `${i * 1.1 + 0.5}s`,
            }}
          />
        ))}

        {/* Wind Gust Breeze Lines */}
        <div
          className="absolute top-[28%] left-0 w-64 sm:w-96 h-1 bg-gradient-to-r from-transparent via-white/50 via-yellow-100/40 to-transparent rounded-full animate-wind-gust"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-[48%] left-0 w-72 sm:w-[28rem] h-1.5 bg-gradient-to-r from-transparent via-white/60 via-emerald-100/40 to-transparent rounded-full animate-wind-gust-fast"
          style={{ animationDelay: "2.8s" }}
        />
        <div
          className="absolute top-[68%] left-0 w-80 sm:w-[32rem] h-1 bg-gradient-to-r from-transparent via-yellow-100/50 via-white/40 to-transparent rounded-full animate-wind-gust"
          style={{ animationDelay: "5.2s" }}
        />

        {/* Dandelion Fluffs */}
        <span
          className="absolute top-[20%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="absolute top-[35%] left-0 w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_6px_#ffffff] animate-dandelion-float"
          style={{ animationDelay: "3.8s" }}
        />
        <span
          className="absolute top-[50%] left-0 w-3 h-3 bg-white/95 rounded-full shadow-[0_0_8px_#ffffff] animate-dandelion-float"
          style={{ animationDelay: "7.5s" }}
        />
      </div>

      {/* ═══ EXTREME FOREGROUND CAMERA PETALS (z-[45]) ═══ */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-[45] will-change-transform"
        style={{
          transform: "translate3d(calc(var(--mx, 0) * -85px), calc(var(--my, 0) * -40px), 0)",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <span
            key={`fg-petal-${i}`}
            className="absolute w-[18px] h-[12px] bg-[#ffd6e6]/95 rounded-[50%_50%_30%_70%] shadow-[0_0_12px_rgba(255,255,255,0.6)] animate-petal-drift-fg blur-[4px]"
            style={{
              top: `${10 + i * 15}%`,
              left: `${-15 + (i % 2) * 20}%`,
              animationDelay: `${i * 1.8 + 0.2}s`,
            }}
          />
        ))}

        {/* Flying Leaves */}
        <span className="gb-leaf gb-leaf--big animate-leaf-gust-fast" style={{ top: "12%", animationDelay: "0s" }} />
        <span className="gb-leaf animate-leaf-gust" style={{ top: "31%", animationDelay: "1.8s" }} />
        <span className="gb-leaf gb-leaf--small animate-leaf-gust-slow" style={{ top: "44%", animationDelay: "3.4s" }} />
      </div>

      {/* Prominent Glowing Fireflies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        <span
          className="absolute bottom-[26%] left-[14%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#eab308] animate-firefly-prominent"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="absolute bottom-[38%] left-[22%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a,0_0_20px_#ca8a04] animate-firefly-prominent"
          style={{ animationDelay: "1.6s" }}
        />
        <span
          className="absolute bottom-[16%] left-[28%] w-3 h-3 bg-lime-200 rounded-full shadow-[0_0_12px_#a3e635,0_0_22px_#65a30d] animate-firefly-prominent"
          style={{ animationDelay: "3.2s" }}
        />
        <span
          className="absolute bottom-[32%] left-[42%] w-3.5 h-3.5 bg-yellow-200 rounded-full shadow-[0_0_14px_#fde047,0_0_28px_#facc15] animate-firefly-prominent"
          style={{ animationDelay: "0.8s" }}
        />
        <span
          className="absolute bottom-[22%] left-[52%] w-2.5 h-2.5 bg-yellow-300 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent"
          style={{ animationDelay: "2.4s" }}
        />
        <span
          className="absolute bottom-[44%] left-[62%] w-3 h-3 bg-amber-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#d97706] animate-firefly-prominent"
          style={{ animationDelay: "4.0s" }}
        />
        <span
          className="absolute bottom-[28%] right-[22%] w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_12px_#fde047,0_0_24px_#ca8a04] animate-firefly-prominent"
          style={{ animationDelay: "1.2s" }}
        />
        <span
          className="absolute bottom-[40%] right-[14%] w-2.5 h-2.5 bg-lime-200 rounded-full shadow-[0_0_10px_#a3e635] animate-firefly-prominent"
          style={{ animationDelay: "2.8s" }}
        />
        <span
          className="absolute bottom-[18%] right-[8%] w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-[0_0_14px_#fde047,0_0_26px_#eab308] animate-firefly-prominent"
          style={{ animationDelay: "3.6s" }}
        />
        <span
          className="absolute bottom-[48%] right-[32%] w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_10px_#fef08a] animate-firefly-prominent"
          style={{ animationDelay: "4.8s" }}
        />
      </div>
    </>
  );
}
