import { describe, it, expect } from 'vitest';
import { generatePalette } from '../palette';
import { getContrastRatio, mixColors } from '../contrast';

describe('Music World Palette Generator - WCAG Contrast Guarantees', () => {
  const testCoverColors = [
    { name: 'Yellow', hex: '#FFEB3B' },
    { name: 'Pale Pink', hex: '#FFD1DC' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Near-black', hex: '#121212' },
    { name: 'Electric Blue', hex: '#00D2FF' },
    { name: 'Crimson Red (Default)', hex: '#C2185B' },
    { name: 'Bright Green', hex: '#1DB954' },
    { name: 'Pastel Peach', hex: '#FFE0B2' },
  ];

  testCoverColors.forEach(({ name, hex }) => {
    describe(`Palette for ${name} (${hex})`, () => {
      const palette = generatePalette(hex);

      it('guarantees --color-dark on --color-light is at least 4.5:1', () => {
        const ratio = getContrastRatio(palette.dark, palette.light);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('guarantees --color-dark on --color-bg is at least 4.5:1', () => {
        const ratio = getContrastRatio(palette.dark, palette.bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('guarantees --on-vibrant on --color-vibrant is at least 4.5:1', () => {
        const ratio = getContrastRatio(palette.onVibrant, palette.vibrant);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('guarantees --color-text-muted on --color-light is at least 4.5:1', () => {
        const ratio = getContrastRatio(palette.textMuted, palette.light);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('guarantees --color-text-muted on --color-bg is at least 4.5:1', () => {
        const ratio = getContrastRatio(palette.textMuted, palette.bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('guarantees --color-dark on --color-surface blended over the page background is at least 4.5:1', () => {
        // --color-surface: color-mix(in srgb, var(--color-bg) 80%, transparent)
        // Blended over main page background (--color-light):
        const surfaceOverLight = mixColors(palette.bg, palette.light, 0.8);
        const ratioOverLight = getContrastRatio(palette.dark, surfaceOverLight);
        expect(ratioOverLight).toBeGreaterThanOrEqual(4.5);

        // Blended over base background (--color-bg):
        const surfaceOverBg = mixColors(palette.bg, palette.bg, 0.8);
        const ratioOverBg = getContrastRatio(palette.dark, surfaceOverBg);
        expect(ratioOverBg).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
