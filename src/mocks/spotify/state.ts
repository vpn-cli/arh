import meFixture from './fixtures/me.json';
import tracksFixture from './fixtures/tracks.json';
import playlistsFixture from './fixtures/playlists.json';
import devicesFixture from './fixtures/devices.json';
import playerFixture from './fixtures/player.json';
import { getMockSpotifyProduct } from './config';

export interface MockTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  is_playable: boolean;
  artists: Array<{ id: string; name: string; uri: string }>;
  album: {
    id: string;
    name: string;
    uri: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
}

export interface MockPlaylist {
  id: string;
  name: string;
  description: string;
  collaborative: boolean;
  public: boolean;
  uri: string;
  owner: { id: string; display_name: string };
  images: Array<{ url: string; height: number; width: number }>;
  tracks: { href: string; total: number };
}

export interface MockPaginated<T> {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
}

function paginate<T>(
  items: T[],
  offset = 0,
  limit = 20,
  baseUrl = 'https://api.spotify.com/v1/resource'
): MockPaginated<T> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);
  const sliced = items.slice(safeOffset, safeOffset + safeLimit);

  const next = safeOffset + safeLimit < items.length
    ? `${baseUrl}?offset=${safeOffset + safeLimit}&limit=${safeLimit}`
    : null;
  const previous = safeOffset > 0
    ? `${baseUrl}?offset=${Math.max(0, safeOffset - safeLimit)}&limit=${safeLimit}`
    : null;

  return {
    href: `${baseUrl}?offset=${safeOffset}&limit=${safeLimit}`,
    limit: safeLimit,
    next,
    offset: safeOffset,
    previous,
    total: items.length,
    items: sliced,
  };
}

class SpotifyMockState {
  private user = { ...meFixture };
  private tracks: MockTrack[] = JSON.parse(JSON.stringify(tracksFixture));
  private playlists: MockPlaylist[] = JSON.parse(JSON.stringify(playlistsFixture));
  private playlistTracksMap: Map<string, MockTrack[]> = new Map();
  private likedTrackIds: Set<string> = new Set();
  private devices = JSON.parse(JSON.stringify(devicesFixture.devices));
  private playerState = JSON.parse(JSON.stringify(playerFixture));
  private queue: MockTrack[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.user = JSON.parse(JSON.stringify(meFixture));
    this.tracks = JSON.parse(JSON.stringify(tracksFixture));
    this.playlists = JSON.parse(JSON.stringify(playlistsFixture));
    this.devices = JSON.parse(JSON.stringify(devicesFixture.devices));
    this.playerState = JSON.parse(JSON.stringify(playerFixture));

    // Initially mark first 3 tracks as liked
    this.likedTrackIds = new Set(['track_mock_1', 'track_mock_2', 'track_mock_3']);

    // Initialize playlist tracks
    this.playlistTracksMap = new Map();
    this.playlistTracksMap.set('playlist_mock_1', [this.tracks[0], this.tracks[1], this.tracks[2]]);
    this.playlistTracksMap.set('playlist_mock_2', [this.tracks[3], this.tracks[4]]);
    this.playlistTracksMap.set('playlist_mock_3', [
      this.tracks[0],
      this.tracks[3],
      this.tracks[5],
      this.tracks[6],
      this.tracks[7],
    ]);

    this.queue = [this.tracks[1], this.tracks[2], this.tracks[3]];
  }

  // --- /me ---
  public getMe() {
    return {
      ...this.user,
      product: getMockSpotifyProduct(),
    };
  }

  // --- /me/playlists ---
  public getPlaylists(offset = 0, limit = 20): MockPaginated<MockPlaylist> {
    return paginate(this.playlists, offset, limit, 'https://api.spotify.com/v1/me/playlists');
  }

  public getPlaylist(id: string) {
    const pl = this.playlists.find((p) => p.id === id);
    if (!pl) return null;
    const tracks = this.playlistTracksMap.get(id) || [];
    return {
      ...pl,
      tracks: paginate(
        tracks.map((t, idx) => ({
          added_at: new Date(1700000000000 + idx * 86400000).toISOString(),
          added_by: { id: this.user.id },
          is_local: false,
          track: t,
        })),
        0,
        100,
        `https://api.spotify.com/v1/playlists/${id}/tracks`
      ),
    };
  }

  public getPlaylistItems(id: string, offset = 0, limit = 50) {
    const tracks = this.playlistTracksMap.get(id) || [];
    const wrapped = tracks.map((t, idx) => ({
      added_at: new Date(1700000000000 + idx * 86400000).toISOString(),
      added_by: { id: this.user.id },
      is_local: false,
      track: t,
    }));
    return paginate(wrapped, offset, limit, `https://api.spotify.com/v1/playlists/${id}/tracks`);
  }

  public createPlaylist(name: string, description = '') {
    const newId = `playlist_mock_${Date.now()}`;
    const newPlaylist: MockPlaylist = {
      id: newId,
      name,
      description,
      collaborative: false,
      public: true,
      uri: `spotify:playlist:${newId}`,
      owner: { id: this.user.id, display_name: this.user.display_name },
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273mockcreated', height: 300, width: 300 }],
      tracks: { href: `https://api.spotify.com/v1/playlists/${newId}/tracks`, total: 0 },
    };
    this.playlists.unshift(newPlaylist);
    this.playlistTracksMap.set(newId, []);
    return newPlaylist;
  }

  public addTracksToPlaylist(id: string, uris: string[]) {
    const list = this.playlistTracksMap.get(id) || [];
    for (const uri of uris) {
      const trackId = uri.replace('spotify:track:', '');
      const track = this.getTrack(trackId);
      if (track) list.push(track);
    }
    this.playlistTracksMap.set(id, list);
    const pl = this.playlists.find((p) => p.id === id);
    if (pl) pl.tracks.total = list.length;
    return { snapshot_id: `snapshot_${Date.now()}` };
  }

  public updatePlaylist(id: string, updates: { name?: string; description?: string; public?: boolean }) {
    const pl = this.playlists.find((p) => p.id === id);
    if (!pl) return null;
    if (updates.name !== undefined) pl.name = updates.name;
    if (updates.description !== undefined) pl.description = updates.description;
    if (updates.public !== undefined) pl.public = updates.public;
    return pl;
  }

  public removeTracksFromPlaylist(id: string, uris: string[]) {
    let list = this.playlistTracksMap.get(id) || [];
    const uriSet = new Set(uris);
    list = list.filter((t) => !uriSet.has(t.uri) && !uriSet.has(`spotify:track:${t.id}`));
    this.playlistTracksMap.set(id, list);
    const pl = this.playlists.find((p) => p.id === id);
    if (pl) pl.tracks.total = list.length;
    return { snapshot_id: `snapshot_${Date.now()}` };
  }

  public reorderPlaylist(id: string, rangeStart: number, insertBefore: number) {
    const list = this.playlistTracksMap.get(id) || [];
    if (rangeStart >= 0 && rangeStart < list.length) {
      const [item] = list.splice(rangeStart, 1);
      const targetIndex = insertBefore > rangeStart ? insertBefore - 1 : insertBefore;
      list.splice(Math.max(0, Math.min(targetIndex, list.length)), 0, item);
      this.playlistTracksMap.set(id, list);
    }
    return { snapshot_id: `snapshot_${Date.now()}` };
  }

  // --- /me/tracks (Liked Songs) ---
  public getSavedTracks(offset = 0, limit = 20) {
    const liked = this.tracks.filter((t) => this.likedTrackIds.has(t.id));
    const wrapped = liked.map((t, idx) => ({
      added_at: new Date(1700000000000 + idx * 3600000).toISOString(),
      track: t,
    }));
    return paginate(wrapped, offset, limit, 'https://api.spotify.com/v1/me/tracks');
  }

  public isTrackSaved(trackId: string): boolean {
    return this.likedTrackIds.has(trackId);
  }

  public checkSavedTracks(trackIds: string[]): boolean[] {
    return trackIds.map((id) => this.likedTrackIds.has(id));
  }

  public saveTracks(trackIds: string[]): void {
    for (const id of trackIds) {
      this.likedTrackIds.add(id);
    }
  }

  public removeSavedTracks(trackIds: string[]): void {
    for (const id of trackIds) {
      this.likedTrackIds.delete(id);
    }
  }

  // --- /search ---
  public search(q: string, types: string[] = ['track'], offset = 0, limit = 10) {
    const safeLimit = Math.min(Math.max(1, limit), 10);
    const query = q.toLowerCase();
    const result: Record<string, any> = {};

    if (types.includes('track')) {
      const matched = this.tracks.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.artists.some((a) => a.name.toLowerCase().includes(query))
      );
      result.tracks = paginate(matched, offset, safeLimit, 'https://api.spotify.com/v1/search');
    }

    if (types.includes('playlist')) {
      const matched = this.playlists.filter((p) => p.name.toLowerCase().includes(query));
      result.playlists = paginate(matched, offset, safeLimit, 'https://api.spotify.com/v1/search');
    }

    if (types.includes('artist')) {
      const matched = [
        {
          id: 'artist_mock_1',
          name: 'Radiohead',
          uri: 'spotify:artist:artist_mock_1',
          images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273mockradiohead', height: 300, width: 300 }],
        },
      ];
      result.artists = paginate(matched, offset, safeLimit, 'https://api.spotify.com/v1/search');
    }

    return result;
  }

  // --- /tracks/:id ---
  public getTrack(id: string): MockTrack | null {
    return this.tracks.find((t) => t.id === id) || null;
  }

  // --- Player State & Commands ---
  public getPlayerState() {
    return this.playerState;
  }

  public getDevices() {
    return { devices: this.devices };
  }

  public play(options?: { uris?: string[]; context_uri?: string; offset?: { uri?: string; position?: number } }) {
    this.playerState.is_playing = true;
    if (options?.uris && options.uris.length > 0) {
      const trackId = options.uris[0].replace('spotify:track:', '');
      const tr = this.getTrack(trackId);
      if (tr) this.playerState.item = tr;
    }
    return true;
  }

  public pause() {
    this.playerState.is_playing = false;
    return true;
  }

  public seek(positionMs: number) {
    this.playerState.progress_ms = positionMs;
    return true;
  }

  public setVolume(volumePercent: number) {
    if (this.playerState.device) {
      this.playerState.device.volume_percent = volumePercent;
    }
    return true;
  }

  public setShuffle(state: boolean) {
    this.playerState.shuffle_state = state;
    return true;
  }

  public setRepeat(state: 'off' | 'context' | 'track') {
    this.playerState.repeat_state = state;
    return true;
  }

  public next() {
    if (this.queue.length > 0) {
      const nextTrack = this.queue.shift()!;
      this.playerState.item = nextTrack;
      this.playerState.progress_ms = 0;
    }
    return true;
  }

  public previous() {
    this.playerState.progress_ms = 0;
    return true;
  }

  public getQueue() {
    return {
      currently_playing: this.playerState.item,
      queue: this.queue,
    };
  }

  public addToQueue(uri: string) {
    const trackId = uri.replace('spotify:track:', '');
    const tr = this.getTrack(trackId);
    if (tr) this.queue.push(tr);
    return true;
  }

  public getRecentlyPlayed(limit = 50) {
    const items = this.tracks.slice(0, limit).map((t, idx) => ({
      track: t,
      played_at: new Date(Date.now() - idx * 180000).toISOString(),
      context: null,
    }));
    return { items };
  }

  public getTopTracks(limit = 10) {
    return { items: this.tracks.slice(0, limit) };
  }

  public getTopArtists(limit = 10) {
    const artists = [
      {
        id: 'artist_mock_1',
        name: 'Radiohead',
        uri: 'spotify:artist:artist_mock_1',
        genres: ['alternative rock', 'art rock'],
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273mockradiohead', height: 300, width: 300 }],
      },
    ];
    return { items: artists.slice(0, limit) };
  }

  public getAlbum(id: string) {
    const firstTrack = this.tracks[0];
    return {
      id,
      name: firstTrack?.album?.name || 'In Rainbows',
      uri: `spotify:album:${id}`,
      artists: firstTrack?.artists || [{ id: 'artist_mock_1', name: 'Radiohead', uri: 'spotify:artist:artist_mock_1' }],
      images: firstTrack?.album?.images || [
        { url: 'https://i.scdn.co/image/ab67616d0000b273mockalbum', height: 640, width: 640 },
      ],
      tracks: paginate(this.tracks.slice(0, 10), 0, 50, `https://api.spotify.com/v1/albums/${id}/tracks`),
    };
  }

  public getAlbumTracks(id: string, offset = 0, limit = 50) {
    return paginate(this.tracks.slice(0, 10), offset, limit, `https://api.spotify.com/v1/albums/${id}/tracks`);
  }

  public getArtist(id: string) {
    return {
      id,
      name: 'Radiohead',
      uri: `spotify:artist:${id}`,
      genres: ['alternative rock', 'art rock'],
      images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273mockartist', height: 640, width: 640 }],
    };
  }

  public getArtistAlbums(id: string, offset = 0, limit = 10) {
    return paginate(this.playlists.slice(0, 5), offset, limit, `https://api.spotify.com/v1/artists/${id}/albums`);
  }
}

export const mockSpotifyState = new SpotifyMockState();
