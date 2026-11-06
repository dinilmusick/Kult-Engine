import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:3000';
const outputDir = path.resolve('artifacts/browser-inspection');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push({ kind: 'pageerror', message: error.message }));
    page.on('console', (message) => {
      const text = message.text();
      const expectedAuthNoise = text.includes('Canonical Google session restoration failed') || text.includes('srkl-engine-mc96yqo08-dextro1n1laevo-1517.vercel.app');
      const expectedApi404 = text.includes('Failed to load resource: the server responded with a 404');
      if (message.type() === 'error' && !expectedAuthNoise && !expectedApi404) errors.push({ kind: 'console', message: text });
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().includes('/api/')) {
        errors.push({ kind: 'http', message: response.status() + ' ' + response.url() });
      }
    });
    const response = await page.goto(baseUrl + '/', { waitUntil: 'networkidle', timeout: 30000 });
    const screenshot = path.join(outputDir, `home-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({
      viewport,
      status: response?.status() ?? 0,
      title: await page.title(),
      url: page.url(),
      errors,
      screenshot,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

await writeFile(path.join(outputDir, 'report.json'), JSON.stringify(results, null, 2));
const failed = results.filter((result) => result.status >= 400 || result.errors.length > 0);
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(results, null, 2));
