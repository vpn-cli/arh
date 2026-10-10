import { getContrastRatio, mixColors } from './contrast';

export interface DerivedPalette {
  bg: string;
  light: string;
  muted: string;
  dark: string;
  vibrant: string;
  onVibrant: string;
  textMuted: string;
}

/**
 * Generates an accessible, WCAG AA (>= 4.5:1) compliant palette for Music World.
 * Guarantees:
 * - --color-dark on --color-light and on --color-bg is >= 4.5:1
 * - --on-vibrant on --color-vibrant is >= 4.5:1 (adjusting vibrant if necessary)
 * - --color-text-muted on both --color-light and --color-bg is >= 4.5:1
 */
export function generatePalette(baseColorInput?: string): DerivedPalette {
  let vibrant = (baseColorInput || '#C2185B').trim();
  if (!vibrant.startsWith('#')) {
    vibrant = `#${vibrant}`;
  }
  if (!/^#[0-9a-fA-F]{3,8}$/.test(vibrant)) {
    vibrant = '#C2185B';
  }

  // Base tint surfaces
  const bg = mixColors(vibrant, '#ffffff', 0.08);
  const light = mixColors(vibrant, '#ffffff', 0.15);
  const muted = mixColors(vibrant, '#ffffff', 0.35);

  // 1. Derive --color-dark, guaranteeing >= 4.5:1 on both bg and light
  let dark = mixColors(vibrant, '#000000', 0.40);
  let weight = 0.40;
  while (
    (getContrastRatio(dark, bg) < 4.5 || getContrastRatio(dark, light) < 4.5) &&
    weight > 0
  ) {
    weight = Math.max(0, weight - 0.02);
    dark = mixColors(vibrant, '#000000', weight);
  }

  // If still under 4.5, fall back to high contrast dark
  if (getContrastRatio(dark, bg) < 4.5 || getContrastRatio(dark, light) < 4.5) {
    dark = '#121324';
  }

  // 2. Derive --on-vibrant (better of white or dark against vibrant, min 4.5:1)
  const crWhite = getContrastRatio('#ffffff', vibrant);
  const crDark = getContrastRatio(dark, vibrant);

  let onVibrant = '#ffffff';

  if (crWhite >= crDark) {
    onVibrant = '#ffffff';
    // If white is better but doesn't reach 4.5:1, darken vibrant until it reaches 4.5:1
    let darkenWeight = 1.0;
    while (getContrastRatio('#ffffff', vibrant) < 4.5 && darkenWeight > 0.05) {
      darkenWeight -= 0.02;
      vibrant = mixColors(vibrant, '#000000', darkenWeight);
    }
  } else {
    onVibrant = dark;
    // If dark is better but doesn't reach 4.5:1, lighten vibrant until it reaches 4.5:1
    let lightenWeight = 1.0;
    while (getContrastRatio(dark, vibrant) < 4.5 && lightenWeight > 0.05) {
      lightenWeight -= 0.02;
      vibrant = mixColors(vibrant, '#ffffff', lightenWeight);
    }
  }

  // 3. Derive --color-text-muted, guaranteed >= 4.5:1 on both bg and light
  // Start from a softer mixture of dark with light, and increase dark weight until >= 4.5:1
  let textMutedWeight = 0.60;
  let textMuted = mixColors(dark, bg, textMutedWeight);

  while (
    (getContrastRatio(textMuted, bg) < 4.5 || getContrastRatio(textMuted, light) < 4.5) &&
    textMutedWeight < 1.0
  ) {
    textMutedWeight = Math.min(1.0, textMutedWeight + 0.02);
    textMuted = mixColors(dark, bg, textMutedWeight);
  }

  if (getContrastRatio(textMuted, bg) < 4.5 || getContrastRatio(textMuted, light) < 4.5) {
    textMuted = dark;
  }

  return {
    bg,
    light,
    muted,
    dark,
    vibrant,
    onVibrant,
    textMuted,
  };
}
