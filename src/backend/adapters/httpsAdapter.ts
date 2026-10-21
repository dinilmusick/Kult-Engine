// ══════════════════════════════════════════════════════════════════════════════
// PROTOCOL ADAPTER: UNIVERSAL HTTPS / FETCH ADAPTER (CLOUDFLARE & VERCEL)
// Spec: MULTI_TARGET_BUILD_SPEC §2 Protocol Adapter Invariant & Law L8
// Zero Divergence across Cloudflare Workers, Vercel Serverless, and Local Dev (< 200 lines).
// ══════════════════════════════════════════════════════════════════════════════

import { DepmBackend } from '../DepmBackend';
import { adaptNodeRequest } from './nodeBridge';
import { handleVaultRoutes } from './vaultRoutes';
import { createLocalServiceFromKloksAsset, getKloksServiceAsset } from '../../libraries/services/assetDiscovery';

export interface Env {
  ENVIRONMENT?: string;
  APP_NAME?: string;
  DEPM_GATEWAY_DOMAIN?: string;
  SYSTEM_DATABASE_URL_1?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: unknown;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Workspace-Id, X-Vault-Key',
};

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function parseBody(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}

function getUserId(req: Request, url: URL): string {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer sess::')) {
    const p = auth.replace('Bearer sess::', '').split('::');
    if (p[0]) return p[0];
  }
  return req.headers.get('x-user-id') || url.searchParams.get('userId') || '';
}

export async function fetchHandler(request: Request, env: Env = {}): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  const ingress = DepmBackend.services.routes.matchGatewayIngress(pathname);
  if (ingress) return Response.redirect(ingress.destinationUrl, 302);

  if (pathname === '/api/health' || pathname === '/health') {
    return jsonRes({ status: 'ok', service: 'depm-unified-engine', timestamp: new Date().toISOString() });
  }

  // 1. Auth routes
  if (pathname === '/api/auth/login' && method === 'POST') {
    const b = await parseBody(request);
    const res = await DepmBackend.services.auth.loginUser(b.email || b.identifier, b.password, false, env);
    return jsonRes(res, (res as any).status || 200);
  }
  if (pathname === '/api/auth/admin/login' && method === 'POST') {
    const b = await parseBody(request);
    const res = await DepmBackend.services.auth.loginUser(b.email || b.identifier, b.password, true, env);
    return jsonRes(res, (res as any).status || 200);
  }
  if (pathname === '/api/auth/users' && method === 'GET') {
    return jsonRes(await DepmBackend.services.auth.getUsers(env));
  }

  // 2. Workspace & Cloud Storage routes
  if (pathname === '/api/workspace/storage-details' && method === 'GET') {
    const wsId = url.searchParams.get('workspaceId') || url.searchParams.get('id') || '';
    return jsonRes(await DepmBackend.services.workspace.getWorkspaceStorageDetails(wsId, env));
  }
  if (pathname === '/api/db/workspace') {
    const uId = getUserId(request, url);
    const wsId = url.searchParams.get('workspaceId') || url.searchParams.get('id') || '';
    if (method === 'GET') return jsonRes(await DepmBackend.services.workspace.loadWorkspaceData(uId, wsId, env));
    if (method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await DepmBackend.services.workspace.saveWorkspaceData(uId, b.workspaceId || wsId || b.workspace?.id, b.workspace || b, env));
    }
  }
  if (pathname === '/api/db/workspace/rename-app' && method === 'POST') {
    const b = await parseBody(request);
    return jsonRes(await DepmBackend.services.workspace.renameAppInWorkspaceData(getUserId(request, url), b.workspaceId, b.appId, b.newName, env));
  }
  if (pathname === '/api/workspaces' || pathname === '/api/auth/workspaces') {
    const uId = getUserId(request, url);
    if (method === 'GET') return jsonRes(await DepmBackend.services.workspace.getWorkspaces(uId, env));
    if (method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await DepmBackend.services.workspace.createWorkspace(uId || b.userId, b.workspace || b, env));
    }
    if (method === 'PUT') {
      const b = await parseBody(request);
      return jsonRes(await DepmBackend.services.workspace.updateWorkspace(uId || b.userId, b, env));
    }
    if (method === 'DELETE') {
      return jsonRes(await DepmBackend.services.workspace.deleteWorkspace(uId, url.searchParams.get('workspaceId') || url.searchParams.get('id') || '', env));
    }
  }

  // 2.5 SRKL Backblaze federation used by workspace creation
  if (pathname === '/api/srkl/backblaze/accounts' && method === 'GET') {
    return jsonRes(await DepmBackend.services.srkl.getSrklAccounts(getUserId(request, url), 'backblaze', env));
  }
  if (pathname === '/api/srkl/backblaze/buckets' && method === 'POST') {
    return jsonRes(await DepmBackend.services.srkl.listBackblazeBuckets(await parseBody(request)));
  }

  // 3. Storage Connections & Testing
  if (pathname === '/api/storage/connections' || pathname === '/api/auth/storage/connections') {
    const uId = getUserId(request, url);
    if (method === 'GET') return jsonRes(await DepmBackend.services.storage.getStorageConnections(uId, env));
    if (method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await DepmBackend.services.storage.saveStorageConnection(uId || b.userId, b.connection || b, env), 201);
    }
  }
  const connDelMatch = pathname.match(/^\/api\/storage\/connections\/([^/]+)$/);
  if (connDelMatch && method === 'DELETE') {
    return jsonRes(await DepmBackend.services.storage.deleteStorageConnection(getUserId(request, url), connDelMatch[1], env));
  }
  if ((pathname === '/api/storage/test' || pathname === '/api/auth/storage/test') && method === 'POST') {
    return jsonRes(await DepmBackend.services.storage.testStorageConnection((await parseBody(request)).connection || await parseBody(request)));
  }

  // 4. System Buckets
  if (pathname === '/api/system/buckets') {
    if (method === 'GET') return jsonRes(await DepmBackend.services.storage.getSystemBuckets(env));
    if (method === 'POST') return jsonRes(await DepmBackend.services.storage.saveSystemBucket(await parseBody(request), env), 201);
  }
  if (pathname === '/api/system/buckets/primary' && method === 'GET') {
    return jsonRes(await DepmBackend.services.storage.getPrimarySystemBucket(env));
  }

  // 5. Workspace Vault & SRKL Ecosystem routes
  const vaultRes = await handleVaultRoutes(request, url, getUserId(request, url), env, jsonRes, parseBody);
  if (vaultRes) return vaultRes;

  if (pathname === '/api/srkl/accounts' && method === 'GET') {
    return jsonRes(await DepmBackend.services.srkl.getSrklAccounts(getUserId(request, url), url.searchParams.get('service') || '', env));
  }
  if (pathname === '/api/srkl/status' && method === 'GET') {
    return jsonRes(await DepmBackend.services.srkl.getSrklStatus(env));
  }

  // 6. Public Routes & Gateway Config
  if (pathname === '/api/public/routes' && method === 'GET') return jsonRes(DepmBackend.services.routes.getPublicRoutes());
  if (pathname.startsWith('/api/public/routes/')) {
    const res = DepmBackend.services.routes.getPublicRouteByPath(pathname.replace('/api/public/routes/', ''));
    return jsonRes(res, (res as any).status || 200);
  }
  if (pathname === '/api/gateway/config' && method === 'GET') return jsonRes(DepmBackend.services.routes.getGatewayConfig(env));
  if (pathname === '/api/routes') {
    if (method === 'GET') return jsonRes(DepmBackend.services.routes.getAllRoutes());
    if (method === 'POST') return jsonRes(DepmBackend.services.routes.upsertRoute(await parseBody(request)));
  }
  if (pathname === '/api/kult/npm/search' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    if (!q.trim()) return jsonRes({ success: true, packages: [] });
    try {
      const response = await fetch('https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(q) + '&size=20');
      const body = await response.json() as any;
      const packages = (body.objects || []).map((x: any) => x.package?.name).filter(Boolean);
      const preferred = packages.filter((name: string) => name.startsWith('@dinilmusick/') || name.startsWith('@ultrst-armada/'));
      return jsonRes({ success: true, packages: [...preferred, ...packages.filter((n: string) => !preferred.includes(n))] });
    } catch (error: any) {
      return jsonRes({ success: false, packages: [], error: error?.message || 'npm registry unavailable' }, 502);
    }
  }
  if (pathname === '/api/kult/kloks/services' && method === 'GET') {
    const { discoverKloksAssets } = await import('../../libraries/services/assetDiscovery');
    return jsonRes({ success: true, services: discoverKloksAssets().filter((a: any) => a.category === 'services') });
  }
  const copyMatch = pathname.match(/^\/api\/kult\/kloks\/services\/([^/]+)\/copy$/);
  if (copyMatch && method === 'POST') {
    const asset = getKloksServiceAsset(copyMatch[1]);
    if (!asset) return jsonRes({ success: false, status: 404, error: 'KLOKS service not found.' }, 404);
    return jsonRes({ success: true, service: createLocalServiceFromKloksAsset(asset) });
  }

  if (pathname === '/api/kult/validate' && method === 'POST') {
    return jsonRes(DepmBackend.services.kult.validate((await parseBody(request)).document));
  }
  if (pathname === '/api/kult/execute' && method === 'POST') {
    const b = await parseBody(request);
    return jsonRes(await DepmBackend.services.kult.execute(b.document, b.inputs));
  }
  if (pathname === '/api/kult/export' && method === 'POST') {
    return jsonRes(DepmBackend.services.kult.exportArtifact((await parseBody(request)).document));
  }
  if (pathname === '/api/kult/promote' && method === 'POST') {
    return jsonRes(await DepmBackend.services.kult.promote((await parseBody(request)).document));
  }

  // 7. Assets fallback for Frontend SPA
  // Pass request as-is — CF Assets uses not_found_handling=single-page-application
  // to serve index.html for any non-file path. Manual /index.html rewrites cause
  // infinite redirect loops (CF Assets normalizes /index.html → / automatically).
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function' && !pathname.startsWith('/api/')) {
    return await env.ASSETS.fetch(request);
  }

  return jsonRes({ error: 'Not Found', path: pathname }, 404);
}

export default {
  async fetch(request: Request, env: Env = {}, ctx?: any): Promise<Response> {
    return fetchHandler(request, env);
  },
};

export { adaptNodeRequest };
