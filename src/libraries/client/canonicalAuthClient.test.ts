import assert from 'node:assert/strict';
import test from 'node:test';
import { KultCanonicalAuthClient } from './canonicalAuthClient.js';

test('email sign-in reads the canonical bearer token from Better Auth headers', async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    request = { url: String(url), init };
    return new Response(JSON.stringify({ user: { id: 'u1', email: 'user@example.com', name: 'User' } }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-auth-token': 'canonical-token' },
    });
  }) as typeof fetch;
  const client = new KultCanonicalAuthClient('https://auth.example.com/', fetcher);
  const result = await client.signInEmail(' User@Example.com ', 'password123');
  assert.equal(result.success, true);
  assert.equal(result.token, 'canonical-token');
  assert.equal(request?.url, 'https://auth.example.com/api/auth/sign-in/email');
  assert.equal(request?.init?.credentials, 'include');
  assert.deepEqual(JSON.parse(String(request?.init?.body)), { email: 'user@example.com', password: 'password123' });
});

test('registration uses the canonical Better Auth sign-up endpoint', async () => {
  let url = '';
  const fetcher = (async (input: string | URL | Request) => {
    url = String(input);
    return new Response(JSON.stringify({ user: { id: 'u1', email: 'user@example.com', name: 'User' } }), { status: 200 });
  }) as typeof fetch;
  const client = new KultCanonicalAuthClient('https://auth.example.com', fetcher);
  const result = await client.signUpEmail('user@example.com', 'password123', 'User');
  assert.equal(result.success, true);
  assert.equal(url, 'https://auth.example.com/api/auth/sign-up/email');
});

test('Google sign-in requests the provider redirect from Luth', async () => {
  let body: any;
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ url: 'https://accounts.google.com/oauth' }), { status: 200 });
  }) as typeof fetch;
  const client = new KultCanonicalAuthClient('https://auth.example.com', fetcher);
  const result = await client.signInGoogle('https://kult.example.com/?auth=google');
  assert.equal(result.redirectUrl, 'https://accounts.google.com/oauth');
  assert.deepEqual(body, { provider: 'google', callbackURL: 'https://kult.example.com/?auth=google' });
});

test('authentication failures are returned without manufacturing a session', async () => {
  const fetcher = (async () => new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 })) as typeof fetch;
  const client = new KultCanonicalAuthClient('https://auth.example.com', fetcher);
  const result = await client.signInEmail('user@example.com', 'wrong');
  assert.equal(result.success, false);
  assert.equal(result.token, undefined);
  assert.equal(result.error, 'Invalid credentials');
});
