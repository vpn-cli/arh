import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordPendingTrackId,
  clearPendingTrackId,
  shouldIgnoreIncomingTrack,
  getPendingTrackId,
  getLastIgnoredTrack,
  setDeferredApplyCallback,
} from '../playbackHelpers';
import { useSpotifyPlayerStore } from '@/store/spotifyStore';

describe('Vinyl Art Reconcile - 3s Pending Guard (T1 - T6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearPendingTrackId();
    useSpotifyPlayerStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
    });
  });

  afterEach(() => {
    clearPendingTrackId();
    vi.useRealTimers();
  });

  // Helper simulating the SDK player_state_changed handler
  const simulateSdkTrackReport = (track: any, nextTracks: any[] = []) => {
    const ignored = shouldIgnoreIncomingTrack(track, undefined, nextTracks);
    if (!ignored) {
      useSpotifyPlayerStore.getState().setCurrentTrack(track);
    }
    return ignored;
  };

  it('T1 Tap-then-Next: pending B; SDK reports C; NO further events; advance 3000ms -> currentTrack === C', () => {
    const trackB = { id: 'B', uri: 'spotify:track:B', name: 'Song B' };
    const trackC = { id: 'C', uri: 'spotify:track:C', name: 'Song C' };

    // Tap B (sets pending B and optimistic currentTrack B)
    recordPendingTrackId(trackB.id, trackB.uri);
    useSpotifyPlayerStore.getState().setCurrentTrack(trackB);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // Next pressed shortly after, SDK reports C
    const isIgnored = simulateSdkTrackReport(trackC);
    expect(isIgnored).toBe(true);
    expect(getLastIgnoredTrack()?.id).toBe('C');
    // UI remains B while within the 3s window
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // NO further events arrive; timer expires at 3000ms
    vi.advanceTimersByTime(3000);

    // Store reconciles to C
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('C');
    expect(getPendingTrackId()).toBeNull();
  });

  it('T2 Failed play: currentTrack A; pending B (optimistic B set); SDK reports A only; advance 3000ms -> currentTrack === A', () => {
    const trackA = { id: 'A', uri: 'spotify:track:A', name: 'Song A' };
    const trackB = { id: 'B', uri: 'spotify:track:B', name: 'Song B' };

    // Initially playing A
    useSpotifyPlayerStore.getState().setCurrentTrack(trackA);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('A');

    // Tap B (optimistic B)
    recordPendingTrackId(trackB.id, trackB.uri);
    useSpotifyPlayerStore.getState().setCurrentTrack(trackB);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // Play fails; SDK continues reporting A only
    const isIgnored = simulateSdkTrackReport(trackA);
    expect(isIgnored).toBe(true);
    expect(getLastIgnoredTrack()?.id).toBe('A');
    // Still shows B within window
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // 3s expires without confirmation
    vi.advanceTimersByTime(3000);

    // Reconciles back to actual playing track A
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('A');
    expect(getPendingTrackId()).toBeNull();
  });

  it('T3 Relinking: pending B; SDK reports {id: "B2", linked_from: {id: "B"}} -> accepted immediately (currentTrack === B2, no wait), pending cleared', () => {
    const trackB = { id: 'B', uri: 'spotify:track:B', name: 'Original B' };
    const relinkedB2 = {
      id: 'B2',
      uri: 'spotify:track:B2',
      name: 'Relinked B2',
      linked_from: { id: 'B', uri: 'spotify:track:B' },
    };

    recordPendingTrackId(trackB.id, trackB.uri);
    expect(getPendingTrackId()).toBe('B');

    // SDK reports relinked track B2 pointing to original ID B
    const isIgnored = simulateSdkTrackReport(relinkedB2);

    // Accepted immediately without waiting
    expect(isIgnored).toBe(false);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B2');
    expect(getPendingTrackId()).toBeNull();
    expect(getLastIgnoredTrack()).toBeNull();

    // Advancing timers should not alter track
    vi.advanceTimersByTime(3000);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B2');
  });

  it('T4 Confirmation cancels the timer: pending B; SDK reports A (ignored); SDK reports B; advance 3000ms -> currentTrack stays B (A NOT applied)', () => {
    const trackA = { id: 'A', uri: 'spotify:track:A', name: 'Song A' };
    const trackB = { id: 'B', uri: 'spotify:track:B', name: 'Song B' };

    recordPendingTrackId(trackB.id, trackB.uri);
    useSpotifyPlayerStore.getState().setCurrentTrack(trackB);

    // SDK reports lingering event for track A (ignored, stored as lastIgnoredTrack)
    expect(simulateSdkTrackReport(trackA)).toBe(true);
    expect(getLastIgnoredTrack()?.id).toBe('A');

    // SDK now reports confirmation for track B (clears pending and cancels timer)
    expect(simulateSdkTrackReport(trackB)).toBe(false);
    expect(getPendingTrackId()).toBeNull();
    expect(getLastIgnoredTrack()).toBeNull();
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // Advance 3000ms: timer was cancelled, so A is NOT applied
    vi.advanceTimersByTime(3000);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');
  });

  it('T5 Re-pending: pending B; SDK C ignored; at 1000ms pending D; SDK D -> currentTrack D; advance 5000ms -> stays D', () => {
    const trackB = { id: 'B', uri: 'spotify:track:B' };
    const trackC = { id: 'C', uri: 'spotify:track:C' };
    const trackD = { id: 'D', uri: 'spotify:track:D' };

    recordPendingTrackId(trackB.id, trackB.uri);
    expect(simulateSdkTrackReport(trackC)).toBe(true);
    expect(getLastIgnoredTrack()?.id).toBe('C');

    // At 1000ms, user initiates play for D (resets pending state and starts new 3s timer)
    vi.advanceTimersByTime(1000);
    recordPendingTrackId(trackD.id, trackD.uri);
    expect(getPendingTrackId()).toBe('D');
    expect(getLastIgnoredTrack()).toBeNull();

    // SDK confirms D
    expect(simulateSdkTrackReport(trackD)).toBe(false);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('D');

    // Advance 5000ms: stays D, previous C is never applied
    vi.advanceTimersByTime(5000);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('D');
  });

  it('T6 Existing behavior preserved: optimistic B + SDK A within 3s keeps B', () => {
    const trackA = { id: 'A', uri: 'spotify:track:A' };
    const trackB = { id: 'B', uri: 'spotify:track:B' };

    recordPendingTrackId(trackB.id, trackB.uri);
    useSpotifyPlayerStore.getState().setCurrentTrack(trackB);

    // Advance 500ms, SDK reports A
    vi.advanceTimersByTime(500);
    expect(simulateSdkTrackReport(trackA)).toBe(true);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');

    // Advance another 1000ms (1500ms total), still shows B
    vi.advanceTimersByTime(1000);
    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('B');
  });

  it('applies queue cache callback and updates queue index on deferred reconcile', () => {
    const trackA = { id: 'A', uri: 'spotify:track:A' };
    const trackB = { id: 'B', uri: 'spotify:track:B' };
    const trackC = { id: 'C', uri: 'spotify:track:C' };
    const nextTracks = [{ id: 'D', uri: 'spotify:track:D' }];

    // Prepare store with queue [A, B, C]
    useSpotifyPlayerStore.setState({
      queue: [{ track: trackA }, { track: trackB }, { track: trackC }],
      queueIndex: 1, // at B
      currentTrack: trackB,
    });

    const callbackSpy = vi.fn();
    const unregister = setDeferredApplyCallback(callbackSpy);

    recordPendingTrackId(trackB.id, trackB.uri);
    // SDK reports C with nextTracks
    simulateSdkTrackReport(trackC, nextTracks);

    // Timer expires
    vi.advanceTimersByTime(3000);

    expect(useSpotifyPlayerStore.getState().currentTrack?.id).toBe('C');
    expect(useSpotifyPlayerStore.getState().queueIndex).toBe(2); // synced to C's index
    expect(callbackSpy).toHaveBeenCalledTimes(1);
    expect(callbackSpy).toHaveBeenCalledWith(trackC, nextTracks);

    unregister();
  });
});
