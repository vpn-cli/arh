import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorldRouter, { preloadWorld } from '../WorldRouter';
import HomeWorld from '../HomeWorld';
import { GameStateProvider } from '@/lib/gameState';

// Mock GSAP and audio
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: () => ({
      fromTo: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }),
    to: vi.fn().mockReturnValue({ kill: vi.fn() }),
    fromTo: vi.fn().mockReturnValue({ kill: vi.fn() }),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('@/lib/audio', () => ({
  sfx: {
    hover: vi.fn(),
    select: vi.fn(),
  },
  getAudioContext: vi.fn(),
}));

describe('WorldRouter and preloading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders HomeWorld statically when currentWorld is home', () => {
    render(
      <GameStateProvider>
        <WorldRouter />
      </GameStateProvider>
    );

    expect(
      screen.queryByText(/pick one at a time/i) || screen.queryByText(/choose your world/i)
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enter MAIN WORLD/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Enter MUSIC WORLD/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Enter SCRAPBOOK/i })).toBeDefined();
  });

  it('triggers preload when portal is hovered or focused', () => {
    const onPortalIntent = vi.fn();
    render(
      <GameStateProvider>
        <HomeWorld onPortalIntent={onPortalIntent} />
      </GameStateProvider>
    );

    const musicButton = screen.getByRole('button', { name: /Enter MUSIC WORLD/i });

    // Hover
    fireEvent.mouseEnter(musicButton);
    expect(onPortalIntent).toHaveBeenCalledWith('music');

    const mainButton = screen.getByRole('button', { name: /Enter MAIN WORLD/i });

    // Focus
    fireEvent.focus(mainButton);
    expect(onPortalIntent).toHaveBeenCalledWith('main');
  });

  it('renders TransitionOverlay with world-main-3s clip when transitioning from home to main', () => {
    render(
      <GameStateProvider>
        <WorldRouter />
      </GameStateProvider>
    );

    act(() => {
      screen.getByRole('button', { name: /Enter MAIN WORLD/i }).click();
    });

    const overlay = screen.getByTestId('world-transition-overlay');
    expect(overlay).toBeDefined();

    const video = screen.getByTestId('world-transition-video') as HTMLVideoElement;
    expect(video.getAttribute('src')).toBe('/transitions/world-main-3s.mp4');
    expect(video.getAttribute('poster')).toBe('/transitions/world-main-3s.webp');
  });

  it('preloadWorld helper executes without throwing for valid world ids', async () => {
    await Promise.all([
      preloadWorld('main'),
      preloadWorld('music'),
      preloadWorld('scrapbook'),
    ]);
  }, 15000);
});
