import { NextRequest, NextResponse } from 'next/server';
import { db, memories } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthenticatedSpotifyUserId } from '@/lib/server/spotifyAuthUser';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_TYPES = ['track', 'artist', 'playlist'] as const;
type EntityType = typeof VALID_TYPES[number];

function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

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

async function parseJsonBody(req: NextRequest): Promise<{ ok: true; data: any } | { ok: false }> {
  try {
    const data = await req.json();
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

// GET /api/memories — List memories for authenticated user
export async function GET() {
  const auth = await getAuthenticatedSpotifyUserId();
  if (!auth.ok) {
    if (auth.reason === 'unauthenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Upstream Spotify service unavailable' }, { status: 503 });
  }

  try {
    const rows = await db
      .select()
      .from(memories)
      .where(eq(memories.spotifyUserId, auth.userId))
      .orderBy(desc(memories.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[API Memories GET] Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/memories — Create or update memory by spotify_uri
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

  const bodyResult = await parseJsonBody(req);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const { spotifyUri, entityType, note, category, dateLabel } = bodyResult.data;

  if (!entityType || !VALID_TYPES.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entity_type. Must be track, artist, or playlist.' }, { status: 400 });
  }

  if (!spotifyUri || typeof spotifyUri !== 'string' || !validateUri(spotifyUri, entityType)) {
    return NextResponse.json({ error: `Invalid spotify_uri format for type "${entityType}".` }, { status: 400 });
  }

  if (typeof note !== 'string' || note.trim().length < 1 || note.trim().length > 2000) {
    return NextResponse.json({ error: 'Note must be between 1 and 2000 characters.' }, { status: 400 });
  }

  const trimmedNote = note.trim();
  const cleanCategory = typeof category === 'string' && category.trim() ? category.trim().slice(0, 50) : null;
  const cleanDateLabel = typeof dateLabel === 'string' && dateLabel.trim() ? dateLabel.trim().slice(0, 50) : null;
  const now = new Date();

  try {
    const [saved] = await db
      .insert(memories)
      .values({
        spotifyUserId: auth.userId,
        spotifyUri,
        entityType,
        note: trimmedNote,
        category: cleanCategory,
        dateLabel: cleanDateLabel,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [memories.spotifyUserId, memories.spotifyUri],
        set: {
          note: trimmedNote,
          category: cleanCategory,
          dateLabel: cleanDateLabel,
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    console.error('[API Memories POST] Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/memories — Update note, category, dateLabel by UUID
export async function PATCH(req: NextRequest) {
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

  const bodyResult = await parseJsonBody(req);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const { id, note, category, dateLabel } = bodyResult.data;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid ID. Must be a valid UUID.' }, { status: 400 });
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (note !== undefined) {
    if (typeof note !== 'string' || note.trim().length < 1 || note.trim().length > 2000) {
      return NextResponse.json({ error: 'Note must be between 1 and 2000 characters.' }, { status: 400 });
    }
    updates.note = note.trim();
  }

  if (category !== undefined) {
    updates.category = typeof category === 'string' && category.trim() ? category.trim().slice(0, 50) : null;
  }

  if (dateLabel !== undefined) {
    updates.dateLabel = typeof dateLabel === 'string' && dateLabel.trim() ? dateLabel.trim().slice(0, 50) : null;
  }

  try {
    const [updated] = await db
      .update(memories)
      .set(updates)
      .where(and(eq(memories.id, id), eq(memories.spotifyUserId, auth.userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Memory not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[API Memories PATCH] Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/memories — Delete by UUID
export async function DELETE(req: NextRequest) {
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

  const searchParams = req.nextUrl.searchParams;
  let id = searchParams.get('id');

  if (!id) {
    const bodyResult = await parseJsonBody(req);
    if (bodyResult.ok) {
      id = bodyResult.data?.id;
    }
  }

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid ID. Must be a valid UUID.' }, { status: 400 });
  }

  try {
    const [deleted] = await db
      .delete(memories)
      .where(and(eq(memories.id, id), eq(memories.spotifyUserId, auth.userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Memory not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: deleted.id }, { status: 200 });
  } catch (error) {
    console.error('[API Memories DELETE] Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
