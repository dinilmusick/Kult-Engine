import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationAgent } from './applicationAgent.js';

describe('application agent', () => {
  it('discovers backend capabilities', () => {
    const agent = createApplicationAgent({ id: 'test', name: 'Test', backend: { demo: { ping: async () => 'pong' } } });
    assert.ok(agent.capabilities().some(item => item.id === 'backend.demo.ping'));
  });
});
