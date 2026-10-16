import React from 'react';
import { Memory } from '@/store/useMemoriesStore';
import { StickerIcon } from './StickerIcon';
import { PlayIcon } from './icons';
import {
  MemoryDecor,
  PaperType,
  FastenerType,
  StickerCorner,
} from './memoryDecor';

interface MemoryCardProps {
  memory: Memory;
  entity: any | null;
  isLoading: boolean;
  decor: MemoryDecor;
  onPlayTrack: (uri: string) => void;
  onClickArtist: (id: string) => void;
  onClickPlaylist: (id: string) => void;
  onEditMemory: (entity: any | null, type: 'track' | 'artist' | 'playlist', memoryId?: string) => void;
  onDeleteMemory: (id: string) => void;
}

function getPaperStyle(paper: PaperType): React.CSSProperties {
  switch (paper) {
    case 'ruled':
      return {
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent, transparent 23px, var(--color-muted) 23px, var(--color-muted) 24px)',
        opacity: 0.25,
      };
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(to right, var(--color-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--color-muted) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        opacity: 0.22,
      };
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(var(--color-muted) 1.5px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        opacity: 0.3,
      };
    case 'plain':
    default:
      return {};
  }
}

function getCornerPosition(_corner?: StickerCorner): string {
  // Move all Snoopy stickers to the right edge, peeking slightly outside the card,
  // clear of edit/delete buttons (top right) and date/POST stamps (bottom right).
  return '-right-3.5 top-[38%]';
}

function renderFastener(fastener: FastenerType) {
  switch (fastener) {
    case 'straight-tape':
      return (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/80 border border-[var(--color-muted)]/50 shadow-2xs rotate-[-1deg] pointer-events-none rounded-xs z-20"
          aria-hidden="true"
        />
      );
    case 'angled-tape':
      return (
        <div
          className="absolute -top-2 left-3 w-12 h-3.5 bg-white/80 border border-[var(--color-muted)]/50 shadow-2xs -rotate-[24deg] pointer-events-none rounded-xs z-20"
          aria-hidden="true"
        />
      );
    case 'corner-tapes':
      return (
        <>
          <div
            className="absolute -top-1.5 left-1 w-9 h-3 bg-white/80 border border-[var(--color-muted)]/50 shadow-2xs -rotate-[28deg] pointer-events-none rounded-xs z-20"
            aria-hidden="true"
          />
          <div
            className="absolute -top-1.5 right-1 w-9 h-3 bg-white/80 border border-[var(--color-muted)]/50 shadow-2xs rotate-[28deg] pointer-events-none rounded-xs z-20"
            aria-hidden="true"
          />
        </>
      );
    case 'paper-clip':
      return (
        <svg
          width="20"
          height="34"
          viewBox="0 0 20 36"
          fill="none"
          className="absolute -top-3 right-6 z-20 pointer-events-none drop-shadow-2xs text-[var(--color-dark)]"
          aria-hidden="true"
        >
          <path
            d="M6 10V27C6 30.3137 8.68629 33 12 33C15.3137 33 18 30.3137 18 27V6C18 3.23858 15.7614 1 13 1C10.2386 1 8 3.23858 8 6V24C8 25.6569 9.34315 27 11 27C12.6569 27 14 25.6569 14 24V10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />
        </svg>
      );
    case 'push-pin':
      return (
        <svg
          width="18"
          height="24"
          viewBox="0 0 18 24"
          fill="none"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-xs"
          aria-hidden="true"
        >
          <circle cx="9" cy="8" r="6" fill="var(--color-vibrant)" />
          <circle cx="7" cy="6" r="2" fill="white" opacity="0.6" />
          <path d="M9 14V22" stroke="var(--color-dark)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function MemoryCard({
  memory,
  entity,
  isLoading,
  decor,
  onPlayTrack,
  onClickArtist,
  onClickPlaylist,
  onEditMemory,
  onDeleteMemory,
}: MemoryCardProps) {
  const isFailed = !isLoading && !entity;

  const coverImage =
    entity?.album?.images?.[0]?.url ||
    entity?.images?.[0]?.url ||
    (typeof entity?.album?.images?.[0] === 'string' ? entity.album.images[0] : null) ||
    (typeof entity?.images?.[0] === 'string' ? entity.images[0] : null) ||
    null;

  const artistOrSubtitle =
    entity?.artists?.map((a: any) => a.name).join(', ') ||
    (memory.entityType === 'artist' ? 'Artist' : memory.entityType === 'playlist' ? 'Playlist' : '');

  // No Date constructor in render: format pure string
  const displayDate = memory.createdAt ? memory.createdAt.split('T')[0] : '';

  return (
    <div
      className="mw-card mw-memory-card relative bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col justify-between select-none group"
      style={{
        '--memory-tilt': `${decor.tilt}deg`,
      } as React.CSSProperties}
    >
      {/* Paper texture overlay drawn with CSS gradients */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0 overflow-hidden"
        style={getPaperStyle(decor.paper)}
        aria-hidden="true"
      />

      {/* Fastener: tape, clip, or push pin */}
      {renderFastener(decor.fastener)}

      {/* Fully visible sticker playing .mw-sticker-bob once on hover and focus-within, tilted with sticker drop shadow */}
      <div
        className={`absolute ${getCornerPosition(decor.stickerCorner)} z-20 pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.18)]`}
        style={{
          transform: `translateY(-50%) rotate(${decor.tilt > 0 ? -6 : 6}deg)`,
        }}
      >
        <div className="mw-sticker-bob inline-block">
          <StickerIcon name={decor.sticker} size={42} />
        </div>
      </div>

      {/* Header: Chips & Actions */}
      <div className="flex justify-between items-start gap-2 mb-2 pr-6 relative z-10">
        <div className="flex gap-2 items-center flex-wrap">
          {memory.category && (
            <span className="bg-[var(--color-light)] border border-[var(--color-muted)] text-[var(--color-dark)] font-pixel text-caption px-2.5 py-0.5 rounded-full font-bold uppercase">
              {memory.category}
            </span>
          )}
          {memory.dateLabel && (
            <span className="text-[var(--color-dark)] font-pixel text-caption font-semibold uppercase">
              {memory.dateLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEditMemory(entity || null, memory.entityType, memory.id)}
            className="text-meta font-bold text-[var(--color-dark)] font-pixel min-h-[24px] px-2 py-0.5 rounded hover:bg-[var(--color-light)] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={() => onDeleteMemory(memory.id)}
            className="text-meta font-bold text-[var(--color-dark)] font-pixel min-h-[24px] px-2 py-0.5 rounded hover:bg-[var(--color-light)] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            DELETE
          </button>
        </div>
      </div>

      {/* Note text large with note accent (pr-9 sm:pr-10 guarantees no collision with right-edge sticker) */}
      <div className="my-2 relative z-10 pr-9 sm:pr-10">
        <blockquote
          className={`font-pixel text-title font-bold text-[var(--color-dark)] leading-snug select-text ${
            decor.noteAccent === 'highlighter'
              ? 'inline bg-gradient-to-r from-[var(--color-vibrant)]/15 to-[var(--color-vibrant)]/5 px-1 rounded-xs box-decoration-clone'
              : ''
          }`}
        >
          &ldquo;{memory.note}&rdquo;
        </blockquote>
        {decor.noteAccent === 'underline' && (
          <svg
            viewBox="0 0 160 8"
            fill="none"
            className="w-36 h-2 mt-1 text-[var(--color-vibrant)] opacity-60"
            aria-hidden="true"
          >
            <path
              d="M1 5.5C28 2 64 6.5 98 4C126 2 145 5 159 3.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Song as a mini polaroid with tilt and thicker bottom border */}
      <div
        className="mt-3 relative z-10 transition-transform duration-180"
        style={{ transform: `rotate(${decor.polaroidTilt}deg)` }}
      >
        {isFailed ? (
          <div className="p-2 text-center text-[var(--color-dark)] font-pixel text-caption font-medium border border-[var(--color-muted)]/30 rounded-xl bg-white/50">
            SPOTIFY ENTITY UNAVAILABLE
          </div>
        ) : entity ? (
          <div
            onClick={() => {
              if (memory.entityType === 'track') onPlayTrack(entity.uri);
              else if (memory.entityType === 'artist') onClickArtist(entity.id);
              else if (memory.entityType === 'playlist') onClickPlaylist(entity.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (memory.entityType === 'track') onPlayTrack(entity.uri);
                else if (memory.entityType === 'artist') onClickArtist(entity.id);
                else if (memory.entityType === 'playlist') onClickPlaylist(entity.id);
              }
            }}
            aria-label={`Play ${entity.name || 'item'}`}
            className="group/polaroid flex items-center gap-3 p-2 bg-white rounded-xl border border-[var(--color-muted)] border-b-4 shadow-2xs hover:bg-[var(--color-light)]/50 cursor-pointer transition-colors"
          >
            {/* 56px cover with thicker bottom border */}
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-lg overflow-hidden border-2 border-b-4 border-white shadow-2xs shrink-0 bg-[var(--color-muted)]/20 relative">
              {coverImage ? (
                <img src={coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-dark)] font-bold text-caption">
                  ♪
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/polaroid:opacity-100 flex items-center justify-center transition-opacity">
                <PlayIcon size={18} className="text-white ml-0.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="font-pixel text-body font-bold text-[var(--color-dark)] truncate">
                {entity.name}
              </div>
              {artistOrSubtitle && (
                <div className="font-pixel text-caption text-[var(--color-text-muted)] truncate mt-0.5">
                  {artistOrSubtitle}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-14 animate-pulse bg-[var(--color-light)] rounded-xl border border-[var(--color-muted)]/30" />
        )}
      </div>

      {/* Date stamp: dashed rectangle, round postmark, or ticket stub */}
      <div className="self-end mt-3 relative z-10">
        {decor.dateStamp === 'dashed-rectangle' && (
          <div
            className="text-[var(--color-dark)] font-pixel text-caption font-semibold opacity-75 px-2 py-0.5 border border-dashed border-[var(--color-muted)] rounded bg-white/70"
            style={{ transform: `rotate(${decor.dateStampTilt}deg)` }}
          >
            {displayDate}
          </div>
        )}
        {decor.dateStamp === 'round-postmark' && (
          <div
            className="text-[var(--color-dark)] font-pixel text-meta font-bold opacity-75 w-12 h-12 rounded-full border border-dashed border-[var(--color-text-muted)] flex flex-col items-center justify-center text-center bg-white/70 leading-none"
            style={{ transform: `rotate(${decor.dateStampTilt}deg)` }}
          >
            <span className="opacity-60 text-meta">POST</span>
            <span className="text-meta">{displayDate.slice(5) || displayDate}</span>
          </div>
        )}
        {decor.dateStamp === 'ticket-stub' && (
          <div
            className="text-[var(--color-dark)] font-pixel text-caption font-semibold opacity-75 px-2.5 py-0.5 border-y border-dashed border-[var(--color-muted)] bg-white/80 uppercase tracking-wider"
            style={{ transform: `rotate(${decor.dateStampTilt}deg)` }}
          >
            MEMO • {displayDate}
          </div>
        )}
      </div>
    </div>
  );
}
