import { mockSpotifyState } from './state';
import { getMockSpotifyProduct } from './config';

export interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

export class MockSpotifyPlayer {
  private options: SpotifyPlayerOptions;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private volume = 0.8;
  private paused = false;
  private position = 35000;
  private deviceId = 'mock_device_punkrose';
  private timer: NodeJS.Timeout | null = null;

  constructor(options: SpotifyPlayerOptions) {
    this.options = options;
    this.volume = options.volume ?? 0.8;
  }

  public addListener(event: string, callback: Function): boolean {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return true;
  }

  public on(event: string, callback: Function): boolean {
    return this.addListener(event, callback);
  }

  public removeListener(event: string, callback: Function): boolean {
    const set = this.listeners.get(event);
    if (set) {
      return set.delete(callback);
    }
    return false;
  }

  private emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[MockSpotifyPlayer] Error in ${event} listener:`, e);
        }
      });
    }
  }

  private buildPlaybackState() {
    const playerItem = mockSpotifyState.getPlayerState().item || {
      id: 'track_mock_1',
      name: 'Karma Police',
      uri: 'spotify:track:track_mock_1',
      duration_ms: 261000,
      artists: [{ name: 'Radiohead', uri: 'spotify:artist:artist_mock_1' }],
      album: {
        name: 'OK Computer',
        uri: 'spotify:album:album_mock_1',
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273mockokcomputer' }],
      },
    };

    return {
      paused: this.paused,
      position: this.position,
      duration: playerItem.duration_ms,
      shuffle: false,
      shuffle_state: false,
      repeat_mode: 0,
      track_window: {
        current_track: playerItem,
        previous_tracks: [],
        next_tracks: [],
      },
    };
  }

  private startTicker(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.paused && this.isConnected) {
        this.position += 1000;
        const currentItem = mockSpotifyState.getPlayerState().item;
        if (currentItem && this.position >= currentItem.duration_ms) {
          this.position = 0;
          mockSpotifyState.next();
        }
      }
    }, 1000);
  }

  private stopTicker(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async connect(): Promise<boolean> {
    if (getMockSpotifyProduct() === 'free') {
      setTimeout(() => {
        this.emit('account_error', { message: 'Spotify Premium required' });
      }, 50);
      return false;
    }

    this.isConnected = true;
    this.startTicker();

    setTimeout(() => {
      this.emit('ready', { device_id: this.deviceId });
      this.emit('player_state_changed', this.buildPlaybackState());
    }, 50);

    return true;
  }

  public disconnect(): void {
    this.isConnected = false;
    this.stopTicker();
    this.emit('not_ready', { device_id: this.deviceId });
  }

  public async getCurrentState(): Promise<any> {
    if (!this.isConnected) return null;
    return this.buildPlaybackState();
  }

  public async getVolume(): Promise<number> {
    return this.volume;
  }

  public async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public async pause(): Promise<void> {
    this.paused = true;
    mockSpotifyState.pause();
    this.emit('player_state_changed', this.buildPlaybackState());
  }

  public async resume(): Promise<void> {
    this.paused = false;
    mockSpotifyState.play();
    this.emit('player_state_changed', this.buildPlaybackState());
  }

  public async togglePlay(): Promise<void> {
    if (this.paused) {
      await this.resume();
    } else {
      await this.pause();
    }
  }

  public async seek(position_ms: number): Promise<void> {
    this.position = position_ms;
    mockSpotifyState.seek(position_ms);
    this.emit('player_state_changed', this.buildPlaybackState());
  }

  public async previousTrack(): Promise<void> {
    this.position = 0;
    mockSpotifyState.previous();
    this.emit('player_state_changed', this.buildPlaybackState());
  }

  public async nextTrack(): Promise<void> {
    this.position = 0;
    mockSpotifyState.next();
    this.emit('player_state_changed', this.buildPlaybackState());
  }

  public async activateElement(): Promise<void> {
    return Promise.resolve();
  }
}
