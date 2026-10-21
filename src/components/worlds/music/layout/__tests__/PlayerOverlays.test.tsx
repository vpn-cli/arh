import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerOverlays } from '../PlayerOverlays';
import { IsOutgoingWorldContext } from '@/context/OutgoingWorldContext';
import { useSpotifyLockStore } from '@/store/spotifyLockStore';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

vi.mock('@/lib/gameState', () => ({
  useGameState: () => ({ goHome: vi.fn() }),
}));

vi.mock('@/lib/audio', () => ({
  sfx: { select: vi.fn() },
}));

describe('PlayerOverlays outgoing suppression', () => {
  it('renders SESSION EXPIRED when live (isOutgoing=false), but suppresses it when outgoing (isOutgoing=true)', () => {
    const { rerender } = render(
      <IsOutgoingWorldContext.Provider value={false}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={true}
          token="test-token"
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.getByText('SESSION EXPIRED')).toBeDefined();
    expect(screen.getByText(/Your music is still playing! But the controls need a fresh login/i)).toBeDefined();

    rerender(
      <IsOutgoingWorldContext.Provider value={true}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={true}
          token="test-token"
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.queryByText('SESSION EXPIRED')).toBeNull();
  });

  it('renders Connect Spotify when live (isOutgoing=false), but suppresses it when outgoing (isOutgoing=true)', () => {
    const { rerender } = render(
      <IsOutgoingWorldContext.Provider value={false}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={false}
          token={null}
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.getByText('Connect Spotify')).toBeDefined();

    rerender(
      <IsOutgoingWorldContext.Provider value={true}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={false}
          token={null}
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.queryByText('Connect Spotify')).toBeNull();
  });

  it('leaves non-blocking reconnecting and recovery error banners unchanged when outgoing', () => {
    const { rerender } = render(
      <IsOutgoingWorldContext.Provider value={true}>
        <PlayerOverlays
          isReconnecting={true}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={false}
          token="test-token"
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.getByText(/Reconnecting to Spotify.../i)).toBeDefined();

    rerender(
      <IsOutgoingWorldContext.Provider value={true}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError="Device connection failed"
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={false}
          token="test-token"
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.getByText('Device connection failed')).toBeDefined();
  });

  it('leaves non-blocking SpotifyRestingBanner and FreeTierNotice unchanged when outgoing', () => {
    useSpotifyLockStore.setState({ isLocked: true, unlockAt: Date.now() + 60000 });
    useSpotifyPlayerStore.setState({ accountTier: 'free' });

    render(
      <IsOutgoingWorldContext.Provider value={true}>
        <PlayerOverlays
          isReconnecting={false}
          recoveryError={null}
          onDismissRecoveryError={vi.fn()}
          isSessionExpired={false}
          token="test-token"
        />
      </IsOutgoingWorldContext.Provider>
    );

    expect(screen.getByText(/Spotify is resting/i)).toBeDefined();
    expect(screen.getByTestId('free-tier-notice')).toBeDefined();
  });
});
