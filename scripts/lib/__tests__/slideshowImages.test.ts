import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  HERO_WIDTH,
  HERO_HEIGHT,
  ANIMATED_HERO_WIDTH,
  ANIMATED_HERO_HEIGHT,
  ANIMATED_HERO_RETRY_WIDTH,
  ANIMATED_HERO_RETRY_HEIGHT,
  PIPELINE_VERSION,
  POSITION_OVERRIDES,
  parsePositionOverride,
  getContentHash8,
  slugify,
  convertSlideshowImage,
} from '../slideshowImages';

describe('slideshowImages constants', () => {
  it('defines HERO dimensions with ~4.4:1 ratio', () => {
    expect(HERO_WIDTH).toBe(1600);
    expect(HERO_HEIGHT).toBe(364);
    const ratio = HERO_WIDTH / HERO_HEIGHT;
    expect(ratio).toBeCloseTo(4.3956, 3);
  });

  it('defines ANIMATED dimensions at same target ratio', () => {
    expect(ANIMATED_HERO_WIDTH).toBe(900);
    expect(ANIMATED_HERO_HEIGHT).toBe(205);
    expect(ANIMATED_HERO_RETRY_WIDTH).toBe(640);
    expect(ANIMATED_HERO_RETRY_HEIGHT).toBe(146);
  });

  it('defines PIPELINE_VERSION', () => {
    expect(PIPELINE_VERSION).toBe(2);
  });
});

describe('parsePositionOverride', () => {
  const cases: Array<{ file: string; expectedOverride: string; expectedBase: string; expectedPos: number }> = [
    { file: 'kitty-picnic@top.jpg', expectedOverride: '@top', expectedBase: 'kitty-picnic', expectedPos: sharp.gravity.north },
    { file: 'forest@bottom.png', expectedOverride: '@bottom', expectedBase: 'forest', expectedPos: sharp.gravity.south },
    { file: 'sunset@left.webp', expectedOverride: '@left', expectedBase: 'sunset', expectedPos: sharp.gravity.west },
    { file: 'city@right.jpeg', expectedOverride: '@right', expectedBase: 'city', expectedPos: sharp.gravity.east },
    { file: 'portrait@center.jpg', expectedOverride: '@center', expectedBase: 'portrait', expectedPos: sharp.gravity.center },
    { file: 'art@topleft.gif', expectedOverride: '@topleft', expectedBase: 'art', expectedPos: sharp.gravity.northwest },
    { file: 'art@topright.png', expectedOverride: '@topright', expectedBase: 'art', expectedPos: sharp.gravity.northeast },
    { file: 'art@bottomleft.jpg', expectedOverride: '@bottomleft', expectedBase: 'art', expectedPos: sharp.gravity.southwest },
    { file: 'art@bottomright.webp', expectedOverride: '@bottomright', expectedBase: 'art', expectedPos: sharp.gravity.southeast },
  ];

  for (const c of cases) {
    it(`parses ${c.file} correctly`, () => {
      const res = parsePositionOverride(c.file);
      expect(res).not.toBeNull();
      expect(res?.override).toBe(c.expectedOverride);
      expect(res?.cleanBaseName).toBe(c.expectedBase);
      expect(res?.position).toBe(c.expectedPos);
    });
  }

  it('returns null for filenames without position override', () => {
    expect(parsePositionOverride('kitty-picnic.jpg')).toBeNull();
    expect(parsePositionOverride('download (11)hgf.jpeg')).toBeNull();
    expect(parsePositionOverride('hello@notavalidposition.png')).toBeNull();
  });

  it('strips override from output slug when slugified', () => {
    const parsed = parsePositionOverride('kitty-picnic@top.jpg');
    expect(parsed).not.toBeNull();
    const slug = slugify(parsed!.cleanBaseName);
    expect(slug).toBe('kitty-picnic');
  });
});

describe('getContentHash8', () => {
  it('returns 8-char hex string', () => {
    const buf = Buffer.from('test image content');
    const hash = getContentHash8(buf);
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('changes hash when extra (override) is passed', () => {
    const buf = Buffer.from('test image content');
    const hash1 = getContentHash8(buf);
    const hash2 = getContentHash8(buf, '@top');
    const hash3 = getContentHash8(buf, '@bottom');
    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
  });
});

describe('convertSlideshowImage', () => {
  it('crops still images to exactly HERO_WIDTH x HERO_HEIGHT', async () => {
    // Create a 800x600 test image
    const inputBuf = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await convertSlideshowImage(inputBuf);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.width).toBe(1600);
      expect(result.height).toBe(364);
      expect(result.animated).toBe(false);

      const outMeta = await sharp(result.buffer).metadata();
      expect(outMeta.width).toBe(1600);
      expect(outMeta.height).toBe(364);
      expect(outMeta.format).toBe('webp');
    }
  });

  it('crops with manual override position when provided', async () => {
    const inputBuf = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const result = await convertSlideshowImage(inputBuf, sharp.gravity.north);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.width).toBe(1600);
      expect(result.height).toBe(364);
    }
  });
});
