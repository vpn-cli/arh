"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
const sfx: any = { select: () => { }, hover: () => { }, pop: () => { }, move: () => { }, error: () => { } };

interface BentoItem {
  src: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  tapeColor?: string;
  tapeAngle?: number;
  sticker?: "star" | "heart" | "flower" | "sparkle";
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

// 5 Curated Spreads of Memories (10 Pages total)
const SPREADS: SpreadData[] = [
  // Spread 1 (Pages 1 & 2)
  {
    left: {
      pageTitle: "FAVORITE SNAPSHOTS",
      items: [
        { src: "/arh/worthy/IMG_20250303_001446.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFD0DC", tapeAngle: -4, sticker: "sparkle" },
        { src: "/arh/IMG-20240928-WA0048.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 5, sticker: "star" },
        { src: "/arh/IMG-20241016-WA0005.jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: -3 },
        { src: "/arh/worthy/IMG-20241101-WA0219.jpg", col: 0, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 6 },
        { src: "/arh/IMG-20241101-WA0178.jpg", col: 1, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: -2, sticker: "heart" },
      ]
    },
    right: {
      pageTitle: "GOLDEN DAYS",
      items: [
        { src: "/arh/worthy/IMG-20240930-WA0088.jpg", col: 0, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 4 },
        { src: "/arh/IMG_20240924_010327.jpg", col: 1, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#B8E6D0", tapeAngle: -5, sticker: "sparkle" },
        { src: "/arh/worthy/IMG20240427175950.jpg", col: 0, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -3, sticker: "flower" },
        { src: "/arh/IMG-20260122-WA0006.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 3 },
        { src: "/arh/IMG-20250311-WA0066.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -4, sticker: "star" },
      ]
    }
  },
  // Spread 2 (Pages 3 & 4)
  {
    left: {
      pageTitle: "GOOD VIBES ONLY",
      items: [
        { src: "/arh/worthy/IMG_20241020_013013.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: 3, sticker: "heart" },
        { src: "/arh/IMG-20250303-WA0010.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 2, tapeColor: "#FFD0DC", tapeAngle: -6 },
        { src: "/arh/worthy/IMG_20250621_222805.jpg", col: 0, row: 1, colSpan: 2, rowSpan: 2, tapeColor: "#FFE4A1", tapeAngle: 4, sticker: "sparkle" },
        { src: "/arh/IMG-20250325-WA0153.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -2, sticker: "star" },
      ]
    },
    right: {
      pageTitle: "THE ARCHIVE",
      items: [
        { src: "/arh/worthy/IMG_20250724_202916.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#DFD5F5", tapeAngle: -4, sticker: "flower" },
        { src: "/arh/IMG-20250701-WA0008.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: 5 },
        { src: "/arh/worthy/IMG20250301065115.jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: -3, sticker: "heart" },
        { src: "/arh/IMG-20251102-WA0028.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 2 },
        { src: "/arh/IMG-20251218-WA0023.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -5, sticker: "sparkle" },
      ]
    }
  },
  // Spread 3 (Pages 5 & 6)
  {
    left: {
      pageTitle: "UNFILTERED MOMENTS",
      items: [
        { src: "/arh/worthy/IMG_20260924_033018.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFD0DC", tapeAngle: -3, sticker: "star" },
        { src: "/arh/IMG-20260101-WA0004.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 4 },
        { src: "/arh/IMG-20260507-WA0008.jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: -4, sticker: "flower" },
        { src: "/arh/IMG-20241101-WA0224.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 2 },
        { src: "/arh/IMG-20241101-WA0235.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -5, sticker: "heart" },
      ]
    },
    right: {
      pageTitle: "TIME CAPSULE",
      items: [
        { src: "/arh/worthy/IMG-20241127-WA0002.jpg", col: 0, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 3, sticker: "sparkle" },
        { src: "/arh/IMG20240406002757.jpg", col: 1, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFD0DC", tapeAngle: -4 },
        { src: "/arh/IMG20250325225353.jpg", col: 0, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -2, sticker: "star" },
        { src: "/arh/worthy/IMG-20250118-WA0009.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: 4 },
        { src: "/arh/IMG_20240409_021609.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -3, sticker: "flower" },
      ]
    }
  },
  // Spread 4 (Pages 7 & 8)
  {
    left: {
      pageTitle: "RANDOM ADVENTURES",
      items: [
        { src: "/arh/IMG-20250719-WA0011.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFE4A1", tapeAngle: -3, sticker: "heart" },
        { src: "/arh/IMG-20251207-WA0053.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 4 },
        { src: "/arh/IMG-20260712-WA0006.jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: -4, sticker: "sparkle" },
        { src: "/arh/worthy/IMG_20240907_00235820.jpeg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 3 },
        { src: "/arh/IMG-20250311-WA0068.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -2, sticker: "star" },
      ]
    },
    right: {
      pageTitle: "CHAOS & SMILES",
      items: [
        { src: "/arh/IMG20250301114906.jpg", col: 0, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 3 },
        { src: "/arh/IMG20250924002702.jpg", col: 1, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#B8E6D0", tapeAngle: -4, sticker: "flower" },
        { src: "/arh/IMG20251020234739.jpg", col: 0, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -3, sticker: "sparkle" },
        { src: "/arh/IMG_20250112_030247.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 2 },
        { src: "/arh/IMG-20241127-WA0084(1).jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: -4, sticker: "heart" },
      ]
    }
  },
  // Spread 5 (Pages 9 & 10)
  {
    left: {
      pageTitle: "MEMORIES & MORE",
      items: [
        { src: "/arh/Screenshot_2026-03-06-01-43-35-36_6012fa4d4ddec268fc5c7112cbb265e7.jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#B8E6D0", tapeAngle: -3, sticker: "star" },
        { src: "/arh/Screenshot_2026-09-13-15-14-19-25_6012fa4d4ddec268fc5c7112cbb265e7.jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 4 },
        { src: "/arh/Screenshot_2026-09-13-16-33-45-66_6012fa4d4ddec268fc5c7112cbb265e7.jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -2, sticker: "heart" },
        { src: "/arh/Screenshot_2026-09-14-12-57-33-77_6012fa4d4ddec268fc5c7112cbb265e7.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 3 },
        { src: "/arh/worthy/IMG-20260210-WA0004.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -4, sticker: "sparkle" },
      ]
    },
    right: {
      pageTitle: "SPECIAL DAYS",
      items: [
        { src: "/arh/worthy/_storage_emulated_0_DCIM_.convert_tmp_files_IMG20240906220404_20260929185757.jpg", col: 0, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 3 },
        { src: "/arh/worthy/_storage_emulated_0_DCIM_.convert_tmp_files_IMG20240928212639_20260929185757.jpg", col: 1, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFD0DC", tapeAngle: -4, sticker: "flower" },
        { src: "/arh/_storage_emulated_0_DCIM_.convert_tmp_files_IMG20240818224123_20260929185759.jpg", col: 0, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: -3, sticker: "star" },
        { src: "/arh/_storage_emulated_0_DCIM_.convert_tmp_files_IMG20240901185634_20260929185757.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 4 },
        { src: "/arh/_storage_emulated_0_DCIM_.convert_tmp_files_IMG20240928213108_20260929185757.jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -3, sticker: "heart" },
      ]
    }
  },
  // Spread 6 (Pages 11 & 12)
  {
    left: {
      pageTitle: "MORE MEMORIES",
      items: [
        { src: "/arh/IMG_1914.PNG", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#FFE4A1", tapeAngle: -3, sticker: "heart" },
        { src: "/arh/a70f8250-73fc-4fb0-aff9-5f85e237c3f2.JPG", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 4 },
        { src: "/arh/b7525aff-5c10-407d-8f19-e502b0350bda.JPG", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#B8E6D0", tapeAngle: -4, sticker: "sparkle" },
        { src: "/arh/id.jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 3 },
        { src: "/arh/lp_image (1).jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -2, sticker: "star" },
      ]
    },
    right: {
      pageTitle: "THE ARCHIVE CONTINUES",
      items: [
        { src: "/arh/lp_image (2).jpg", col: 0, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 3 },
        { src: "/arh/lp_image (4).jpg", col: 1, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#B8E6D0", tapeAngle: -4, sticker: "flower" },
        { src: "/arh/lp_image (5).jpg", col: 0, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: -3, sticker: "sparkle" },
        { src: "/arh/lp_image (8).jpg", col: 0, row: 2, colSpan: 2, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: 2 },
        { src: "/arh/worthy/lp_image (3).jpg", col: 2, row: 2, colSpan: 1, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: -4, sticker: "heart" },
      ]
    }
  },
  // Spread 7 (Pages 13 & 14)
  {
    left: {
      pageTitle: "FINAL SNAPS",
      items: [
        { src: "/arh/worthy/lp_image (6).jpg", col: 0, row: 0, colSpan: 2, rowSpan: 2, tapeColor: "#B8E6D0", tapeAngle: -3, sticker: "star" },
        { src: "/arh/worthy/lp_image (7).jpg", col: 2, row: 0, colSpan: 1, rowSpan: 1, tapeColor: "#FFE4A1", tapeAngle: 4 },
        { src: "/arh/worthy/lp_image (9).jpg", col: 2, row: 1, colSpan: 1, rowSpan: 1, tapeColor: "#DFD5F5", tapeAngle: -2, sticker: "heart" },
        { src: "/arh/worthy/lp_image.jpg", col: 0, row: 2, colSpan: 3, rowSpan: 1, tapeColor: "#FFD0DC", tapeAngle: 3 },
      ]
    },
    right: {
      pageTitle: "THE END ✦",
      items: []
    }
  }
];


const Sticker = ({ type }: { type: string }) => {
  if (type === "star") return <svg width="36" height="36" viewBox="0 0 32 32"><path d="M16 2l4 10h10l-8 7 3 11-9-7-9 7 3-11-8-7h10z" fill="#FFD98A" stroke="#20233F" strokeWidth="2" /></svg>;
  if (type === "heart") return <svg width="36" height="36" viewBox="0 0 32 32"><path d="M16 28s-14-10-14-18c0-4.5 4-8 8-8 3 0 5.5 2 6 5 .5-3 3-5 6-5 4 0 8 3.5 8 8 0 8-14 18-14 18z" fill="#FF8FB3" stroke="#20233F" strokeWidth="2" /></svg>;
  if (type === "sparkle") return <svg width="36" height="36" viewBox="0 0 32 32"><path d="M16 2q0 14 14 14q-14 0-14 14q0-14-14-14q14 0 14-14z" fill="#FFE4A1" stroke="#20233F" strokeWidth="2" /></svg>;
  if (type === "flower") return <svg width="36" height="36" viewBox="0 0 32 32"><circle cx="16" cy="6" r="5" fill="#DFD5F5" stroke="#20233F" strokeWidth="2" /><circle cx="16" cy="26" r="5" fill="#DFD5F5" stroke="#20233F" strokeWidth="2" /><circle cx="6" cy="16" r="5" fill="#DFD5F5" stroke="#20233F" strokeWidth="2" /><circle cx="26" cy="16" r="5" fill="#DFD5F5" stroke="#20233F" strokeWidth="2" /><circle cx="16" cy="16" r="4" fill="#FFD98A" stroke="#20233F" strokeWidth="2" /></svg>;
  return null;
}

function DraggableCropImage({ item, onImageClick, positions, setPosAbsolute, onCropEnd, editMode, isSelected, onSelect }: any) {
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

  return (
    <div
      className={`relative w-full h-full bg-white overflow-hidden cursor-pointer group transition-all duration-500 ease-out hover:scale-[1.05] hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(255,182,193,0.4)] hover:z-20 ${isSelected ? 'ring-4 ring-[#FF8FB3] scale-95 opacity-80' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={editMode ? handlePointerMove : undefined}
      onPointerUp={editMode ? handlePointerUp : undefined}
      onPointerCancel={editMode ? handlePointerUp : undefined}
      style={{ touchAction: editMode ? 'none' : 'auto' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt="memory"
        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        style={{
          objectPosition: `${currentX}% ${currentY}%`
        }}
        draggable={false}
      />
      <div className="absolute inset-0 bg-[#FFF0DC]/10 mix-blend-multiply pointer-events-none" />

      {/* Inner 3D Shading on images to make them feel embedded */}
      <div className="absolute inset-0 shadow-[inset_1px_2px_4px_rgba(0,0,0,0.1)] pointer-events-none" />
    </div>
  );
}

function PageContent({
  data, onImageClick, positions, setPosAbsolute, onCropEnd, editMode, selectedFrame, onFrameClick, spreadIdx, side
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
  side: 'left' | 'right'
}) {
  return (
    <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden" style={{ backgroundColor: "#FDFBF7" }}>
      {/* Cute Pastel Pattern overlay */}
      <div className="absolute inset-0 opacity-100 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFE4A1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

      {data.pageTitle && (
        <h2 className="relative font-pixel text-[#FF8FB3] text-lg sm:text-2xl font-bold mb-4 z-10 text-center tracking-widest uppercase drop-shadow-[2px_2px_0_white]">
          {data.pageTitle}
        </h2>
      )}

      <div className="flex-1 relative z-10 w-full">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4">
          {data.items.map((item, idx) => (
            <div
              key={idx}
              className="relative p-1.5 sm:p-2 bg-white shadow-[0_8px_20px_rgba(255,182,193,0.3)] rounded-sm group hover:rotate-1 transition-transform duration-500"
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
                   className="absolute -top-3 left-1/2 w-12 sm:w-16 h-5 z-20 opacity-80 mix-blend-multiply drop-shadow-sm pointer-events-none"
                   style={{ 
                     backgroundColor: item.tapeColor, 
                     transform: `translateX(-50%) rotate(${item.tapeAngle || 0}deg)`,
                     borderLeft: '3px dotted rgba(255,255,255,0.7)',
                     borderRight: '3px dotted rgba(255,255,255,0.7)'
                   }}
                 />
              )}

              {item.sticker && (
                 <div className="absolute -bottom-5 -right-5 z-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 pointer-events-none">
                   <Sticker type={item.sticker} />
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ThreeDScrapbook() {
  const [appSpreads, setAppSpreads] = useState<SpreadData[]>(SPREADS);
  const [editMode, setEditMode] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<{ spreadIdx: number, side: 'left' | 'right', itemIdx: number } | null>(null);

  useEffect(() => {
    // Load previously saved layout from localStorage (persists across refreshes while editing locally)
    const saved = localStorage.getItem('scrapbook_spreads');
    if (saved) {
      try {
        let savedSpreads = JSON.parse(saved);

        // Active fix: correct the broken path if it got saved in their local storage
        for (let sIdx = 0; sIdx < savedSpreads.length; sIdx++) {
          for (const side of ['left', 'right'] as const) {
            for (const item of savedSpreads[sIdx][side].items) {
              if (item.src === '/arh/worthy/IMG_20250112_030247.jpg') {
                item.src = '/arh/IMG_20250112_030247.jpg';
              }
              // Also ensure any cached .HEIC paths are pointed to the newly converted .jpg files
              if (item.src.endsWith('.HEIC')) {
                item.src = item.src.replace('.HEIC', '.jpg');
              }
            }
          }
        }

        // Merge: If we added new pages in the code, append them to their saved layout
        if (savedSpreads.length < SPREADS.length) {
          const missingSpreads = SPREADS.slice(savedSpreads.length);
          savedSpreads = [...savedSpreads, ...missingSpreads];
        }

        setAppSpreads(savedSpreads);
      } catch (e) { }
    }
  }, []);

  const [currentSpread, setCurrentSpread] = useState(0);
  const [flippingIndex, setFlippingIndex] = useState(-1);
  const [flippingDir, setFlippingDir] = useState(0);
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Fullscreen image inspect refs & state
  const overlayRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [inspectVisible, setInspectVisible] = useState(false);

  const allImages = React.useMemo(() => {
    return appSpreads.flatMap(s => [...s.left.items, ...s.right.items].map(i => i.src));
  }, [appSpreads]);

  const openInspect = useCallback((src: string | null) => {
    if (!src) return;
    setInspectImage(src);
    setInspectVisible(true);

    // Position carousel to the correct image after it renders
    setTimeout(() => {
      if (carouselRef.current) {
        const idx = allImages.indexOf(src);
        if (idx !== -1) {
          const el = carouselRef.current.children[idx + 1] as HTMLElement; // +1 to skip style tag
          if (el) {
            carouselRef.current.scrollLeft = el.offsetLeft - (window.innerWidth / 2) + (el.offsetWidth / 2);
          }
        }
      }
    }, 50);
  }, [allImages]);

  const closeInspect = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
      overlayRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        setInspectVisible(false);
        setInspectImage(null);
      }, 300);
    } else {
      setInspectVisible(false);
      setInspectImage(null);
    }
  }, []);

  const navigateInspect = useCallback((dir: number) => {
    if (carouselRef.current) {
      sfx.select();
      // Scroll by roughly 35% of the screen width to safely push the snap point to the next/prev image
      carouselRef.current.scrollBy({ left: dir * (window.innerWidth * 0.35), behavior: 'smooth' });
    }
  }, []);

  const setPosAbsolute = (src: string, x: number, y: number) => {
    setPositions(prev => ({ ...prev, [src]: { x, y } }));
  };

  const handleCropEnd = (src: string, x: number, y: number) => {
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
      localStorage.setItem('scrapbook_spreads', JSON.stringify(newSpreads));
      return newSpreads;
    });
  };

  const handleFrameClick = (spreadIdx: number, side: 'left' | 'right', itemIdx: number) => {
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
  };

  const handleSave = () => {
    // Apply all crop positions from the drag state into the spreads
    const newSpreads = JSON.parse(JSON.stringify(appSpreads));
    for (let sIdx = 0; sIdx < newSpreads.length; sIdx++) {
      for (const side of ['left', 'right'] as const) {
        for (const item of newSpreads[sIdx][side].items) {
          if (positions[item.src]) {
            item.pos = `${Math.round(positions[item.src].x)}% ${Math.round(positions[item.src].y)}%`;
          }
        }
      }
    }
    setAppSpreads(newSpreads);
    localStorage.setItem('scrapbook_spreads', JSON.stringify(newSpreads));
    setEditMode(false);
  };

  const handleExportCode = () => {
    // Build finalized spreads with all current crop positions baked in
    const finalSpreads = JSON.parse(JSON.stringify(appSpreads));
    for (let sIdx = 0; sIdx < finalSpreads.length; sIdx++) {
      for (const side of ['left', 'right'] as const) {
        for (const item of finalSpreads[sIdx][side].items) {
          if (positions[item.src]) {
            item.pos = `${Math.round(positions[item.src].x)}% ${Math.round(positions[item.src].y)}%`;
          }
        }
      }
    }

    // Pretty-print as a TypeScript constant ready to paste into source
    const lines: string[] = ['const SPREADS: SpreadData[] = ['];
    finalSpreads.forEach((spread: SpreadData, sIdx: number) => {
      lines.push(`  // Spread ${sIdx + 1}`);
      lines.push('  {');
      for (const side of ['left', 'right'] as const) {
        const page = spread[side];
        lines.push(`    ${side}: {`);
        if (page.pageTitle) lines.push(`      pageTitle: "${page.pageTitle}",`);
        lines.push('      items: [');
        page.items.forEach((item: any) => {
          const parts: string[] = [
            `src: "${item.src}"`,
            `col: ${item.col}`,
            `row: ${item.row}`,
            `colSpan: ${item.colSpan}`,
            `rowSpan: ${item.rowSpan}`,
          ];
          if (item.tapeColor) parts.push(`tapeColor: "${item.tapeColor}"`);
          if (item.tapeAngle !== undefined) parts.push(`tapeAngle: ${item.tapeAngle}`);
          if (item.sticker) parts.push(`sticker: "${item.sticker}"`);
          if (item.pos) parts.push(`pos: "${item.pos}"`);
          lines.push(`        { ${parts.join(', ')} },`);
        });
        lines.push('      ]');
        lines.push('    },');
      }
      lines.push(`  }${sIdx < finalSpreads.length - 1 ? ',' : ''}`);
    });
    lines.push('];');

    const code = lines.join('\n');
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ SPREADS code copied to clipboard!\n\nPaste it over the const SPREADS array in ThreeDScrapbook.tsx before deploying to Vercel.');
    }).catch(() => {
      // Fallback: open in a new window
      const win = window.open('');
      if (win) {
        win.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;white-space:pre-wrap">${code}</pre>`);
      }
    });
  };

  const turnPage = (dir: number) => {
    if (flippingIndex !== -1) return;
    const targetIdx = currentSpread + dir;
    if (targetIdx < 0 || targetIdx >= appSpreads.length) {
      sfx.error();
      return;
    }

    sfx.select();
    const leafIdx = dir > 0 ? currentSpread : targetIdx;

    setFlippingIndex(leafIdx);
    setFlippingDir(dir);
    setCurrentSpread(targetIdx);

    setTimeout(() => {
      setFlippingIndex(-1);
      sfx.pop();
    }, 850);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inspectVisible) {
        if (e.key === "ArrowRight") navigateInspect(1);
        if (e.key === "ArrowLeft") navigateInspect(-1);
        if (e.key === "Escape") closeInspect();
      } else {
        if (e.key === "ArrowRight") turnPage(1);
        if (e.key === "ArrowLeft") turnPage(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpread, flippingIndex, inspectVisible, navigateInspect, closeInspect]);

  // Fix Next.js hydration issues with CSS 3D
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-center font-pixel text-[#20233F]">
        <div className="relative">
          <div className="text-5xl text-[#FFD0DC] animate-spin mb-6" style={{ animationDuration: '3s' }}>✿</div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-[#FFE4A1] animate-ping" style={{ animationDuration: '2s' }}>✦</div>
        </div>
        <div className="animate-pulse tracking-widest font-bold text-lg">LOADING SCRAPBOOK...</div>
      </div>
    );
  }

  const totalLeaves = appSpreads.length - 1;

  return (
    <div 
      className="relative w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-center pt-8 overflow-visible"
    >
      {/* Fullscreen Image Inspect Modal — Native Scroll Carousel via Portal */}
      {inspectVisible && inspectImage && typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[99999] bg-[#101223]/95 flex items-center justify-center cursor-zoom-out"
          onClick={() => { sfx.select(); closeInspect(); }}
          style={{ overscrollBehaviorX: 'none', overscrollBehaviorY: 'none' }}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-[999999] cursor-pointer"
            onClick={(e) => { e.stopPropagation(); sfx.select(); closeInspect(); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {/* Navigation Controls on Overlay */}
          <button
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-[999999] cursor-pointer"
            onClick={(e) => { e.stopPropagation(); navigateInspect(-1); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-[999999] cursor-pointer"
            onClick={(e) => { e.stopPropagation(); navigateInspect(1); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          <div
            ref={carouselRef}
            className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth items-center px-[50vw] gap-2 sm:gap-4"
            style={{ overscrollBehaviorX: 'none', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                  className="relative max-w-full max-h-full border-[6px] sm:border-[10px] border-[#FDFBF7] shadow-[0_15px_30px_rgba(0,0,0,0.5)] p-1 sm:p-2 bg-white pointer-events-auto transition-transform hover:scale-[1.02] cursor-zoom-out"
                  onClick={() => { sfx.select(); closeInspect(); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Memory" className="max-w-[70vw] sm:max-w-[45vw] max-h-[60vh] w-auto h-auto object-contain pointer-events-none" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 px-4 py-2 bg-[#FFD0DC] border-4 border-[#20233F] shadow-[4px_4px_0_#20233F] font-pixel text-[#20233F] font-bold text-xs sm:text-sm rotate-[4deg] pointer-events-none z-[999999]">
            CLICK ANYWHERE TO CLOSE
          </div>
        </div>,
        document.body
      )}

      {/* Elegant Floating Navigation Arrows */}
      <div className="absolute top-1/2 left-4 sm:left-12 -translate-y-1/2 z-50 pointer-events-none">
        <button
          onClick={() => turnPage(-1)}
          disabled={currentSpread === 0 || flippingIndex !== -1}
          className="pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-lg flex items-center justify-center disabled:opacity-0 hover:bg-white hover:scale-110 transition-all text-[#20233F]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>
      <div className="absolute top-1/2 right-4 sm:right-12 -translate-y-1/2 z-50 pointer-events-none">
        <button
          onClick={() => turnPage(1)}
          disabled={currentSpread === appSpreads.length - 1 || flippingIndex !== -1}
          className="pointer-events-auto w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/50 backdrop-blur-md border border-white/40 shadow-lg flex items-center justify-center disabled:opacity-0 hover:bg-white hover:scale-110 transition-all text-[#20233F]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div
        className="relative w-[95%] max-w-[1300px] aspect-[1.75/1] shadow-[15px_30px_60px_rgba(20,10,30,0.15)] z-10 will-change-transform"
        style={{
          perspective: "3500px",
          transformStyle: "preserve-3d",
          transform: `rotateX(6deg) rotateY(-2deg) translateZ(0)`
        }}
      >
        {/* Book Base Cover (Sleek and trimmed without thick borders) */}
        <div
          className="absolute inset-0 bg-[#F5F2EB] rounded-sm shadow-md"
          style={{ transform: "translateZ(-3px)" }}
        />

        {/* Binder Rings (Spine) */}
        <div
          className="absolute left-1/2 top-[5%] bottom-[5%] w-6 sm:w-8 -translate-x-1/2 flex flex-col justify-evenly z-[100] pointer-events-none"
          style={{ transform: "translateZ(10px)" }}
        >
          {Array.from({ length: 9 }).map((_, r) => (
            <div key={r} className="w-full h-2.5 sm:h-3.5 bg-white border-2 border-[#FFB6C1] rounded-full shadow-[2px_2px_0_#FFB6C1] relative" />
          ))}
        </div>

        {/* Spine Crease Shadows (Static) */}
        <div className="absolute left-0 w-1/2 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to right, transparent 85%, rgba(0,0,0,0.08) 100%)", transform: "translateZ(0.1px)" }} />
        <div className="absolute right-0 w-1/2 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to left, transparent 85%, rgba(0,0,0,0.08) 100%)", transform: "translateZ(0.1px)" }} />

        {/* Static Base Left (Spread 0 Left) */}
        <div className="absolute left-0 w-1/2 h-full origin-right bg-[#FDFBF7]" style={{ transform: "translateZ(0px)" }}>
          <PageContent data={appSpreads[0].left} onImageClick={(src) => { sfx.select(); openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={0} side="left" />
        </div>

        {/* Static Base Right (Spread N-1 Right) */}
        <div className="absolute right-0 w-1/2 h-full origin-left bg-[#FDFBF7]" style={{ transform: "translateZ(0px)" }}>
          <PageContent data={appSpreads[appSpreads.length - 1].right} onImageClick={(src) => { sfx.select(); openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={appSpreads.length - 1} side="right" />
        </div>

        {/* Flippable Leaves */}
        {Array.from({ length: totalLeaves }).map((_, i) => {
          const isFlipped = currentSpread > i;
          const isFlipping = flippingIndex === i;

          let zIndex = 10;
          if (isFlipping) {
            zIndex = 50;
          } else if (isFlipped) {
            zIndex = i + 1;
          } else {
            zIndex = totalLeaves - i + 1;
          }

          return (
            <div
              key={i}
              className="absolute right-0 w-1/2 h-full origin-left"
              style={{
                zIndex,
                transformStyle: "preserve-3d",
                transform: isFlipped ? 'rotateY(-180deg) translateZ(-1px)' : 'rotateY(0deg) translateZ(1px)',
                transition: 'transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000)'
              }}
            >
              {/* Front of Leaf (Spread i Right) */}
              <div
                className="absolute inset-0 bg-[#FDFBF7] shadow-sm"
                style={{ 
                  backfaceVisibility: 'hidden', 
                  transform: 'rotateY(0deg) translateZ(1px)',
                  pointerEvents: isFlipped ? 'none' : 'auto' 
                }}
              >
                {/* Spine crease shadow on the left side of the right page */}
                <div className="absolute left-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />

                <PageContent data={appSpreads[i].right} onImageClick={(src) => { sfx.select(); openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i} side="right" />
              </div>

              {/* Back of Leaf (Spread i+1 Left) */}
              <div
                className="absolute inset-0 bg-[#FDFBF7] shadow-sm"
                style={{ 
                  backfaceVisibility: 'hidden', 
                  transform: 'rotateY(180deg) translateZ(1px)',
                  pointerEvents: !isFlipped ? 'none' : 'auto' 
                }}
              >
                {/* Spine crease shadow on the right side of the left page */}
                <div className="absolute right-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />

                <PageContent data={appSpreads[i + 1].left} onImageClick={(src) => { sfx.select(); openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i + 1} side="left" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Mode Toggle & Save UI */}
      <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
        {editMode ? (
          <>
            <button
              className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] hover:-translate-y-1 hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#FFE4A1] text-[#20233F]"
              onClick={handleExportCode}
              title="Copies final SPREADS code to clipboard — paste into source before deploying"
            >
              📋 EXPORT FOR DEPLOY
            </button>
            <button
              className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] hover:-translate-y-1 hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#B8E6D0] text-[#20233F]"
              onClick={handleSave}
            >
              ✓ DONE
            </button>
          </>
        ) : (
          <button
            className="border-4 border-[#20233F] px-4 py-3 font-pixel text-xs font-bold shadow-[4px_4px_0_#20233F] hover:-translate-y-1 hover:shadow-[4px_6px_0_#20233F] transition-all bg-[#FFD0DC] text-[#20233F]"
            onClick={() => setEditMode(true)}
          >
            EDIT MODE
          </button>
        )}
      </div>

    </div>
  );
}
