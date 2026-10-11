import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_VOLUME = 0.5;
export const VOLUME_STORAGE_KEY = 'kawaii_player_volume';

export interface VolumeStoreState {
  volume: number;
  previousVolume: number;
  setVolume: (volume: number) => void;
  setPreviousVolume: (volume: number) => void;
}

export const usePlayerVolumeStore = create<VolumeStoreState>()(
  persist(
    (set) => ({
      volume: DEFAULT_VOLUME,
      previousVolume: DEFAULT_VOLUME,
      setVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({ volume: clamped });
      },
      setPreviousVolume: (previousVolume: number) => {
        const clamped = Math.max(0, Math.min(1, previousVolume));
        set({ previousVolume: clamped });
      },
    }),
    {
      name: VOLUME_STORAGE_KEY,
    }
  )
);

export function getPersistedVolume(): number {
  const vol = usePlayerVolumeStore.getState().volume;
  return typeof vol === 'number' && !isNaN(vol) ? vol : DEFAULT_VOLUME;
}
