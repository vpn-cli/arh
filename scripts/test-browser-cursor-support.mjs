import { chromium, firefox } from 'playwright';

const TESTS = [
  'image-set(url("/hampter/cursor/kitty_default_32.png") 1x, url("/hampter/cursor/kitty_default_64.png") 2x) 5 1, auto',
  'image-set(url("/hampter/cursor/kitty_default_32.png") 1x, url("/hampter/cursor/kitty_default_64.png") 2x), auto',
  '-webkit-image-set(url("/hampter/cursor/kitty_default_32.png") 1x, url("/hampter/cursor/kitty_default_64.png") 2x) 5 1, auto',
  'url("/hampter/cursor/kitty_default_32.png") 5 1, auto',
  'url("/hampter/cursor/kitty_default_32.png"), auto'
];

async function testEngine(name, launcher) {
  console.log(`\n================ Testing ${name} ================`);
  try {
    const browser = await launcher();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.setContent(`<!DOCTYPE html>
      <html>
        <head>
          <style>
            #el-imgset { cursor: image-set(url("/hampter/cursor/kitty_default_32.png") 1x, url("/hampter/cursor/kitty_default_64.png") 2x) 5 1, auto; }
            #el-webkit { cursor: -webkit-image-set(url("/hampter/cursor/kitty_default_32.png") 1x, url("/hampter/cursor/kitty_default_64.png") 2x) 5 1, auto; }
            #el-url { cursor: url("/hampter/cursor/kitty_default_32.png") 5 1, auto; }
          </style>
        </head>
        <body>
          <div id="el-imgset"></div>
          <div id="el-webkit"></div>
          <div id="el-url"></div>
        </body>
      </html>
    `);

    const results = await page.evaluate((tests) => {
      const supports = {};
      for (const t of tests) {
        supports[t] = CSS.supports('cursor', t);
      }
      return {
        supports,
        computed: {
          imgset: getComputedStyle(document.getElementById('el-imgset')).cursor,
          webkit: getComputedStyle(document.getElementById('el-webkit')).cursor,
          url: getComputedStyle(document.getElementById('el-url')).cursor,
        }
      };
    }, TESTS);

    console.log(`[${name}] CSS.supports results:`);
    for (const [query, ok] of Object.entries(results.supports)) {
      console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'}: cursor: ${query}`);
    }
    console.log(`[${name}] Computed cursor styles:`);
    console.log(`  imgset: ${results.computed.imgset}`);
    console.log(`  webkit: ${results.computed.webkit}`);
    console.log(`  url:    ${results.computed.url}`);

    await browser.close();
  } catch (err) {
    console.error(`[${name}] Error:`, err.message);
  }
}

async function run() {
  // 1. Chrome
  await testEngine('Google Chrome', () => chromium.launch({ channel: 'chrome', headless: true }));
  // 2. Microsoft Edge
  await testEngine('Microsoft Edge', () => chromium.launch({ channel: 'msedge', headless: true }));
  // 3. Mozilla Firefox
  await testEngine('Mozilla Firefox', () => firefox.launch({ headless: true }));
}

run();
