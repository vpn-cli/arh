import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  memories: {
    id: 'id',
    spotifyUserId: 'spotify_user_id',
    spotifyUri: 'spotify_uri',
    entityType: 'entity_type',
    note: 'note',
    category: 'category',
    dateLabel: 'date_label',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

vi.mock('@/lib/server/spotifyAuthUser', () => ({
  getAuthenticatedSpotifyUserId: vi.fn(),
}));

import { GET, POST, PATCH, DELETE } from '../route';
import { getAuthenticatedSpotifyUserId } from '@/lib/server/spotifyAuthUser';
import { db } from '@/db';

describe('/api/memories Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when user is unauthenticated', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: false,
      reason: 'unauthenticated',
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('GET returns 503 when Spotify upstream fails', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: false,
      reason: 'upstream',
    });

    const res = await GET();
    expect(res.status).toBe(503);
  });

  it('POST rejects with 403 on Origin header mismatch', async () => {
    const req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'POST',
      headers: {
        origin: 'http://malicious-site.com',
        host: 'localhost:3000',
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('POST returns 400 on malformed JSON', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: true,
      userId: 'spotify_user_123',
    });

    const req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'POST',
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
      body: 'invalid-json{',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Malformed JSON');
  });

  it('POST validates entity_type, spotify_uri and note length', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: true,
      userId: 'spotify_user_123',
    });

    // Invalid entityType
    let req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'POST',
      headers: { host: 'localhost:3000' },
      body: JSON.stringify({
        entityType: 'album',
        spotifyUri: 'spotify:album:123',
        note: 'Note',
      }),
    });
    let res = await POST(req);
    expect(res.status).toBe(400);

    // Mismatched URI
    req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'POST',
      headers: { host: 'localhost:3000' },
      body: JSON.stringify({
        entityType: 'track',
        spotifyUri: 'spotify:artist:123',
        note: 'Note',
      }),
    });
    res = await POST(req);
    expect(res.status).toBe(400);

    // Empty note
    req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'POST',
      headers: { host: 'localhost:3000' },
      body: JSON.stringify({
        entityType: 'track',
        spotifyUri: 'spotify:track:123',
        note: '   ',
      }),
    });
    res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('PATCH returns 400 for non-UUID id', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: true,
      userId: 'spotify_user_123',
    });

    const req = new NextRequest('http://localhost:3000/api/memories', {
      method: 'PATCH',
      headers: { host: 'localhost:3000' },
      body: JSON.stringify({
        id: 'not-a-uuid',
        note: 'Updated note',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('UUID');
  });

  it('DELETE returns 400 for non-UUID id', async () => {
    vi.mocked(getAuthenticatedSpotifyUserId).mockResolvedValue({
      ok: true,
      userId: 'spotify_user_123',
    });

    const req = new NextRequest('http://localhost:3000/api/memories?id=invalid-id', {
      method: 'DELETE',
      headers: { host: 'localhost:3000' },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('UUID');
  });
});
