import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GameStateProvider, useGameState } from '../gameState';
import { getTransitionClip } from '@/components/transitions/TransitionOverlay';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TestComponent = () => {
  const { currentWorld, goToWorld, completeTransition } = useGameState();
  return (
    <div>
      <span data-testid="current-world">{currentWorld}</span>
      <button onClick={() => goToWorld('scrapbook')}>Go Scrapbook</button>
      <button onClick={() => completeTransition()}>Complete Transition</button>
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

  it('should transition between worlds correctly with 4000ms safety cap delay', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    expect(screen.getByTestId('current-world').textContent).toBe('home');
    
    act(() => {
      screen.getByText('Go Scrapbook').click();
    });

    // Still home immediately because of transition
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Changed to scrapbook after 4000ms safety cap
    expect(screen.getByTestId('current-world').textContent).toBe('scrapbook');
  });

  it('completes transition immediately when completeTransition is called', () => {
    render(
      <GameStateProvider>
        <TestComponent />
      </GameStateProvider>
    );

    act(() => {
      screen.getByText('Go Scrapbook').click();
    });
    expect(screen.getByTestId('current-world').textContent).toBe('home');

    act(() => {
      screen.getByText('Complete Transition').click();
    });
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
      vi.advanceTimersByTime(4000);
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
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId('current-world').textContent).toBe('scrapbook');
    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.stringContaining('world=scrapbook')
    );
  });

  it('completes multi-hop sequence hub→main→hub→music→hub→scrapbook with correct clips and updates currentWorldRef', () => {
    const MultiHopHarness = () => {
      const { currentWorld, previousWorld, isTransitioning, transitionTarget, goToWorld, completeTransition } = useGameState();
      const from = previousWorld || currentWorld;
      const to = transitionTarget || currentWorld;
      const activeClip = isTransitioning ? getTransitionClip(from, to) : null;

      return (
        <div>
          <span data-testid="world">{currentWorld}</span>
          <span data-testid="is-trans">{String(isTransitioning)}</span>
          <span data-testid="clip-video">{activeClip?.video || ''}</span>
          <span data-testid="clip-poster">{activeClip?.poster || ''}</span>
          <button data-testid="go-main" onClick={() => goToWorld('main')}>Main</button>
          <button data-testid="go-music" onClick={() => goToWorld('music')}>Music</button>
          <button data-testid="go-scrapbook" onClick={() => goToWorld('scrapbook')}>Scrapbook</button>
          <button data-testid="go-home" onClick={() => goToWorld('home')}>Home</button>
          <button data-testid="complete" onClick={() => completeTransition()}>Complete</button>
        </div>
      );
    };

    render(
      <GameStateProvider>
        <MultiHopHarness />
      </GameStateProvider>
    );

    // Initial state: Hub
    expect(screen.getByTestId('world').textContent).toBe('home');

    // Hop 1: hub → main
    act(() => {
      screen.getByTestId('go-main').click();
    });
    expect(screen.getByTestId('is-trans').textContent).toBe('true');
    // to-world: target's clip (main)
    expect(screen.getByTestId('clip-video').textContent).toBe('/transitions/world-main-3s.mp4');
    expect(screen.getByTestId('clip-poster').textContent).toBe('/transitions/world-main-3s.webp');
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('world').textContent).toBe('main');
    expect(screen.getByTestId('is-trans').textContent).toBe('false');

    // Hop 2: main → hub
    act(() => {
      screen.getByTestId('go-home').click();
    });
    expect(screen.getByTestId('is-trans').textContent).toBe('true');
    // to-hub: the left world's clip (main)
    expect(screen.getByTestId('clip-video').textContent).toBe('/transitions/world-main-3s.mp4');
    expect(screen.getByTestId('clip-poster').textContent).toBe('/transitions/world-main-3s.webp');
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('world').textContent).toBe('home');
    expect(screen.getByTestId('is-trans').textContent).toBe('false');

    // Hop 3: hub → music
    act(() => {
      screen.getByTestId('go-music').click();
    });
    expect(screen.getByTestId('is-trans').textContent).toBe('true');
    // to-world: target's clip (music)
    expect(screen.getByTestId('clip-video').textContent).toBe('/transitions/world-music-3s.mp4');
    expect(screen.getByTestId('clip-poster').textContent).toBe('/transitions/world-music-3s.webp');
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('world').textContent).toBe('music');
    expect(screen.getByTestId('is-trans').textContent).toBe('false');

    // Hop 4: music → hub
    act(() => {
      screen.getByTestId('go-home').click();
    });
    expect(screen.getByTestId('is-trans').textContent).toBe('true');
    // to-hub: the left world's clip (music)
    expect(screen.getByTestId('clip-video').textContent).toBe('/transitions/world-music-3s.mp4');
    expect(screen.getByTestId('clip-poster').textContent).toBe('/transitions/world-music-3s.webp');
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('world').textContent).toBe('home');
    expect(screen.getByTestId('is-trans').textContent).toBe('false');

    // Hop 5: hub → scrapbook
    act(() => {
      screen.getByTestId('go-scrapbook').click();
    });
    expect(screen.getByTestId('is-trans').textContent).toBe('true');
    // to-world: target's clip (scrapbook)
    expect(screen.getByTestId('clip-video').textContent).toBe('/transitions/world-scrapbook-3s.mp4');
    expect(screen.getByTestId('clip-poster').textContent).toBe('/transitions/world-scrapbook-3s.webp');
    act(() => {
      screen.getByTestId('complete').click();
    });
    expect(screen.getByTestId('world').textContent).toBe('scrapbook');
    expect(screen.getByTestId('is-trans').textContent).toBe('false');
  });
});
