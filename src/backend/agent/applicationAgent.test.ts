import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationAgent } from './applicationAgent.js';
import { applicationAgent } from './runtime.js';

describe('application agent', () => {
  it('discovers backend capabilities', () => {
    const agent = createApplicationAgent({ id: 'test', name: 'Test', backend: { demo: { ping: async () => 'pong' } } });
    assert.ok(agent.capabilities().some(item => item.id === 'backend.demo.ping'));
  });

  it('discovers Kult creator authoring capabilities', () => {
    const ids = applicationAgent.capabilities().map(item => item.id);
    assert.ok(ids.includes('backend.services.service.create'));
    assert.ok(ids.includes('backend.services.service.inspect'));
    assert.ok(ids.includes('backend.services.service.run'));
    assert.ok(ids.includes('backend.services.service.validate'));
    assert.ok(ids.includes('backend.services.service.promote'));
  });
});

