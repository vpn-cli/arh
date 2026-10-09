"use client";

import { useState, useEffect, useCallback } from "react";
import { VIBES } from "@/config/vibes";
import { proxyFetch } from "@/lib/spotifyClient";

export function useResolvedVibes(
  token: string | null,
  onOpenPlaylist?: (id: string) => void
) {
  const [resolvedVibes, setResolvedVibes] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!token) return;

    const resolveVibes = async () => {
      const newResolved: Record<string, string | null> = {};
      let updated = false;

      for (const vibe of VIBES) {
        if (vibe.playlistId) {
          newResolved[vibe.id] = vibe.playlistId;
          continue;
        }

        const cacheKey = `resolved_vibe_${vibe.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          newResolved[vibe.id] = cached === "null" ? null : cached;
          continue;
        }

        try {
          const res = await proxyFetch(`search?q=${encodeURIComponent(vibe.searchQuery)}&type=playlist&limit=10`);
          if (res && res.playlists?.items?.length > 0) {
            let bestPlaylist = null;
            let maxFollowers = -1;

            for (const item of res.playlists.items) {
              if (!item) continue;
              const trackCount = item.items?.total ?? item.tracks?.total ?? 0;
              if (trackCount >= 20 || !bestPlaylist) {
                const followers = item.followers?.total || 0;
                if (followers > maxFollowers || !bestPlaylist) {
                  maxFollowers = followers;
                  bestPlaylist = item;
                }
              }
            }

            if (bestPlaylist) {
              newResolved[vibe.id] = bestPlaylist.id;
              localStorage.setItem(cacheKey, bestPlaylist.id);
            } else {
              newResolved[vibe.id] = null;
              localStorage.setItem(cacheKey, "null");
            }
          } else {
            newResolved[vibe.id] = null;
            localStorage.setItem(cacheKey, "null");
          }
        } catch (e) {
          console.error(`Failed to resolve vibe ${vibe.id}`, e);
          newResolved[vibe.id] = null;
        }
        updated = true;
      }

      if (updated || Object.keys(newResolved).length > 0) {
        setResolvedVibes((prev) => ({ ...prev, ...newResolved }));
      }
    };

    resolveVibes();
  }, [token]);

  const handleVibeClick = useCallback(
    (vibeId: string) => {
      const targetPlaylistId = resolvedVibes[vibeId] || VIBES.find((v) => v.id === vibeId)?.playlistId;
      if (targetPlaylistId && onOpenPlaylist) {
        onOpenPlaylist(targetPlaylistId);
      }
    },
    [resolvedVibes, onOpenPlaylist]
  );

  return {
    resolvedVibes,
    handleVibeClick,
  };
}
