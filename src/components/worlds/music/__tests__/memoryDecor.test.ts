import { describe, it, expect } from 'vitest';
import {
  getMemoryDecor,
  ALLOWED_STICKERS,
  ALLOWED_TILTS,
  FASTENERS,
  PAPERS,
  MemoryDecor,
} from '../memoryDecor';

describe('getMemoryDecor', () => {
  it('returns exactly the same decor for the same memory id twice (pure, deterministic)', () => {
    const id = 'mem-test-uuid-456';
    const first = getMemoryDecor(id);
    const second = getMemoryDecor(id);
    expect(first).toEqual(second);
  });

  it('generates at least 3 different fasteners, papers, and stickers across 12 sample ids', () => {
    const sampleIds = [
      'mem-1-alpha',
      'mem-2-bravo',
      'mem-3-charlie',
      'mem-4-delta',
      'mem-5-echo',
      'mem-6-foxtrot',
      'mem-7-golf',
      'mem-8-hotel',
      'mem-9-india',
      'mem-10-juliet',
      'mem-11-kilo',
      'mem-12-lima',
    ];

    const fasteners = new Set<string>();
    const papers = new Set<string>();
    const stickers = new Set<string>();

    sampleIds.forEach((id) => {
      const decor = getMemoryDecor(id);
      fasteners.add(decor.fastener);
      papers.add(decor.paper);
      stickers.add(decor.sticker);
    });

    expect(fasteners.size).toBeGreaterThanOrEqual(3);
    expect(papers.size).toBeGreaterThanOrEqual(3);
    expect(stickers.size).toBeGreaterThanOrEqual(3);
  });

  it('guarantees consecutive cards never share a sticker or a tilt', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `memory-stream-id-${i}`);
    let prevDecor: MemoryDecor | null = null;

    ids.forEach((id) => {
      const currentDecor = getMemoryDecor(id, prevDecor);

      if (prevDecor) {
        expect(currentDecor.sticker).not.toBe(prevDecor.sticker);
        expect(currentDecor.tilt).not.toBe(prevDecor.tilt);
      }

      prevDecor = currentDecor;
    });
  });

  it('never returns r3c4 (or r5c1, r5c2, r5c3) across a large set of sample ids', () => {
    const testIds = Array.from({ length: 100 }, (_, i) => `id-${i}-sample-seed`);
    let prevDecor: MemoryDecor | null = null;

    testIds.forEach((id) => {
      const decor = getMemoryDecor(id, prevDecor);
      expect(decor.sticker).not.toBe('r3c4');
      expect(decor.sticker).not.toBe('r5c1');
      expect(decor.sticker).not.toBe('r5c2');
      expect(decor.sticker).not.toBe('r5c3');
      expect(ALLOWED_STICKERS).toContain(decor.sticker);
      expect(ALLOWED_TILTS).toContain(decor.tilt);
      prevDecor = decor;
    });
  });

  it('constrains all parameters within valid predefined design options', () => {
    const decor = getMemoryDecor('arbitrary-id');
    expect(ALLOWED_STICKERS).toContain(decor.sticker);
    expect(['top-right', 'top-left', 'bottom-left']).toContain(decor.stickerCorner);
    expect(FASTENERS).toContain(decor.fastener);
    expect(PAPERS).toContain(decor.paper);
    expect(ALLOWED_TILTS).toContain(decor.tilt);
    expect(['underline', 'highlighter', 'none']).toContain(decor.noteAccent);
    expect(['dashed-rectangle', 'round-postmark', 'ticket-stub']).toContain(decor.dateStamp);
    expect(decor.polaroidTilt).toBeGreaterThanOrEqual(-2);
    expect(decor.polaroidTilt).toBeLessThanOrEqual(2);
  });
});
