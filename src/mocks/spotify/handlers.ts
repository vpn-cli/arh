import { http, HttpResponse } from 'msw';
import { mockSpotifyState } from './state';
import { getMockSpotifyProduct } from './config';

function mockPlayer403IfFree() {
  if (getMockSpotifyProduct() === 'free') {
    return HttpResponse.json(
      {
        error: {
          status: 403,
          message: 'Player command failed: Premium required',
          reason: 'PREMIUM_REQUIRED',
        },
      },
      { status: 403 }
    );
  }
  return null;
}

export const handlers = [
  // --- GET /me ---
  http.get('https://api.spotify.com/v1/me', () => {
    return HttpResponse.json(mockSpotifyState.getMe());
  }),

  // --- /me/playlists ---
  http.get('https://api.spotify.com/v1/me/playlists', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getPlaylists(offset, limit));
  }),

  http.post('https://api.spotify.com/v1/me/playlists', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const name = body?.name || 'New Playlist';
    const description = body?.description || '';
    const created = mockSpotifyState.createPlaylist(name, description);
    return HttpResponse.json(created, { status: 201 });
  }),

  // --- /playlists/:id ---
  http.get('https://api.spotify.com/v1/playlists/:id', ({ params }) => {
    const id = params.id as string;
    const playlist = mockSpotifyState.getPlaylist(id);
    if (!playlist) {
      return HttpResponse.json({ error: { status: 404, message: 'Not found' } }, { status: 404 });
    }
    return HttpResponse.json(playlist);
  }),

  http.put('https://api.spotify.com/v1/playlists/:id', async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const updated = mockSpotifyState.updatePlaylist(params.id as string, body);
    if (!updated) {
      return HttpResponse.json({ error: { status: 404, message: 'Not found' } }, { status: 404 });
    }
    return new HttpResponse(null, { status: 200 });
  }),

  // --- /playlists/:id/tracks or /playlists/:id/items ---
  http.get('https://api.spotify.com/v1/playlists/:id/tracks', ({ request, params }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getPlaylistItems(params.id as string, offset, limit));
  }),

  http.get('https://api.spotify.com/v1/playlists/:id/items', ({ request, params }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getPlaylistItems(params.id as string, offset, limit));
  }),

  http.post('https://api.spotify.com/v1/playlists/:id/tracks', async ({ request, params }) => {
    const url = new URL(request.url);
    let uris: string[] = [];
    const queryUris = url.searchParams.get('uris');
    if (queryUris) {
      uris = queryUris.split(',');
    } else {
      const body = (await request.json().catch(() => ({}))) as any;
      if (Array.isArray(body?.uris)) uris = body.uris;
    }
    const result = mockSpotifyState.addTracksToPlaylist(params.id as string, uris);
    return HttpResponse.json(result, { status: 201 });
  }),

  http.post('https://api.spotify.com/v1/playlists/:id/items', async ({ request, params }) => {
    const url = new URL(request.url);
    let uris: string[] = [];
    const queryUris = url.searchParams.get('uris');
    if (queryUris) {
      uris = queryUris.split(',');
    } else {
      const body = (await request.json().catch(() => ({}))) as any;
      if (Array.isArray(body?.uris)) uris = body.uris;
    }
    const result = mockSpotifyState.addTracksToPlaylist(params.id as string, uris);
    return HttpResponse.json(result, { status: 201 });
  }),

  http.delete('https://api.spotify.com/v1/playlists/:id/items', async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const uris = Array.isArray(body?.items) ? body.items.map((i: any) => i.uri).filter(Boolean) : [];
    const result = mockSpotifyState.removeTracksFromPlaylist(params.id as string, uris);
    return HttpResponse.json(result, { status: 200 });
  }),

  http.delete('https://api.spotify.com/v1/playlists/:id/tracks', async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const uris = Array.isArray(body?.tracks) ? body.tracks.map((t: any) => t.uri).filter(Boolean) : [];
    const result = mockSpotifyState.removeTracksFromPlaylist(params.id as string, uris);
    return HttpResponse.json(result, { status: 200 });
  }),

  http.put('https://api.spotify.com/v1/playlists/:id/items', async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const rangeStart = typeof body?.range_start === 'number' ? body.range_start : 0;
    const insertBefore = typeof body?.insert_before === 'number' ? body.insert_before : 0;
    const result = mockSpotifyState.reorderPlaylist(params.id as string, rangeStart, insertBefore);
    return HttpResponse.json(result, { status: 200 });
  }),

  // --- /me/tracks (Liked Songs) ---
  http.get('https://api.spotify.com/v1/me/tracks', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getSavedTracks(offset, limit));
  }),

  http.put('https://api.spotify.com/v1/me/tracks', async ({ request }) => {
    const url = new URL(request.url);
    let ids: string[] = [];
    const idsParam = url.searchParams.get('ids');
    if (idsParam) {
      ids = idsParam.split(',');
    } else {
      const body = (await request.json().catch(() => ({}))) as any;
      if (Array.isArray(body?.ids)) ids = body.ids;
    }
    mockSpotifyState.saveTracks(ids);
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete('https://api.spotify.com/v1/me/tracks', async ({ request }) => {
    const url = new URL(request.url);
    let ids: string[] = [];
    const idsParam = url.searchParams.get('ids');
    if (idsParam) {
      ids = idsParam.split(',');
    } else {
      const body = (await request.json().catch(() => ({}))) as any;
      if (Array.isArray(body?.ids)) ids = body.ids;
    }
    mockSpotifyState.removeSavedTracks(ids);
    return new HttpResponse(null, { status: 200 });
  }),

  // --- /me/library/contains ---
  http.get('https://api.spotify.com/v1/me/library/contains', ({ request }) => {
    const url = new URL(request.url);
    const urisParam = url.searchParams.get('uris') || url.searchParams.get('ids') || '';
    const tokens = urisParam.split(',').filter(Boolean);
    const trackIds = tokens.map((t) => t.replace('spotify:track:', ''));
    const contains = mockSpotifyState.checkSavedTracks(trackIds);
    return HttpResponse.json(contains);
  }),

  // --- /me/library (PUT/DELETE for liking/unliking by URI) ---
  http.put('https://api.spotify.com/v1/me/library', ({ request }) => {
    const url = new URL(request.url);
    const urisParam = url.searchParams.get('uris') || url.searchParams.get('ids') || '';
    const tokens = urisParam.split(',').filter(Boolean);
    const trackIds = tokens.map((t) => t.replace('spotify:track:', ''));
    mockSpotifyState.saveTracks(trackIds);
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete('https://api.spotify.com/v1/me/library', ({ request }) => {
    const url = new URL(request.url);
    const urisParam = url.searchParams.get('uris') || url.searchParams.get('ids') || '';
    const tokens = urisParam.split(',').filter(Boolean);
    const trackIds = tokens.map((t) => t.replace('spotify:track:', ''));
    mockSpotifyState.removeSavedTracks(trackIds);
    return new HttpResponse(null, { status: 200 });
  }),

  // --- /search ---
  http.get('https://api.spotify.com/v1/search', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const typeParam = url.searchParams.get('type') || 'track';
    const types = typeParam.split(',');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.search(q, types, offset, limit));
  }),

  // --- /me/player ---
  http.get('https://api.spotify.com/v1/me/player', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    return HttpResponse.json(mockSpotifyState.getPlayerState());
  }),

  http.get('https://api.spotify.com/v1/me/player/devices', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    return HttpResponse.json(mockSpotifyState.getDevices());
  }),

  http.put('https://api.spotify.com/v1/me/player/play', async ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const body = (await request.json().catch(() => ({}))) as any;
    mockSpotifyState.play(body);
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('https://api.spotify.com/v1/me/player/pause', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    mockSpotifyState.pause();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('https://api.spotify.com/v1/me/player/seek', ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const pos = parseInt(url.searchParams.get('position_ms') || '0', 10);
    mockSpotifyState.seek(pos);
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('https://api.spotify.com/v1/me/player/volume', ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const vol = parseInt(url.searchParams.get('volume_percent') || '50', 10);
    mockSpotifyState.setVolume(vol);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.spotify.com/v1/me/player/next', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    mockSpotifyState.next();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.spotify.com/v1/me/player/previous', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    mockSpotifyState.previous();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('https://api.spotify.com/v1/me/player/shuffle', ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const state = url.searchParams.get('state') === 'true';
    mockSpotifyState.setShuffle(state);
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('https://api.spotify.com/v1/me/player/repeat', ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const state = (url.searchParams.get('state') || 'off') as 'off' | 'context' | 'track';
    mockSpotifyState.setRepeat(state);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('https://api.spotify.com/v1/me/player/queue', () => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    return HttpResponse.json(mockSpotifyState.getQueue());
  }),

  http.post('https://api.spotify.com/v1/me/player/queue', ({ request }) => {
    const blocked = mockPlayer403IfFree();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const uri = url.searchParams.get('uri') || '';
    mockSpotifyState.addToQueue(uri);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('https://api.spotify.com/v1/me/player/recently-played', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    return HttpResponse.json(mockSpotifyState.getRecentlyPlayed(limit));
  }),

  // --- /me/top/tracks & /me/top/artists ---
  http.get('https://api.spotify.com/v1/me/top/tracks', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    return HttpResponse.json(mockSpotifyState.getTopTracks(limit));
  }),

  http.get('https://api.spotify.com/v1/me/top/artists', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    return HttpResponse.json(mockSpotifyState.getTopArtists(limit));
  }),

  // --- /tracks/:id ---
  http.get('https://api.spotify.com/v1/tracks/:id', ({ params }) => {
    const track = mockSpotifyState.getTrack(params.id as string);
    if (!track) {
      return HttpResponse.json({ error: { status: 404, message: 'Track not found' } }, { status: 404 });
    }
    return HttpResponse.json(track);
  }),

  // --- /albums/:id & /albums/:id/tracks ---
  http.get('https://api.spotify.com/v1/albums/:id', ({ params }) => {
    const album = mockSpotifyState.getAlbum(params.id as string);
    return HttpResponse.json(album);
  }),

  http.get('https://api.spotify.com/v1/albums/:id/tracks', ({ request, params }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getAlbumTracks(params.id as string, offset, limit));
  }),

  // --- /artists/:id & /artists/:id/albums ---
  http.get('https://api.spotify.com/v1/artists/:id', ({ params }) => {
    const artist = mockSpotifyState.getArtist(params.id as string);
    return HttpResponse.json(artist);
  }),

  http.get('https://api.spotify.com/v1/artists/:id/albums', ({ request, params }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    return HttpResponse.json(mockSpotifyState.getArtistAlbums(params.id as string, offset, limit));
  }),

  http.get('https://api.spotify.com/v1/artists/:id/top-tracks', () => {
    return HttpResponse.json(mockSpotifyState.getTopTracks(10));
  }),

  // --- Catch-All: Unhandled Spotify Web API endpoints return 501 ---
  http.all('https://api.spotify.com/*', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      { error: `no mock for ${request.method} ${url.pathname}` },
      { status: 501 }
    );
  }),

  // --- Catch-All: Unhandled Spotify Accounts endpoints return 501 ---
  http.all('https://accounts.spotify.com/*', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(
      { error: `no mock for ${request.method} ${url.pathname}` },
      { status: 501 }
    );
  }),
];
