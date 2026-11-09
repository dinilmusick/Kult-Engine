import { queryUnifiedDb } from '@ultrst-armada/kloks/backend';

export type WorkspaceStorageProvider = 'local_fs' | 'backblaze_b2';
export interface KultWorkspace {
  id: string; name: string; description?: string; engine: 'local_fs' | 'object_storage';
  workspacePath: string; storageProvider: WorkspaceStorageProvider; storageConnectionId?: string;
  localFolderName?: string; localFolderKey?: string; b2BucketName?: string; b2Endpoint?: string; b2Region?: string;
  createdAt: string; updatedAt?: string;
}

function profiles(row: any): Record<string, any> {
  if (!row || !row.app_profiles) return {};
  if (typeof row.app_profiles === 'string') { try { return JSON.parse(row.app_profiles) || {}; } catch { return {}; } }
  return row.app_profiles || {};
}

/** Resolve the Luth principal's application profile from SRKL-owned profile storage. */
async function findUser(identifier: string, env: any) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;
  try {
    const result = await queryUnifiedDb(
      'SELECT id, email, username, name, role, avatar_glyph, email_verified, trust_level, status, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR LOWER(email) = LOWER($1) LIMIT 1',
      [raw],
      env
    );
    return result.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

function safeUser(row: any) {
  return { id: row.id, email: row.email, username: row.username || String(row.email || '').split('@')[0],
    name: row.name || row.display_name || String(row.email || '').split('@')[0], role: row.role || 'user',
    avatarGlyph: row.avatar_glyph, emailVerified: row.email_verified, trustLevel: row.trust_level, status: row.status || 'ACTIVE' };
}

function workspaceList(row: any): KultWorkspace[] {
  const list = profiles(row).kult?.workspaces;
  return Array.isArray(list) ? list : [];
}

async function saveWorkspaces(row: any, workspaces: KultWorkspace[], env: any) {
  const p = profiles(row); p.kult = { ...(p.kult || {}), workspaces };
  await queryUnifiedDb('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(p), row.id], env);
  return workspaces;
}

function normalize(input: any, existing?: KultWorkspace): KultWorkspace {
  const requestedProvider = input.storageProvider || input.storageConfig?.provider;
  const provider: WorkspaceStorageProvider = requestedProvider === 'backblaze_b2' || requestedProvider === 'backblaze' ? 'backblaze_b2' : 'local_fs';
  const id = existing?.id || input.id || ('ws_' + Date.now().toString(36));
  return { id, name: String(input.name || existing?.name || 'New Workspace').trim(), description: input.description ?? existing?.description,
    engine: provider === 'backblaze_b2' ? 'object_storage' : 'local_fs', workspacePath: input.workspacePath || existing?.workspacePath || ('data/workspaces/' + id),
    storageProvider: provider, storageConnectionId: input.storageConnectionId ?? existing?.storageConnectionId,
    localFolderName: input.localFolderName ?? existing?.localFolderName, localFolderKey: input.localFolderKey ?? existing?.localFolderKey,
    b2BucketName: input.b2BucketName ?? existing?.b2BucketName, b2Endpoint: input.b2Endpoint ?? existing?.b2Endpoint,
    b2Region: input.b2Region ?? existing?.b2Region, createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export async function findUserWorkspace(identifier: string, workspaceId: string, env: any = {}) {
  const row = await findUser(identifier, env);
  if (!row) return { workspace: null, connection: null };
  const workspace = workspaceList(row).find((item) => item.id === workspaceId) || null;
  return { workspace, connection: null };
}

export async function getWorkspaces(identifier: string, env: any = {}) {
  const row = await findUser(identifier, env);
  if (!row) return { success: false, status: 404, error: 'User profile not found.', workspaces: [] };
  const workspaces = workspaceList(row);
  return { success: true, status: 200, workspaces, activeWorkspaceId: workspaces[0]?.id || null };
}

export async function createWorkspace(identifier: string, input: any = {}, env: any = {}) {
  const row = await findUser(identifier, env);
  if (!row) return { success: false, status: 404, error: 'User profile not found.' };
  const provider = input.storageProvider || input.storageConfig?.provider;
  const bucket = input.b2BucketName || input.storageConfig?.bucketName;
  if ((provider === 'backblaze_b2' || provider === 'backblaze') && !bucket) return { success: false, status: 400, error: 'A Backblaze B2 bucket must be selected.' };
  if (provider === 'backblaze_b2' || provider === 'backblaze') input = { ...input, storageProvider: 'backblaze_b2', b2BucketName: bucket, storageConnectionId: input.storageConnectionId || input.storageConfig?.connectionId };
  const workspace = normalize(input); const workspaces = await saveWorkspaces(row, [...workspaceList(row), workspace], env);
  return { success: true, status: 201, workspace, workspaces };
}

export async function updateWorkspace(identifier: string, input: any = {}, env: any = {}) {
  const row = await findUser(identifier, env); if (!row) return { success: false, status: 404, error: 'User profile not found.' };
  const list = workspaceList(row); const id = input.workspaceId || input.id; const index = list.findIndex((w) => w.id === id);
  if (index < 0) return { success: false, status: 404, error: 'Workspace not found.' };
  list[index] = normalize({ ...input, ...(input.updates || {}) }, list[index]); await saveWorkspaces(row, list, env);
  return { success: true, status: 200, workspace: list[index], workspaces: list };
}

export async function deleteWorkspace(identifier: string, workspaceId: string, env: any = {}) {
  const row = await findUser(identifier, env); if (!row) return { success: false, status: 404, error: 'User profile not found.' };
  const list = workspaceList(row); const workspaces = list.filter((w) => w.id !== workspaceId);
  if (workspaces.length === list.length) return { success: false, status: 404, error: 'Workspace not found.' };
  await saveWorkspaces(row, workspaces, env); return { success: true, status: 200, deletedId: workspaceId, workspaces };
}

export async function getSrklBackblazeAccounts(identifier: string, env: any = {}) {
  const row = await findUser(identifier, env); if (!row) return { success: false, status: 404, accounts: [] };
  const p = profiles(row); const candidates = p.srkl?.storage_connections || p.srkl?.accounts || [];
  const accounts = (Array.isArray(candidates) ? candidates : []).filter((a: any) => {
    const service = String(a.service || a.serviceId || a.provider || '').toLowerCase();
    return service.includes('backblaze') || service === 'b2' || Boolean(a.credentials?.keyId || a.b2KeyId);
  });
  return { success: true, status: 200, accounts };
}

export async function listBackblazeBuckets(account: any = {}) {
  const c = account.credentials || account; const keyId = c.keyId || c.b2KeyId || c.accessKeyId;
  const appKey = c.applicationKey || c.b2ApplicationKey || c.appKey || c.secretAccessKey;
  if (!keyId || !appKey) return { success: false, status: 400, error: 'Backblaze credentials are missing.', buckets: [] };
  try {
    const basic = typeof Buffer !== 'undefined' ? Buffer.from(keyId + ':' + appKey).toString('base64') : btoa(keyId + ':' + appKey);
    const auth = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', { headers: { Authorization: 'Basic ' + basic }, signal: AbortSignal.timeout(8000) });
    if (!auth.ok) return { success: false, status: 401, error: 'Backblaze authorization failed.', buckets: [] };
    const a: any = await auth.json();
    const listed = await fetch(a.apiUrl + '/b2api/v2/b2_list_buckets', { method: 'POST', headers: { Authorization: a.authorizationToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: a.accountId }), signal: AbortSignal.timeout(8000) });
    if (!listed.ok) return { success: false, status: 502, error: 'Backblaze bucket listing failed.', buckets: [] };
    const data: any = await listed.json();
    return { success: true, status: 200, buckets: (data.buckets || []).map((b: any) => ({ bucketId: b.bucketId, bucketName: b.bucketName, bucketType: b.bucketType })), region: c.region || 'eu-central-003', endpoint: c.endpoint || a.s3ApiUrl };
  } catch (error: any) { return { success: false, status: 502, error: error?.message || 'Unable to reach Backblaze.', buckets: [] }; }
}
