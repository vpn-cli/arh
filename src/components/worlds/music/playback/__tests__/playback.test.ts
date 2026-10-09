import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidContextUri,
  openInSpotify,
  getNextRepeatMode,
  computeNextQueueIndex,
  computePrevQueueIndex,
  resolveQueueTrack,
  findTrackInSources,
  resolveTrackForPlayback,
} from '../playbackHelpers';

describe('playbackHelpers pure functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidContextUri', () => {
    it('returns true for valid context uris', () => {
      expect(isValidContextUri('spotify:playlist:123')).toBe(true);
      expect(isValidContextUri('spotify:album:456')).toBe(true);
      expect(isValidContextUri('spotify:artist:789')).toBe(true);
      expect(isValidContextUri('spotify:show:abc')).toBe(true);
    });

    it('returns false for non-context or invalid values', () => {
      expect(isValidContextUri('spotify:track:123')).toBe(false);
      expect(isValidContextUri('spotify:mix')).toBe(false);
      expect(isValidContextUri('')).toBe(false);
      expect(isValidContextUri(null)).toBe(false);
      expect(isValidContextUri(undefined)).toBe(false);
      expect(isValidContextUri(12345)).toBe(false);
    });
  });

  describe('openInSpotify', () => {
    it('opens window for 3-part spotify URI', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openInSpotify('spotify:track:abc123xyz');
      expect(openSpy).toHaveBeenCalledWith('https://open.spotify.com/track/abc123xyz', '_blank');
    });

    it('does nothing when uri is missing or invalid', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      openInSpotify('');
      openInSpotify(undefined);
      openInSpotify('invalid-uri');
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('repeat mode and queue helpers', () => {
    it('cycles next repeat mode', () => {
      expect(getNextRepeatMode('off')).toBe('context');
      expect(getNextRepeatMode('context')).toBe('track');
      expect(getNextRepeatMode('track')).toBe('off');
    });

    it('computes next queue index correctly', () => {
      expect(computeNextQueueIndex('track', 5, 2)).toBe(2);
      expect(computeNextQueueIndex('off', 5, 2)).toBe(3);
      expect(computeNextQueueIndex('off', 5, 4)).toBe(null);
      expect(computeNextQueueIndex('context', 5, 4)).toBe(0);
    });

    it('computes prev queue index correctly', () => {
      expect(computePrevQueueIndex('track', 5, 2)).toBe(2);
      expect(computePrevQueueIndex('off', 5, 2)).toBe(1);
      expect(computePrevQueueIndex('off', 5, 0)).toBe(null);
      expect(computePrevQueueIndex('context', 5, 0)).toBe(4);
    });
  });

  describe('track resolution helpers', () => {
    it('resolves queue track from string and object', () => {
      expect(resolveQueueTrack('spotify:track:1')).toEqual({
        uri: 'spotify:track:1',
        track: { uri: 'spotify:track:1', name: 'Queued Track' },
      });
      expect(resolveQueueTrack({ uri: 'spotify:track:2', name: 'My Track' })).toEqual({
        uri: 'spotify:track:2',
        track: { uri: 'spotify:track:2', name: 'My Track' },
      });
      expect(resolveQueueTrack(null)).toBe(null);
    });

    it('finds track in sources', () => {
      const bTrack = { uri: 'spotify:track:b', name: 'Birthday Track' };
      const lTrack = { uri: 'spotify:track:l', name: 'Liked Track' };
      const rTrack = { uri: 'spotify:track:r', name: 'Recent Track' };
      const sources = {
        birthdayMixTracks: [bTrack],
        likedTracks: [lTrack],
        recentTracks: [{ track: rTrack }],
      };

      expect(findTrackInSources('spotify:track:b', sources)).toBe(bTrack);
      expect(findTrackInSources('spotify:track:l', sources)).toBe(lTrack);
      expect(findTrackInSources('spotify:track:r', sources)).toBe(rTrack);
      expect(findTrackInSources('spotify:track:unknown', sources)).toBeUndefined();
    });

    it('resolves track for playback from context or sources', () => {
      const current = { uri: 'spotify:track:c', name: 'Current' };
      const trackObj = { uri: 'spotify:track:custom', name: 'Custom' };
      expect(resolveTrackForPlayback('spotify:track:custom', undefined, trackObj, current, {})).toBe(trackObj);
      expect(resolveTrackForPlayback('spotify:track:c', undefined, undefined, current, {})).toBe(current);
    });
  });
});
