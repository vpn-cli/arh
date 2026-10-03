import { create } from 'zustand';

interface SpotifyPlayerState {
  player: any | null;
  deviceId: string | null;
  isReady: boolean;
  isActive: boolean;
  currentTrack: any | null;
  isPaused: boolean;
  isShuffle: boolean;
  position: number;
  duration: number;
  error: string | null;
  setPlayer: (player: any) => void;
  setDeviceId: (id: string | null) => void;
  setIsReady: (ready: boolean) => void;
  setIsActive: (active: boolean) => void;
  setCurrentTrack: (track: any) => void;
  setIsPaused: (paused: boolean) => void;
  setIsShuffle: (shuffle: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setError: (err: string | null) => void;
}

export const useSpotifyPlayerStore = create<SpotifyPlayerState>((set) => ({
  player: null,
  deviceId: null,
  isReady: false,
  isActive: false,
  currentTrack: null,
  isPaused: true,
  isShuffle: false,
  position: 0,
  duration: 0,
  error: null,
  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setIsReady: (isReady) => set({ isReady }),
  setIsActive: (isActive) => set({ isActive }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setIsShuffle: (isShuffle) => set({ isShuffle }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setError: (error) => set({ error }),
}));
