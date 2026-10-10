/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { PlayIcon, PauseIcon } from "../icons";

export interface CurrentlyPlayingHeroProps {
  currentTrack: any;
  isPaused: boolean;
  heroArt: string;
  birthdayMixTracks: any[];
  likedTracks: any[];
  onNavigate: (tab: any) => void;
  playTracks: (uris: string[], tracks?: any[]) => void;
  togglePlay: () => void;
}

export const CurrentlyPlayingHero = React.memo(function CurrentlyPlayingHero({
  currentTrack,
  isPaused,
  heroArt,
  birthdayMixTracks,
  likedTracks,
  onNavigate,
  playTracks,
  togglePlay,
}: CurrentlyPlayingHeroProps) {
  return (
    <section className="relative h-[220px] sm:h-[260px] overflow-hidden rounded-[24px] border-2 border-[var(--color-muted)] bg-[var(--color-light)] shadow-sm">
      <img
        src={heroArt}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-75"
        style={{ objectPosition: "65% 50%" }}
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-light)]/95 via-[var(--color-light)]/85 to-[var(--color-light)]/40" />
      <div className="relative z-10 flex h-full items-center px-6 sm:px-8 py-6 sm:py-8">
        <div className="max-w-lg">
          <p className="font-pixel text-caption sm:text-body font-bold tracking-widest text-[var(--color-dark)] uppercase">
            {currentTrack ? "CURRENTLY PLAYING" : "GOOD EVENING"}
          </p>
          <h2 className="mt-2 font-pixel text-display font-extrabold leading-tight text-[var(--color-dark)] drop-shadow-[0_2px_0_#FFFFFF]">
            {currentTrack ? currentTrack.name : "Let's listen together ♡"}
          </h2>
          <p className="mt-2 sm:mt-3 font-pixel text-body sm:text-title font-medium text-[var(--color-dark)] opacity-90 truncate">
            {currentTrack
              ? currentTrack.artists?.map((a: any) => a.name).join(", ")
              : "What are we listening to today?"}
          </p>
          <button
            onClick={() => {
              if (currentTrack) {
                togglePlay();
              } else {
                const tracksToPlay =
                  birthdayMixTracks.length > 0 ? birthdayMixTracks : likedTracks;
                if (tracksToPlay.length > 0) {
                  playTracks(
                    tracksToPlay.map((t: any) => t.uri),
                    tracksToPlay
                  );
                } else {
                  onNavigate("mix");
                }
              }
            }}
            className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-vibrant)] px-5 sm:px-6 py-2 sm:py-2.5 font-pixel text-body font-bold text-[var(--on-vibrant)] shadow-md mw-btn group cursor-pointer"
          >
            <span>
              {currentTrack ? (
                isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />
              ) : (
                <PlayIcon size={16} />
              )}
            </span>
            {currentTrack ? (isPaused ? "Resume" : "Playing") : "Play Mix"}
          </button>
        </div>
      </div>
    </section>
  );
});
