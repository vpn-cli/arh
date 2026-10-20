import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SOURCE_IMAGE = path.join(projectRoot, 'public/images/hello-kitty.png');
const BG_PINK = { r: 250, g: 237, b: 242, alpha: 1 }; // #FAEDF2
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function createIcoBuffer(images) {
  // images: array of { width, height, buffer }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map((img) => img.buffer)]);
}

async function renderIcon({ canvasW, canvasH, targetW, background, outputPath }) {
  const meta = await sharp(SOURCE_IMAGE).metadata();
  const aspect = meta.height / meta.width; // 253 / 350 = 0.722857
  const targetH = Math.round(targetW * aspect);

  const resized = await sharp(SOURCE_IMAGE)
    .resize(targetW, targetH, {
      kernel: 'lanczos3',
      fit: 'fill',
    })
    .toBuffer();

  const left = Math.floor((canvasW - targetW) / 2);
  const top = Math.floor((canvasH - targetH) / 2);

  const result = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, result);
    console.log(`Saved: ${path.relative(projectRoot, outputPath)} (${canvasW}x${canvasH}, artwork ${targetW}x${targetH})`);
  }

  return { buffer: result, width: canvasW, height: canvasH, targetW, targetH, left, top };
}

async function main() {
  console.log(`Using source image: ${SOURCE_IMAGE}`);

  // 1. public/icons/app/icon-192.png (192x192, transparent, ~6% padding on width: 88% width = 169px)
  await renderIcon({
    canvasW: 192,
    canvasH: 192,
    targetW: 169, // 169 / 192 = 88.02%
    background: TRANSPARENT,
    outputPath: path.join(projectRoot, 'public/icons/app/icon-192.png'),
  });

  // 2. public/icons/app/icon-512.png (512x512, transparent, ~6% padding on width: 88% width = 450px)
  await renderIcon({
    canvasW: 512,
    canvasH: 512,
    targetW: 450, // 450 / 512 = 87.89%
    background: TRANSPARENT,
    outputPath: path.join(projectRoot, 'public/icons/app/icon-512.png'),
  });

  // 3. public/icons/app/icon-maskable-512.png (512x512, solid #FAEDF2, safe zone 409px circle -> targetW = 394px)
  await renderIcon({
    canvasW: 512,
    canvasH: 512,
    targetW: 394, // 394x285 fits within 409.6px diameter safe zone circle
    background: BG_PINK,
    outputPath: path.join(projectRoot, 'public/icons/app/icon-maskable-512.png'),
  });

  // 4. src/app/apple-icon.png (180x180, solid #FAEDF2, ~6% padding on width: 88% width = 158px)
  await renderIcon({
    canvasW: 180,
    canvasH: 180,
    targetW: 158, // 158 / 180 = 87.78%
    background: BG_PINK,
    outputPath: path.join(projectRoot, 'src/app/apple-icon.png'),
  });

  // 5. src/app/icon.png (48x48, transparent, ~6% padding on width: 88% width = 42px)
  await renderIcon({
    canvasW: 48,
    canvasH: 48,
    targetW: 42, // 42 / 48 = 87.5%
    background: TRANSPARENT,
    outputPath: path.join(projectRoot, 'src/app/icon.png'),
  });

  // 6. src/app/favicon.ico (multi-size: 16x16, 32x32, 48x48)
  const ico16 = await renderIcon({
    canvasW: 16,
    canvasH: 16,
    targetW: 14,
    background: TRANSPARENT,
  });
  const ico32 = await renderIcon({
    canvasW: 32,
    canvasH: 32,
    targetW: 28,
    background: TRANSPARENT,
  });
  const ico48 = await renderIcon({
    canvasW: 48,
    canvasH: 48,
    targetW: 42,
    background: TRANSPARENT,
  });

  const icoBuffer = createIcoBuffer([
    { width: 16, height: 16, buffer: ico16.buffer },
    { width: 32, height: 32, buffer: ico32.buffer },
    { width: 48, height: 48, buffer: ico48.buffer },
  ]);

  const faviconPath = path.join(projectRoot, 'src/app/favicon.ico');
  fs.writeFileSync(faviconPath, icoBuffer);
  console.log(`Saved: ${path.relative(projectRoot, faviconPath)} (multi-size ICO: 16, 32, 48)`);
}

main().catch(console.error);
