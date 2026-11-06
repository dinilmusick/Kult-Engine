export interface CanonicalSession {
  authenticated?: boolean;
  user?: { id?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const LUTH_URL = 'https://luth.blueprint-ninjastudios.workers.dev';

export async function resolveCanonicalUserId(request: Request): Promise<string> {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return '';
  try {
    const response = await fetch(LUTH_URL + '/api/session', {
      headers: { Authorization: 'Bearer ' + token },
      credentials: 'include',
    });
    if (!response.ok) return '';
    const session = await response.json() as CanonicalSession;
    return session.user?.id || '';
  } catch {
    return '';
  }
}
