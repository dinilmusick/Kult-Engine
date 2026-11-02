import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const adapter = fs.readFileSync(path.join(root, 'src/backend/adapters/httpsAdapter.ts'), 'utf8');
const workspaceService = fs.readFileSync(path.join(root, 'src/backend/services/kultWorkspaceService.ts'), 'utf8');
const apiClient = fs.readFileSync(path.join(root, 'src/libraries/client/apiClient.ts'), 'utf8');
const backendFacade = fs.readFileSync(path.join(root, 'src/backend/DepmBackend.ts'), 'utf8');

test('Kult resolves identity only by validating a canonical SRKL bearer session', () => {
  assert.match(adapter, /api\/auth\/get-session/);
  assert.match(adapter, /Authorization: `Bearer ${token}`/);
  assert.match(adapter, /session\.user\?\.id/);
  assert.match(adapter, /token\.startsWith\(['"]sess::['"]\)/);
  assert.doesNotMatch(adapter, /Bearer sess::/);
  assert.doesNotMatch(adapter, /req\.headers\.get\(['"]x-user-id['"]\)/i);
  assert.doesNotMatch(adapter, /searchParams\.get\(['"]userId['"]\)/i);
});

test('Kult no longer implements local password verification or session issuance', () => {
  assert.doesNotMatch(workspaceService, /passwordMatches|bcrypt|sess::/);
  assert.doesNotMatch(workspaceService, /loginUser\(/);
});

test('Kult API client forwards only the canonical session bearer for identity', () => {
  assert.match(apiClient, /kultCanonicalSessionToken/);
  assert.match(apiClient, /Authorization/);
  assert.doesNotMatch(apiClient, /x-user-id/i);
});
