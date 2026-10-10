import { describe, it, expect } from 'vitest';
import { getContrastRatio, getRelativeLuminance, hexToRgb, mixColors, rgbToHex } from '../contrast';

describe('WCAG Contrast Ratio Helper', () => {
  it('converts hex to RGB correctly', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('123456')).toEqual({ r: 18, g: 52, b: 86 });
  });

  it('converts RGB to hex correctly', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(18, 52, 86)).toBe('#123456');
  });

  it('calculates correct relative luminance for black and white', () => {
    expect(getRelativeLuminance('#000000')).toBe(0);
    expect(getRelativeLuminance('#ffffff')).toBe(1);
  });

  it('computes 21:1 contrast ratio between black and white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
    expect(getContrastRatio('#ffffff', '#000000')).toBe(21);
  });

  it('computes 1:1 contrast ratio for identical colors', () => {
    expect(getContrastRatio('#123456', '#123456')).toBe(1);
  });

  it('accurately measures standard WCAG ratios', () => {
    // Pure black (#000000) on #767676 is approx 4.54:1 (WCAG AA threshold for body text)
    const ratio = getContrastRatio('#000000', '#767676');
    expect(ratio).toBeGreaterThanOrEqual(4.5);

    // White on #595959 is approx 7.0:1 (WCAG AAA)
    const ratioAAA = getContrastRatio('#ffffff', '#595959');
    expect(ratioAAA).toBeGreaterThanOrEqual(7.0);
  });

  it('correctly mixes colors proportionally', () => {
    const mixed = mixColors('#000000', '#ffffff', 0.5);
    expect(mixed).toBe('#808080');
  });
});
