import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorldRouter, { preloadWorld } from '../WorldRouter';
import HomeWorld from '../HomeWorld';
import { GameStateProvider, useGameState } from '@/lib/gameState';

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

    expect(screen.getByText('CHOOSE YOUR WORLD')).toBeDefined();
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

  it('preloadWorld helper executes without throwing for valid world ids', async () => {
    await Promise.all([
      preloadWorld('main'),
      preloadWorld('music'),
      preloadWorld('scrapbook'),
    ]);
  }, 15000);
});
