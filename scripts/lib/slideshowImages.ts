import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const ACCEPTED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
]);

export const MAX_ANIMATED_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
export const MAX_TOTAL_SLIDESHOW_BYTES = 25 * 1024 * 1024; // 25 MB

export const HERO_WIDTH = 1600;
export const HERO_HEIGHT = 364;

export const ANIMATED_HERO_WIDTH = 900;
export const ANIMATED_HERO_HEIGHT = 205;
export const ANIMATED_HERO_RETRY_WIDTH = 640;
export const ANIMATED_HERO_RETRY_HEIGHT = 146;

export const PIPELINE_VERSION = 2;

export const POSITION_OVERRIDES: Record<string, number> = {
  '@top': sharp.gravity.north,
  '@bottom': sharp.gravity.south,
  '@left': sharp.gravity.west,
  '@right': sharp.gravity.east,
  '@center': sharp.gravity.center,
  '@topleft': sharp.gravity.northwest,
  '@topright': sharp.gravity.northeast,
  '@bottomleft': sharp.gravity.southwest,
  '@bottomright': sharp.gravity.southeast,
  top: sharp.gravity.north,
  bottom: sharp.gravity.south,
  left: sharp.gravity.west,
  right: sharp.gravity.east,
  center: sharp.gravity.center,
  topleft: sharp.gravity.northwest,
  topright: sharp.gravity.northeast,
  bottomleft: sharp.gravity.southwest,
  bottomright: sharp.gravity.southeast,
};

export interface PositionOverrideResult {
  override: string;
  cleanBaseName: string;
  position: number;
}

/**
 * Checks if a filename (or base name) ends with a position override suffix (@top, @bottom, etc.)
 * before the file extension.
 * Returns the override suffix (e.g. '@top'), clean base name, and resolved sharp position/gravity,
 * or null if no override was found.
 */
export function parsePositionOverride(filename: string): PositionOverrideResult | null {
  const baseName = path.parse(filename).name;
  const match = baseName.match(/@(topleft|topright|bottomleft|bottomright|top|bottom|left|right|center)$/i);
  if (!match) return null;

  const override = match[0].toLowerCase();
  const cleanBaseName = baseName.slice(0, match.index);
  const position = POSITION_OVERRIDES[override];

  return {
    override,
    cleanBaseName,
    position,
  };
}

export interface SlideItem {
  src: string;
  width: number;
  height: number;
  animated: boolean;
}

export interface ConvertImageSuccess {
  success: true;
  buffer: Buffer;
  width: number;
  height: number;
  animated: boolean;
}

export interface ConvertImageFailure {
  success: false;
  skipped: true;
  reason: string;
}

export type ConvertImageResult = ConvertImageSuccess | ConvertImageFailure;

/**
 * Slugifies an image name for clean URL and file naming.
 * Strips diacritics, replaces non-alphanumeric with hyphens, collapses hyphens.
 */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'image';
}

/**
 * Returns the first 8 hex characters of the SHA-256 hash of a buffer.
 * Includes PIPELINE_VERSION (and optional extra metadata such as override suffix) in the hash input
 * to ensure cache safety across pipeline versions.
 */
export function getContentHash8(buffer: Buffer, extra?: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`v${PIPELINE_VERSION}:`);
  if (extra) {
    hash.update(`${extra}:`);
  }
  hash.update(buffer);
  return hash.digest('hex').slice(0, 8);
}

/**
 * Formats byte size into human-readable B / KB / MB.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Converts an image buffer to WebP according to slideshow specifications:
 * - Still images: auto-rotate from EXIF, strip all metadata, convert to WebP,
 *   resize with fit "cover" to exactly HERO_WIDTH x HERO_HEIGHT (1600 x 364),
 *   choosing crop region with sharp's attention strategy (or manual override), quality 80.
 * - Animated GIFs (more than 1 frame): animated WebP, same target ratio at 900 x 205
 *   (then 640 x 146 for oversize retry), cropped from the centre (or manual override).
 *   If result > 2.5 MB after retry, skips.
 */
export async function convertSlideshowImage(
  inputBuffer: Buffer,
  positionOverride?: number | string
): Promise<ConvertImageResult> {
  // Read metadata with animated: true so multi-frame images report page count
  const inputMeta = await sharp(inputBuffer, { animated: true }).metadata();
  const isAnimated = Boolean(inputMeta.pages && inputMeta.pages > 1);

  let outputBuffer: Buffer;

  // Resolve position
  let stillPosition: number | string = sharp.strategy.attention;
  let animatedPosition: number | string = sharp.gravity.center;

  if (positionOverride !== undefined && positionOverride !== null) {
    let resolvedPos: number | string = positionOverride;
    if (typeof positionOverride === 'string') {
      const lower = positionOverride.toLowerCase();
      if (lower in POSITION_OVERRIDES) {
        resolvedPos = POSITION_OVERRIDES[lower];
      }
    }
    stillPosition = resolvedPos;
    animatedPosition = resolvedPos;
  }

  if (isAnimated) {
    // Attempt 1: animated WebP, 900 x 205, cropped from centre (or manual override)
    outputBuffer = await sharp(inputBuffer, { animated: true })
      .resize({
        width: ANIMATED_HERO_WIDTH,
        height: ANIMATED_HERO_HEIGHT,
        fit: 'cover',
        position: animatedPosition,
      })
      .webp()
      .toBuffer();

    // Attempt 2: if over 2.5 MB, retry at 640 x 146
    if (outputBuffer.length > MAX_ANIMATED_SIZE_BYTES) {
      outputBuffer = await sharp(inputBuffer, { animated: true })
        .resize({
          width: ANIMATED_HERO_RETRY_WIDTH,
          height: ANIMATED_HERO_RETRY_HEIGHT,
          fit: 'cover',
          position: animatedPosition,
        })
        .webp()
        .toBuffer();
    }

    // If still over 2.5 MB, skip it
    if (outputBuffer.length > MAX_ANIMATED_SIZE_BYTES) {
      return {
        success: false,
        skipped: true,
        reason: `Animated file exceeded 2.5 MB after conversion (even at 640px: ${formatBytes(outputBuffer.length)})`,
      };
    }
  } else {
    // Still images: auto-rotate from EXIF, strip all metadata, convert to WebP,
    // exactly HERO_WIDTH x HERO_HEIGHT, quality 80, cover fit with attention strategy (or manual override)
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: HERO_WIDTH,
        height: HERO_HEIGHT,
        fit: 'cover',
        position: stillPosition,
      })
      .webp({ quality: 80 })
      .toBuffer();
  }

  const outMeta = await sharp(outputBuffer, { animated: isAnimated }).metadata();
  const width = outMeta.width || (isAnimated ? ANIMATED_HERO_WIDTH : HERO_WIDTH);
  const height =
    outMeta.pageHeight || outMeta.height || (isAnimated ? ANIMATED_HERO_HEIGHT : HERO_HEIGHT);

  return {
    success: true,
    buffer: outputBuffer,
    width,
    height,
    animated: isAnimated,
  };
}

/**
 * Regenerates src/config/slideshow.ts from ALL .webp files currently in public/slideshow/.
 * Reads width, height, and animated flag from each file.
 */
export async function regenerateSlideshowConfig(
  slideshowDir: string,
  configPath: string
): Promise<SlideItem[]> {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  const existingFiles = fs.existsSync(slideshowDir)
    ? fs.readdirSync(slideshowDir).filter((f) => f.endsWith('.webp')).sort()
    : [];

  const slides: SlideItem[] = [];

  for (const file of existingFiles) {
    const fullPath = path.join(slideshowDir, file);
    try {
      const meta = await sharp(fullPath, { animated: true }).metadata();
      const isAnimated = Boolean(meta.pages && meta.pages > 1);
      slides.push({
        src: `/slideshow/${file}`,
        width: meta.width || 1200,
        height: meta.pageHeight || meta.height || 800,
        animated: isAnimated,
      });
    } catch (err) {
      console.warn(`Warning: Could not read metadata for ${file}:`, err);
    }
  }

  const configContent = `// Generated automatically by slideshow scripts - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}

export interface SlideItem {
  src: string;
  width: number;
  height: number;
  animated: boolean;
}

export const slideshowSlides: SlideItem[] = ${JSON.stringify(slides, null, 2)};
`;

  fs.writeFileSync(configPath, configContent, 'utf-8');
  return slides;
}

/**
 * Calculates total size in bytes of all files in public/slideshow/.
 */
export function getSlideshowTotalSizeBytes(slideshowDir: string): number {
  if (!fs.existsSync(slideshowDir)) return 0;
  let total = 0;
  for (const file of fs.readdirSync(slideshowDir)) {
    const filePath = path.join(slideshowDir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        total += stat.size;
      }
    } catch {
      // Ignore transient access errors
    }
  }
  return total;
}
