export interface SpotifyImage {
  url: string;
  width?: number | null;
  height?: number | null;
}

/**
 * Returns the smallest image at least 2x displayPx wide (for Retina/HiDPI displays),
 * falling back to the largest available image if none are wide enough.
 * If widths are unavailable (e.g. custom playlist covers), falls back to the first available image.
 *
 * Guarantees:
 * - Returns null if images is null, undefined, empty, or contains no valid URLs.
 * - Always returns a string URL (never undefined or null) when at least one image has a valid URL.
 */
export function pickImage(
  images: Array<SpotifyImage | string> | null | undefined,
  displayPx: number
): string | null {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  // Normalize and filter to valid image entries with non-empty URL strings
  const normalized: SpotifyImage[] = images
    .map((img) => (typeof img === 'string' ? { url: img } : img))
    .filter((img): img is SpotifyImage => Boolean(img && typeof img.url === 'string' && img.url.trim().length > 0));

  if (normalized.length === 0) {
    return null;
  }

  const targetWidth = displayPx * 2;

  // Find images with valid numeric width (or height as fallback dimension)
  const withWidth = normalized.filter(
    (img) => (typeof img.width === 'number' && img.width > 0) || (typeof img.height === 'number' && img.height > 0)
  );

  const getDim = (img: SpotifyImage): number => {
    if (typeof img.width === 'number' && img.width > 0) return img.width;
    if (typeof img.height === 'number' && img.height > 0) return img.height;
    return 0;
  };

  // 1. If no images have numeric dimensions (e.g. custom playlist cover with width: null),
  // return the first available image URL.
  if (withWidth.length === 0) {
    return normalized[0].url;
  }

  // 2. Images with numeric dimensions >= 2x displayPx
  const valid = withWidth.filter((img) => getDim(img) >= targetWidth);

  if (valid.length > 0) {
    // Pick the smallest image that satisfies 2x displayPx
    valid.sort((a, b) => getDim(a) - getDim(b));
    return valid[0].url;
  }

  // 3. None of the numeric images are >= 2x displayPx.
  // If the primary image (normalized[0]) has width: null (e.g. custom high-res upload alongside a tiny thumbnail),
  // prefer the primary image over an under-sized thumbnail.
  if (normalized[0].width == null && normalized[0].height == null) {
    return normalized[0].url;
  }

  // Otherwise, fall back to the largest available numeric image
  withWidth.sort((a, b) => getDim(b) - getDim(a));
  return withWidth[0].url;
}
