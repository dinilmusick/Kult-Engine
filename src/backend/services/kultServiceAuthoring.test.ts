import assert from 'node:assert/strict';
import test from 'node:test';
import { kultServiceAuthoring } from './kultServiceAuthoring.js';

test('Kult engineer validates a service without a browser runtime', async () => {
  const result = await kultServiceAuthoring.engineer({ mode: 'validate' });
  assert.equal(result.success, true);
  assert.equal(result.validation.ok, true);
});

test('Kult engineer can execute the graph debugger', async () => {
  const result = await kultServiceAuthoring.engineer({
    mode: 'debug',
    inputs: { a: 2, b: 3, operation: 'add' },
  });
  assert.equal(result.validation.ok, true);
  assert.equal(result.execution?.status, 'passed');
});
