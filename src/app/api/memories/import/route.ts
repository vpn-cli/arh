import { NextRequest, NextResponse } from 'next/server';
import { db, memories, NewMemoryEntry } from '@/db';
import { getAuthenticatedSpotifyUserId } from '@/lib/server/spotifyAuthUser';

const VALID_TYPES = ['track', 'artist', 'playlist'] as const;
type EntityType = typeof VALID_TYPES[number];

function validateUri(uri: string, type: EntityType): boolean {
  return new RegExp(`^spotify:${type}:[a-zA-Z0-9]+$`).test(uri);
}

function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const reqHost = req.headers.get('host') || req.nextUrl.host;
    return originHost === reqHost;
  } catch {
    return false;
  }
}

// POST /api/memories/import — Batch import memories from client localStorage (max 500)
export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden: Origin mismatch' }, { status: 403 });
  }

  const auth = await getAuthenticatedSpotifyUserId();
  if (!auth.ok) {
    if (auth.reason === 'unauthenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Upstream Spotify service unavailable' }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Payload must be an array of memory objects.' }, { status: 400 });
  }

  if (body.length === 0) {
    return NextResponse.json({ success: true, count: 0 }, { status: 200 });
  }

  if (body.length > 500) {
    return NextResponse.json({ error: 'Batch import exceeds maximum allowed limit of 500 items.' }, { status: 400 });
  }

  const validEntries: NewMemoryEntry[] = [];
  const now = new Date();

  for (const entry of body) {
    if (!entry || typeof entry !== 'object') continue;

    const { entityType, spotifyUri, note, category, dateLabel, createdAt } = entry;

    if (!entityType || !VALID_TYPES.includes(entityType)) continue;
    if (!spotifyUri || typeof spotifyUri !== 'string' || !validateUri(spotifyUri, entityType)) continue;
    if (typeof note !== 'string' || note.trim().length < 1 || note.trim().length > 2000) continue;

    let parsedCreatedAt = now;
    if (createdAt) {
      const parsed = new Date(createdAt);
      if (!isNaN(parsed.getTime())) {
        parsedCreatedAt = parsed;
      }
    }

    validEntries.push({
      spotifyUserId: auth.userId,
      spotifyUri,
      entityType,
      note: note.trim(),
      category: typeof category === 'string' && category.trim() ? category.trim().slice(0, 50) : null,
      dateLabel: typeof dateLabel === 'string' && dateLabel.trim() ? dateLabel.trim().slice(0, 50) : null,
      createdAt: parsedCreatedAt,
      updatedAt: now,
    });
  }

  if (validEntries.length === 0) {
    return NextResponse.json({ success: true, count: 0 }, { status: 200 });
  }

  try {
    await db
      .insert(memories)
      .values(validEntries)
      .onConflictDoNothing({
        target: [memories.spotifyUserId, memories.spotifyUri],
      });

    return NextResponse.json({ success: true, count: validEntries.length }, { status: 200 });
  } catch (error) {
    console.error('[API Memories Import] Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
