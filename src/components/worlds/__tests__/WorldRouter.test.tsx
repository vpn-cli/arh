import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WorldRouter, { preloadWorld } from '../WorldRouter';
import HomeWorld from '../HomeWorld';
import { TransitionOverlay } from '@/components/transitions/TransitionOverlay';
import { GameStateProvider } from '@/lib/gameState';
import gsap from 'gsap';

// Mock GSAP and audio
vi.mock('gsap', () => {
  const tlCallbacks: Array<() => void> = [];
  const tlInstance = {
    fromTo: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    addLabel: vi.fn().mockReturnThis(),
    addPause: vi.fn().mockReturnThis(),
    call: vi.fn((cb: () => void) => {
      if (typeof cb === 'function') {
        tlCallbacks.push(cb);
      }
      return tlInstance;
    }),
    play: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    kill: vi.fn(),
    _triggerCallbacks: () => {
      tlCallbacks.forEach((cb) => cb());
    },
    _clearCallbacks: () => {
      tlCallbacks.length = 0;
    },
  };

  const gsapMock = {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => tlInstance),
    to: vi.fn().mockReturnValue({ kill: vi.fn() }),
    fromTo: vi.fn().mockReturnValue({ kill: vi.fn() }),
    set: vi.fn(),
    _tl: tlInstance,
  };

  return {
    default: gsapMock,
    ...gsapMock,
  };
});

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

interface MockTimeline {
  _triggerCallbacks: () => void;
  _clearCallbacks: () => void;
}

interface MockGsap {
  _tl: MockTimeline;
}

describe('WorldRouter and preloading', () => {
  let mockPerformanceNow = 1000;

  beforeEach(() => {
    vi.clearAllMocks();
    (gsap as unknown as MockGsap)._tl._clearCallbacks();
    mockPerformanceNow = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => mockPerformanceNow);
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it('renders TransitionOverlay with world-main-2500ms clip when transitioning from home to main', () => {
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
    expect(video.getAttribute('src')).toBe('/transitions/world-main-2500ms.mp4');
    expect(video.getAttribute('poster')).toBe('/transitions/world-main-2500ms.webp');
  });

  it('preloadWorld helper executes without throwing for valid world ids', async () => {
    await Promise.all([
      preloadWorld('main'),
      preloadWorld('music'),
      preloadWorld('scrapbook'),
    ]);
  }, 15000);

  it('keeps outgoing world mounted until 0.6s during transition', () => {
    vi.useFakeTimers();

    render(
      <GameStateProvider>
        <WorldRouter />
      </GameStateProvider>
    );

    // Initial state: HomeWorld mounted
    expect(screen.getByRole('button', { name: /Enter MAIN WORLD/i })).toBeDefined();

    // Trigger transition to main
    act(() => {
      screen.getByRole('button', { name: /Enter MAIN WORLD/i }).click();
    });

    // At t = 0 to 500ms (< 600ms iris duration), outgoing world (HomeWorld) MUST remain mounted
    act(() => {
      mockPerformanceNow += 500;
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('button', { name: /Enter MAIN WORLD/i })).toBeDefined();

    // At t = 600ms, iris fully covers screen and outgoing HomeWorld unmounts
    act(() => {
      mockPerformanceNow += 100;
      vi.advanceTimersByTime(100); // 600ms total
    });
    expect(screen.queryByRole('button', { name: /Enter MAIN WORLD/i })).toBeNull();
  });
});

describe('Transition choreography and paint-before-fade invariant', () => {
  let mockPerformanceNow = 1000;

  beforeEach(() => {
    vi.clearAllMocks();
    (gsap as unknown as MockGsap)._tl._clearCallbacks();
    mockPerformanceNow = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => mockPerformanceNow);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hub -> world: fade NEVER starts before paint signal arrives', () => {
    vi.useFakeTimers();
    const onFadeStart = vi.fn();
    const onFadeComplete = vi.fn();

    let rerenderFn: ((ui: React.ReactElement) => void) | undefined;
    act(() => {
      const res = render(
        <TransitionOverlay
          fromWorld="home"
          toWorld="main"
          isTransitioning={true}
          isTargetPainted={false}
          onFadeStart={onFadeStart}
          onFadeComplete={onFadeComplete}
        />
      );
      rerenderFn = res.rerender;
    });

    // Advance beyond minimum clip hold time (2600ms) while target world has not painted
    act(() => {
      mockPerformanceNow += 2800;
      vi.advanceTimersByTime(2800);
    });

    // Crucial invariant: fade must NOT have started because target world has not painted
    expect(onFadeStart).not.toHaveBeenCalled();

    // Signal paint arrival
    act(() => {
      rerenderFn?.(
        <TransitionOverlay
          fromWorld="home"
          toWorld="main"
          isTransitioning={true}
          isTargetPainted={true}
          onFadeStart={onFadeStart}
          onFadeComplete={onFadeComplete}
        />
      );
    });

    // Now fade start fires immediately since time >= 2.6s and paint signal is received
    expect(onFadeStart).toHaveBeenCalledTimes(1);
  });

  it('world -> hub: fade NEVER starts before hub paint signal arrives', () => {
    vi.useFakeTimers();
    const onFadeStart = vi.fn();
    const onFadeComplete = vi.fn();

    let rerenderFn: ((ui: React.ReactElement) => void) | undefined;
    act(() => {
      const res = render(
        <TransitionOverlay
          fromWorld="main"
          toWorld="home"
          isTransitioning={true}
          isTargetPainted={false}
          onFadeStart={onFadeStart}
          onFadeComplete={onFadeComplete}
        />
      );
      rerenderFn = res.rerender;
    });

    // Advance to 2750ms while unpainted
    act(() => {
      mockPerformanceNow += 2750;
      vi.advanceTimersByTime(2750);
    });

    // Invariant: fade must not start
    expect(onFadeStart).not.toHaveBeenCalled();

    // Signal paint arrival from hub
    act(() => {
      rerenderFn?.(
        <TransitionOverlay
          fromWorld="main"
          toWorld="home"
          isTransitioning={true}
          isTargetPainted={true}
          onFadeStart={onFadeStart}
          onFadeComplete={onFadeComplete}
        />
      );
    });

    expect(onFadeStart).toHaveBeenCalledTimes(1);
  });

  it('clears GSAP inline styles and will-change on timeline completion and unmount', () => {
    const worldDiv = document.createElement('div');
    const worldRef = { current: worldDiv };
    const onFadeStart = vi.fn();
    const onFadeComplete = vi.fn();

    const { unmount } = render(
      <TransitionOverlay
        fromWorld="home"
        toWorld="main"
        isTransitioning={true}
        isTargetPainted={true}
        onFadeStart={onFadeStart}
        onFadeComplete={onFadeComplete}
        worldContainerRef={worldRef}
      />
    );

    // Trigger timeline completion callback
    act(() => {
      (gsap as unknown as MockGsap)._tl._triggerCallbacks();
    });

    expect(gsap.set).toHaveBeenCalledWith(worldDiv, { clearProps: 'all' });
    expect(onFadeComplete).toHaveBeenCalled();

    // Unmount clears props cleanly as well
    unmount();
    expect(gsap.set).toHaveBeenCalledWith(worldDiv, { clearProps: 'all' });
  });

  it('clears GSAP inline styles and will-change cleanly when 4000ms safety cap fires', () => {
    vi.useFakeTimers();
    const worldDiv = document.createElement('div');
    worldDiv.style.willChange = 'transform, opacity';
    const worldRef = { current: worldDiv };
    const onFadeStart = vi.fn();
    const onFadeComplete = vi.fn();

    render(
      <TransitionOverlay
        fromWorld="home"
        toWorld="main"
        isTransitioning={true}
        isTargetPainted={false}
        onFadeStart={onFadeStart}
        onFadeComplete={onFadeComplete}
        worldContainerRef={worldRef}
      />
    );

    // Fire safety cap at 4000ms
    act(() => {
      mockPerformanceNow += 4000;
      vi.advanceTimersByTime(4000);
    });

    expect(onFadeStart).toHaveBeenCalled();
    expect(onFadeComplete).toHaveBeenCalled();
    expect(worldDiv.style.willChange).toBe('');
    expect(gsap.set).toHaveBeenCalledWith(worldDiv, { clearProps: 'all' });
  });
});
