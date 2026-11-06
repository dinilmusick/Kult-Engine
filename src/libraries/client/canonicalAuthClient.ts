import { createLuthAuthClient, DEFAULT_LUTH_URL, resolveClientOrigin } from '@dinilmusick/gutts/auth';

export interface CanonicalAuthResult {
  success: boolean;
  user?: { id: string; email: string; name: string; [key: string]: unknown };
  token?: string;
  redirectUrl?: string;
  error?: string;
}

export class KultCanonicalAuthClient {
  private readonly client: ReturnType<typeof createLuthAuthClient>;

  constructor(baseUrl = DEFAULT_LUTH_URL, applicationOrigin?: string) {
    const tokenStore = (() => {
      let token = '';
      return { get: () => token, set: (value: string) => { token = value; }, clear: () => { token = ''; } };
    })();
    this.client = createLuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'kult',
      origin: resolveClientOrigin(applicationOrigin),
      luthUrl: baseUrl,
      autoRegister: false,
      tokenStore,
    });
  }

  async signInEmail(email: string, password: string): Promise<CanonicalAuthResult> {
    try {
      await this.client.signInWithEmail({ email: email.trim().toLowerCase(), password });
      const session = await this.client.getSession();
      if (!session.authenticated || !session.user) return { success: false, error: 'Luth did not establish a session.' };
      const token = new Headers(this.client.getAuthHeaders()).get('authorization')?.replace(/^Bearer\s+/i, '');
      return { success: true, user: session.user, token: token || undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth authentication failed.' };
    }
  }

  async signUpEmail(email: string, password: string, name: string): Promise<CanonicalAuthResult> {
    try {
      await this.client.signUpWithEmail({ email: email.trim().toLowerCase(), password, name: name.trim() });
      const session = await this.client.getSession();
      return session.authenticated && session.user ? { success: true, user: session.user } : { success: false, error: 'Luth did not establish a session.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth registration failed.' };
    }
  }

  async signInGoogle(callbackURL: string): Promise<CanonicalAuthResult> {
    try {
      const result = await this.client.signInWithGoogle({ callbackURL });
      const data = result as { url?: string };
      return { success: true, redirectUrl: data.url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Canonical Luth Google authentication failed.' };
    }
  }
}
