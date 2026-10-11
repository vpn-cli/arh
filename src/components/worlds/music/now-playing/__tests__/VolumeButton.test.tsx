import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VolumeButton } from '../VolumeButton';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { usePlayerVolumeStore } from '@/providers/volumeStore';

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

describe('VolumeButton', () => {
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

  it('renders a round 36px volume button with aria-expanded="false" initially', () => {
    render(<VolumeButton />);

    const button = screen.getByRole('button', { name: 'Volume' });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('slider', { name: /volume/i })).toBeNull();
  });

  it('opens on click and displays the volume slider with aria-expanded="true"', () => {
    render(<VolumeButton />);

    const button = screen.getByRole('button', { name: 'Volume' });
    expect(button.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      fireEvent.click(button);
    });

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const slider = screen.getByRole('slider', { name: /volume/i }) as HTMLInputElement;
    expect(slider).toBeDefined();
    expect(slider.value).toBe('60');
  });

  it('closes on Escape and returns focus to the button', () => {
    render(<VolumeButton />);

    const button = screen.getByRole('button', { name: 'Volume' });

    act(() => {
      fireEvent.click(button);
    });
    expect(button.getAttribute('aria-expanded')).toBe('true');

    const slider = screen.getByRole('slider', { name: /volume/i });
    act(() => {
      slider.focus();
    });
    expect(document.activeElement).toBe(slider);

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('slider', { name: /volume/i })).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('closes on outside click', () => {
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <VolumeButton />
      </div>
    );

    const button = screen.getByRole('button', { name: 'Volume' });
    const outside = screen.getByTestId('outside-area');

    act(() => {
      fireEvent.click(button);
    });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('slider', { name: /volume/i })).toBeDefined();

    act(() => {
      fireEvent.click(outside);
    });

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('slider', { name: /volume/i })).toBeNull();
  });

  it('moving the slider calls the same volume setter as before', () => {
    render(<VolumeButton />);

    const button = screen.getByRole('button', { name: 'Volume' });
    act(() => {
      fireEvent.click(button);
    });

    const slider = screen.getByRole('slider', { name: /volume/i });
    act(() => {
      fireEvent.change(slider, { target: { value: '80' } });
    });

    expect(usePlayerVolumeStore.getState().volume).toBe(0.8);
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.8);
  });

  it('toggling the button again closes the popover', () => {
    render(<VolumeButton />);

    const button = screen.getByRole('button', { name: 'Volume' });
    act(() => {
      fireEvent.click(button);
    });
    expect(button.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      fireEvent.click(button);
    });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('slider', { name: /volume/i })).toBeNull();
  });
});
