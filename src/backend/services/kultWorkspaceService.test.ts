import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listBackblazeBuckets } from './kultWorkspaceService';

describe('Kult workspace storage', () => {
  it('rejects a Backblaze connection without credentials', async () => {
    const result = await listBackblazeBuckets({});
    assert.equal(result.success, false);
    assert.equal(result.status, 400);
    assert.deepEqual(result.buckets, []);
  });
});
