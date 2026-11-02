#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

function compressWasmAssets(assetsDir, maxBytes = DEFAULT_MAX_BYTES) {
  if (!fs.existsSync(assetsDir)) return [];
  const compressedAssets = [];
  for (const fileName of fs.readdirSync(assetsDir)) {
    if (!fileName.endsWith('.wasm')) continue;
    const filePath = path.join(assetsDir, fileName);
    const original = fs.readFileSync(filePath);
    if (original.length <= maxBytes) continue;
    if (original[0] === 0x1f && original[1] === 0x8b) {
      throw new Error(`WASM asset ${fileName} is already gzip encoded but still exceeds ${maxBytes} bytes.`);
    }
    const compressed = gzipSync(original, { level: 9 });
    if (compressed.length > maxBytes) {
      throw new Error(`Compressed WASM asset ${fileName} remains too large: ${compressed.length} bytes.`);
    }
    fs.writeFileSync(filePath, compressed);
    compressedAssets.push({ fileName, originalBytes: original.length, compressedBytes: compressed.length });
  }
  if (compressedAssets.length > 0) {
    const headersPath = path.join(path.dirname(assetsDir), '_headers');
    const existing = fs.existsSync(headersPath) ? fs.readFileSync(headersPath, 'utf8').trim() : '';
    const rules = compressedAssets.map(({ fileName }) => `/assets/${fileName}\n  Content-Type: application/wasm\n  Content-Encoding: gzip`);
    fs.writeFileSync(headersPath, [existing, ...rules].filter(Boolean).join('\n\n') + '\n');
  }
  return compressedAssets;
}

if (require.main === module) {
  const assetsDir = process.argv[2] || path.resolve(__dirname, '../dist/assets');
  const compressed = compressWasmAssets(assetsDir);
  for (const asset of compressed) {
    console.log(`[wasm-assets] ${asset.fileName}: ${asset.originalBytes} -> ${asset.compressedBytes} bytes (gzip)`);
  }
  if (compressed.length === 0) console.log('[wasm-assets] No oversized WASM assets found.');
}

module.exports = { compressWasmAssets, DEFAULT_MAX_BYTES };
