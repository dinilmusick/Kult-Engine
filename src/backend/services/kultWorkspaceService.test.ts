import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listBackblazeBuckets, systemDatabaseUrls } from './kultWorkspaceService';

describe('Kult workspace storage', () => {
  it('rejects a Backblaze connection without credentials', async () => {
    const result = await listBackblazeBuckets({});
    assert.equal(result.success, false);
    assert.equal(result.status, 400);
    assert.deepEqual(result.buckets, []);
  });
});


describe('Kult authentication database configuration', () => {
  it('prioritizes numbered SYSTEM_DATABASE_URL_* variables and ignores empty values', () => {
    assert.deepEqual(
      systemDatabaseUrls({
        SYSTEM_DATABASE_URL_1: 'postgres://one',
        SYSTEM_DATABASE_URL_2: '',
        SYSTEM_DATABASE_URL_3: 'postgres://three',
        SYSTEM_DATABASE_URL: 'postgres://legacy',
      }),
      ['postgres://one', 'postgres://three', 'postgres://legacy'],
    );
  });
});
