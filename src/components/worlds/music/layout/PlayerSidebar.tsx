"use client";

import React from "react";
import { logoutSpotify } from "@/lib/spotifyAuth";
import { usePlaylists } from "@/hooks/useSpotify";

export type MusicNavTab = 'home' | 'playlists' | 'mix' | 'vibes' | 'library' | 'memories' | 'frequencies';

export interface PlayerSidebarProps {
  activeTab: string;
  onNavigate: (tab: any) => void;
  onOpenPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  onLogout?: () => void;
}

const NAV_ITEMS: { id: MusicNavTab; icon: string; label: string }[] = [
  { id: 'home', icon: '⌂', label: 'Home' },
  { id: 'playlists', icon: '♫', label: 'Playlists' },
  { id: 'mix', icon: '✨', label: 'Mix' },
  { id: 'vibes', icon: '✦', label: 'Vibes' },
  { id: 'library', icon: '▥', label: 'Library' },
  { id: 'memories', icon: '▣', label: 'Memories' },
  { id: 'frequencies', icon: '≋', label: 'Frequencies' },
];

export const PlayerSidebar = React.memo(function PlayerSidebar({
  activeTab,
  onNavigate,
  onOpenPlaylist,
  onCreatePlaylist,
  onLogout = logoutSpotify,
}: PlayerSidebarProps) {
  const { data: playlists = [] } = usePlaylists({ enabled: true });

  return (
    <div className="w-64 border-r-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-white/90 hidden md:flex" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 8%, white)' }}>
      <div className="h-28 border-2 border-[var(--color-muted)] bg-[var(--color-light)] flex items-center gap-3 justify-center m-4 rounded-2xl shrink-0">
        <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
        <div>
          <div className="font-pixel text-lg font-bold text-[var(--color-dark)]">KAWAII</div>
          <div className="font-pixel text-xs text-[var(--color-dark)] font-medium">vibes • memories</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-4 py-2 shrink-0" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-2 text-left font-pixel rounded-xl mw-nav-item ${
                isActive
                  ? 'bg-[var(--color-light)] text-[var(--color-dark)] font-bold border border-[var(--color-muted)] shadow-xs'
                  : 'text-[var(--color-dark)] font-medium border border-transparent'
              }`}
            >
              <span className="w-5 text-xl mw-nav-icon">{item.icon}</span>
              <span className="text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col flex-1 overflow-hidden mt-2">
        <div className="px-4 py-2 flex justify-between items-center text-[var(--color-dark)] shrink-0 border-t border-[var(--color-light)]">
          <span className="font-pixel text-sm font-bold uppercase tracking-wider text-[var(--color-dark)]">Your Playlists</span>
          <button
            onClick={onCreatePlaylist}
            className="mw-btn font-bold text-base text-[var(--color-dark)] p-1 rounded"
            aria-label="Create new playlist"
            title="Create new playlist"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {playlists.slice(0, 15).map((p: any, idx: number) => (
            <div
              key={`${p.id || 'playlist'}-${idx}`}
              onClick={() => onOpenPlaylist(p.id)}
              className="flex items-center gap-3 py-2 cursor-pointer mw-row rounded-lg px-2 group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onOpenPlaylist(p.id);
                }
              }}
            >
              {p.images && p.images.length >= 4 ? (
                <div className="w-8 h-8 rounded overflow-hidden grid grid-cols-2 grid-rows-2 shadow-sm shrink-0 border border-[var(--color-muted)] bg-[var(--color-muted)]">
                  {p.images.slice(0, 4).map((img: any, i: number) => (
                    <img key={i} src={img.url || img} alt="" className="w-full h-full object-cover" />
                  ))}
                </div>
              ) : p.images?.[0] ? (
                <img src={(p.images[2] || p.images[0]).url || p.images[0]} loading="lazy" alt={p.name} className="w-8 h-8 rounded object-cover shadow-sm shrink-0 border border-[var(--color-muted)]" />
              ) : (
                <div className="w-8 h-8 bg-[var(--color-muted)] border border-[var(--color-muted)] rounded shadow-sm flex items-center justify-center text-[var(--color-dark)] text-xs font-bold shrink-0">♪</div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-[var(--color-dark)] truncate">{p.name}</span>
                <span className="text-xs text-[var(--color-dark)] font-medium">{(p.items?.total ?? p.tracks?.total ?? p.total_tracks ?? (Array.isArray(p.items) ? p.items.length : (Array.isArray(p.tracks?.items) ? p.tracks.items.length : (Array.isArray(p.tracks) ? p.tracks.length : 0))))} songs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 mt-auto border-t border-[var(--color-light)]">
        <button
          onClick={onLogout}
          className="mw-btn w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[var(--color-vibrant)] text-[var(--color-vibrant)] font-pixel text-sm font-bold hover:bg-[var(--color-vibrant)] hover:text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
});
