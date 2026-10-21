import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorldRouter from '../WorldRouter';
import { GameStateProvider, useGameState } from '@/lib/gameState';
import { PlayerOverlays } from '../music/layout/PlayerOverlays';

// Mock GSAP and audio as in WorldRouter.test.tsx
vi.mock('gsap', () => {
  const tlInstance = {
    fromTo: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    addLabel: vi.fn().mockReturnThis(),
    addPause: vi.fn().mockReturnThis(),
    call: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  };
  const gsapMock = {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => tlInstance),
    to: vi.fn().mockReturnValue({ kill: vi.fn() }),
    fromTo: vi.fn().mockReturnValue({ kill: vi.fn() }),
    set: vi.fn(),
    killTweensOf: vi.fn(),
  };
  return { default: gsapMock, ...gsapMock };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('@/lib/audio', () => ({
  sfx: { hover: vi.fn(), select: vi.fn() },
  getAudioContext: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default: (importer: () => Promise<any>) => {
    let Component: React.ComponentType<any> | null = null;
    importer().then((mod: any) => {
      Component = mod.default || mod;
    });
    return function DynamicComponent(props: any) {
      const [Loaded, setLoaded] = React.useState<React.ComponentType<any> | null>(() => Component);
      React.useEffect(() => {
        if (!Loaded) {
          importer().then((mod: any) => {
            setLoaded(() => mod.default || mod);
          });
        }
      }, [Loaded]);
      return Loaded ? <Loaded {...props} /> : null;
    };
  },
}));

// Mock MusicWorld to render PlayerOverlays with an expired session
vi.mock('../music/MusicWorld', () => ({
  default: () => (
    <div data-testid="mock-music-world">
      <PlayerOverlays
        isReconnecting={false}
        recoveryError={null}
        onDismissRecoveryError={vi.fn()}
        isSessionExpired={true}
        token="test-token"
      />
    </div>
  ),
}));

describe('Outgoing world crossfade overlay suppression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/?world=music');
  });

  it('renders SESSION EXPIRED in live container, but suppresses it in outgoing container during crossfade', async () => {
    let gameStateActions: ReturnType<typeof useGameState> | null = null;
    function StateCapture() {
      gameStateActions = useGameState();
      return null;
    }

    render(
      <GameStateProvider>
        <StateCapture />
        <WorldRouter />
      </GameStateProvider>
    );

    // Live music world should render SESSION EXPIRED in live content container
    const liveContainer = screen.getByTestId('world-content-container');
    expect(within(liveContainer).getByText('SESSION EXPIRED')).toBeDefined();

    // Trigger transition back to home (crossfade hop)
    act(() => {
      gameStateActions?.goHome();
    });

    // Outgoing container must be present
    const outgoingContainer = screen.getByTestId('outgoing-world-container');
    expect(outgoingContainer).toBeDefined();

    // REGRESSION ASSERTION:
    // The outgoing container must NOT render the SESSION EXPIRED overlay
    expect(within(outgoingContainer).queryByText('SESSION EXPIRED')).toBeNull();
  });
});
