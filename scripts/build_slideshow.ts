import fs from 'node:fs';
import path from 'node:path';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_TOTAL_SLIDESHOW_BYTES,
  convertSlideshowImage,
  formatBytes,
  getContentHash8,
  getSlideshowTotalSizeBytes,
  parsePositionOverride,
  regenerateSlideshowConfig,
  slugify,
} from './lib/slideshowImages';

interface ProcessedItem {
  file: string;
  outputFile: string;
  originalSize: number;
  outputSize: number;
  cached: boolean;
  override?: string;
}

interface SkippedItem {
  file: string;
  originalSize: number;
  reason: string;
}

interface IgnoredItem {
  file: string;
  reason: string;
}

async function main() {
  const rootDir = process.cwd();
  const srcDir = path.resolve(rootDir, 'assets-src/slideshow');
  const outputDir = path.resolve(rootDir, 'public/slideshow');
  const configPath = path.resolve(rootDir, 'src/config/slideshow.ts');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const entries = fs.readdirSync(srcDir);

  const keptItems: ProcessedItem[] = [];
  const skippedItems: SkippedItem[] = [];
  const ignoredItems: IgnoredItem[] = [];
  const expectedManualOutputs = new Set<string>();

  // Filter accepted source files and classify ignored items
  const acceptedEntries: string[] = [];
  for (const entry of entries) {
    const filePath = path.join(srcDir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      ignoredItems.push({ file: entry, reason: 'Directory (ignored)' });
      continue;
    }

    const ext = path.extname(entry).toLowerCase();
    if (!ACCEPTED_IMAGE_EXTENSIONS.has(ext)) {
      const reason =
        entry === '.gitkeep'
          ? 'Git directory placeholder'
          : `Unsupported file extension (${ext || 'no extension'})`;
      ignoredItems.push({ file: entry, reason });
      continue;
    }

    acceptedEntries.push(entry);
  }

  // Find all existing manual ('m-*.webp') slides currently on disk
  const existingOutputFiles = fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : [];
  const existingMFiles = existingOutputFiles.filter(
    (file) => file.startsWith('m-') && file.endsWith('.webp')
  );

  const isPrune = process.argv.includes('--prune');

  // Guard against accidental wipes:
  // If assets-src/slideshow/ contains no accepted source files but public/slideshow/
  // contains "m-" outputs, do NOT delete anything unless --prune is explicitly passed.
  if (acceptedEntries.length === 0 && existingMFiles.length > 0 && !isPrune) {
    const count = existingMFiles.length;
    const plural = count === 1 ? 'slide' : 'slides';
    console.error(
      `\nError: assets-src/slideshow/ contains no accepted source files, but public/slideshow/ contains ${count} manual ${plural} ("m-*" outputs).`
    );
    console.error(
      `Aborting deletion to protect against accidental wipes. Deleting would remove ${count} ${plural}.`
    );
    console.error(
      `If you want to remove all manual slides, re-run with --prune:\n  npm run slideshow -- --prune\n  # or: npx tsx scripts/build_slideshow.ts --prune\n`
    );
    process.exit(1);
  }

  // Process accepted source files
  for (const entry of acceptedEntries) {
    const filePath = path.join(srcDir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    let sourceBuffer: Buffer;
    try {
      sourceBuffer = fs.readFileSync(filePath);
    } catch (err) {
      skippedItems.push({
        file: entry,
        originalSize: stat.size,
        reason: `Could not read source file: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const originalSize = sourceBuffer.length;
    const overrideInfo = parsePositionOverride(entry);
    const hash8 = getContentHash8(sourceBuffer, overrideInfo?.override);
    const baseName = path.parse(entry).name;
    const cleanBaseName = overrideInfo ? overrideInfo.cleanBaseName : baseName;
    const slug = slugify(cleanBaseName);
    const outputFile = `m-${slug}-${hash8}.webp`;
    const outputPath = path.join(outputDir, outputFile);

    expectedManualOutputs.add(outputFile);

    // Idempotent: skip sources whose output already exists
    if (fs.existsSync(outputPath)) {
      try {
        const outStat = fs.statSync(outputPath);
        keptItems.push({
          file: entry,
          outputFile,
          originalSize,
          outputSize: outStat.size,
          cached: true,
          override: overrideInfo?.override,
        });
        continue;
      } catch {
        // Corrupted stat, re-convert below
      }
    }

    try {
      const result = await convertSlideshowImage(sourceBuffer, overrideInfo?.position);
      if (!result.success) {
        skippedItems.push({
          file: entry,
          originalSize,
          reason: result.reason,
        });
        continue;
      }

      fs.writeFileSync(outputPath, result.buffer);
      keptItems.push({
        file: entry,
        outputFile,
        originalSize,
        outputSize: result.buffer.length,
        cached: false,
        override: overrideInfo?.override,
      });
    } catch (err) {
      skippedItems.push({
        file: entry,
        originalSize,
        reason: `Conversion error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Delete orphaned manual outputs whose source file is gone (only 'm-' prefixed files)
  const deletedFiles: string[] = [];
  for (const file of existingMFiles) {
    if (!expectedManualOutputs.has(file)) {
      try {
        fs.unlinkSync(path.join(outputDir, file));
        deletedFiles.push(file);
      } catch (err) {
        console.warn(`Warning: Could not delete orphaned file ${file}:`, err);
      }
    }
  }

  // Regenerate src/config/slideshow.ts from ALL files currently in public/slideshow/
  const mergedSlides = await regenerateSlideshowConfig(outputDir, configPath);

  // Calculate total size of public/slideshow/
  const totalSizeBytes = getSlideshowTotalSizeBytes(outputDir);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // Print summary
  console.log('\n========================================');
  console.log('        Manual Slideshow Build          ');
  console.log('========================================');

  if (keptItems.length > 0) {
    console.log('\nFiles processed (original -> output):');
    for (const item of keptItems) {
      const status = item.cached ? '[up-to-date]' : '[converted]';
      const overrideNote = item.override ? ` [@ override: ${item.override}]` : '';
      console.log(
        `  - ${item.file} -> ${item.outputFile} (${formatBytes(item.originalSize)} -> ${formatBytes(item.outputSize)}) ${status}${overrideNote}`
      );
    }
  }

  const filesWithOverride = keptItems.filter((item) => item.override);
  console.log(`\nFiles with @ override: ${filesWithOverride.length}`);
  if (filesWithOverride.length > 0) {
    for (const item of filesWithOverride) {
      console.log(`  - ${item.file} (${item.override}) -> ${item.outputFile}`);
    }
  } else {
    console.log('  (none)');
  }

  console.log(`\nItems kept:    ${keptItems.length}`);
  console.log(`Items skipped: ${skippedItems.length}`);
  if (skippedItems.length > 0) {
    for (const s of skippedItems) {
      console.log(`  - [Skipped] ${s.file} (${formatBytes(s.originalSize)}): ${s.reason}`);
    }
  }

  console.log(`Items ignored: ${ignoredItems.length}`);
  if (ignoredItems.length > 0) {
    for (const i of ignoredItems) {
      console.log(`  - [Ignored] ${i.file}: ${i.reason}`);
    }
  }

  if (deletedFiles.length > 0) {
    console.log(`\nDeleted orphaned manual slides: ${deletedFiles.length}`);
    for (const d of deletedFiles) {
      console.log(`  - ${d}`);
    }
  }

  console.log(`\nMerged slides in slideshow config: ${mergedSlides.length}`);
  console.log(`Total public/slideshow/ size on disk: ${totalSizeMB} MB`);

  if (totalSizeBytes > MAX_TOTAL_SLIDESHOW_BYTES) {
    console.warn(`\nWARNING: Total slideshow size exceeds 25 MB limit (${totalSizeMB} MB)!`);
  }

  console.log(`Config updated at: ${path.relative(rootDir, configPath)}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Fatal slideshow build error:', err);
  process.exit(1);
});
