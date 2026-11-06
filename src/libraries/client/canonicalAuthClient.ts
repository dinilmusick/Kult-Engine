const DEFAULT_LUTH_URL = 'https://luth.blueprint-ninjastudios.workers.dev';

export interface CanonicalAuthResult {
  success: boolean;
  user?: { id: string; email: string; name: string; [key: string]: unknown };
  token?: string;
  redirectUrl?: string;
  error?: string;
}

export class KultCanonicalAuthClient {
  private token = '';

  constructor(private readonly baseUrl = DEFAULT_LUTH_URL, private readonly applicationOrigin = '') {}

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(this.baseUrl.replace(/\/+$/, '') + path, {
      ...init,
      credentials: init.credentials || 'include',
      headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}), ...(init.headers || {}) },
    });
  }

  private async parse(response: Response): Promise<any> {
    const data = await response.json().catch(() => ({}));
    const token = response.headers.get('set-auth-token') || data?.token || data?.session?.token || '';
    if (token) this.token = token;
    return data;
  }

  async signInEmail(email: string, password: string): Promise<CanonicalAuthResult> {
    try {
      const response = await this.request('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await this.parse(response);
      if (!response.ok) return { success: false, error: data?.message || 'Canonical Luth authentication failed.' };
      const session = await this.request('/api/session');
      const sessionData = await this.parse(session);
      if (!sessionData.authenticated || !sessionData.user) return { success: false, error: 'Luth did not establish a session.' };
      return { success: true, user: sessionData.user, token: this.token || undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth authentication failed.' };
    }
  }

  async signUpEmail(email: string, password: string, name: string): Promise<CanonicalAuthResult> {
    try {
      const response = await this.request('/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim() }),
      });
      if (!response.ok) {
        const data = await this.parse(response);
        return { success: false, error: data?.message || 'Canonical Luth registration failed.' };
      }
      const data = await this.parse(response);
      return data?.user ? { success: true, user: data.user } : { success: false, error: 'Luth did not establish a session.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth registration failed.' };
    }
  }

  async signInGoogle(callbackURL = this.applicationOrigin): Promise<CanonicalAuthResult> {
    try {
      const response = await this.request('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google', callbackURL }),
      });
      const data = await this.parse(response);
      return response.ok ? { success: true, redirectUrl: data?.url } : { success: false, error: data?.message || 'Canonical Luth Google authentication failed.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth Google authentication failed.' };
    }
  }
}
