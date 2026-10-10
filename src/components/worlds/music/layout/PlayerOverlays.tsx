"use client";

import React from "react";
import { WarningIcon, CloseIcon } from "../icons";
import { redirectToSpotifyAuth, logoutSpotify } from "@/lib/spotifyAuth";

export interface PlayerOverlaysProps {
  isReconnecting: boolean;
  recoveryError: string | null;
  onDismissRecoveryError: () => void;
  isSessionExpired: boolean;
  token: string | null;
  onReLogin?: () => void;
  onConnect?: () => void;
  onResetSession?: () => void;
}

export const PlayerOverlays = React.memo(function PlayerOverlays({
  isReconnecting,
  recoveryError,
  onDismissRecoveryError,
  isSessionExpired,
  token,
  onReLogin = redirectToSpotifyAuth,
  onConnect = redirectToSpotifyAuth,
  onResetSession = logoutSpotify,
}: PlayerOverlaysProps) {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  return (
    <>
      {/* Inline Reconnecting Notice / Recovery Error Banner */}
      {(isReconnecting || recoveryError) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300">
          {isReconnecting && (
            <div className="pointer-events-auto bg-[#1DB954] text-white px-4 py-2 rounded-full font-pixel text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(29,185,84,0.4)] border border-white/20 animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Reconnecting to Spotify...</span>
            </div>
          )}
          {recoveryError && !isReconnecting && (
            <div className="pointer-events-auto bg-[#E11D48] text-white px-4 py-2 rounded-full font-pixel text-xs flex items-center gap-2 shadow-[0_4px_12px_rgba(225,29,72,0.4)] border border-white/20">
              <WarningIcon size={14} className="shrink-0 text-white" />
              <span>{recoveryError}</span>
              <button
                onClick={onDismissRecoveryError}
                className="ml-2 hover:opacity-75 font-bold p-0.5 flex items-center justify-center text-white"
                aria-label="Dismiss error notice"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {isSessionExpired && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-light)]/80 backdrop-blur-sm">
          <div className="bg-white rounded-none border-4 border-[var(--color-vibrant)] shadow-[8px_8px_0px_var(--color-muted)] p-8 flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="text-5xl animate-bounce">🔑</div>
            <h3 className="font-pixel text-lg font-bold text-[var(--color-dark)] leading-snug">SESSION EXPIRED</h3>
            <p className="font-pixel text-xs text-[var(--color-dark)] leading-relaxed">
              Your music is still playing! But the controls need a fresh login to keep working.
            </p>
            <button
              onClick={onReLogin}
              className="w-full mt-2 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-pixel text-sm font-bold py-3 px-6 rounded-full shadow-[0_4px_15px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              RE-LOGIN TO SPOTIFY
            </button>
          </div>
        </div>
      )}

      {!token && !isSessionExpired && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/75 backdrop-blur-sm px-4">
          <div className="bg-white/95 rounded-3xl border-2 border-[var(--color-muted)] shadow-[0_18px_45px_var(--color-muted)] shadow-opacity-20 p-8 flex flex-col items-center gap-4 max-w-sm text-center">
            <img src="/hampter/hello_kitty_pin.png" alt="" className="w-16 h-16 object-contain" />
            <h3 className="font-pixel text-2xl font-bold text-[var(--color-dark)] leading-snug">KAWAII_PLAYER.EXE</h3>
            <p className="font-pixel text-sm text-[var(--color-dark)] leading-relaxed font-medium">
              Connect Spotify to load your playlists, queue, and soundscape controls.
            </p>
            <button
              onClick={onConnect}
              className="w-full mt-2 bg-[var(--color-vibrant)] hover:bg-[var(--color-vibrant)] text-white font-pixel text-lg font-bold py-3 px-6 rounded-full shadow-[0_8px_22px_var(--color-vibrant)] hover:scale-105 active:scale-95 transition-all"
            >
              Connect Spotify
            </button>
            {isLocalhost && (
              <button
                onClick={onResetSession}
                className="font-pixel text-xs text-[var(--color-dark)] hover:text-[var(--color-dark)] font-medium"
              >
                Reset local session
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
});
