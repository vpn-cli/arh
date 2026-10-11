import { create } from 'zustand';

interface SpotifyLockState {
  isLocked: boolean;
  unlockAt: number | null;
  retryAfter: number | null;
  setLock: (retryAfterSeconds: number) => void;
  clearLock: () => void;
  getRemainingSeconds: () => number;
}

const STORAGE_KEY = 'spotify_lock_until';

function getInitialLock(): { isLocked: boolean; unlockAt: number | null; retryAfter: number | null } {
  if (typeof window === 'undefined') {
    return { isLocked: false, unlockAt: null, retryAfter: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const unlockAt = parseInt(raw, 10);
      if (!isNaN(unlockAt) && unlockAt > Date.now()) {
        const remaining = Math.ceil((unlockAt - Date.now()) / 1000);
        return { isLocked: true, unlockAt, retryAfter: remaining };
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return { isLocked: false, unlockAt: null, retryAfter: null };
}

let lockTimer: ReturnType<typeof setTimeout> | null = null;

export const useSpotifyLockStore = create<SpotifyLockState>((set, get) => {
  const initial = getInitialLock();

  if (initial.isLocked && initial.unlockAt) {
    const msRemaining = Math.max(0, initial.unlockAt - Date.now());
    if (lockTimer) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      get().clearLock();
    }, msRemaining);
  }

  return {
    ...initial,
    setLock: (retryAfterSeconds: number) => {
      const seconds = Math.max(1, retryAfterSeconds);
      const unlockAt = Date.now() + seconds * 1000;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, String(unlockAt));
        } catch {
          // Ignore
        }
      }
      if (lockTimer) clearTimeout(lockTimer);
      lockTimer = setTimeout(() => {
        get().clearLock();
      }, seconds * 1000);

      set({
        isLocked: true,
        unlockAt,
        retryAfter: seconds,
      });
    },
    clearLock: () => {
      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
      set({
        isLocked: false,
        unlockAt: null,
        retryAfter: null,
      });
    },
    getRemainingSeconds: () => {
      const { unlockAt } = get();
      if (!unlockAt) return 0;
      return Math.max(0, Math.ceil((unlockAt - Date.now()) / 1000));
    },
  };
});

/**
 * Returns true if Spotify is currently locked out on the client.
 */
export function isSpotifyLocked(): boolean {
  const state = useSpotifyLockStore.getState();
  if (!state.isLocked || !state.unlockAt) return false;
  if (Date.now() >= state.unlockAt) {
    state.clearLock();
    return false;
  }
  return true;
}

/**
 * Sets the client-side Spotify lock duration.
 */
export function setClientSpotifyLock(retryAfterSeconds: number): void {
  useSpotifyLockStore.getState().setLock(retryAfterSeconds);
}

/**
 * Clears the client-side Spotify lock immediately.
 */
export function clearClientSpotifyLock(): void {
  useSpotifyLockStore.getState().clearLock();
}
