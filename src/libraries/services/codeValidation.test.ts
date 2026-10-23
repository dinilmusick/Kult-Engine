import test from 'node:test';
import assert from 'node:assert/strict';
import { validateKultService } from './codeValidation';

test('Kult rejects semantically invalid service documents before WebContainer execution', async () => {
  const result = await validateKultService({ service: { id: '', name: '', version: '', description: '', inputPorts: [], outputPorts: [] }, nodes: [], edges: [], assets: [], tests: [], metadata: {} } as any);
  assert.equal(result.ok, false);
  assert.deepEqual(result.code.failedLayers, []);
});
