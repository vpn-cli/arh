import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import sharp from 'sharp';
import {
  convertSlideshowImage,
  getSlideshowTotalSizeBytes,
  MAX_TOTAL_SLIDESHOW_BYTES,
  regenerateSlideshowConfig,
  type SlideItem,
} from './lib/slideshowImages';

/**
 * Sync script for Pinterest board slideshow.
 * Run manually with:
 *   - npx tsx scripts/sync_pinterest_board.ts
 *   - npx tsx scripts/sync_pinterest_board.ts --list-boards
 * Never runs at build time or in the browser.
 */

const MAX_ITEMS = 30;

interface PinterestBoard {
  id: string;
  name: string;
  privacy?: string;
  pin_count?: number;
}

interface PinterestPinVariant {
  url: string;
  width: number;
  height: number;
}

interface PinterestPin {
  id: string;
  media?: {
    media_type?: string;
    images?: Record<string, PinterestPinVariant>;
  };
}

interface SkippedItem {
  id: string;
  reason: string;
}

function handleErrorResponse(status: number, bodyText: string, token?: string): void {
  let message = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    message = parsed.message || parsed.error || JSON.stringify(parsed);
  } catch {
    // Keep raw response text
  }
  if (token) {
    message = message.replaceAll(token, '[REDACTED_TOKEN]');
  }
  console.error(`Pinterest API error (HTTP ${status}): ${message}`);
  process.exitCode = 1;
}

async function main() {
  const rootDir = process.cwd();
  const envPath = path.resolve(rootDir, '.env.local');

  // 1. Confirm .env.local is gitignored
  const gitignorePath = path.resolve(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    const isIgnored = gitignore
      .split('\n')
      .map((l) => l.trim())
      .some((line) => line === '.env*' || line === '.env.local' || line === '.env*.local');
    if (!isIgnored) {
      console.warn('WARNING: .env.local does not appear to be ignored by .gitignore!');
    }
  }

  // Load environment variables from .env.local
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  const isListBoardsMode = process.argv.includes('--list-boards');

  // Helper mode: list boards
  if (isListBoardsMode) {
    if (!token) {
      console.error('Error: PINTEREST_ACCESS_TOKEN must be set in .env.local to list boards.');
      process.exit(1);
    }

    console.log('Fetching boards from Pinterest API v5...');
    let bookmark: string | null = null;
    const allBoards: PinterestBoard[] = [];

    do {
      const url = new URL('https://api.pinterest.com/v5/boards');
      url.searchParams.set('page_size', '100');
      if (bookmark) {
        url.searchParams.set('bookmark', bookmark);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errBody = await res.text();
        handleErrorResponse(res.status, errBody, token);
        return;
      }

      const data = (await res.json()) as { items?: PinterestBoard[]; bookmark?: string | null };
      const items = data.items || [];
      allBoards.push(...items);
      bookmark = data.bookmark || null;
    } while (bookmark);

    if (allBoards.length === 0) {
      console.log('No boards found for this Pinterest account.');
    } else {
      console.log(`\nFound ${allBoards.length} board${allBoards.length === 1 ? '' : 's'}:\n`);
      console.table(
        allBoards.map((b) => ({
          id: b.id,
          name: b.name,
          privacy: b.privacy ?? 'UNKNOWN',
          pin_count: b.pin_count ?? 0,
        }))
      );
    }

    process.exit(0);
  }

  // Normal run: validate credentials
  if (!token) {
    console.error('Error: PINTEREST_ACCESS_TOKEN must be set in .env.local.');
    console.error('Please configure PINTEREST_ACCESS_TOKEN in .env.local before running this sync script.');
    process.exit(1);
  }

  if (!boardId) {
    console.error('Error: PINTEREST_BOARD_ID is missing in .env.local.');
    console.error(
      'Run `npx tsx scripts/sync_pinterest_board.ts --list-boards` to see your available boards and their IDs, then set PINTEREST_BOARD_ID in .env.local.'
    );
    process.exit(1);
  }

  const slideshowDir = path.resolve(rootDir, 'public/slideshow');
  fs.mkdirSync(slideshowDir, { recursive: true });

  console.log('Fetching pins from Pinterest API v5...');

  // Fetch all pins on the board following pagination
  let bookmark: string | null = null;
  const allPins: PinterestPin[] = [];

  do {
    const url = new URL(`https://api.pinterest.com/v5/boards/${encodeURIComponent(boardId)}/pins`);
    url.searchParams.set('page_size', '100');
    if (bookmark) {
      url.searchParams.set('bookmark', bookmark);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      handleErrorResponse(res.status, errBody, token);
      return;
    }

    const data = (await res.json()) as { items?: PinterestPin[]; bookmark?: string | null };
    const items = data.items || [];
    allPins.push(...items);
    bookmark = data.bookmark || null;
  } while (bookmark);

  console.log(`Retrieved ${allPins.length} pins from board.`);

  const keptItems: SlideItem[] = [];
  const skippedItems: SkippedItem[] = [];
  const allBoardPinIds = new Set(allPins.map((p) => p.id));

  // Process pins up to MAX_ITEMS
  for (const pin of allPins) {
    // Skip video pins
    if (pin.media?.media_type === 'video') {
      skippedItems.push({ id: pin.id, reason: 'Video pin (skipped)' });
      continue;
    }

    const images = pin.media?.images;
    if (!images || Object.keys(images).length === 0) {
      skippedItems.push({ id: pin.id, reason: 'No image variants found' });
      continue;
    }

    // Keep at most MAX_ITEMS
    if (keptItems.length >= MAX_ITEMS) {
      skippedItems.push({ id: pin.id, reason: `Exceeded MAX_ITEMS limit (${MAX_ITEMS})` });
      continue;
    }

    // Choose largest image variant
    const variants = Object.values(images);
    const largest =
      images.originals ||
      variants.reduce((prev, curr) => {
        const prevArea = (prev.width || 0) * (prev.height || 0);
        const currArea = (curr.width || 0) * (curr.height || 0);
        return currArea > prevArea ? curr : prev;
      }, variants[0]);

    if (!largest?.url) {
      skippedItems.push({ id: pin.id, reason: 'No valid image URL found' });
      continue;
    }

    const targetFile = path.join(slideshowDir, `p-${pin.id}.webp`);

    // Idempotent: skip downloading if already present
    if (fs.existsSync(targetFile)) {
      try {
        const existingMeta = await sharp(targetFile, { animated: true }).metadata();
        const isAnimated = Boolean(existingMeta.pages && existingMeta.pages > 1);
        keptItems.push({
          src: `/slideshow/p-${pin.id}.webp`,
          width: existingMeta.width || largest.width || 1200,
          height: existingMeta.pageHeight || existingMeta.height || largest.height || 800,
          animated: isAnimated,
        });
        continue;
      } catch {
        // If existing file is corrupted, re-download
      }
    }

    // Download image
    try {
      const imgRes = await fetch(largest.url);
      if (!imgRes.ok) {
        skippedItems.push({ id: pin.id, reason: `Download failed with HTTP ${imgRes.status}` });
        continue;
      }

      const arrayBuffer = await imgRes.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      const result = await convertSlideshowImage(inputBuffer);
      if (!result.success) {
        skippedItems.push({ id: pin.id, reason: result.reason });
        continue;
      }

      fs.writeFileSync(targetFile, result.buffer);

      keptItems.push({
        src: `/slideshow/p-${pin.id}.webp`,
        width: result.width,
        height: result.height,
        animated: result.animated,
      });
    } catch (err) {
      skippedItems.push({
        id: pin.id,
        reason: `Image processing error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Delete files for pins no longer on the board (only 'p-' prefixed files)
  const deletedFiles: string[] = [];
  const existingFiles = fs.readdirSync(slideshowDir);
  for (const file of existingFiles) {
    if (file.startsWith('p-') && file.endsWith('.webp')) {
      const pinId = path.basename(file, '.webp').slice(2);
      if (!allBoardPinIds.has(pinId)) {
        fs.unlinkSync(path.join(slideshowDir, file));
        deletedFiles.push(file);
      }
    }
  }

  // Regenerate src/config/slideshow.ts from ALL files currently in public/slideshow/
  const configDir = path.resolve(rootDir, 'src/config');
  const configPath = path.join(configDir, 'slideshow.ts');
  const mergedSlides = await regenerateSlideshowConfig(slideshowDir, configPath);

  // Print summary
  const totalSizeBytes = getSlideshowTotalSizeBytes(slideshowDir);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  console.log('\n========================================');
  console.log('       Pinterest Slideshow Sync         ');
  console.log('========================================');
  console.log(`Total board pins fetched: ${allPins.length}`);
  console.log(`Pinterest items kept:     ${keptItems.length}`);
  console.log(`Pinterest items skipped:  ${skippedItems.length}`);
  console.log(`Merged slides in config:  ${mergedSlides.length}`);
  if (skippedItems.length > 0) {
    console.log('\nSkipped items breakdown:');
    for (const item of skippedItems) {
      console.log(`  - [Pin ${item.id}]: ${item.reason}`);
    }
  }
  if (deletedFiles.length > 0) {
    console.log(`\nDeleted files (no longer on board): ${deletedFiles.length}`);
    for (const f of deletedFiles) {
      console.log(`  - ${f}`);
    }
  }
  console.log(`\nTotal slideshow size on disk: ${totalSizeMB} MB`);
  if (totalSizeBytes > MAX_TOTAL_SLIDESHOW_BYTES) {
    console.warn(`\nWARNING: Total slideshow size exceeds 25 MB limit (${totalSizeMB} MB)!`);
  }
  console.log(`Config written to: ${path.relative(rootDir, configPath)}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
