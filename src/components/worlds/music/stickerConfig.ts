/**
 * Configuration and mappings for Snoopy stickers.
 *
 * Single on/off flag:
 * SNOOPY_STICKERS_ENABLED = true  -> Use Snoopy sticker icons
 * SNOOPY_STICKERS_ENABLED = false -> Restore previous/default icons
 */
export const SNOOPY_STICKERS_ENABLED = true;

export const trackChange = ['r2c3', 'r2c4', 'r3c1', 'r5c2'] as const;

export const moments = {
  queueEmpty: 'r5c3',
  searchEmpty: 'r5c1',
  lyricsMissing: 'r4c1',
  loading: 'r2c3',
  error: 'r5c1',
  notFound: 'r5c1',
  addedToQueue: 'r5c2',
  addedToPlaylist: 'r3c1',
  memorySaved: 'r3c4',
} as const;

export type MomentSlot = keyof typeof moments;

export const SNOOPY_STICKER_MAP = {
  header: 'r4c4',             // party hat and cake
  kawaiiCard: 'r4c2',         // strawberry costume
  continueListening: 'r5c2',  // scooter
  recentlyPlayed: 'r4c1',     // reading a book
  queueTab: 'r1c4',           // big bow
  queueModal: 'r1c4',         // big bow
  birthdayMix: 'r4c4',        // party hat and cake
  topTracks: 'r2c1',          // Woodstock / headphones
  vibes: 'r2c3',              // sunglasses Joe Cool
  memories: 'r3c4',           // scrapbook / memory
  restingWave: 'r5c3',        // resting / sleeping
  progressThumb: 'r5c2',      // progress bar handle
  r1c1: 'r1c1',
  r1c2: 'r1c2',
  r1c3: 'r1c3',
  r1c4: 'r1c4',
  r2c1: 'r2c1',
  r2c2: 'r2c2',
  r2c3: 'r2c3',
  r2c4: 'r2c4',
  r3c1: 'r3c1',
  r3c2: 'r3c2',
  r3c3: 'r3c3',
  r3c4: 'r3c4',
  r4c1: 'r4c1',
  r4c2: 'r4c2',
  r4c3: 'r4c3',
  r4c4: 'r4c4',
  r5c1: 'r5c1',
  r5c2: 'r5c2',
  r5c3: 'r5c3',
} as const;

export type StickerSlot = keyof typeof SNOOPY_STICKER_MAP;
