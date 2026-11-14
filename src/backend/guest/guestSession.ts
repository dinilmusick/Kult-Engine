/**
 * @file guestSession.ts
 * @plane P1-backend
 * @description Ephemeral in-memory guest session handler. No DB writes.
 * No env vars. Sessions live only for the lifetime of the process (<= 200 lines).
 */

import { randomBytes } from 'node:crypto';

interface GuestLease { token: string; createdAt: number; }

const GUEST_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours in-process
const leases = new Map<string, GuestLease>();

function mintToken(): string {
  return `guest_${randomBytes(18).toString('hex')}`;
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, lease] of leases) {
    if (now - lease.createdAt > GUEST_SESSION_TTL_MS) leases.delete(id);
  }
}

function guestSessionId(request: Request): string | null {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer guest_')) return auth.slice(7);
  return null;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors },
  });

const GUEST_PATHS = [
  '/api/auth/guest/status',
  '/api/auth/guest/session',
  '/api/guest/lease',
];

export async function handleGuestRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const { pathname } = url;
  if (!GUEST_PATHS.includes(pathname)) return null;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  // GET /api/auth/guest/status — always enabled, no auth required
  if (pathname === '/api/auth/guest/status' && request.method === 'GET') {
    return json({ success: true, enabled: true, mode: 'ephemeral' });
  }

  // POST /api/auth/guest/session or /api/guest/lease — mint a new guest lease
  if ((pathname === '/api/auth/guest/session' || pathname === '/api/guest/lease') && request.method === 'POST') {
    purgeExpired();
    const token = mintToken();
    const id = token;
    leases.set(id, { token, createdAt: Date.now() });
    return json({ success: true, token, mode: 'ephemeral' }, 201);
  }

  // GET /api/auth/guest/session — check if a lease is still valid
  if (pathname === '/api/auth/guest/session' && request.method === 'GET') {
    const id = guestSessionId(request);
    const lease = id ? leases.get(id) : null;
    const valid = lease !== undefined && Date.now() - lease.createdAt < GUEST_SESSION_TTL_MS;
    if (!valid) return json({ success: false, error: 'Guest session expired or not found.' }, 401);
    return json({ success: true, valid: true, mode: 'ephemeral' });
  }

  // DELETE /api/auth/guest/session — revoke lease
  if (pathname === '/api/auth/guest/session' && request.method === 'DELETE') {
    const id = guestSessionId(request);
    if (id) leases.delete(id);
    return json({ success: true });
  }

  return json({ error: 'Method not allowed.' }, 405);
}
