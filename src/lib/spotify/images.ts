export interface SpotifyImage {
  url: string;
  width?: number | null;
  height?: number | null;
}

/**
 * Returns the smallest image at least 2x displayPx wide (for Retina/HiDPI displays),
 * falling back to the largest available image if none are wide enough.
 * Returns null if the images array is empty or undefined.
 */
export function pickImage(
  images: Array<SpotifyImage | string> | null | undefined,
  displayPx: number
): string | null {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  // Normalize image entries
  const normalized: SpotifyImage[] = images
    .map((img) => (typeof img === 'string' ? { url: img } : img))
    .filter((img): img is SpotifyImage => Boolean(img && typeof img.url === 'string' && img.url.trim().length > 0));

  if (normalized.length === 0) {
    return null;
  }

  const targetWidth = displayPx * 2;

  // Filter images that have valid numeric dimensions
  const withWidth = normalized.filter(
    (img) => typeof img.width === 'number' && img.width > 0
  );

  if (withWidth.length === 0) {
    // If no width metadata is available, fall back to the first image
    return normalized[0].url;
  }

  // Images at least 2x displayPx wide
  const valid = withWidth.filter((img) => (img.width as number) >= targetWidth);

  if (valid.length > 0) {
    // Smallest among those at least 2x displayPx wide
    valid.sort((a, b) => (a.width as number) - (b.width as number));
    return valid[0].url;
  }

  // Fallback to the largest available image
  withWidth.sort((a, b) => (b.width as number) - (a.width as number));
  return withWidth[0].url;
}
