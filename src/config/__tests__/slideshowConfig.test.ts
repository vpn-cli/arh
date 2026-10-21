import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { slideshowSlides } from '../slideshow';

describe('slideshow config', () => {
  it('matches all .webp files in public/slideshow', () => {
    const slideshowDir = path.resolve(process.cwd(), 'public/slideshow');
    const diskFiles = fs
      .readdirSync(slideshowDir)
      .filter((file) => file.endsWith('.webp'))
      .sort();

    const configFiles = slideshowSlides
      .map((slide) => path.basename(slide.src))
      .sort();

    expect(
      configFiles,
      'slideshowSlides in src/config/slideshow.ts does not match files in public/slideshow/. Run `npm run slideshow` to regenerate.'
    ).toEqual(diskFiles);
  });
});
