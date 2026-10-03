import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GameStateProvider, useGameState } from '../gameState';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TestComponent = () => {
  const { currentWorld, goToWorld } = useGameState();
  return (
    <div>
      <span data-testid="current-world">{currentWorld}</span>
      <button onClick={() => goToWorld('scrapbook')}>Go Scrapbook</button>
    </div>
  );
};

describe('GameStateProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear localStorage and URL search params
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with home world by default', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );
    expect(screen.getByTestId('current-world').textContent).toBe('home');
  });

  it('should automatically set world to music if spotify_auth=success and returnToMusic=true', () => {
    window.localStorage.setItem('spotify_auth_return', 'true');
    window.history.replaceState({}, '', '/?spotify_auth=success');

    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    // Initial effect updates it to music
    expect(screen.getByTestId('current-world').textContent).toBe('music');
    // LocalStorage should be cleared
    expect(window.localStorage.getItem('spotify_auth_return')).toBeNull();
  });

  it('should transition between worlds correctly with delay', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    expect(screen.getByTestId('current-world').textContent).toBe('home');
    
    act(() => {
      screen.getByText('Go Scrapbook').click();
    });

    // Still home immediately because of transition delay
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Changed to scrapbook after 500ms
    expect(screen.getByTestId('current-world').textContent).toBe('scrapbook');
  });
});
