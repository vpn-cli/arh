import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PORT = 3847;
const PUBLIC_DIR = path.resolve('public');
const ARTIFACTS_DIR = 'C:\\Users\\vipin\\.gemini\\antigravity-ide\\brain\\16bbb94c-36f3-4a03-ba47-5fafe7902397';

const STATES = ['default', 'blink', 'squeeze', 'happy', 'sleepy', 'dizzy', 'locked'];

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/' || urlPath === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateHtml());
    return;
  }

  const filePath = path.join(PUBLIC_DIR, urlPath.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

function generateHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello Kitty Native Cursor Visual Proof</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #0f111a;
      color: #f0f2f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 32px;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #ff8fb3;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .subtitle {
      color: #a0a5b5;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 20px;
    }
    .card {
      background: #181a26;
      border: 1px solid #282b3d;
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #ffeaa7;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #282b3d;
      padding-bottom: 8px;
    }
    .badge {
      background: #25283b;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      color: #b9d7c0;
    }
    .comparison-row {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .preview-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .canvas-frame {
      position: relative;
      background: #202336;
      background-image: 
        linear-gradient(45deg, #191b2b 25%, transparent 25%), 
        linear-gradient(-45deg, #191b2b 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #191b2b 75%), 
        linear-gradient(-45deg, transparent 75%, #191b2b 75%);
      background-size: 12px 12px;
      background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
      border: 1px solid #373b54;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .label {
      font-size: 11px;
      color: #8c92a4;
      font-family: monospace;
    }
    .hotspot-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #ff2255;
      border-radius: 50%;
      box-shadow: 0 0 4px #ff0044, 0 0 0 1px #ffffff;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
    }
    .magnified-frame {
      position: relative;
      border: 1px solid #373b54;
      border-radius: 6px;
      background: #151722;
      padding: 8px;
    }
    .crosshair-h {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 34, 85, 0.6);
      pointer-events: none;
    }
    .crosshair-v {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: rgba(255, 34, 85, 0.6);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <h1>🐾 Hello Kitty Native CSS Cursors — Visual Verification</h1>
  <div class="subtitle">
    Inspection of 1x (32×23px) and 2x (64×46px) native assets. Red dot marks exact click hotspot at ear apex (5, 1).
  </div>

  <div class="grid">
    ${STATES.map(state => `
      <div class="card" id="card-${state}">
        <div class="card-title">
          <span>state: <strong>${state}</strong></span>
          <span class="badge">hotspot (5, 1)</span>
        </div>
        <div class="comparison-row">
          <!-- 1x actual size -->
          <div class="preview-box">
            <div class="canvas-frame" style="width: 48px; height: 38px;">
              <div style="position: relative; width: 32px; height: 23px;">
                <img id="img-1x-${state}" src="/hampter/cursor/kitty_${state}_32.png" width="32" height="23" style="display:block;" />
                <div class="hotspot-dot" style="left: 5px; top: 1px;"></div>
              </div>
            </div>
            <span class="label">1x (32×23)</span>
          </div>

          <!-- 2x rendered at 1x size (as CSS displays on retina) -->
          <div class="preview-box">
            <div class="canvas-frame" style="width: 48px; height: 38px;">
              <div style="position: relative; width: 32px; height: 23px;">
                <img id="img-2x-${state}" src="/hampter/cursor/kitty_${state}_64.png" width="32" height="23" style="display:block;" />
                <div class="hotspot-dot" style="left: 5px; top: 1px;"></div>
              </div>
            </div>
            <span class="label">2x @ 1x css</span>
          </div>

          <!-- 4x Magnification of 1x -->
          <div class="preview-box">
            <div class="canvas-frame" style="width: 140px; height: 104px;">
              <div style="position: relative; width: 128px; height: 92px;">
                <img src="/hampter/cursor/kitty_${state}_32.png" width="128" height="92" style="display:block; image-rendering: pixelated;" />
                <!-- 5 * 4 = 20px, 1 * 4 = 4px -->
                <div class="hotspot-dot" style="left: 20px; top: 4px; width: 6px; height: 6px;"></div>
              </div>
            </div>
            <span class="label">4× Zoom (Hotspot)</span>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
}

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Verification test server running at http://localhost:${PORT}`);

  try {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2
    });

    const networkResponses = [];
    page.on('response', (res) => {
      networkResponses.push({
        url: res.url(),
        status: res.status(),
        ok: res.ok()
      });
    });

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    console.log(`\n--- Validating Network Responses (HTTP 200) ---`);
    let allHttp200 = true;
    for (const state of STATES) {
      const url32 = `http://localhost:${PORT}/hampter/cursor/kitty_${state}_32.png`;
      const url64 = `http://localhost:${PORT}/hampter/cursor/kitty_${state}_64.png`;

      const res32 = networkResponses.find(r => r.url === url32);
      const res64 = networkResponses.find(r => r.url === url64);

      const pass32 = res32 && res32.status === 200;
      const pass64 = res64 && res64.status === 200;

      if (!pass32 || !pass64) allHttp200 = false;
      console.log(`  kitty_${state}_32.png: ${pass32 ? 'HTTP 200 ✓' : 'FAILED ✗'} | kitty_${state}_64.png: ${pass64 ? 'HTTP 200 ✓' : 'FAILED ✗'}`);
    }

    console.log(`\n--- Validating Natural Image Dimensions in DOM ---`);
    const dimensions = await page.evaluate((states) => {
      const results = {};
      for (const s of states) {
        const img1x = document.getElementById(`img-1x-${s}`);
        const img2x = document.getElementById(`img-2x-${s}`);
        results[s] = {
          '1x': { width: img1x.naturalWidth, height: img1x.naturalHeight },
          '2x': { width: img2x.naturalWidth, height: img2x.naturalHeight }
        };
      }
      return results;
    }, STATES);

    let allDimensionsCorrect = true;
    for (const [state, dims] of Object.entries(dimensions)) {
      const ok1x = dims['1x'].width === 32 && dims['1x'].height === 23;
      const ok2x = dims['2x'].width === 64 && dims['2x'].height === 46;
      if (!ok1x || !ok2x) allDimensionsCorrect = false;
      console.log(`  ${state}: 1x=${dims['1x'].width}x${dims['1x'].height} (${ok1x ? 'PASS' : 'FAIL'}), 2x=${dims['2x'].width}x${dims['2x'].height} (${ok2x ? 'PASS' : 'FAIL'})`);
    }

    const screenshotPath = path.join(ARTIFACTS_DIR, 'cursor_visual_proof.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n✓ Visual proof screenshot captured successfully at:\n  ${screenshotPath}`);

    await browser.close();

    if (!allHttp200 || !allDimensionsCorrect) {
      console.error('Validation failed!');
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
