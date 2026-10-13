"use client";

import React from "react";

export default function TheEditHelloKitty() {
  return (
    <div className="absolute -top-[70px] sm:-top-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center z-0 pointer-events-none drop-shadow-[0_4px_8px_rgba(58,36,64,0.15)]">
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
                fill={{ "0": "#2D1B36", "1": "#FFFFFF", "2": "#FF6584", "3": "#FFEAA7" }[char]}
              />
            ) : null
          )
        )}
      </svg>

      {/* Cute Pixel Paws */}
      <div className="absolute -bottom-2 -left-4 -rotate-12 z-20">
        <svg width="36" height="30" viewBox="0 0 6 5" xmlns="http://www.w3.org/2000/svg">
          {[" 0000 ", "011110", "011110", "010010", " 0000 "].map((row, y) =>
            row.split("").map((char, x) =>
              char !== " " ? (
                <rect key={`pl-${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={{ "0": "#2D1B36", "1": "#FFFFFF" }[char]} />
              ) : null
            )
          )}
        </svg>
      </div>
      <div className="absolute -bottom-2 -right-4 rotate-12 z-20">
        <svg width="36" height="30" viewBox="0 0 6 5" xmlns="http://www.w3.org/2000/svg" className="-scale-x-100">
          {[" 0000 ", "011110", "011110", "010010", " 0000 "].map((row, y) =>
            row.split("").map((char, x) =>
              char !== " " ? (
                <rect key={`pr-${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={{ "0": "#2D1B36", "1": "#FFFFFF" }[char]} />
              ) : null
            )
          )}
        </svg>
      </div>
    </div>
  );
}
