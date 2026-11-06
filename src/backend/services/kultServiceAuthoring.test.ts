import assert from 'node:assert/strict';
import test from 'node:test';
import { kultServiceAuthoring } from './kultServiceAuthoring.js';

test('Kult engineer validates a service without a browser runtime', async () => {
  const result = await kultServiceAuthoring.engineer({ mode: 'validate' });
  assert.equal(result.success, true, JSON.stringify(result));
  assert.equal(result.validation.ok, true, JSON.stringify(result.validation));
});

test('Kult engineer can execute the graph debugger', async () => {
  const result = await kultServiceAuthoring.engineer({
    mode: 'debug',
    inputs: { a: 2, b: 3, operation: 'add' },
  });
  assert.equal(result.validation.ok, true);
  assert.equal(result.execution?.status, 'passed', JSON.stringify(result.execution));
});

test('Kult authoring API rejects invalid service documents before execution', async () => {
  const invalid = structuredClone((await import('../../libraries/services/starterServices.js')).STARTER_KLOKS_ARITHMETIC_SERVICE);
  invalid.service.name = '   ';
  const result = await kultServiceAuthoring.validate({ document: invalid });
  assert.equal(result.ok, false);
  assert.equal(result.semantic.errors.some((error) => error.code === 'ERR_EMPTY_NAME'), true);
});

test('Kult authoring API exposes create, inspect and edit as deterministic operations', async () => {
  const created = await kultServiceAuthoring.create({ id: 'contract-test-service', name: 'Contract Test Service' });
  assert.equal(created.success, true);
  const inspected = await kultServiceAuthoring.inspect({ serviceId: 'contract-test-service' });
  assert.equal(inspected.name, 'Contract Test Service');
  const edited = await kultServiceAuthoring.edit({ serviceId: 'contract-test-service', patch: { service: { ...created.document.service, name: 'Edited Contract Test Service' } } });
  assert.equal(edited.success, true);
  assert.equal(edited.document.service.name, 'Edited Contract Test Service');
});

test('Kult authoring API blocks promotion on validation failure', async () => {
  const invalid = structuredClone((await import('../../libraries/services/starterServices.js')).STARTER_KLOKS_ARITHMETIC_SERVICE);
  invalid.service.name = '';
  const result = await kultServiceAuthoring.promote({ document: invalid });
  assert.equal(result.success, false);
  assert.equal(result.error, 'Promotion blocked by service engineering verification.');
});

test('Kult authoring API returns a structured execution result for run mode', async () => {
  const result = await kultServiceAuthoring.engineer({ mode: 'run', inputs: { a: 7, b: 5, operation: 'add' } });
  assert.equal(result.success, true, JSON.stringify(result));
  assert.equal(result.execution?.status, 'passed', JSON.stringify(result.execution));
});
