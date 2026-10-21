import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listBackblazeBuckets, getWorkspaces } from './kultWorkspaceService';

describe('Kult workspace storage', () => {
  it('rejects a Backblaze connection without credentials', async () => {
    const result = await listBackblazeBuckets({});
    assert.equal(result.success, false);
    assert.equal(result.status, 400);
    assert.deepEqual(result.buckets, []);
  });
});

it('requires a real Backblaze bucket for cloud workspace creation', async () => {
  const result = await import('./kultWorkspaceService').then(({ createWorkspace }) => createWorkspace('missing-user', {
    name: 'Cloud',
    storageProvider: 'backblaze_b2',
  }, {}));
  assert.equal(result.success, false);
});
