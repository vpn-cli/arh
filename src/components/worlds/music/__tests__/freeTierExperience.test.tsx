import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';
import { fetchSpotifyMe } from '@/hooks/useSpotify';
import { useAccountTier, SPOTIFY_UNREACHABLE_MSG } from '@/hooks/useAccountTier';
import * as spotifyClient from '@/lib/spotifyClient';
import * as spotifyRecovery from '@/lib/spotifyRecovery';
import * as playbackHelpers from '../playback/playbackHelpers';
import { executeQueueTrackAddition } from '../playback/playbackHelpers';
import { ensurePlaybackDevice, playTrackGlobal } from '../playback/globalPlaybackActions';
import { addTrackToPlayerQueue } from '@/lib/spotify/player';
import { getMockSpotifyProduct } from '@/mocks/spotify/config';
import { mockSpotifyState } from '@/mocks/spotify/state';
import { MockSpotifyPlayer } from '@/mocks/spotify/stubPlayer';
import { SpotifyModeBadge } from '@/components/SpotifyModeBadge';
import { FreeTierNotice } from '../FreeTierNotice';
import { TrackActionsMenu } from '../TrackActionsMenu';
import { PlaybackControls } from '../now-playing/PlaybackControls';
import { TrackRow } from '../TrackRow';

vi.mock('@/lib/spotify/player', () => ({
  addTrackToPlayerQueue: vi.fn(),
}));

vi.mock('@/lib/spotifyClient', async (importOriginal) => {
  const actual = await importOriginal<typeof spotifyClient>();
  return {
    ...actual,
    proxyFetch: vi.fn(),
  };
});

describe('Spotify Free Tier Experience & Tier Detection', () => {
  const originalEnvProduct = process.env.MOCK_SPOTIFY_PRODUCT;
  const originalPublicProduct = process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useSpotifyPlayerStore.setState({
      accountTier: 'unknown',
      queue: [],
    });
  });

  afterEach(() => {
    process.env.MOCK_SPOTIFY_PRODUCT = originalEnvProduct;
    process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT = originalPublicProduct;
    vi.restoreAllMocks();
  });

  describe('Tier Detection', () => {
    it('sets accountTier to "premium" when /me product is premium', async () => {
      vi.mocked(spotifyClient.proxyFetch).mockResolvedValueOnce({
        id: 'user_1',
        product: 'premium',
      });

      const res = await fetchSpotifyMe();
      expect(res.product).toBe('premium');
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('premium');
    });

    it('sets accountTier to "free" when /me product is free', async () => {
      vi.mocked(spotifyClient.proxyFetch).mockResolvedValueOnce({
        id: 'user_2',
        product: 'free',
      });

      const res = await fetchSpotifyMe();
      expect(res.product).toBe('free');
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('free');
    });

    it('sets accountTier to "free" when /me product is anything other than premium (e.g. open)', async () => {
      vi.mocked(spotifyClient.proxyFetch).mockResolvedValueOnce({
        id: 'user_3',
        product: 'open',
      });

      await fetchSpotifyMe();
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('free');
    });

    it('keeps accountTier as "unknown" when /me request fails and SDK is not marked free', async () => {
      useSpotifyPlayerStore.setState({ accountTier: 'unknown' });
      vi.mocked(spotifyClient.proxyFetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchSpotifyMe()).rejects.toThrow('Network error');
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('unknown');
    });

    it('a page without playlists still resolves the tier via useAccountTier', async () => {
      useSpotifyPlayerStore.setState({ accountTier: 'unknown' });
      vi.mocked(spotifyClient.proxyFetch).mockResolvedValueOnce({
        id: 'user_page_test',
        product: 'free',
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestPageWithoutPlaylists() {
        useAccountTier();
        return <div>Standalone Page Without Playlists</div>;
      }

      render(
        <QueryClientProvider client={queryClient}>
          <TestPageWithoutPlaylists />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(useSpotifyPlayerStore.getState().accountTier).toBe('free');
      });
      expect(spotifyClient.proxyFetch).toHaveBeenCalledWith('/me');
    });

    it('normalizes arbitrary tier values in setAccountTier', () => {
      const store = useSpotifyPlayerStore.getState();

      store.setAccountTier('premium');
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('premium');

      store.setAccountTier('unknown');
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('unknown');

      // Anything other than premium or unknown becomes free
      store.setAccountTier('custom' as any);
      expect(useSpotifyPlayerStore.getState().accountTier).toBe('free');
    });
  });

  describe('Queue Handling on 403 & Error Notification', () => {
    it('does NOT add track locally when Spotify rejects queue request with 403', async () => {
      const mockTrack = { id: 'track_1', uri: 'spotify:track:track_1', name: 'Rejected Song' };
      vi.mocked(addTrackToPlayerQueue).mockRejectedValueOnce({
        status: 403,
        reason: 'PREMIUM_REQUIRED',
        message: 'Spotify Premium required for playback',
      });
      const addToStoreQueue = vi.fn();

      await executeQueueTrackAddition(mockTrack, undefined, 'device_1', addToStoreQueue);

      expect(addTrackToPlayerQueue).toHaveBeenCalledWith('spotify:track:track_1', 'device_1');
      expect(addToStoreQueue).not.toHaveBeenCalled();
    });

    it('adds track locally when Spotify queue request succeeds', async () => {
      const mockTrack = { id: 'track_2', uri: 'spotify:track:track_2', name: 'Accepted Song' };
      vi.mocked(addTrackToPlayerQueue).mockResolvedValueOnce({} as any);
      const addToStoreQueue = vi.fn();

      await executeQueueTrackAddition(mockTrack, 'spotify:playlist:123', 'device_1', addToStoreQueue);

      expect(addTrackToPlayerQueue).toHaveBeenCalledWith('spotify:track:track_2', 'device_1');
      expect(addToStoreQueue).toHaveBeenCalledWith(mockTrack, 'spotify:playlist:123');
    });

    it('notifies recovery error banner when executeQueueTrackAddition fails', async () => {
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');
      vi.mocked(addTrackToPlayerQueue).mockRejectedValueOnce(new Error('Queue operation rejected'));

      await executeQueueTrackAddition(
        { id: 't_fail', uri: 'spotify:track:fail', name: 'Fail Track' },
        undefined,
        'dev_1',
        vi.fn()
      );

      expect(notifySpy).toHaveBeenCalledWith('Queue operation rejected');
    });
  });

  describe('Mock Free Mode & Browser Config', () => {
    it('reads NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT in browser config and never takes effect in production', () => {
      const origPub = process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT;
      const origNodeEnv = process.env.NODE_ENV;

      try {
        (process.env as any).NODE_ENV = 'development';
        process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT = 'free';
        delete process.env.MOCK_SPOTIFY_PRODUCT;

        expect(getMockSpotifyProduct()).toBe('free');

        // Hard production guard: never takes effect in production
        (process.env as any).NODE_ENV = 'production';
        expect(getMockSpotifyProduct()).toBe('premium');
      } finally {
        process.env.NEXT_PUBLIC_MOCK_SPOTIFY_PRODUCT = origPub;
        (process.env as any).NODE_ENV = origNodeEnv;
      }
    });

    it('respects MOCK_SPOTIFY_PRODUCT=free in helper, state, and stub player', async () => {
      process.env.MOCK_SPOTIFY_PRODUCT = 'free';
      expect(getMockSpotifyProduct()).toBe('free');

      // 1. mockSpotifyState returns product: 'free'
      expect(mockSpotifyState.getMe().product).toBe('free');

      // 2. stub player emits account_error on connect
      const stubPlayer = new MockSpotifyPlayer({
        name: 'test-stub',
        getOAuthToken: vi.fn(),
      });
      const accountErrorListener = vi.fn();
      stubPlayer.addListener('account_error', accountErrorListener);

      const connected = await stubPlayer.connect();
      expect(connected).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(accountErrorListener).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/Premium required/i) })
      );
    });

    it('displays free tier on SpotifyModeBadge in mock mode', () => {
      process.env.MOCK_SPOTIFY_PRODUCT = 'free';
      useSpotifyPlayerStore.setState({ accountTier: 'free' });

      render(<SpotifyModeBadge />);
      const badge = screen.getByTestId('spotify-mode-badge');
      expect(badge.textContent).toContain('mock spotify (free)');
    });

    it('displays premium tier on SpotifyModeBadge when premium', () => {
      process.env.MOCK_SPOTIFY_PRODUCT = 'premium';
      useSpotifyPlayerStore.setState({ accountTier: 'premium' });

      render(<SpotifyModeBadge />);
      const badge = screen.getByTestId('spotify-mode-badge');
      expect(badge.textContent).toContain('mock spotify (premium)');
    });
  });

  describe('Track Row Clicks & Playback Routing in Free Mode vs Unknown', () => {
    it('opens track in Spotify when clicking TrackRow in free mode without calling play endpoint', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'free' });
      const openSpy = vi.spyOn(playbackHelpers, 'openInSpotify').mockImplementation(() => {});

      const onPlay = vi.fn((uri) => {
        ensurePlaybackDevice(uri);
      });

      render(
        <TrackRow
          track={{ id: 't1', uri: 'spotify:track:t1', name: 'Song 1' }}
          onPlay={onPlay}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /play song 1/i }));
      expect(onPlay).toHaveBeenCalledWith('spotify:track:t1', undefined, expect.any(Object));
      expect(openSpy).toHaveBeenCalledWith('spotify:track:t1');
      expect(spotifyClient.proxyFetch).not.toHaveBeenCalledWith(expect.stringContaining('/me/player/play'), expect.anything());
    });

    it('does nothing harmful when clicking TrackRow in unknown mode (no openInSpotify, no play endpoint)', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'unknown' });
      const openSpy = vi.spyOn(playbackHelpers, 'openInSpotify').mockImplementation(() => {});

      const onPlay = vi.fn((uri) => {
        ensurePlaybackDevice(uri);
      });

      render(
        <TrackRow
          track={{ id: 't1', uri: 'spotify:track:t1', name: 'Song 1' }}
          onPlay={onPlay}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /play song 1/i }));
      expect(onPlay).toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
      expect(spotifyClient.proxyFetch).not.toHaveBeenCalledWith(expect.stringContaining('/me/player/play'), expect.anything());
    });

    it('playTrackGlobal opens in Spotify when free, and does nothing harmful when unknown', async () => {
      const openSpy = vi.spyOn(playbackHelpers, 'openInSpotify').mockImplementation(() => {});

      // Free tier
      useSpotifyPlayerStore.setState({ accountTier: 'free' });
      await playTrackGlobal('spotify:track:global1');
      expect(openSpy).toHaveBeenCalledWith('spotify:track:global1');
      expect(spotifyClient.proxyFetch).not.toHaveBeenCalledWith(expect.stringContaining('/me/player/play'), expect.anything());

      openSpy.mockClear();

      // Unknown tier
      useSpotifyPlayerStore.setState({ accountTier: 'unknown' });
      await playTrackGlobal('spotify:track:global2');
      expect(openSpy).not.toHaveBeenCalled();
      expect(spotifyClient.proxyFetch).not.toHaveBeenCalledWith(expect.stringContaining('/me/player/play'), expect.anything());
    });
  });

  describe('Player UI in Free Mode', () => {
    it('hides Add to queue in TrackActionsMenu when accountTier is free', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'free' });

      render(
        <TrackActionsMenu
          track={{ id: 't1', name: 'Song 1', uri: 'spotify:track:t1' }}
          onAddToQueue={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /track options/i }));
      expect(screen.queryByRole('menuitem', { name: /add to queue/i })).toBeNull();
    });

    it('shows Add to queue in TrackActionsMenu when accountTier is premium', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'premium' });

      render(
        <TrackActionsMenu
          track={{ id: 't1', name: 'Song 1', uri: 'spotify:track:t1' }}
          onAddToQueue={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /track options/i }));
      expect(screen.getByRole('menuitem', { name: /add to queue/i })).toBeDefined();
    });

    it('shows loading indicator and disabled play button before tier is known', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'unknown' });

      render(
        <PlaybackControls
          token="test-token"
          togglePlay={vi.fn()}
          prevTrack={vi.fn()}
          nextTrack={vi.fn()}
          toggleShuffle={vi.fn()}
          toggleRepeat={vi.fn()}
        />
      );

      const playBtn = screen.getByRole('button', { name: /loading player/i });
      expect(playBtn).toBeDefined();
      expect((playBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('shows OPEN IN SPOTIFY and never pause when accountTier is free', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'free', isPaused: false });

      render(
        <PlaybackControls
          token="test-token"
          togglePlay={vi.fn()}
          prevTrack={vi.fn()}
          nextTrack={vi.fn()}
          toggleShuffle={vi.fn()}
          toggleRepeat={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Open in Spotify' })).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    });

    it('renders dismissible FreeTierNotice once per session', () => {
      useSpotifyPlayerStore.setState({ accountTier: 'free' });

      const { unmount } = render(<FreeTierNotice />);
      expect(
        screen.getByText('Playback opens in the Spotify app. In-browser playback needs Spotify Premium.')
      ).toBeDefined();

      const dismissBtn = screen.getByRole('button', { name: /dismiss notice/i });
      fireEvent.click(dismissBtn);

      expect(
        screen.queryByText('Playback opens in the Spotify app. In-browser playback needs Spotify Premium.')
      ).toBeNull();
      expect(sessionStorage.getItem('spotify_free_tier_dismissed')).toBe('true');

      unmount();

      // Second mount within same session does not render
      render(<FreeTierNotice />);
      expect(
        screen.queryByText('Playback opens in the Spotify app. In-browser playback needs Spotify Premium.')
      ).toBeNull();
    });
  });

  describe('Unknown Tier Timeout and Auto-Retry', () => {
    it('/me fails, so the message shows and one retry happens after the interval', async () => {
      vi.useFakeTimers();
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');

      vi.mocked(spotifyClient.proxyFetch)
        .mockRejectedValueOnce(new Error('Spotify error'))
        .mockResolvedValueOnce({ id: 'u1', product: 'premium' });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestTierComponent() {
        useAccountTier();
        return <div>Account Tier Test</div>;
      }

      render(
        <QueryClientProvider client={queryClient}>
          <TestTierComponent />
        </QueryClientProvider>
      );

      // Advance 1ms for TanStack Query's internal timer to process rejection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });

      // Message shows right away when /me fails
      expect(notifySpy).toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(1);

      // Advance 30 seconds for the refetch interval
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      // One retry happens after the interval
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('the tier resolves, so the retries stop and the message clears', async () => {
      vi.useFakeTimers();
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');

      vi.mocked(spotifyClient.proxyFetch)
        .mockRejectedValueOnce(new Error('Spotify error'))
        .mockResolvedValueOnce({ id: 'u1', product: 'premium' });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestTierComponent() {
        useAccountTier();
        return <div>Account Tier Test</div>;
      }

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TestTierComponent />
        </QueryClientProvider>
      );

      // Advance 1ms for initial rejection
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(notifySpy).toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);

      // Advance 30 seconds for retry which resolves the tier
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30001);
      });

      expect(useSpotifyPlayerStore.getState().accountTier).toBe('premium');
      // Retries stop and message clears
      expect(notifySpy).toHaveBeenCalledWith(null);

      const callsAfterResolve = vi.mocked(spotifyClient.proxyFetch).mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });
      expect(vi.mocked(spotifyClient.proxyFetch).mock.calls.length).toBe(callsAfterResolve);

      unmount();
      vi.useRealTimers();
    });

    it('a 429 does not cause retries faster than allowed', async () => {
      vi.useFakeTimers();
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');

      // 429 with 45s Retry-After
      vi.mocked(spotifyClient.proxyFetch)
        .mockRejectedValueOnce({ status: 429, retryAfter: 45, message: 'Too Many Requests' })
        .mockResolvedValueOnce({ id: 'u1', product: 'premium' });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestTierComponent() {
        useAccountTier();
        return <div>Account Tier Test</div>;
      }

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TestTierComponent />
        </QueryClientProvider>
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(notifySpy).toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(1);

      // At 30 seconds, no retry yet because limiter retryAfter is 45s
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(1);

      // At 45 seconds total, the retry occurs
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15001);
      });
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(2);

      unmount();
      vi.useRealTimers();
    });

    it('if accountTier is still unknown 8 seconds after the first /me attempt, shows unreachable message', async () => {
      vi.useFakeTimers();
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');

      // Hanging request (neither resolves nor rejects immediately)
      vi.mocked(spotifyClient.proxyFetch).mockImplementation(() => new Promise(() => {}));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestTierComponent() {
        useAccountTier();
        return <div>Account Tier Test</div>;
      }

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TestTierComponent />
        </QueryClientProvider>
      );

      // At 5 seconds, message has not been shown
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(notifySpy).not.toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);

      // At 8 seconds, timeout fires and message shows
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(notifySpy).toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);

      unmount();
      vi.useRealTimers();
    });

    it('on 401 error, follows existing sign-in/refresh flow and does not loop', async () => {
      vi.useFakeTimers();
      const notifySpy = vi.spyOn(spotifyRecovery, 'notifyRecoveryError');

      vi.mocked(spotifyClient.proxyFetch).mockRejectedValueOnce({ status: 401, message: 'Unauthorized' });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(['spotifySession'], { accessToken: 'valid_access_token' });

      function TestTierComponent() {
        useAccountTier();
        return <div>Account Tier Test</div>;
      }

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TestTierComponent />
        </QueryClientProvider>
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });

      // Does not show unreachable banner on 401 (401 triggers login modal instead)
      expect(notifySpy).not.toHaveBeenCalledWith(SPOTIFY_UNREACHABLE_MSG);

      // Does not retry after 30s
      await act(async () => {
        await vi.advanceTimersByTimeAsync(35000);
      });
      expect(spotifyClient.proxyFetch).toHaveBeenCalledTimes(1);

      unmount();
      vi.useRealTimers();
    });
  });
});
