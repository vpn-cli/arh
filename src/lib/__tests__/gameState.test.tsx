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

  it('should transition between worlds correctly with 3000ms delay', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    expect(screen.getByTestId('current-world').textContent).toBe('home');
    
    act(() => {
      screen.getByText('Go Scrapbook').click();
    });

    // Still home immediately because of 3000ms transition delay
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Changed to scrapbook after 3000ms
    expect(screen.getByTestId('current-world').textContent).toBe('scrapbook');
  });

  it('runs only one transition when two goToWorld calls fire in the same tick (Correction 3 guard)', () => {
    const Probe = () => {
      const { goToWorld, isTransitioning, currentWorld } = useGameState();
      return (
        <div>
          <span data-testid="probe-world">{currentWorld}</span>
          <span data-testid="probe-trans">{String(isTransitioning)}</span>
          <button data-testid="btn-music" onClick={() => goToWorld('music')}>Music</button>
          <button data-testid="btn-scrapbook" onClick={() => goToWorld('scrapbook')}>Scrapbook</button>
        </div>
      );
    };

    render(
      <GameStateProvider>
        <Probe />
      </GameStateProvider>
    );

    expect(screen.getByTestId('probe-world').textContent).toBe('home');
    expect(screen.getByTestId('probe-trans').textContent).toBe('false');

    // Fire two calls synchronously in the very same tick
    act(() => {
      screen.getByTestId('btn-music').click();
      screen.getByTestId('btn-scrapbook').click();
    });

    // Second call ('scrapbook') must have been ignored by isTransitioningRef guard
    expect(screen.getByTestId('probe-trans').textContent).toBe('true');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Successfully transitioned to first call ('music'), not second
    expect(screen.getByTestId('probe-world').textContent).toBe('music');
    expect(screen.getByTestId('probe-trans').textContent).toBe('false');
  });

  it('ignores goToWorld when called with the same world as currentWorld', () => {
    const Probe = () => {
      const { goToWorld, isTransitioning } = useGameState();
      return (
        <div>
          <span data-testid="probe-trans">{String(isTransitioning)}</span>
          <button data-testid="btn-home" onClick={() => goToWorld('home')}>Home</button>
        </div>
      );
    };

    render(
      <GameStateProvider>
        <Probe />
      </GameStateProvider>
    );

    act(() => {
      screen.getByTestId('btn-home').click();
    });

    // Should not enter transitioning state
    expect(screen.getByTestId('probe-trans').textContent).toBe('false');
  });

  it('transitions immediately when immediate: true is passed', () => {
    const Probe = () => {
      const { goToWorld, currentWorld, isTransitioning } = useGameState();
      return (
        <div>
          <span data-testid="probe-world">{currentWorld}</span>
          <span data-testid="probe-trans">{String(isTransitioning)}</span>
          <button
            data-testid="btn-imm"
            onClick={() => goToWorld('scrapbook', { immediate: true })}
          >
            Immediate
          </button>
        </div>
      );
    };

    render(
      <GameStateProvider>
        <Probe />
      </GameStateProvider>
    );

    act(() => {
      screen.getByTestId('btn-imm').click();
    });

    // Changed immediately with 0 delay and no transitioning flag
    expect(screen.getByTestId('probe-world').textContent).toBe('scrapbook');
    expect(screen.getByTestId('probe-trans').textContent).toBe('false');
  });

  it('should initialize with world from ?world= if valid', () => {
    window.history.replaceState({}, '', '/?world=music');
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );
    expect(screen.getByTestId('current-world').textContent).toBe('music');
  });

  it('should ignore invalid ?world= param and default to home', () => {
    window.history.replaceState({}, '', '/?world=invalid_world');
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );
    expect(screen.getByTestId('current-world').textContent).toBe('home');
  });

  it('should update URL with history.replaceState when world changes', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    act(() => {
      screen.getByText('Go Scrapbook').click();
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('current-world').textContent).toBe('scrapbook');
    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.stringContaining('world=scrapbook')
    );
  });
});
