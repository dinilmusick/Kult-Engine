import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PlaywrightInspectionRuntime } from '@ultrst-armada/kloks/browser-inspection';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:3000';
const outputDirectory = process.env.INSPECTION_OUTPUT || 'artifacts/browser-inspection';
const manifest = JSON.parse(await readFile('skipo.browser-inspection.json', 'utf8'));
const config = manifest.browserInspection;
if (!config?.enabled) throw new Error('Browser inspection is disabled in the app manifest.');
const routes = config.routes?.length ? config.routes : ['/'];
const viewports = config.viewports?.length ? config.viewports : [{ width: 1440, height: 900 }];
const runtime = new PlaywrightInspectionRuntime();
const results = [];
const safeName = value => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'root';

for (const viewport of viewports) {
  for (const route of routes) {
    if (typeof route !== 'string' || !route.startsWith('/')) throw new Error('Inspection routes must start with /.');
    const url = new URL(route.slice(1), baseUrl.endsWith('/') ? baseUrl : baseUrl + '/').toString();
    const name = safeName(new URL(url).pathname) + '-' + viewport.width + 'x' + viewport.height;
    const inspected = await runtime.inspect({
      url, viewports: [viewport], checks: config.checks || [],
      waitUntil: config.waitUntil || 'domcontentloaded',
      timeoutMs: config.timeoutMs || 30000,
      captureDom: config.captureDom !== false,
      maxDomCharacters: config.maxDomCharacters || 120000,
      screenshotDirectory: join(outputDirectory, 'screenshots', name),
      reportPath: join(outputDirectory, 'reports', name + '.json'),
    });
    results.push({ ...inspected, viewport });
  }
}

const report = {
  schemaVersion: 1, generatedAt: new Date().toISOString(), baseUrl,
  ok: results.every(result => result.ok), results,
  summary: {
    targets: results.length, passed: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    consoleLogs: results.reduce((count, result) => count + result.logs.length, 0),
    errors: results.reduce((count, result) => count + result.errors.length, 0),
  },
};
await mkdir(outputDirectory, { recursive: true });
const reportPath = join(outputDirectory, 'report.json');
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify({ ok: report.ok, summary: report.summary, reportPath }, null, 2) + '\n');
if (!report.ok) process.exitCode = 1;
