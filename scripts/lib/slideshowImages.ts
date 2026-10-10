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
 */
export function getContentHash8(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8);
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
 * - Still images: auto-rotate from EXIF, strip all metadata, convert to WebP, max 1600px wide, quality about 80.
 * - Animated GIFs (more than 1 frame): animated WebP, max 900px wide.
 *   If result > 2.5 MB, retries at 640px wide. If still over, skips.
 */
export async function convertSlideshowImage(
  inputBuffer: Buffer
): Promise<ConvertImageResult> {
  // Read metadata with animated: true so multi-frame images report page count
  const inputMeta = await sharp(inputBuffer, { animated: true }).metadata();
  const isAnimated = Boolean(inputMeta.pages && inputMeta.pages > 1);

  let outputBuffer: Buffer;

  if (isAnimated) {
    // Attempt 1: animated WebP, max 900px wide
    outputBuffer = await sharp(inputBuffer, { animated: true })
      .resize({ width: 900, withoutEnlargement: true })
      .webp()
      .toBuffer();

    // Attempt 2: if over 2.5 MB, retry at 640px wide
    if (outputBuffer.length > MAX_ANIMATED_SIZE_BYTES) {
      outputBuffer = await sharp(inputBuffer, { animated: true })
        .resize({ width: 640, withoutEnlargement: true })
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
    // Still images: auto-rotate from EXIF, strip all metadata, convert to WebP, max 1600px wide, quality 80
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  }

  const outMeta = await sharp(outputBuffer, { animated: isAnimated }).metadata();
  const width = outMeta.width || (inputMeta.width ? Math.min(inputMeta.width, isAnimated ? 900 : 1600) : 1200);
  const height = outMeta.pageHeight || outMeta.height || inputMeta.height || 800;

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
