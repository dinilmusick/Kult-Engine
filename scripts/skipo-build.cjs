#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

console.log('[skipo-build] Starting Universal Single-Pass Build...');
const startTime = Date.now();

fs.mkdirSync(path.join(rootDir, 'api'), { recursive: true });

function run(cmd, desc) {
  console.log(`[skipo-build] ${desc}...`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

try {
  run('npx vite build', 'Building Vite frontend assets');

  const serverBuiltins = [
    'http', 'https', 'events', 'stream', 'buffer', 'fs', 'fs/promises', 'path',
    'url', 'util', 'net', 'tls', 'zlib', 'os', 'child_process',
    'crypto', 'worker_threads', 'cluster', 'dgram', 'dns', 'readline', 'vm',
    'inspector', 'module', 'typescript',
    '@aws-sdk/*', 'node:*', 'lucide-react',
  ].map((mod) => `'--external:${mod}'`).join(' ');

  run(
    `npx esbuild src/backend/adapters/universalEntry.ts --bundle --platform=neutral --main-fields=module,main --format=esm --alias:crypto=node:crypto --define:__filename='"index.js"' --define:__dirname='"/"' ${serverBuiltins} --outfile=api/index.js`,
    'Bundling Single Universal Polyglot Backend (api/index.js)'
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ [skipo-build] Universal single-artifact build completed in ${duration}s.`);
} catch (error) {
  console.error('\n❌ [skipo-build] Build failed:', error.message);
  process.exit(error.status || 1);
}
