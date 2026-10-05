import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RepeatMode = 'off' | 'context' | 'track';

export interface QueueItem {
  track: any;
  contextUri?: string;
}

interface SpotifyPlayerState {
  player: any | null;
  deviceId: string | null;
  isReady: boolean;
  isActive: boolean;
  currentTrack: any | null;
  isPaused: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  position: number;
  duration: number;
  error: string | null;
  
  queue: QueueItem[];
  queueIndex: number;

  setPlayer: (player: any) => void;
  setDeviceId: (id: string | null) => void;
  setIsReady: (ready: boolean) => void;
  setIsActive: (active: boolean) => void;
  setCurrentTrack: (track: any) => void;
  setIsPaused: (paused: boolean) => void;
  setIsShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setError: (err: string | null) => void;

  addToQueue: (track: any, contextUri?: string) => void;
  addTracksToQueue: (items: QueueItem[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueueIndex: (index: number) => void;
  setQueue: (queue: QueueItem[]) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
}

export const useSpotifyPlayerStore = create<SpotifyPlayerState>()(
  persist(
    (set) => ({
      player: null,
      deviceId: null,
      isReady: false,
      isActive: false,
      currentTrack: null,
      isPaused: true,
      isShuffle: false,
      repeatMode: 'off',
      position: 0,
      duration: 0,
      error: null,
      
      queue: [],
      queueIndex: -1,

      setPlayer: (player) => set({ player }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setIsReady: (isReady) => set({ isReady }),
      setIsActive: (isActive) => set({ isActive }),
      setCurrentTrack: (currentTrack) => set((state) => ({
        currentTrack,
        duration: currentTrack?.duration_ms || state.duration
      })),
      setIsPaused: (isPaused) => set({ isPaused }),
      setIsShuffle: (isShuffle) => set({ isShuffle }),
      setRepeatMode: (repeatMode) => set({ repeatMode }),
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),
      setError: (error) => set({ error }),

      addToQueue: (track, contextUri) => set((state) => ({ queue: [...state.queue, { track, contextUri }] })),
      addTracksToQueue: (items) => set((state) => ({ queue: [...state.queue, ...items] })),
      removeFromQueue: (index) => set((state) => {
        const newQueue = [...state.queue];
        newQueue.splice(index, 1);
        
        // Adjust queueIndex
        let newIndex = state.queueIndex;
        if (index <= state.queueIndex) {
          newIndex--;
        }
        
        // Sanity bounds check just in case, although newIndex can be -1
        if (newIndex < -1) newIndex = -1;
        
        return { queue: newQueue, queueIndex: newIndex };
      }),
      clearQueue: () => set({ queue: [], queueIndex: -1 }),
      setQueueIndex: (queueIndex) => set({ queueIndex }),
      setQueue: (queue) => set({ queue }),
      reorderQueue: (startIndex, endIndex) => set((state) => {
        const newQueue = [...state.queue];
        const [removed] = newQueue.splice(startIndex, 1);
        newQueue.splice(endIndex, 0, removed);

        let newIndex = state.queueIndex;
        if (startIndex === state.queueIndex) {
          newIndex = endIndex;
        } else if (startIndex < state.queueIndex && endIndex >= state.queueIndex) {
          newIndex--;
        } else if (startIndex > state.queueIndex && endIndex <= state.queueIndex) {
          newIndex++;
        }

        return { queue: newQueue, queueIndex: newIndex };
      })
    }),
    {
      name: 'kawaii_spotify_player_cache',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        duration: state.duration,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        queue: state.queue,
        queueIndex: state.queueIndex,
      }),
    }
  )
);
