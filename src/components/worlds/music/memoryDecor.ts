import { StickerSlot } from './stickerConfig';

export type StickerCell =
  | 'r1c1' | 'r1c2' | 'r1c3' | 'r1c4'
  | 'r2c1' | 'r2c2' | 'r2c3' | 'r2c4'
  | 'r3c1' | 'r3c2' | 'r3c3'
  | 'r4c1' | 'r4c2' | 'r4c3' | 'r4c4';

export type StickerCorner = 'top-right' | 'top-left' | 'bottom-left';

export type FastenerType =
  | 'straight-tape'
  | 'angled-tape'
  | 'corner-tapes'
  | 'paper-clip'
  | 'push-pin';

export type PaperType = 'plain' | 'ruled' | 'grid' | 'dots';

export type TiltDegrees = -2 | -1.2 | -0.6 | 0.6 | 1.2 | 2;

export type NoteAccent = 'underline' | 'highlighter' | 'none';

export type DateStampStyle = 'dashed-rectangle' | 'round-postmark' | 'ticket-stub';

export interface MemoryDecor {
  sticker: StickerCell;
  stickerCorner: StickerCorner;
  fastener: FastenerType;
  paper: PaperType;
  tilt: TiltDegrees;
  noteAccent: NoteAccent;
  dateStamp: DateStampStyle;
  dateStampTilt: number;
  polaroidTilt: number;
}

/**
 * 15 allowed cells produced by the extraction script.
 * Excludes:
 * - r3c4 (the header's)
 * - r5c3 (the sleeping one)
 * - r5c1 (empty states)
 * - r5c2 (progress handle)
 */
export const ALLOWED_STICKERS: readonly StickerCell[] = [
  'r1c1', 'r1c2', 'r1c3', 'r1c4',
  'r2c1', 'r2c2', 'r2c3', 'r2c4',
  'r3c1', 'r3c2', 'r3c3',
  'r4c1', 'r4c2', 'r4c3', 'r4c4',
] as const;

export const STICKER_CORNERS: readonly StickerCorner[] = [
  'top-right',
  'top-left',
  'bottom-left',
] as const;

export const FASTENERS: readonly FastenerType[] = [
  'straight-tape',
  'angled-tape',
  'corner-tapes',
  'paper-clip',
  'push-pin',
] as const;

export const PAPERS: readonly PaperType[] = [
  'plain',
  'ruled',
  'grid',
  'dots',
] as const;

export const ALLOWED_TILTS: readonly TiltDegrees[] = [
  -2, -1.2, -0.6, 0.6, 1.2, 2,
] as const;

export const NOTE_ACCENTS: readonly NoteAccent[] = [
  'underline',
  'highlighter',
  'none',
] as const;

export const DATE_STAMPS: readonly DateStampStyle[] = [
  'dashed-rectangle',
  'round-postmark',
  'ticket-stub',
] as const;

const DATE_STAMP_TILTS = [-2.5, -1.5, 1.2, 2.2, -1.8, 2.8] as const;
const POLAROID_TILTS = [-1.8, -1.2, -0.6, 0.6, 1.2, 1.8] as const;

/**
 * Pure 32-bit FNV-1a hash generator with seed.
 */
function hashWithSeed(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Pure function to derive consistent, deterministic scrapbook decor for a memory card.
 * Never uses Math.random() or Date in render.
 * Server and client match.
 *
 * @param memoryId Unique ID of the memory
 * @param previousDecor Decor of the preceding card in the sequence (if any)
 */
export function getMemoryDecor(
  memoryId: string,
  previousDecor?: MemoryDecor | null
): MemoryDecor {
  const safeId = memoryId || 'memory-default';

  // 1. Sticker: 15 allowed cells, never r3c4, r5c1, r5c2, r5c3. Never same as previous.
  const stickerCandidates = previousDecor?.sticker
    ? ALLOWED_STICKERS.filter((s) => s !== previousDecor.sticker)
    : ALLOWED_STICKERS;
  const stickerHash = hashWithSeed(safeId, 0x811c9dc5);
  const sticker = stickerCandidates[stickerHash % stickerCandidates.length];

  // 2. Sticker corner: top-right, top-left, or bottom-left. Fully visible, never clipped.
  const cornerHash = hashWithSeed(safeId, 0x9e3779b9);
  const stickerCorner = STICKER_CORNERS[cornerHash % STICKER_CORNERS.length];

  // 3. Fastener: straight tape at top centre, angled tape on one corner, two small corner tapes, paper clip, push pin.
  const fastenerHash = hashWithSeed(safeId, 0x85ebca6b);
  const fastener = FASTENERS[fastenerHash % FASTENERS.length];

  // 4. Paper: plain, ruled lines, grid, or dots.
  const paperHash = hashWithSeed(safeId, 0xc2b2ae35);
  const paper = PAPERS[paperHash % PAPERS.length];

  // 5. Tilt: one of -2, -1.2, -0.6, 0.6, 1.2, 2. Never same as previous.
  const tiltCandidates = previousDecor?.tilt !== undefined
    ? ALLOWED_TILTS.filter((t) => t !== previousDecor.tilt)
    : ALLOWED_TILTS;
  const tiltHash = hashWithSeed(safeId, 0x27d4eb2f);
  const tilt = tiltCandidates[tiltHash % tiltCandidates.length];

  // 6. Note accent: hand-drawn underline, highlighter swipe, or none.
  const accentHash = hashWithSeed(safeId, 0x165667b1);
  const noteAccent = NOTE_ACCENTS[accentHash % NOTE_ACCENTS.length];

  // 7. Date stamp: dashed rectangle, round postmark, ticket stub, each tilted a few degrees.
  const stampHash = hashWithSeed(safeId, 0x1f9e2b17);
  const dateStamp = DATE_STAMPS[stampHash % DATE_STAMPS.length];

  const dateTiltHash = hashWithSeed(safeId, 0x517cc1b7);
  const dateStampTilt = DATE_STAMP_TILTS[dateTiltHash % DATE_STAMP_TILTS.length];

  // 8. Song polaroid: tilt of -2 to 2 degrees and thicker bottom border.
  const polaroidTiltHash = hashWithSeed(safeId, 0x72a5a1f3);
  const polaroidTilt = POLAROID_TILTS[polaroidTiltHash % POLAROID_TILTS.length];

  return {
    sticker,
    stickerCorner,
    fastener,
    paper,
    tilt,
    noteAccent,
    dateStamp,
    dateStampTilt,
    polaroidTilt,
  };
}
