import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/memoriesClient', () => ({
  memoriesFetch: vi.fn(),
}));

import { useMemoriesStore } from '../useMemoriesStore';
import { memoriesFetch } from '@/lib/memoriesClient';

describe('useMemoriesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMemoriesStore.setState({ memories: [], isLoading: false, error: null });
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('optimistically adds a memory and replaces temporary id with server id upon success', async () => {
    const serverMemory = {
      id: 'server-uuid-1234-5678',
      spotifyUri: 'spotify:track:abc',
      entityType: 'track',
      note: 'Love this track',
      createdAt: '2026-10-10T12:00:00.000Z',
      updatedAt: '2026-10-10T12:00:00.000Z',
    };

    vi.mocked(memoriesFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => serverMemory,
    } as any);

    useMemoriesStore.getState().addMemory({
      spotifyUri: 'spotify:track:abc',
      entityType: 'track',
      note: 'Love this track',
    });

    // Immediately present with temporary id
    expect(useMemoriesStore.getState().memories.length).toBe(1);
    expect(useMemoriesStore.getState().memories[0].spotifyUri).toBe('spotify:track:abc');

    // Wait microtasks for async server call to resolve
    await new Promise((resolve) => setTimeout(resolve, 50));

    // ID should now be the server's ID
    const current = useMemoriesStore.getState().memories;
    expect(current[0].id).toBe('server-uuid-1234-5678');
  });

  it('rolls back optimistic add if server request fails', async () => {
    vi.mocked(memoriesFetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database connection failed' }),
    } as any);

    useMemoriesStore.getState().addMemory({
      spotifyUri: 'spotify:track:xyz',
      entityType: 'track',
      note: 'Will fail',
    });

    // Optimistic item added
    expect(useMemoriesStore.getState().memories.length).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Rolled back to empty
    expect(useMemoriesStore.getState().memories.length).toBe(0);
    expect(useMemoriesStore.getState().error).toContain('Database connection failed');
  });

  it('optimistically updates and rolls back on failure', async () => {
    useMemoriesStore.setState({
      memories: [
        {
          id: 'mem-1',
          spotifyUri: 'spotify:track:1',
          entityType: 'track',
          note: 'Original note',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      ],
    });

    vi.mocked(memoriesFetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Update failed' }),
    } as any);

    useMemoriesStore.getState().updateMemory('mem-1', { note: 'Attempted edit' });

    // Optimistically edited
    expect(useMemoriesStore.getState().memories[0].note).toBe('Attempted edit');

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Rolled back to original
    expect(useMemoriesStore.getState().memories[0].note).toBe('Original note');
    expect(useMemoriesStore.getState().error).toContain('Update failed');
  });

  it('optimistically deletes and rolls back on failure', async () => {
    useMemoriesStore.setState({
      memories: [
        {
          id: 'mem-1',
          spotifyUri: 'spotify:track:1',
          entityType: 'track',
          note: 'Keep or delete',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      ],
    });

    vi.mocked(memoriesFetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Delete failed' }),
    } as any);

    useMemoriesStore.getState().deleteMemory('mem-1');

    // Optimistically removed
    expect(useMemoriesStore.getState().memories.length).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Rolled back
    expect(useMemoriesStore.getState().memories.length).toBe(1);
    expect(useMemoriesStore.getState().memories[0].id).toBe('mem-1');
  });

  it('sends null in PATCH body when category is cleared', async () => {
    useMemoriesStore.setState({
      memories: [
        {
          id: 'mem-cat-1',
          spotifyUri: 'spotify:track:1',
          entityType: 'track',
          note: 'A track with category',
          category: 'Favorites',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      ],
    });

    vi.mocked(memoriesFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'mem-cat-1',
        spotifyUri: 'spotify:track:1',
        entityType: 'track',
        note: 'A track with category',
        category: null,
        updatedAt: '2026-10-10T12:00:00Z',
      }),
    } as any);

    // Clear category with undefined
    useMemoriesStore.getState().updateMemory('mem-cat-1', { category: undefined });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Confirm the request body sent to PATCH has category: null
    expect(memoriesFetch).toHaveBeenCalledWith(
      '/api/memories',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ id: 'mem-cat-1', category: null }),
      })
    );

    // Confirm store has cleared category
    expect(useMemoriesStore.getState().memories[0].category).toBeUndefined();
  });
});

