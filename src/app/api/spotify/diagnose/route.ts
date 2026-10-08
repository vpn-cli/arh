import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Diagnostic endpoint for Spotify integration
// Only accessible when NODE_ENV === 'development'
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!accessToken) {
    const result = { 
      error: 'No spotify_access_token cookie found.',
      has_refresh: !!refreshToken,
    };
    return NextResponse.json(result, { status: 401 });
  }

  const results: Record<string, any> = { timestamp: new Date().toISOString() };

  async function spotifyGet(path: string) {
    const url = `https://api.spotify.com/v1${path}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const body = await res.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    return { status: res.status, body: parsed, url };
  }

  // Step 1: GET /me
  const me = await spotifyGet('/me');
  results.step1_me = {
    status: me.status,
    id: me.body?.id || 'N/A',
    display_name: me.body?.display_name || 'N/A',
  };

  if (me.status !== 200) {
    results.step1_error = me.body;
    return NextResponse.json(results);
  }

  const myId = me.body.id;

  // Step 2: GET /me/playlists
  const pl = await spotifyGet('/me/playlists?limit=20');
  results.step2_playlists = {
    status: pl.status,
    total: pl.body?.total,
  };

  if (pl.status !== 200 || !pl.body?.items) {
    results.step2_error = pl.body;
    return NextResponse.json(results);
  }

  const owned: any[] = [];
  const followed: any[] = [];

  for (const p of pl.body.items) {
    const info = {
      id: p.id,
      name: p.name,
      owner_id: p.owner?.id,
      owner_display_name: p.owner?.display_name,
      isOwned: p.owner?.id === myId,
      public: p.public,
      collaborative: p.collaborative,
    };
    if (p.owner?.id === myId) {
      owned.push(info);
    } else {
      followed.push(info);
    }
  }

  results.step2_owned = owned.map(p => ({ id: p.id, name: p.name }));
  results.step2_followed = followed.map(p => ({ id: p.id, name: p.name, owner: p.owner_id }));

  // Step 3: Test a NON-OWNED playlist
  if (followed.length > 0) {
    const target = followed[0];
    results.step3_nonowned_test = { playlist_id: target.id, name: target.name, owner_id: target.owner_id };

    const meta = await spotifyGet(`/playlists/${target.id}`);
    results.step3_metadata = {
      status: meta.status,
      owner_id: meta.body?.owner?.id,
      owner_display_name: meta.body?.owner?.display_name,
      public: meta.body?.public,
      collaborative: meta.body?.collaborative,
      items_total: meta.body?.items?.total,
      owner_match: meta.body?.owner?.id === myId ? 'YES' : 'NO',
    };

    const items = await spotifyGet(`/playlists/${target.id}/items?limit=50`);
    results.step3_items = {
      status: items.status,
      url: items.url,
      error_body: items.status !== 200 ? items.body : undefined,
      items_count: items.body?.items?.length,
    };
  } else {
    results.step3_nonowned_test = 'NO_FOLLOWED_PLAYLISTS_FOUND';
  }

  // Step 4: Test an OWNED playlist
  if (owned.length > 0) {
    const target = owned[0];
    results.step4_owned_test = { playlist_id: target.id, name: target.name };

    const items = await spotifyGet(`/playlists/${target.id}/items?limit=50`);
    results.step4_items = {
      status: items.status,
      url: items.url,
      items_count: items.body?.items?.length,
    };

    if (items.status === 200 && items.body?.items?.length > 0) {
      const first = items.body.items[0];
      results.step4_response_shape = {
        first_item_keys: Object.keys(first),
        has_dot_item: !!first.item,
        has_dot_track: !!first.track,
        item_type: first.item?.type,
        item_id: first.item?.id,
        item_name: first.item?.name,
        track_type: first.track?.type,
        track_id: first.track?.id,
        track_name: first.track?.name,
      };
    } else if (items.status !== 200) {
      results.step4_error = items.body;
    }
  } else {
    results.step4_owned_test = 'NO_OWNED_PLAYLISTS_FOUND';
  }

  return NextResponse.json(results, { status: 200 });
}
