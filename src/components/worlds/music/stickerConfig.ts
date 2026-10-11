/**
 * Configuration and mappings for Snoopy stickers.
 *
 * Single on/off flag:
 * SNOOPY_STICKERS_ENABLED = true  -> Use Snoopy sticker icons
 * SNOOPY_STICKERS_ENABLED = false -> Restore previous/default icons
 */
export const SNOOPY_STICKERS_ENABLED = true;

export const SNOOPY_STICKER_MAP = {
  header: 'r4c4',             // party hat and cake
  kawaiiCard: 'r5c3',         // asleep on the moon
  continueListening: 'r5c2',  // scooter
  queueTab: 'r1c4',           // big bow
  queueModal: 'r1c4',         // big bow
} as const;

export type StickerSlot = keyof typeof SNOOPY_STICKER_MAP;
