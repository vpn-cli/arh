"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type TabType =
  | 'home'
  | 'library'
  | 'recent'
  | 'mix'
  | 'playlists'
  | 'search'
  | 'album'
  | 'artist'
  | 'queue'
  | 'frequencies'
  | 'vibes'
  | 'memories';

export interface UseMusicNavigationOptions {
  onNavigate?: () => void;
}

export function useMusicNavigation(options?: UseMusicNavigationOptions) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPlaylistId, setSelectedPlaylistIdState] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Keep onNavigate in a ref so navigation callbacks stay stable
  const onNavigateRef = useRef(options?.onNavigate);
  useEffect(() => {
    onNavigateRef.current = options?.onNavigate;
  });

  // Single internal helper invoked on any view navigation
  const notifyNavigate = useCallback(() => {
    onNavigateRef.current?.();
  }, []);

  const navigate = useCallback((tab: TabType) => {
    setActiveTab(tab);
    notifyNavigate();
  }, [notifyNavigate]);

  const openPlaylist = useCallback((id: string) => {
    setSelectedPlaylistIdState(id);
    setActiveTab('playlists');
    notifyNavigate();
  }, [notifyNavigate]);

  const openAlbum = useCallback((id: string) => {
    setSelectedAlbumId(id);
    setActiveTab('album');
    notifyNavigate();
  }, [notifyNavigate]);

  const openArtist = useCallback((id: string) => {
    setSelectedArtistId(id);
    setActiveTab('artist');
    notifyNavigate();
  }, [notifyNavigate]);

  const handleSearchChange = useCallback((value: string) => {
    setGlobalSearch(value);
    setActiveTab('search');
    notifyNavigate();
  }, [notifyNavigate]);

  // handleClearSearch does not invoke onNavigate
  const handleClearSearch = useCallback(() => {
    setGlobalSearch('');
  }, []);

  // Named back handlers
  const handleBackFromPlaylist = useCallback(() => {
    setSelectedPlaylistIdState(null);
    notifyNavigate();
  }, [notifyNavigate]);

  const handleBackFromAlbum = useCallback(() => {
    setActiveTab('search');
    setSelectedAlbumId(null);
    notifyNavigate();
  }, [notifyNavigate]);

  const handleBackFromArtist = useCallback(() => {
    setActiveTab('search');
    setSelectedArtistId(null);
    notifyNavigate();
  }, [notifyNavigate]);

  const setSelectedPlaylistId = useCallback((id: string | null) => {
    setSelectedPlaylistIdState(id);
    notifyNavigate();
  }, [notifyNavigate]);

  return {
    activeTab,
    selectedPlaylistId,
    selectedAlbumId,
    selectedArtistId,
    globalSearch,
    navigate,
    openPlaylist,
    openAlbum,
    openArtist,
    handleSearchChange,
    handleClearSearch,
    handleBackFromPlaylist,
    handleBackFromAlbum,
    handleBackFromArtist,
    setSelectedPlaylistId,
  };
}
