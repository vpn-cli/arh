import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EntityType = 'track' | 'artist' | 'playlist';

export interface Memory {
  id: string;
  spotifyUri: string;
  entityType: EntityType;
  note: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  dateLabel?: string;
}

interface MemoriesState {
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
}

export const useMemoriesStore = create<MemoriesState>()(
  persist(
    (set) => ({
      memories: [],
      addMemory: (memoryData) => set((state) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newMemory: Memory = {
          ...memoryData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        // Avoid duplicate memories for the same URI, or allow it? The prompt says "attach a memory".
        // Let's allow one memory per entity for simplicity, or just append. Let's append but check if one exists.
        const existingIndex = state.memories.findIndex(m => m.spotifyUri === memoryData.spotifyUri);
        if (existingIndex >= 0) {
          const updatedMemories = [...state.memories];
          updatedMemories[existingIndex] = {
            ...updatedMemories[existingIndex],
            ...memoryData,
            updatedAt: now,
          };
          return { memories: updatedMemories };
        }
        return { memories: [...state.memories, newMemory] };
      }),
      updateMemory: (id, updates) => set((state) => ({
        memories: state.memories.map((m) =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        ),
      })),
      deleteMemory: (id) => set((state) => ({
        memories: state.memories.filter((m) => m.id !== id),
      })),
    }),
    {
      name: 'kawaii_player_memories_v1',
    }
  )
);
