import type { ServiceDocument } from '../types/serviceIR';

export function stableServiceFingerprint(doc: ServiceDocument): string {
  const source = JSON.stringify({
    id: doc.service.id,
    version: doc.service.version,
    inputs: doc.service.inputPorts,
    outputs: doc.service.outputPorts,
    assets: doc.assets,
  });
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16);
}

export const GENERATED_LINT_SCRIPT = `import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (/\\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(target);
  }
}
const errors = [];
await walk(join(process.cwd(), 'src'));
for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (source.split(/\\r?\\n/).length > 200) errors.push(file + ': exceeds 200 lines');
  if (/\\beval\\s*\\(|\\brequire\\s*\\(/.test(source)) errors.push(file + ': dynamic execution is forbidden');
  if (/(?:from\\s+|import\\s*\\()\\s*["'](?:\\.\\.\\/){2,}|["'](?:@\\/)?Skipo\\//.test(source)) errors.push(file + ': direct Skipo import is forbidden');
}
if (errors.length) { console.error(errors.join('\\n')); process.exit(1); }
console.log('Kult lint passed: ' + files.length + ' source files');
`;

export function generatedTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src/**/*.ts', 'tests/**/*.ts'],
  }, null, 2);
}
