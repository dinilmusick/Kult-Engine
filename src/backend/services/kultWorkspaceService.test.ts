import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

describe('Kult canonical profile and database ownership', () => {
  it('uses SRKL application profiles and does not read the Luth identity table directly', async () => {
    const source = await readFile(new URL('./kultWorkspaceService.ts', import.meta.url), 'utf8');
    assert.match(source, /srkl_application_profiles/);
    assert.doesNotMatch(source, /ultrst-users/);
    assert.doesNotMatch(source, /@neondatabase\/serverless/);
    assert.doesNotMatch(source, /SYSTEM_DATABASE_URL_1|DATABASE_URL/);
  });
});
