/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React from "react";
import { logoutSpotify } from "@/lib/spotifyAuth";
import { usePlaylists } from "@/hooks/useSpotify";
import { MediaRow } from "../MediaRow";
import { PlaylistCover } from "../PlaylistCover";
import {
  HomeIcon,
  PlaylistsIcon,
  MixIcon,
  VibesIcon,
  LibraryIcon,
  MemoriesIcon,
  FrequenciesIcon,
  PlusIcon,
} from "../icons";

export type MusicNavTab = 'home' | 'playlists' | 'mix' | 'vibes' | 'library' | 'memories' | 'frequencies';

export type NavIconStyle = 'stickers' | 'svg';

/**
 * Config flag to switch between sticker images and SVG icons.
 * Set to "stickers" or "svg".
 */
export const NAV_ICON_STYLE: NavIconStyle = 'stickers';

export interface PlayerSidebarProps {
  activeTab: string;
  onNavigate: (tab: any) => void;
  onOpenPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
  onLogout?: () => void;
  iconStyle?: NavIconStyle;
}

const NAV_ITEMS: {
  id: MusicNavTab;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}[] = [
  { id: 'home', icon: HomeIcon, label: 'Home' },
  { id: 'playlists', icon: PlaylistsIcon, label: 'Playlists' },
  { id: 'mix', icon: MixIcon, label: 'Mix' },
  { id: 'vibes', icon: VibesIcon, label: 'Vibes' },
  { id: 'library', icon: LibraryIcon, label: 'Library' },
  { id: 'memories', icon: MemoriesIcon, label: 'Memories' },
  { id: 'frequencies', icon: FrequenciesIcon, label: 'Frequencies' },
];

export const PlayerSidebar = React.memo(function PlayerSidebar({
  activeTab,
  onNavigate,
  onOpenPlaylist,
  onCreatePlaylist,
  onLogout = logoutSpotify,
  iconStyle = NAV_ICON_STYLE,
}: PlayerSidebarProps) {
  const { data: playlists = [] } = usePlaylists({ enabled: true });

  return (
    <div
      className="w-[var(--sidebar-width)] border-r-2 border-[var(--color-muted)] flex flex-col shrink-0 bg-white/90 hidden md:flex"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 8%, white)' }}
    >
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
          const IconComp = item.icon;
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
              {iconStyle === 'stickers' ? (
                <img
                  src={`/icons/nav/${item.id}.png`}
                  width={32}
                  height={32}
                  alt=""
                  className="w-8 h-8 object-contain mw-nav-icon shrink-0"
                />
              ) : (
                <span className={`w-8 flex items-center justify-center mw-nav-icon shrink-0 ${isActive ? 'text-[var(--color-vibrant)]' : 'text-[var(--color-dark)]'}`}>
                  <IconComp size={22} />
                </span>
              )}
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
            className="mw-btn font-bold text-[var(--color-dark)] p-1 rounded flex items-center justify-center hover:text-[var(--color-vibrant)]"
            aria-label="Create new playlist"
            title="Create new playlist"
          >
            <PlusIcon size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar flex flex-col gap-0.5">
          {playlists.slice(0, 15).map((p: any, idx: number) => {
            const songCount =
              p.items?.total ??
              p.tracks?.total ??
              p.total_tracks ??
              (Array.isArray(p.items)
                ? p.items.length
                : Array.isArray(p.tracks?.items)
                ? p.tracks.items.length
                : Array.isArray(p.tracks)
                ? p.tracks.length
                : 0);

            return (
              <MediaRow
                key={`${p.id || 'playlist'}-${idx}`}
                title={p.name}
                subtitle={`${songCount} songs`}
                imageSlot={<PlaylistCover images={p.images} size={40} />}
                imageSize={40}
                imageShape="rounded"
                onClick={() => onOpenPlaylist(p.id)}
              />
            );
          })}
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
