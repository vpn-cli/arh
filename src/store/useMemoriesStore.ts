import { create } from 'zustand';
import { memoriesFetch } from '@/lib/memoriesClient';

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
  isLoading: boolean;
  error: string | null;
  addMemory: (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  loadMemories: () => Promise<void>;
  clearError: () => void;
}

const LOCAL_STORAGE_KEY = 'kawaii_player_memories_v1';
const IMPORTED_FLAG_KEY = 'kawaii_player_memories_imported';

async function performOneTimeImport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const alreadyImported = localStorage.getItem(IMPORTED_FLAG_KEY);
  if (alreadyImported) return false;

  const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!rawLocal) {
    localStorage.setItem(IMPORTED_FLAG_KEY, 'true');
    return false;
  }

  try {
    const parsed = JSON.parse(rawLocal);
    const candidateList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.state?.memories)
      ? parsed.state.memories
      : [];

    if (!Array.isArray(candidateList) || candidateList.length === 0) {
      localStorage.setItem(IMPORTED_FLAG_KEY, 'true');
      return false;
    }

    const payload = candidateList.slice(0, 500).map((m: any) => ({
      entityType: m.entityType,
      spotifyUri: m.spotifyUri,
      note: m.note,
      category: m.category || null,
      dateLabel: m.dateLabel || null,
      createdAt: m.createdAt || null,
    }));

    const res = await memoriesFetch('/api/memories/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      localStorage.setItem(IMPORTED_FLAG_KEY, 'true');
      console.log(`[Memories Import] Successfully imported ${payload.length} local memories to Neon.`);
      return true;
    } else {
      console.warn(`[Memories Import] Import returned status ${res.status}`);
      return false;
    }
  } catch (err) {
    console.error('[Memories Import] Failed to import local memories:', err);
    return false;
  }
}

export const useMemoriesStore = create<MemoriesState>()((set, get) => ({
  memories: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadMemories: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await memoriesFetch('/api/memories');
      if (!res) {
        set({ isLoading: false });
        return;
      }

      if (res.status === 401) {
        // Not logged in; clear memories
        set({ memories: [], isLoading: false });
        return;
      }

      if (res.status === 503) {
        // Upstream Spotify temporary error; do not clear memories or prompt login
        set({ isLoading: false, error: 'Spotify service temporarily unavailable' });
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        set({ isLoading: false, error: err.error || 'Failed to load memories' });
        return;
      }

      const rows = await res.json();
      const serverMemories: Memory[] = rows.map((row: any) => ({
        id: row.id,
        spotifyUri: row.spotifyUri,
        entityType: row.entityType,
        note: row.note,
        category: row.category || undefined,
        dateLabel: row.dateLabel || undefined,
        createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date(row.createdAt).toISOString(),
        updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date(row.updatedAt).toISOString(),
      }));

      set({ memories: serverMemories, isLoading: false });

      // Run one-time import in background if needed
      const imported = await performOneTimeImport();
      if (imported) {
        const recheck = await memoriesFetch('/api/memories');
        if (recheck.ok) {
          const freshRows = await recheck.json();
          const freshMemories: Memory[] = freshRows.map((row: any) => ({
            id: row.id,
            spotifyUri: row.spotifyUri,
            entityType: row.entityType,
            note: row.note,
            category: row.category || undefined,
            dateLabel: row.dateLabel || undefined,
            createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date(row.createdAt).toISOString(),
            updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date(row.updatedAt).toISOString(),
          }));
          set({ memories: freshMemories });
        }
      }
    } catch (err: any) {
      console.error('[loadMemories] Error:', err);
      set({ isLoading: false, error: err?.message || 'Failed to load memories' });
    }
  },

  addMemory: (memoryData) => {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const previousMemories = get().memories;

    const existingIndex = previousMemories.findIndex((m) => m.spotifyUri === memoryData.spotifyUri);
    let optimisticMemories: Memory[];

    if (existingIndex >= 0) {
      optimisticMemories = [...previousMemories];
      optimisticMemories[existingIndex] = {
        ...optimisticMemories[existingIndex],
        ...memoryData,
        updatedAt: now,
      };
    } else {
      const newMemory: Memory = {
        ...memoryData,
        id: tempId,
        createdAt: now,
        updatedAt: now,
      };
      optimisticMemories = [...previousMemories, newMemory];
    }

    // Apply optimistic update immediately
    set({ memories: optimisticMemories, error: null });

    // Sync with server asynchronously
    (async () => {
      try {
        const res = await memoriesFetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memoryData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to save memory (status ${res.status})`);
        }

        const savedRow = await res.json();

        // Replace temporary client ID with server-generated ID
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === tempId || m.spotifyUri === savedRow.spotifyUri
              ? {
                  ...m,
                  id: savedRow.id,
                  createdAt: typeof savedRow.createdAt === 'string' ? savedRow.createdAt : new Date(savedRow.createdAt).toISOString(),
                  updatedAt: typeof savedRow.updatedAt === 'string' ? savedRow.updatedAt : new Date(savedRow.updatedAt).toISOString(),
                }
              : m
          ),
        }));
      } catch (err: any) {
        console.error('[addMemory] Server save failed, rolling back:', err);
        set({ memories: previousMemories, error: err?.message || 'Failed to save memory' });
      }
    })();
  },

  updateMemory: (id, updates) => {
    const previousMemories = get().memories;
    const now = new Date().toISOString();

    const patchPayload: Record<string, any> = { id };

    if ('note' in updates && updates.note !== undefined) {
      patchPayload.note = updates.note;
    }

    if ('category' in updates) {
      const val = updates.category;
      patchPayload.category = (typeof val === 'string' && val.trim().length > 0) ? val.trim() : null;
    }

    if ('dateLabel' in updates) {
      const val = updates.dateLabel;
      patchPayload.dateLabel = (typeof val === 'string' && val.trim().length > 0) ? val.trim() : null;
    }

    // Apply optimistic update
    set({
      memories: previousMemories.map((m) =>
        m.id === id
          ? {
              ...m,
              ...updates,
              category: 'category' in updates
                ? (patchPayload.category ?? undefined)
                : m.category,
              dateLabel: 'dateLabel' in updates
                ? (patchPayload.dateLabel ?? undefined)
                : m.dateLabel,
              updatedAt: now,
            }
          : m
      ),
      error: null,
    });

    // Sync with server asynchronously
    (async () => {
      try {
        const res = await memoriesFetch('/api/memories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to update memory (status ${res.status})`);
        }

        const updatedRow = await res.json();
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  note: updatedRow.note ?? m.note,
                  category: updatedRow.category || undefined,
                  dateLabel: updatedRow.dateLabel || undefined,
                  updatedAt: typeof updatedRow.updatedAt === 'string' ? updatedRow.updatedAt : new Date(updatedRow.updatedAt).toISOString(),
                }
              : m
          ),
        }));
      } catch (err: any) {
        console.error('[updateMemory] Server update failed, rolling back:', err);
        set({ memories: previousMemories, error: err?.message || 'Failed to update memory' });
      }
    })();
  },

  deleteMemory: (id) => {
    const previousMemories = get().memories;

    // Apply optimistic delete
    set({
      memories: previousMemories.filter((m) => m.id !== id),
      error: null,
    });

    // Sync with server asynchronously
    (async () => {
      try {
        const res = await memoriesFetch(`/api/memories?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to delete memory (status ${res.status})`);
        }
      } catch (err: any) {
        console.error('[deleteMemory] Server delete failed, rolling back:', err);
        set({ memories: previousMemories, error: err?.message || 'Failed to delete memory' });
      }
    })();
  },
}));

// Auto-load on client startup and window focus
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useMemoriesStore.getState().loadMemories();
  }, 0);

  window.addEventListener('focus', () => {
    useMemoriesStore.getState().loadMemories();
  });
}
