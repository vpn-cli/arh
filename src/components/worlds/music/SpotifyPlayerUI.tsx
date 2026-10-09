/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  useSpotifySession,
  usePlaylists,
  useBirthdayMix,
  useTrackSavedStatus,
  useRecentlyPlayed,
  usePlayerQueue,
} from "@/hooks/useSpotify";
import { useLikedTracks } from "@/hooks/useLikedTracks";
import { SearchResults } from "./SearchResults";
import { PlaylistDetail } from "./PlaylistDetail";
import { AlbumDetail } from "./AlbumDetail";
import { ArtistDetail } from "./ArtistDetail";
import { MixSection } from "./MixSection";
import { FrequenciesSection } from "./FrequenciesSection";
import { VibesSection } from "./VibesSection";
import { AddToPlaylistModal, CreatePlaylistModal, RemovePlaylistModal } from "./PlaylistModals";
import { MemoriesSection } from "./MemoriesSection";
import { MemoryEditorModal } from "./MemoryEditorModal";
import { QueueModal } from "./QueueModal";
import { usePlaylistMutations } from "@/hooks/usePlaylistMutations";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";
import { LyricsView, LyricsViewHandle } from "./lyrics/LyricsView";
import { prefetchLyrics } from "./lyrics/useLyrics";
import { usePlaybackActions } from "./playback/usePlaybackActions";
import { NowPlayingPanel, ProgressBarHandle } from "./now-playing";
import { PlayerHeader } from "./layout/PlayerHeader";
import { PlayerSidebar } from "./layout/PlayerSidebar";
import { PlayerOverlays } from "./layout/PlayerOverlays";
import { HomeTab } from "./home/HomeTab";
import { PlaylistsTab } from "./tabs/PlaylistsTab";
import { LibraryTab } from "./tabs/LibraryTab";
import { RecentTab } from "./tabs/RecentTab";
import { PaletteBackground } from "./palette/PaletteBackground";
import { useRecoveryStatus } from "./hooks/useRecoveryStatus";
import { useRateLimitTimer } from "./hooks/useRateLimitTimer";
import { usePlayerStateSync } from "./hooks/usePlayerStateSync";

type TabType = 'home' | 'library' | 'recent' | 'mix' | 'playlists' | 'search' | 'album' | 'artist' | 'queue' | 'frequencies' | 'vibes' | 'memories';

export default function SpotifyPlayerUI({ onGoHome }: { onGoHome?: () => void }) {
  const { data: sessionData, isError: sessionError } = useSpotifySession();
  const token = sessionData?.accessToken || null;

  const {
    isReconnecting,
    recoveryError,
    setRecoveryError,
    handleDismissRecoveryError,
    isSessionExpired,
  } = useRecoveryStatus({ sessionError: Boolean(sessionError) });

  const currentTrack = useSpotifyPlayerStore((s) => s.currentTrack);
  const isPaused = useSpotifyPlayerStore((s) => s.isPaused);
  const isShuffle = useSpotifyPlayerStore((s) => s.isShuffle);
  const queue = useSpotifyPlayerStore((s) => s.queue);
  const queueIndex = useSpotifyPlayerStore((s) => s.queueIndex);
  const setCurrentTrack = useSpotifyPlayerStore((s) => s.setCurrentTrack);
  const setDuration = useSpotifyPlayerStore((s) => s.setDuration);

  const progressBarRef = useRef<ProgressBarHandle>(null);
  const lyricsViewRef = useRef<LyricsViewHandle | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const [showLyrics, setShowLyrics] = useState(false);
  const handleCloseLyrics = useCallback(() => setShowLyrics(false), []);
  const handleToggleLyrics = useCallback(() => setShowLyrics((prev) => !prev), []);

  const lyricsTrackDisplay = useMemo(() => ({
    name: currentTrack?.name,
    artists: currentTrack?.artists ? currentTrack.artists.map((a: any) => a.name).join(', ') : '',
    art: currentTrack?.album?.images?.[0]?.url || (typeof currentTrack?.album?.images?.[0] === 'string' ? currentTrack.album.images[0] : null) || null,
  }), [currentTrack?.id]);

  // Modal States
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [removingPlaylist, setRemovingPlaylist] = useState<any>(null);
  const [addingTrackUri, setAddingTrackUri] = useState<string | null>(null);
  const [memoryEditorEntity, setMemoryEditorEntity] = useState<any>(null);
  const [memoryEditorType, setMemoryEditorType] = useState<'track' | 'artist' | 'playlist' | null>(null);
  const [memoryEditorMemoryId, setMemoryEditorMemoryId] = useState<string | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueModalTab, setQueueModalTab] = useState<'queue' | 'recent'>('queue');
  const [selectedDevice] = useState<string>("");

  const { removeItems, reorderItems } = usePlaylistMutations();

  const handleExpandQueue = useCallback((tab: 'queue' | 'recent') => {
    setQueueModalTab(tab);
    setIsQueueModalOpen(true);
  }, []);

  // Stable Navigation Callbacks
  const navigate = useCallback((tab: TabType) => setActiveTab(tab), []);
  const openPlaylist = useCallback((id: string) => { setSelectedPlaylistId(id); setActiveTab('playlists'); }, []);
  const openAlbum = useCallback((id: string) => { setSelectedAlbumId(id); setActiveTab('album'); }, []);
  const openArtist = useCallback((id: string) => { setSelectedArtistId(id); setActiveTab('artist'); }, []);
  const handleSearchChange = useCallback((value: string) => { setGlobalSearch(value); setActiveTab('search'); }, []);
  const handleClearSearch = useCallback(() => setGlobalSearch(''), []);
  const handleCreatePlaylist = useCallback(() => setIsCreatingPlaylist(true), []);
  const handleAddMemory = useCallback((entity: any, type: 'track' | 'artist' | 'playlist') => {
    setMemoryEditorEntity(entity);
    setMemoryEditorType(type);
  }, []);
  const handleAddToPlaylist = useCallback((uri: string) => setAddingTrackUri(uri), []);

  const { data: playlists = [], error: playlistsError } = usePlaylists({ enabled: true });
  const { data: likedData, error: likedError } = useLikedTracks(0, 50, { enabled: activeTab === 'library' || activeTab === 'home' });
  const { data: birthdayMixTracks = [], error: mixError } = useBirthdayMix({ enabled: true });
  const { data: recentTracks = [], error: recentError } = useRecentlyPlayed({
    enabled: !currentTrack || activeTab === 'recent' || activeTab === 'home' || isQueueModalOpen,
  });
  const { data: playerQueueData } = usePlayerQueue({ enabled: !!token });

  const effectiveQueue = useMemo(() => {
    if (queue && queue.length > 0) return queue;
    if (playerQueueData?.queue && playerQueueData.queue.length > 0) {
      return playerQueueData.queue.map((t: any) => ({ track: t, contextUri: undefined }));
    }
    return [];
  }, [queue, playerQueueData]);

  // Auto-load last played track from Spotify if player cache is empty
  useEffect(() => {
    if (!currentTrack && recentTracks.length > 0 && recentTracks[0]?.track) {
      const lastPlayed = recentTracks[0].track;
      setCurrentTrack(lastPlayed);
      if (lastPlayed.duration_ms) setDuration(lastPlayed.duration_ms);
    }
  }, [currentTrack, recentTracks, setCurrentTrack, setDuration]);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalSearch), 500);
    return () => clearTimeout(t);
  }, [globalSearch]);

  const { data: isSaved = false } = useTrackSavedStatus(currentTrack?.id);

  const {
    playTrack, playTracks, playPlaylist, playContextTrack, playQueueItem,
    togglePlay, nextTrack, prevTrack, toggleShuffle, toggleRepeat,
    toggleSaveTrack, handleAddToQueue, userPausedRef,
  } = usePlaybackActions({
    selectedDevice, setRecoveryError, birthdayMixTracks,
    likedTracks: likedData?.tracks, recentTracks, isSaved, effectiveQueue,
  });

  const rateLimitTimer = useRateLimitTimer([playlistsError, mixError, likedError, recentError]);

  const { getPositionMs, handleSeek, handleDragSeek } = usePlayerStateSync({
    progressBarRef, lyricsViewRef, userPausedRef, selectedDevice,
  });

  // Prefetch lyrics for current and next track
  useEffect(() => {
    if (currentTrack?.id) prefetchLyrics(currentTrack.id);
    if (effectiveQueue && effectiveQueue.length > 0 && queueIndex < effectiveQueue.length - 1) {
      const nextTrackItem = effectiveQueue[queueIndex + 1]?.track;
      if (nextTrackItem?.id) prefetchLyrics(nextTrackItem.id);
    }
  }, [currentTrack?.id, effectiveQueue, queueIndex]);

  return (
    <div className="w-full h-[100dvh] flex flex-col text-[var(--color-dark)] font-sans relative overflow-hidden">
      <PaletteBackground currentTrack={currentTrack} effectiveQueue={effectiveQueue} queueIndex={queueIndex} />

      <div className="relative z-10 flex flex-col h-full w-full flex-1 min-h-0">
        <PlayerOverlays
          isReconnecting={isReconnecting} recoveryError={recoveryError}
          onDismissRecoveryError={handleDismissRecoveryError} isSessionExpired={isSessionExpired} token={token}
        />

        <PlayerHeader
          onGoHome={onGoHome} searchQuery={globalSearch}
          onSearchChange={handleSearchChange} onClearSearch={handleClearSearch}
        />

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative">
          <PlayerSidebar
            activeTab={activeTab} onNavigate={navigate}
            onOpenPlaylist={openPlaylist} onCreatePlaylist={handleCreatePlaylist}
          />

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6 relative bg-[var(--color-light)]">
            {activeTab === 'home' && (
              <HomeTab
                token={token} onNavigate={navigate} onOpenPlaylist={openPlaylist}
                playTrack={playTrack} playTracks={playTracks} togglePlay={togglePlay}
              />
            )}

            {activeTab === 'playlists' && (
              selectedPlaylistId ? (
                <PlaylistDetail
                  playlistId={selectedPlaylistId} onBack={() => setSelectedPlaylistId(null)}
                  onEdit={() => { const p = playlists.find((pl: any) => pl.id === selectedPlaylistId); if (p) setEditingPlaylist(p); }}
                  onRemove={() => { const p = playlists.find((pl: any) => pl.id === selectedPlaylistId); if (p) setRemovingPlaylist(p); }}
                  onPlayPlaylist={(uri, tracks) => playPlaylist(uri, tracks)}
                  onPlayTrack={(uri, contextUri, track) => contextUri ? playContextTrack(contextUri, uri) : playTrack(uri, undefined, track)}
                  onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddToPlaylist}
                  onRemoveFromPlaylist={async (uri) => { if (selectedPlaylistId) await removeItems.mutateAsync({ playlistId: selectedPlaylistId, uri }); }}
                  onAddMemory={handleAddMemory}
                  onReorder={async (start, end) => { if (selectedPlaylistId) await reorderItems.mutateAsync({ playlistId: selectedPlaylistId, range_start: start, insert_before: end > start ? end + 1 : end }); }}
                  onShufflePlay={async (uri, tracks) => { if (!isShuffle) await toggleShuffle(); playPlaylist(uri, tracks); }}
                />
              ) : (
                <PlaylistsTab
                  onOpenPlaylist={openPlaylist} onCreatePlaylist={handleCreatePlaylist} rateLimitTimer={rateLimitTimer}
                />
              )
            )}

            {activeTab === 'recent' && (
              <RecentTab
                playTrack={playTrack} onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddToPlaylist}
                onAddMemory={handleAddMemory} rateLimitTimer={rateLimitTimer}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab
                playTrack={playTrack} playTracks={playTracks} onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleAddToPlaylist} onAddMemory={handleAddMemory} rateLimitTimer={rateLimitTimer}
              />
            )}

            {activeTab === 'mix' && (
              <MixSection
                onPlayTrack={playTrack} onPlayTracks={playTracks} onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleAddToPlaylist} onClickArtist={openArtist} onClickPlaylist={openPlaylist}
                onAddMemory={handleAddMemory} rateLimitTimer={rateLimitTimer}
              />
            )}

            {activeTab === 'frequencies' && (
              <FrequenciesSection
                onPlayTrack={playTrack} onPlayTracks={playTracks} onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleAddToPlaylist} onClickArtist={openArtist} onAddMemory={handleAddMemory}
                rateLimitTimer={rateLimitTimer}
              />
            )}

            {activeTab === 'vibes' && (
              <VibesSection
                onPlayTrack={playTrack} onPlayTracks={playTracks} onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleAddToPlaylist} onClickArtist={openArtist}
                onAddMemory={(entity, type) => { setMemoryEditorEntity(entity); setMemoryEditorType(type); setMemoryEditorMemoryId(null); }}
                rateLimitTimer={rateLimitTimer}
              />
            )}

            {activeTab === 'memories' && (
              <MemoriesSection
                onPlayTrack={playTrack} onPlayPlaylist={playPlaylist} onAddToQueue={handleAddToQueue}
                onAddToPlaylist={handleAddToPlaylist} onClickArtist={openArtist} onClickPlaylist={openPlaylist}
                onEditMemory={(entity, type, memoryId) => { setMemoryEditorEntity(entity); setMemoryEditorType(type); setMemoryEditorMemoryId(memoryId || null); }}
              />
            )}

            {activeTab === 'search' && (
              <div className="flex flex-col h-full">
                <SearchResults
                  query={debouncedSearch} onPlayTrack={playTrack} onAddToQueue={handleAddToQueue}
                  onAddToPlaylist={handleAddToPlaylist} onClickPlaylist={openPlaylist} onClickAlbum={openAlbum}
                  onClickArtist={openArtist} onAddMemory={handleAddMemory}
                />
              </div>
            )}

            {activeTab === 'album' && selectedAlbumId && (
              <AlbumDetail
                albumId={selectedAlbumId} onBack={() => { navigate('search'); setSelectedAlbumId(null); }}
                onPlayAlbum={playPlaylist} onPlayTrack={(uri, contextUri) => playTrack(uri, contextUri)}
                onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddToPlaylist} onAddMemory={handleAddMemory}
                onShufflePlay={async (uri) => { if (!isShuffle) await toggleShuffle(); playPlaylist(uri); }}
              />
            )}

            {activeTab === 'artist' && selectedArtistId && (
              <ArtistDetail
                artistId={selectedArtistId} onBack={() => { navigate('search'); setSelectedArtistId(null); }}
                onClickAlbum={openAlbum} onPlayTrack={(uri, contextUri) => playTrack(uri, contextUri)}
                onAddToQueue={handleAddToQueue} onAddToPlaylist={handleAddToPlaylist}
                onAddMemory={(entity, type) => { setMemoryEditorEntity(entity); setMemoryEditorType(type); setMemoryEditorMemoryId(null); }}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <NowPlayingPanel
            progressBarRef={progressBarRef} showLyrics={showLyrics} onToggleLyrics={handleToggleLyrics}
            isSaved={isSaved} toggleSaveTrack={toggleSaveTrack} getPositionMs={getPositionMs}
            onSeek={handleSeek} onDragSeek={handleDragSeek} token={token} togglePlay={togglePlay}
            prevTrack={prevTrack} nextTrack={nextTrack} toggleShuffle={toggleShuffle}
            toggleRepeat={toggleRepeat} onExpandQueue={handleExpandQueue} playQueueItem={playQueueItem}
            playTrack={playTrack} playContextTrack={playContextTrack} handleAddToQueue={handleAddToQueue}
          />

          {/* Lyrics View Overlay */}
          {showLyrics && (
            <LyricsView
              ref={lyricsViewRef}
              trackId={currentTrack?.id || null}
              trackDisplay={lyricsTrackDisplay}
              isPaused={isPaused}
              getPositionMs={getPositionMs}
              onSeek={handleSeek}
              onClose={handleCloseLyrics}
            />
          )}
        </div>

        <QueueModal
          isOpen={isQueueModalOpen} onClose={() => setIsQueueModalOpen(false)} initialTab={queueModalTab}
          onPlayTrack={(uri, contextUri) => contextUri ? playContextTrack(contextUri, uri) : playTrack(uri)}
          onAddToPlaylist={handleAddToPlaylist}
        />

        <MemoryEditorModal
          isOpen={!!memoryEditorEntity || !!memoryEditorMemoryId}
          onClose={() => { setMemoryEditorEntity(null); setMemoryEditorType(null); setMemoryEditorMemoryId(null); }}
          entity={memoryEditorEntity} entityType={memoryEditorType} memoryId={memoryEditorMemoryId}
        />

        {addingTrackUri && <AddToPlaylistModal trackUri={addingTrackUri} onClose={() => setAddingTrackUri(null)} />}
        {isCreatingPlaylist && <CreatePlaylistModal onClose={() => setIsCreatingPlaylist(false)} />}
        {editingPlaylist && <CreatePlaylistModal onClose={() => setEditingPlaylist(null)} playlistToEdit={editingPlaylist} />}
        {removingPlaylist && (
          <RemovePlaylistModal
            playlist={removingPlaylist} onClose={() => setRemovingPlaylist(null)}
            onComplete={() => { if (selectedPlaylistId === removingPlaylist.id) setSelectedPlaylistId(null); }}
          />
        )}
      </div>
    </div>
  );
}
