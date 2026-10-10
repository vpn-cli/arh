"use client";

import React, { useState } from 'react';
import {
  HomeIcon,
  PlaylistsIcon,
  MixIcon,
  VibesIcon,
  LibraryIcon,
  MemoriesIcon,
  FrequenciesIcon,
} from '@/components/worlds/music/icons';

interface IconEntry {
  id: string;
  name: string;
  concept: string;
  component: React.ComponentType<{ size?: number; className?: string }>;
}

const ICONS: IconEntry[] = [
  {
    id: 'home',
    name: 'Home',
    concept: 'Little house with a heart window',
    component: HomeIcon,
  },
  {
    id: 'playlists',
    name: 'Playlists',
    concept: 'Cassette tape with spools and bottom notch',
    component: PlaylistsIcon,
  },
  {
    id: 'mix',
    name: 'Mix',
    concept: 'Sparkles and 4-point star cluster',
    component: MixIcon,
  },
  {
    id: 'vibes',
    name: 'Vibes',
    concept: 'Crescent moon with twinkle stars',
    component: VibesIcon,
  },
  {
    id: 'library',
    name: 'Library',
    concept: 'Vinyl record with groove arcs & spindle',
    component: LibraryIcon,
  },
  {
    id: 'memories',
    name: 'Memories',
    concept: 'Polaroid photo with sun & hills',
    component: MemoriesIcon,
  },
  {
    id: 'frequencies',
    name: 'Frequencies',
    concept: 'Balanced 5-bar sound wave spectrum',
    component: FrequenciesIcon,
  },
];

export default function IconsPreviewClient() {
  const [activeTab, setActiveTab] = useState<string>('home');

  return (
    <div
      className="min-h-screen w-full p-6 md:p-10 text-[var(--color-dark)] font-sans"
      style={{
        backgroundColor: 'var(--color-bg, #FFF3D8)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[var(--color-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs px-2 py-0.5 rounded bg-[var(--color-vibrant)] text-white font-bold uppercase tracking-widest">
                Dev Preview
              </span>
              <span className="font-pixel text-xs text-[var(--color-dark)] opacity-70">
                Phase C2 — /diagnose/icons
              </span>
            </div>
            <h1 className="font-pixel text-3xl font-extrabold text-[var(--color-dark)] mt-2">
              Music World Nav Icons
            </h1>
            <p className="font-pixel text-sm text-[var(--color-dark)] opacity-75 mt-1">
              7 consistent inline SVGs: 22px production size & 44px detailed review, 2px rounded strokes, currentColor.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto font-pixel text-xs">
            <span className="px-3 py-1.5 rounded-full border border-[var(--color-muted)] bg-white/70 shadow-2xs font-bold">
              strokeWidth: 2
            </span>
            <span className="px-3 py-1.5 rounded-full border border-[var(--color-muted)] bg-white/70 shadow-2xs font-bold">
              strokeLinecap: round
            </span>
          </div>
        </header>

        {/* 7 Icons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {ICONS.map((item) => {
            const IconComp = item.component;
            return (
              <div
                key={item.id}
                className="bg-white/90 border-2 border-[var(--color-muted)] rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-pixel text-lg font-bold text-[var(--color-dark)]">
                      {item.name}
                    </h2>
                    <p className="font-pixel text-xs text-[var(--color-dark)] opacity-70 mt-0.5">
                      {item.concept}
                    </p>
                  </div>
                </div>

                {/* Display Area: 22px and 44px side by side */}
                <div className="bg-[var(--color-light)]/70 border border-[var(--color-muted)]/50 rounded-xl p-4 flex items-center justify-around gap-4">
                  {/* 22px Size */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-white/90 border border-[var(--color-muted)]/40 flex items-center justify-center text-[var(--color-dark)] shadow-2xs">
                      <IconComp size={22} />
                    </div>
                    <span className="font-pixel text-[11px] font-bold text-[var(--color-dark)] opacity-70">
                      22px
                    </span>
                  </div>

                  {/* 44px Size */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl bg-white/90 border border-[var(--color-muted)]/40 flex items-center justify-center text-[var(--color-dark)] shadow-2xs">
                      <IconComp size={44} />
                    </div>
                    <span className="font-pixel text-[11px] font-bold text-[var(--color-dark)] opacity-70">
                      44px (2x)
                    </span>
                  </div>
                </div>

                {/* Color Variations (Dark vs Vibrant) */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-[var(--color-muted)]/30 font-pixel text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-dark)] font-bold">
                    <IconComp size={18} />
                    <span>Dark</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-vibrant)] font-bold">
                    <IconComp size={18} />
                    <span>Vibrant</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simulated Sidebar Strip Comparison */}
        <section className="bg-white/90 border-2 border-[var(--color-muted)] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-muted)]/40 pb-3">
            <div>
              <h3 className="font-pixel text-base font-bold text-[var(--color-dark)]">
                Simulated Sidebar Navigation Bar (Interactive)
              </h3>
              <p className="font-pixel text-xs text-[var(--color-dark)] opacity-70">
                Click items to preview active vs idle states with real mw-nav-item classes
              </p>
            </div>
            <span className="font-pixel text-xs text-[var(--color-dark)] opacity-60">
              Width: 296px (Desktop)
            </span>
          </div>

          <div className="max-w-[296px] bg-[var(--color-bg)]/80 border-2 border-[var(--color-muted)] rounded-2xl p-3 flex flex-col gap-1 mx-auto sm:mx-0 shadow-inner">
            {ICONS.map((item) => {
              const IconComp = item.component;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  type="button"
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left font-pixel rounded-xl mw-nav-item transition-all ${
                    isActive
                      ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs'
                      : 'text-[var(--color-dark)] font-medium border border-transparent hover:bg-white/50'
                  }`}
                >
                  <span className={`w-5 flex items-center justify-center shrink-0 ${isActive ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'}`}>
                    <IconComp size={22} />
                  </span>
                  <span className="text-sm font-pixel">{item.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
