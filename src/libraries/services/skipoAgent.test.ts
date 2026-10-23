import test from 'node:test';
import assert from 'node:assert/strict';
import { skipoAgentService } from './skipoAgent';

test('Kult exposes a Skipo agent runtime', () => {
  assert.equal(skipoAgentService.inspect().app.runtime, 'skipo');
});

test('Kult agent exposes service and UI promotion suggestions', () => {
  const capabilities = skipoAgentService.inspect().capabilities;
  assert.ok(capabilities.includes('suggest-service-promotion'));
  assert.ok(capabilities.includes('suggest-ui-promotion'));
});

test('Kult agent routes reusable assets to the correct library', () => {
  assert.equal(skipoAgentService.promotionPlan({ kind: 'SERVICE', name: 'x' }).target, 'KLOKS');
  assert.equal(skipoAgentService.promotionPlan({ kind: 'UI', name: 'x' }).target, 'FLOKS');
});
