export interface CanonicalAuthResult {
  success: boolean;
  user?: { id: string; email: string; name: string; [key: string]: unknown };
  token?: string;
  redirectUrl?: string;
  error?: string;
}

export class KultCanonicalAuthClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(baseUrl: string, fetcher: typeof fetch = fetch) {
    if (!baseUrl?.trim()) throw new Error('Canonical SRKL auth URL is required.');
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
  }

  private async post(path: string, body: Record<string, unknown>): Promise<CanonicalAuthResult> {
    try {
      const response = await this.fetcher(`${this.baseUrl}/api/auth${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!response.ok || data?.error) {
        return { success: false, error: data?.error?.message || data?.message || 'Canonical authentication failed.' };
      }
      return {
        success: true,
        user: data?.user,
        token: response.headers.get('set-auth-token') || undefined,
        redirectUrl: data?.url || data?.redirect,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical authentication service unavailable.' };
    }
  }

  signInEmail(email: string, password: string) {
    return this.post('/sign-in/email', { email: email.trim().toLowerCase(), password });
  }

  signUpEmail(email: string, password: string, name: string) {
    return this.post('/sign-up/email', { email: email.trim().toLowerCase(), password, name: name.trim() });
  }

  signInGoogle(callbackURL: string) {
    return this.post('/sign-in/social', { provider: 'google', callbackURL });
  }
}
