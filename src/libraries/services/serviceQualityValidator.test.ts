import { strict as assert } from 'node:assert';
import test from 'node:test';
import { validateGeneratedService } from './serviceQualityValidator';

test('accepts valid generated TypeScript', () => {
  const content = `import { createService, createServiceDefinition } from '@ultrst-armada/krnl';
export const Definition = createServiceDefinition({
  id: 'x',
  name: 'X',
  version: '1.0.0',
  operations: { execute: { id: 'x.execute', name: 'execute', handler: async () => ({ value: 1 }) } },
});
export const Service = createService(Definition);
`;
  const result = validateGeneratedService([{ path: 'src/index.ts', content }]);
  assert.equal(result.ok, true);
  assert.equal(result.diagnostics.length, 0);
});

test('rejects syntax errors and governance violations', () => {
  const result = validateGeneratedService([{
    path: 'src/bad.ts',
    content: 'const = ;\\n// TODO\\n' + 'export const x = 1;\\n'.repeat(201),
  }]);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'TS_SYNTAX'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LAW_L9_LINE_LIMIT'));
  assert.ok(result.diagnostics.some((item) => item.code === 'LAW_L2_STUB'));
});

test('rejects direct Skipo imports', () => {
  const result = validateGeneratedService([{
    path: 'src/index.ts',
    content: "import { x } from '../../Skipo/core';\\nexport { x };\\n",
  }]);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((item) => item.code === 'LAW_L20_IMPORT_ISOLATION'));
});
