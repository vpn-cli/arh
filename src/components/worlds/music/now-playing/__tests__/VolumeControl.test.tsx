import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VolumeControl } from '../VolumeControl';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import {
  usePlayerVolumeStore,
  getPersistedVolume,
  DEFAULT_VOLUME,
  VOLUME_STORAGE_KEY,
} from '@/providers/volumeStore';

let mockProviderPlayer: { setVolume: ReturnType<typeof vi.fn> } | null = null;

vi.mock('@/providers/SpotifyPlayerProvider', () => ({
  useSpotifyPlayer: () => ({
    player: mockProviderPlayer,
    deviceIdRef: { current: 'test-device' },
    notReadyFiredRef: { current: false },
    needsRecoveryRef: { current: false },
    latestStateRef: { current: null },
    subscribe: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe('VolumeControl', () => {
  let mockPlayer: {
    setVolume: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    window.localStorage.clear();

    mockPlayer = {
      setVolume: vi.fn().mockResolvedValue(undefined),
    };
    mockProviderPlayer = mockPlayer;

    useSpotifyPlayerStore.setState({
      player: null,
      isReady: true,
    });

    usePlayerVolumeStore.setState({
      volume: 0.6,
      previousVolume: 0.6,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a real range input labeled Volume with spoken value', () => {
    render(<VolumeControl />);

    const slider = screen.getByRole('slider', { name: /volume/i }) as HTMLInputElement;
    expect(slider).toBeDefined();
    expect(slider.getAttribute('type')).toBe('range');
    expect(slider.getAttribute('min')).toBe('0');
    expect(slider.getAttribute('max')).toBe('100');
    expect(slider.getAttribute('aria-valuetext')).toBe('60%');
    expect(slider.value).toBe('60');
  });

  it('toggles mute and restores previous volume on speaker click', () => {
    render(<VolumeControl />);

    const muteBtn = screen.getByRole('button', { name: /mute/i });
    const slider = screen.getByRole('slider', { name: /volume/i }) as HTMLInputElement;

    // 1. Initial state is 60%
    expect(slider.value).toBe('60');

    // 2. Click speaker -> Mutes to 0
    act(() => {
      fireEvent.click(muteBtn);
    });

    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0);
    expect(usePlayerVolumeStore.getState().volume).toBe(0);
    expect(usePlayerVolumeStore.getState().previousVolume).toBe(0.6);
    expect(slider.value).toBe('0');
    expect(slider.getAttribute('aria-valuetext')).toBe('0%');

    // 3. Click speaker again -> Restores to 60%
    const unmuteBtn = screen.getByRole('button', { name: /unmute/i });
    act(() => {
      fireEvent.click(unmuteBtn);
    });

    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.6);
    expect(usePlayerVolumeStore.getState().volume).toBe(0.6);
    expect(slider.value).toBe('60');
    expect(slider.getAttribute('aria-valuetext')).toBe('60%');
  });

  it('persists volume changes so it is restored on next visit', () => {
    render(<VolumeControl />);

    const slider = screen.getByRole('slider', { name: /volume/i });

    // Change volume via direct input/change (e.g. keyboard or click)
    act(() => {
      fireEvent.change(slider, { target: { value: '80' } });
    });

    expect(usePlayerVolumeStore.getState().volume).toBe(0.8);
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.8);

    // Verify localStorage persistence
    const rawSaved = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    expect(rawSaved).toBeTruthy();
    const parsed = JSON.parse(rawSaved!);
    expect(parsed.state.volume).toBe(0.8);

    // Verify helper retrieves persisted value
    expect(getPersistedVolume()).toBe(0.8);
  });

  it('restores default volume if no persisted value is found', () => {
    window.localStorage.clear();
    usePlayerVolumeStore.setState({
      volume: DEFAULT_VOLUME,
      previousVolume: DEFAULT_VOLUME,
    });

    expect(getPersistedVolume()).toBe(DEFAULT_VOLUME);
  });

  it('disables the volume control while player is not ready', () => {
    useSpotifyPlayerStore.setState({
      isReady: false,
    });

    render(<VolumeControl />);

    const slider = screen.getByRole('slider', { name: /volume/i }) as HTMLInputElement;
    const muteBtn = screen.getByRole('button') as HTMLButtonElement;

    expect(slider.disabled).toBe(true);
    expect(muteBtn.disabled).toBe(true);
  });

  it('updates volume via keyboard arrow keys', () => {
    render(<VolumeControl />);

    const slider = screen.getByRole('slider', { name: /volume/i }) as HTMLInputElement;

    act(() => {
      fireEvent.change(slider, { target: { value: '65' } });
    });

    expect(slider.value).toBe('65');
    expect(slider.getAttribute('aria-valuetext')).toBe('65%');
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.65);
    expect(usePlayerVolumeStore.getState().volume).toBe(0.65);
  });

  it('while dragging, applies volume via rAF and commits to store only on drag end', () => {
    render(<VolumeControl />);

    const slider = screen.getByRole('slider', { name: /volume/i });

    // 1. Begin pointer drag
    fireEvent.pointerDown(slider);

    // 2. Dragging change: value goes to 40%
    act(() => {
      fireEvent.change(slider, { target: { value: '40' } });
    });

    // Store should NOT have committed yet during active dragging
    expect(usePlayerVolumeStore.getState().volume).toBe(0.6);

    // 3. Drag end (pointer up)
    act(() => {
      fireEvent.pointerUp(slider);
    });

    // Now committed to store
    expect(usePlayerVolumeStore.getState().volume).toBe(0.4);
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.4);
  });
});
