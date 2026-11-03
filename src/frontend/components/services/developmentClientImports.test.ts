import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const frontendFiles = [
  'src/frontend/components/services/ServiceTestRunner.tsx',
  'src/frontend/components/services/ServiceDiagnosticsPanel.tsx',
];

test('frontend service tools use the browser-safe development client', async () => {
  for (const file of frontendFiles) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /\.\/kloksDevelopmentClient/);
    assert.doesNotMatch(source, /@ultrst-armada\/kloks\/development(?:\/client)?['"]/);
  }
});
