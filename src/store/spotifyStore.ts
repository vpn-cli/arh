import { create } from 'zustand';

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
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setError: (err: string | null) => void;

  addToQueue: (track: any, contextUri?: string) => void;
  addTracksToQueue: (items: QueueItem[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueueIndex: (index: number) => void;
  setQueue: (queue: QueueItem[]) => void;
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
  
  queue: [],
  queueIndex: -1,

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
  setQueue: (queue) => set({ queue })
}));
