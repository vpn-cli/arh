import { describe, it, expect } from 'vitest';
import { pickImage } from '../images';

describe('pickImage', () => {
  describe('undefined or empty array', () => {
    it('returns null for undefined', () => {
      expect(pickImage(undefined, 48)).toBeNull();
    });

    it('returns null for null', () => {
      expect(pickImage(null, 48)).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(pickImage([], 48)).toBeNull();
    });

    it('returns null for array with no valid URLs', () => {
      expect(pickImage([{ url: '' }, { url: '   ' } as any], 48)).toBeNull();
    });
  });

  describe('all widths null (e.g. custom playlist covers)', () => {
    it('returns the first image URL when all widths and heights are null', () => {
      const images = [
        { url: 'https://images.scdn.co/custom-cover-1.jpg', width: null, height: null },
        { url: 'https://images.scdn.co/custom-cover-2.jpg', width: null, height: null },
      ];
      const result = pickImage(images, 48);
      expect(result).toBe('https://images.scdn.co/custom-cover-1.jpg');
    });

    it('returns string URL when single custom cover has width: null', () => {
      const images = [
        { url: 'https://images.scdn.co/custom-single.jpg', width: null, height: null },
      ];
      const result = pickImage(images, 56);
      expect(result).toBe('https://images.scdn.co/custom-single.jpg');
    });

    it('handles width property omitted completely', () => {
      const images = [{ url: 'https://images.scdn.co/no-width.jpg' }];
      expect(pickImage(images, 48)).toBe('https://images.scdn.co/no-width.jpg');
    });

    it('handles raw string URLs', () => {
      const images = ['https://images.scdn.co/raw-string.jpg'];
      expect(pickImage(images, 48)).toBe('https://images.scdn.co/raw-string.jpg');
    });
  });

  describe('a mix of null and numeric widths', () => {
    it('picks the smallest image meeting >= 2x displayPx when available', () => {
      const images = [
        { url: 'https://images.scdn.co/custom-orig.jpg', width: null, height: null },
        { url: 'https://images.scdn.co/cover-640.jpg', width: 640, height: 640 },
        { url: 'https://images.scdn.co/cover-300.jpg', width: 300, height: 300 },
        { url: 'https://images.scdn.co/cover-64.jpg', width: 64, height: 64 },
      ];
      // displayPx = 48 -> targetWidth = 96
      // 300 and 640 are >= 96, smallest is 300
      const result = pickImage(images, 48);
      expect(result).toBe('https://images.scdn.co/cover-300.jpg');
    });

    it('falls back to custom image if all numeric images are under 2x displayPx', () => {
      const images = [
        { url: 'https://images.scdn.co/custom-highres.jpg', width: null, height: null },
        { url: 'https://images.scdn.co/cover-60.jpg', width: 60, height: 60 },
      ];
      // displayPx = 48 -> targetWidth = 96
      // 60 is < 96; primary image is custom highres with null width
      const result = pickImage(images, 48);
      expect(result).toBe('https://images.scdn.co/custom-highres.jpg');
    });

    it('uses height as fallback dimension if width is null but height is numeric', () => {
      const images = [
        { url: 'https://images.scdn.co/cover-h300.jpg', width: null, height: 300 },
        { url: 'https://images.scdn.co/cover-h640.jpg', width: null, height: 640 },
      ];
      // targetWidth = 96; smallest >= 96 is 300
      const result = pickImage(images, 48);
      expect(result).toBe('https://images.scdn.co/cover-h300.jpg');
    });

    it('never returns undefined when at least one image has a url', () => {
      const testCases = [
        [{ url: 'https://test.jpg' }],
        [{ url: 'https://test.jpg', width: null }],
        [{ url: 'https://test.jpg', width: 0 }],
        [{ url: 'https://test.jpg', width: -10 }],
        [null, { url: 'https://valid.jpg' }],
        ['https://string.jpg'],
        [{ url: 'https://a.jpg', width: null }, { url: 'https://b.jpg', width: 100 }],
      ];

      for (const tc of testCases) {
        const res = pickImage(tc as any, 48);
        expect(res).not.toBeUndefined();
        expect(typeof res).toBe('string');
      }
    });
  });
});
