import fs from "fs";
import path from "path";
import sharp from "sharp";

const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function optimizeDirectory({ inputDir, gridDir, fullDir, label, skipDirs = new Set(["grid", "full"]) }) {
  if (!fs.existsSync(gridDir)) fs.mkdirSync(gridDir, { recursive: true });
  if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });

  let dirInputBytes = 0;
  let dirOutputBytes = 0;
  let processedCount = 0;
  let skippedCount = 0;

  console.log(`\n=== Optimizing ${label} (${inputDir}) ===`);

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) continue;

    const baseName = path.parse(entry.name).name;
    const inputPath = path.join(inputDir, entry.name);
    const gridPath = path.join(gridDir, `${baseName}.webp`);
    const fullPath = path.join(fullDir, `${baseName}.webp`);

    const inputStat = fs.statSync(inputPath);
    dirInputBytes += inputStat.size;

    const gridExists = fs.existsSync(gridPath);
    const fullExists = fs.existsSync(fullPath);
    if (gridExists && fullExists) {
      const gridStat = fs.statSync(gridPath);
      const fullStat = fs.statSync(fullPath);
      if (gridStat.mtimeMs > inputStat.mtimeMs && fullStat.mtimeMs > inputStat.mtimeMs) {
        console.log(`[SKIP] ${entry.name} (already up to date)`);
        dirOutputBytes += gridStat.size + fullStat.size;
        skippedCount++;
        continue;
      }
    }

    try {
      const isCover = baseName.toLowerCase() === "img";
      const gridWidth = isCover ? 1000 : 800;

      // 1. Grid WebP (800px / 1000px, q75)
      await sharp(inputPath)
        .rotate()
        .resize({ width: gridWidth, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(gridPath);

      // 2. Full WebP (1600px, q78)
      await sharp(inputPath)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(fullPath);

      const outGridStat = fs.statSync(gridPath);
      const outFullStat = fs.statSync(fullPath);
      const fileOutBytes = outGridStat.size + outFullStat.size;
      dirOutputBytes += fileOutBytes;
      processedCount++;

      console.log(
        `[OK] ${entry.name} (${formatBytes(inputStat.size)}) -> grid: ${formatBytes(outGridStat.size)} (${gridWidth}px), full: ${formatBytes(outFullStat.size)} (1600px) [combined: ${formatBytes(fileOutBytes)}]`
      );
    } catch (err) {
      console.error(`[ERROR] Failed to optimize ${entry.name}:`, err.message);
    }
  }

  return { dirInputBytes, dirOutputBytes, processedCount, skippedCount };
}

async function run() {
  let totalInputBytes = 0;
  let totalOutputBytes = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;

  // 1. Optimize public/arh photos
  const arhRes = await optimizeDirectory({
    inputDir: path.resolve("public/arh"),
    gridDir: path.resolve("public/arh/grid"),
    fullDir: path.resolve("public/arh/full"),
    label: "Scrapbook Photos (public/arh)",
    skipDirs: new Set(["grid", "full", "worthy"]),
  });
  totalInputBytes += arhRes.dirInputBytes;
  totalOutputBytes += arhRes.dirOutputBytes;
  totalProcessed += arhRes.processedCount;
  totalSkipped += arhRes.skippedCount;

  // 2. Optimize public/arh/worthy photos
  const worthyRes = await optimizeDirectory({
    inputDir: path.resolve("public/arh/worthy"),
    gridDir: path.resolve("public/arh/grid/worthy"),
    fullDir: path.resolve("public/arh/full/worthy"),
    label: "Scrapbook Photos (public/arh/worthy)",
    skipDirs: new Set(["grid", "full"]),
  });
  totalInputBytes += worthyRes.dirInputBytes;
  totalOutputBytes += worthyRes.dirOutputBytes;
  totalProcessed += worthyRes.processedCount;
  totalSkipped += worthyRes.skippedCount;

  // 3. Optimize cover photo (/images/img.jpeg)
  const coverJpeg = path.resolve("public/images/img.jpeg");
  if (fs.existsSync(coverJpeg)) {
    console.log("\n=== Optimizing Cover Image (public/images/img.jpeg) ===");
    const coverStat = fs.statSync(coverJpeg);
    totalInputBytes += coverStat.size;

    const gridDir = path.resolve("public/images/grid");
    const fullDir = path.resolve("public/images/full");
    if (!fs.existsSync(gridDir)) fs.mkdirSync(gridDir, { recursive: true });
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });

    const gridCover = path.join(gridDir, "img.webp");
    const fullCover = path.join(fullDir, "img.webp");

    let shouldProcess = true;
    if (fs.existsSync(gridCover) && fs.existsSync(fullCover)) {
      const gStat = fs.statSync(gridCover);
      const fStat = fs.statSync(fullCover);
      if (gStat.mtimeMs > coverStat.mtimeMs && fStat.mtimeMs > coverStat.mtimeMs) {
        console.log("[SKIP] img.jpeg (cover WebP already up to date)");
        totalOutputBytes += gStat.size + fStat.size;
        totalSkipped++;
        shouldProcess = false;
      }
    }

    if (shouldProcess) {
      try {
        await sharp(coverJpeg)
          .rotate()
          .resize({ width: 1000, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(gridCover);

        await sharp(coverJpeg)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(fullCover);

        const gStat = fs.statSync(gridCover);
        const fStat = fs.statSync(fullCover);
        const outSize = gStat.size + fStat.size;
        totalOutputBytes += outSize;
        totalProcessed++;
        console.log(`[OK] img.jpeg -> grid: ${formatBytes(gStat.size)} (1000px), full: ${formatBytes(fStat.size)} (1600px)`);
      } catch (err) {
        console.error("[ERROR] Failed to optimize cover image:", err.message);
      }
    }
  }

  // 4. Compress background.jpeg
  const bgJpeg = path.resolve("public/background.jpeg");
  const bgWebp = path.resolve("public/background.webp");
  if (fs.existsSync(bgJpeg)) {
    console.log("\n=== Optimizing background.jpeg ===");
    const bgStat = fs.statSync(bgJpeg);
    totalInputBytes += bgStat.size;

    let shouldProcess = true;
    if (fs.existsSync(bgWebp)) {
      const outStat = fs.statSync(bgWebp);
      if (outStat.mtimeMs > bgStat.mtimeMs) {
        console.log("[SKIP] background.jpeg (background.webp already up to date)");
        totalOutputBytes += outStat.size;
        totalSkipped++;
        shouldProcess = false;
      }
    }

    if (shouldProcess) {
      try {
        await sharp(bgJpeg)
          .rotate()
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toFile(bgWebp);

        const outStat = fs.statSync(bgWebp);
        totalOutputBytes += outStat.size;
        totalProcessed++;
        console.log(`[OK] background.jpeg (${formatBytes(bgStat.size)}) -> background.webp (${formatBytes(outStat.size)}) (1920px, q70)`);
      } catch (err) {
        console.error("[ERROR] Failed to optimize background.jpeg:", err.message);
      }
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Total images processed: ${totalProcessed}`);
  console.log(`Total images skipped:   ${totalSkipped}`);
  console.log(`Total input size:       ${formatBytes(totalInputBytes)}`);
  console.log(`Total output size:      ${formatBytes(totalOutputBytes)}`);
  const savings = totalInputBytes - totalOutputBytes;
  const ratio = totalInputBytes > 0 ? ((savings / totalInputBytes) * 100).toFixed(1) : 0;
  console.log(`Savings:                ${formatBytes(savings)} (${ratio}%)`);
  console.log("=========================================\n");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
