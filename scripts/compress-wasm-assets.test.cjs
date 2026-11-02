const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');
const { compressWasmAssets } = require('./compress-wasm-assets.cjs');

test('compresses only oversized WASM assets and emits Cloudflare encoding headers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'krusbl-wasm-'));
  const assets = path.join(root, 'dist', 'assets');
  fs.mkdirSync(assets, { recursive: true });
  const original = Buffer.concat([Buffer.from([0, 97, 115, 109]), Buffer.alloc(2048)]);
  const small = Buffer.from([0, 97, 115, 109]);
  fs.writeFileSync(path.join(assets, 'ort-large.wasm'), original);
  fs.writeFileSync(path.join(assets, 'small.wasm'), small);
  try {
    const results = compressWasmAssets(assets, 128);
    assert.equal(results.length, 1);
    assert.equal(results[0].fileName, 'ort-large.wasm');
    assert.deepEqual(gunzipSync(fs.readFileSync(path.join(assets, 'ort-large.wasm'))), original);
    assert.deepEqual(fs.readFileSync(path.join(assets, 'small.wasm')), small);
    const headers = fs.readFileSync(path.join(root, 'dist', '_headers'), 'utf8');
    assert.match(headers, /\/assets\/ort-large\.wasm/);
    assert.match(headers, /Content-Type: application\/wasm/);
    assert.match(headers, /Content-Encoding: gzip/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
