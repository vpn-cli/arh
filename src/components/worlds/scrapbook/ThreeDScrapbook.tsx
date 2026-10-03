"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { sfx } from "@/lib/audio";

let flipAudio: HTMLAudioElement | null = null;
if (typeof window !== "undefined") {
  flipAudio = new Audio("/flip.mp3");
  flipAudio.volume = 0.5;
  flipAudio.preload = "auto";
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


const Sticker = ({ type }: { type: string }) => {
  const SvgWrap = ({ children, className }: any) => (
    <div className={`filter drop-shadow-[2px_2px_0_rgba(32,35,63,0.3)] ${className}`}>
      <svg width="36" height="36" viewBox="-1 -1 9 9" shapeRendering="crispEdges">
        {children}
      </svg>
    </div>
  );
  if (type === "star") return <SvgWrap className="animate-[spin_4s_linear_infinite] origin-center"><rect x="3" y="0" width="1" height="2" fill="#FFE4A1" /><rect x="2" y="2" width="3" height="1" fill="#FFE4A1" /><rect x="0" y="3" width="7" height="1" fill="#FFE4A1" /><rect x="1" y="4" width="5" height="1" fill="#FFE4A1" /><rect x="2" y="5" width="3" height="1" fill="#FFE4A1" /><rect x="1" y="6" width="1" height="1" fill="#FFE4A1" /><rect x="5" y="6" width="1" height="1" fill="#FFE4A1" /></SvgWrap>;
  if (type === "note") return <SvgWrap className="animate-bounce"><rect x="4" y="0" width="3" height="1" fill="#A1C4FD" /><rect x="3" y="1" width="1" height="4" fill="#A1C4FD" /><rect x="6" y="1" width="1" height="2" fill="#A1C4FD" /><rect x="1" y="4" width="3" height="1" fill="#A1C4FD" /><rect x="0" y="5" width="4" height="2" fill="#A1C4FD" /></SvgWrap>;
  if (type === "sparkle") return <SvgWrap className="animate-pulse"><rect x="3" y="0" width="1" height="2" fill="#DFD5F5" /><rect x="3" y="5" width="1" height="2" fill="#DFD5F5" /><rect x="0" y="3" width="2" height="1" fill="#DFD5F5" /><rect x="5" y="3" width="2" height="1" fill="#DFD5F5" /><rect x="2" y="2" width="3" height="3" fill="#DFD5F5" /></SvgWrap>;
  if (type === "flower") return <SvgWrap className="animate-[spin_6s_linear_infinite_reverse] origin-center"><rect x="2" y="0" width="3" height="2" fill="#FF8FB3" /><rect x="0" y="2" width="2" height="3" fill="#FF8FB3" /><rect x="5" y="2" width="2" height="3" fill="#FF8FB3" /><rect x="2" y="5" width="3" height="2" fill="#FF8FB3" /><rect x="2" y="2" width="3" height="3" fill="#FFE4A1" /></SvgWrap>;
  if (type === "banana") return <div className="text-4xl animate-bounce drop-shadow-[2px_4px_8px_rgba(0,0,0,0.3)] font-sans select-none origin-center mt-2">🍌</div>;
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
      className={`relative w-full h-full bg-white overflow-hidden rounded-lg cursor-pointer group transition-all duration-500 ease-out hover:scale-[1.05] hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(255,182,193,0.4)] hover:z-20 ${isSelected ? 'ring-4 ring-[#FF8FB3] scale-95 opacity-80' : ''}`}
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
  data, onImageClick, positions, setPosAbsolute, onCropEnd, editMode, selectedFrame, onFrameClick, spreadIdx, side, onTurnPage, totalSpreads
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
  totalSpreads?: number
}) {
  if (data.pageTitle === "COVER") {
    return (
      <div className="absolute inset-0 bg-[#FFB6C1] flex flex-col items-center justify-center overflow-hidden border-4 border-[#FFD0DC]">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)", backgroundSize: "24px 24px" }} />
        <div className="relative font-pixel text-4xl sm:text-6xl text-white drop-shadow-[4px_4px_0_#20233F] rotate-[-2deg] mb-12 text-center px-4 leading-tight z-10 pointer-events-none flex flex-col items-center gap-4">
          <span>BANANA<br />BOOK</span>
          <div className="scale-150"><Sticker type="banana" /></div>
        </div>
        <div className="relative font-pixel text-[#20233F] text-xs sm:text-sm animate-bounce drop-shadow-[1px_1px_0_white] bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white z-10 pointer-events-none">
          ✦ ISKO DABAO ✦
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden" style={{ backgroundColor: "#FFB6C1" }}>
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
              className="relative p-1.5 sm:p-2 bg-white shadow-[2px_4px_12px_rgba(255,182,193,0.3)] rounded-xl border-2 border-[#FFD0DC]/40 group hover:scale-[1.02] hover:-rotate-1 transition-all duration-500"
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

      {/* Page Navigation Buttons */}
      <div className={`absolute bottom-4 sm:bottom-6 ${side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} z-50 pointer-events-none`}>
        {side === 'left' && spreadIdx > 0 && onTurnPage && (
          <button
            onClick={(e) => { e.stopPropagation(); onTurnPage(-1); }}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] font-pixel text-xs text-[#20233F] hover:bg-[#FFD0DC] hover:-translate-y-1 hover:-rotate-2 transition-all border-2 border-white pointer-events-auto"
          >
            ◀ PICHE
          </button>
        )}
        {side === 'right' && totalSpreads && spreadIdx < totalSpreads - 1 && data.pageTitle !== "COVER" && onTurnPage && (
          <button
            onClick={(e) => { e.stopPropagation(); onTurnPage(1); }}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-[2px_2px_0_rgba(255,182,193,0.8)] font-pixel text-xs text-[#20233F] hover:bg-[#FFD0DC] hover:-translate-y-1 hover:rotate-2 transition-all border-2 border-white pointer-events-auto"
          >
            AAGE ▶
          </button>
        )}
      </div>
    </div>
  );
}

export default function ThreeDScrapbook() {
  const [appSpreads, setAppSpreads] = useState<SpreadData[]>([
    {
      left: { pageTitle: "", items: [] },
      right: { pageTitle: "COVER", items: [] }
    },
    ...SPREADS
  ]);
  const [editMode, setEditMode] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<{ spreadIdx: number, side: 'left' | 'right', itemIdx: number } | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const logError = (err: any) => {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'error', data: err?.message || err?.toString() })
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

      // 1. Check local storage recovery
      const saved = localStorage.getItem('scrapbook_spreads');
      if (saved) {
        try {
          let savedSpreads = JSON.parse(saved);
          if (savedSpreads.length > 0) {
            if (savedSpreads[0].right?.pageTitle !== "COVER") {
              savedSpreads = [
                { left: { pageTitle: "", items: [] }, right: { pageTitle: "COVER", items: [] } },
                ...savedSpreads
              ];
            }
            finalLayout = savedSpreads;

            const dataToSave = savedSpreads[0].right?.pageTitle === "COVER" ? savedSpreads.slice(1) : savedSpreads;
            fetch('/api/save-scrapbook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSave)
            }).then(() => {
              localStorage.removeItem('scrapbook_spreads');
            }).catch((e) => {
              console.error(`Migration failed: ${e.message}`);
            });
          }
        } catch (e) { console.error(`localStorage recovery failed: ${e}`); }
      } else {
        // 2. Fetch fresh layout from API
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
      }

      if (!isCancelled) {
        setAppSpreads(finalLayout);

        // Now preload images of the first spread
        const firstImages = [
          ...finalLayout[0]?.left.items.map(i => i.src) || [],
          ...finalLayout[0]?.right.items.map(i => i.src) || [],
          ...finalLayout[1]?.left.items.map(i => i.src) || [],
          ...finalLayout[1]?.right.items.map(i => i.src) || []
        ];

        let loaded = 0;
        firstImages.forEach(src => {
          const img = new Image();
          img.onload = () => { loaded++; };
          img.onerror = () => { loaded++; };
          img.src = src;
        });

        setTimeout(() => {
          if (!isCancelled) setMounted(true);
        }, 2500);
      }
    };

    initScrapbook();

    return () => {
      isCancelled = true;
      console.error = originalError;
      window.removeEventListener('unhandledrejection', (e) => logError(e.reason));
      window.removeEventListener('error', (e) => logError(e.message));
    };
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
  const [carouselReady, setCarouselReady] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const allImages = React.useMemo(() => {
    return appSpreads.flatMap(s => [...s.left.items, ...s.right.items].map(i => i.src));
  }, [appSpreads]);

  const openInspect = useCallback((src: string | null) => {
    if (!src) return;
    setCarouselReady(false);
    setInspectImage(src);
    setInspectVisible(true);
    setShowScrollHint(true);
    setTimeout(() => setShowScrollHint(false), 3500);
  }, []);

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

  const handleSave = async () => {
    // Apply all crop positions from the drag state into the spreads
    const newSpreads = JSON.parse(JSON.stringify(appSpreads));
    let appliedPositions = 0;
    for (let sIdx = 0; sIdx < newSpreads.length; sIdx++) {
      for (const side of ['left', 'right'] as const) {
        for (const item of newSpreads[sIdx][side].items) {
          if (positions[item.src]) {
            item.pos = `${Math.round(positions[item.src].x)}% ${Math.round(positions[item.src].y)}%`;
            appliedPositions++;
          }
        }
      }
    }
    console.log(`Applied ${appliedPositions} crop positions from state.`);

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
      return;
    }

    try {
      if (flipAudio) {
        flipAudio.currentTime = 0;
        flipAudio.play().catch(() => { });
      }
    } catch { }

    const leafIdx = dir > 0 ? currentSpread : targetIdx;

    setFlippingIndex(leafIdx);
    setFlippingDir(dir);
    setCurrentSpread(targetIdx);

    setTimeout(() => {
      setFlippingIndex(-1);
    }, 1200);
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

  const [mounted, setMounted] = useState(false);
  // `mounted` handles the preloading inside the massive useEffect above!

  if (!mounted) {
    return (
      <div className="w-full h-[85vh] min-h-[600px] flex flex-col items-center justify-center font-pixel text-[#20233F]">
        <style>{`
          @keyframes scrapbook-dot-wave {
            0%, 100% { transform: translateY(0px); opacity: 0.5; }
            50%       { transform: translateY(-6px); opacity: 1; }
          }
          @keyframes vp-border-top {
            0% { width: 0; }
            25% { width: 100vw; }
            100% { width: 100vw; }
          }
          @keyframes vp-border-right {
            0% { height: 0; }
            25% { height: 0; }
            50% { height: 100vh; }
            100% { height: 100vh; }
          }
          @keyframes vp-border-bottom {
            0% { width: 0; }
            50% { width: 0; }
            75% { width: 100vw; }
            100% { width: 100vw; }
          }
          @keyframes vp-border-left {
            0% { height: 0; }
            75% { height: 0; }
            100% { height: 100vh; }
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
          <div className="absolute top-0 left-0 h-2 sm:h-3 bg-[#FFB6C1] w-0" style={{ animation: 'vp-border-top 2.5s linear forwards' }} />
          <div className="absolute top-0 right-0 w-2 sm:w-3 bg-[#FFE4A1] h-0" style={{ animation: 'vp-border-right 2.5s linear forwards' }} />
          <div className="absolute bottom-0 right-0 h-2 sm:h-3 bg-[#A1C4FD] w-0" style={{ animation: 'vp-border-bottom 2.5s linear forwards' }} />
          <div className="absolute bottom-0 left-0 w-2 sm:w-3 bg-[#B8E6D0] h-0" style={{ animation: 'vp-border-left 2.5s linear forwards' }} />
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
            {[0,1,2,3,4].map((i) => (
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
    >
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
            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-[999999] cursor-pointer"
            onClick={(e) => { e.stopPropagation(); closeInspect(); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          {/* Navigation Controls on Overlay - REMOVED PER USER REQUEST */}

          <div
            ref={carouselRef}
            className={`w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory items-center px-[50vw] gap-2 sm:gap-4 ${carouselReady ? 'scroll-smooth' : ''}`}
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
                  className={`relative max-w-[90vw] sm:max-w-[75vw] max-h-[90vh] p-1.5 sm:p-2 bg-white/40 backdrop-blur-3xl shadow-[0_10px_40px_rgba(255,190,210,0.4)] rounded-2xl border-2 border-white/60 pointer-events-auto transition-all duration-300 hover:scale-[1.02] cursor-zoom-out flex flex-col items-center group ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                  onClick={() => { closeInspect(); }}
                >
                  {/* Randomized Kawaii Washi Tapes */}
                  {i % 2 === 0 ? (
                    <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#FFD0DC]/90 backdrop-blur-md -rotate-6 shadow-sm z-10 rounded-sm mix-blend-multiply" />
                  ) : (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-4 sm:h-5 bg-[#FFE4A1]/90 backdrop-blur-md rotate-2 shadow-sm z-10 rounded-sm mix-blend-multiply" />
                  )}
                  {i % 3 === 0 ? (
                    <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#A1C4FD]/90 backdrop-blur-md rotate-3 shadow-sm z-10 rounded-sm mix-blend-multiply" />
                  ) : i % 3 === 1 ? (
                    <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-6 w-12 sm:w-20 h-4 sm:h-5 bg-[#B8E6D0]/90 backdrop-blur-md -rotate-4 shadow-sm z-10 rounded-sm mix-blend-multiply" />
                  ) : null}

                  {/* Randomized Hover Pixel Symbols! */}
                  <div className="absolute -top-6 right-1 text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-125 -translate-y-4 group-hover:translate-y-0 pointer-events-none z-20 font-pixel drop-shadow-md text-[#FFE4A1] animate-bounce">
                    {i % 4 === 0 ? '★' : i % 4 === 1 ? '✦' : i % 4 === 2 ? '⚡' : '☁'}
                  </div>
                  <div className="absolute -bottom-6 left-1 text-2xl sm:text-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:-rotate-12 translate-y-4 group-hover:translate-y-0 pointer-events-none z-20 font-pixel drop-shadow-md text-[#FF8FB3] animate-pulse">
                    {i % 3 === 0 ? '✿' : i % 3 === 1 ? '♪' : '✸'}
                  </div>

                  {/* Inner Photo Frame */}
                  <div className="overflow-hidden rounded-xl border border-white/40 bg-white/20 shadow-sm pointer-events-auto" onContextMenu={(e) => e.stopPropagation()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Memory" className="w-auto h-auto max-w-[85vw] sm:max-w-[70vw] max-h-[80vh] object-contain rounded-lg pointer-events-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 px-4 py-2 bg-[#FFD0DC] border-4 border-[#20233F] shadow-[4px_4px_0_#20233F] font-pixel text-[#20233F] font-bold text-xs sm:text-sm rotate-[4deg] pointer-events-none z-[999999]">
            CLICK ANYWHERE TO CLOSE
          </div>

          {/* Scroll Hint Popup */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#FFD0DC]/90 backdrop-blur-md px-6 py-2 rounded-full text-[#20233F] font-pixel text-xs tracking-wider shadow-[0_4px_12px_rgba(255,182,193,0.4)] border border-white/50 pointer-events-none z-[999999] transition-opacity duration-1000 ${showScrollHint ? 'opacity-100' : 'opacity-0'}`}>
            ✦ SCROLL TO NAVIGATE ✦
          </div>
        </div>,
        document.body
      )}

      {/* Navigation Arrows Removed in favor of in-page buttons */}

      <div
        className="relative w-[95%] max-w-[1300px] aspect-[1.75/1] z-10 will-change-transform"
        style={{
          perspective: "3500px",
          transformStyle: "preserve-3d",
          transform: `rotateX(6deg) rotateY(-2deg) ${currentSpread === 0 ? 'translateX(-25%)' : 'translateX(0%)'} translateZ(0)`,
          transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Right Book Base */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#FFB6C1] rounded-r-sm shadow-[10px_20px_40px_rgba(20,10,30,0.15)]"
          style={{ transform: "translateZ(-3px)" }}
        />

        {/* Left Book Base Container */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/2 origin-right z-0 will-change-transform"
          style={{
            transform: currentSpread === 0 ? "rotateY(180deg) translateZ(10px)" : "rotateY(0deg) translateZ(0px)",
            transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Left Base Background with shadow */}
          <div
            className="absolute inset-0 bg-[#FFB6C1] rounded-l-sm shadow-[-10px_20px_40px_rgba(20,10,30,0.15)]"
            style={{ transform: "translateZ(-3px)" }}
          />

          {/* Static Base Left (Spread 0 Left) */}
          <div className="absolute inset-0 bg-[#FFB6C1]" style={{ transform: "translateZ(0px)", backfaceVisibility: 'hidden' }}>
            <PageContent data={appSpreads[0].left} onImageClick={(src) => { openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={0} side="left" onTurnPage={turnPage} totalSpreads={appSpreads.length} />
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
          <PageContent data={appSpreads[appSpreads.length - 1].right} onImageClick={(src) => { openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={appSpreads.length - 1} side="right" onTurnPage={turnPage} totalSpreads={appSpreads.length} />
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
              className="absolute right-0 w-1/2 h-full origin-left will-change-transform"
              onClick={() => {
                if (currentSpread === 0 && i === 0) {
                  turnPage(1);
                }
              }}
              style={{
                zIndex,
                transformStyle: "preserve-3d",
                transform: isFlipped ? 'rotateY(-180deg) translateZ(-1px)' : 'rotateY(0deg) translateZ(1px)',
                transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: (currentSpread === 0 && i === 0) ? 'pointer' : 'auto'
              }}
            >
              {/* Front of Leaf (Spread i Right) */}
              <div
                className="absolute inset-0 bg-[#FFB6C1] shadow-sm will-change-transform"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg) translateZ(1px)',
                  pointerEvents: isFlipped ? 'none' : 'auto'
                }}
              >
                {/* Spine crease shadow on the left side of the right page */}
                <div className="absolute left-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />

                <PageContent data={appSpreads[i].right} onImageClick={(src) => { openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i} side="right" onTurnPage={turnPage} totalSpreads={appSpreads.length} />
              </div>

              {/* Back of Leaf (Spread i+1 Left) */}
              <div
                className="absolute inset-0 bg-[#FFB6C1] shadow-sm will-change-transform"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                  pointerEvents: !isFlipped ? 'none' : 'auto'
                }}
              >
                {/* Spine crease shadow on the right side of the left page */}
                <div className="absolute right-0 w-1/3 h-full pointer-events-none z-[40]" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.08) 0%, transparent 100%)" }} />

                <PageContent data={appSpreads[i + 1].left} onImageClick={(src) => { openInspect(src); }} positions={positions} setPosAbsolute={setPosAbsolute} onCropEnd={handleCropEnd} editMode={editMode} selectedFrame={selectedFrame} onFrameClick={handleFrameClick} spreadIdx={i + 1} side="left" onTurnPage={turnPage} totalSpreads={appSpreads.length} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Hint Text */}
      <div className={`mt-6 sm:mt-10 bg-[#20233F] px-4 py-2 sm:px-6 sm:py-3 rounded-full text-white font-pixel text-[10px] sm:text-xs tracking-widest text-center shadow-[4px_4px_0_rgba(0,0,0,0.1)] border-2 border-white/50 whitespace-nowrap pointer-events-none z-[20] transition-opacity duration-1000 ${currentSpread === 0 ? 'opacity-0' : 'opacity-100'}`}>
        PRESS ARROWS TO NAVIGATE • CLICK ANY IMAGE TO ENTER FULL VIEW
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
