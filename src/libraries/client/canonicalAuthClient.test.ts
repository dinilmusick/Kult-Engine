import assert from 'node:assert/strict';
import test from 'node:test';
import { KultCanonicalAuthClient } from './canonicalAuthClient.js';

function mockFetch(handler: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => { globalThis.fetch = original; };
}

test('email sign-in uses canonical Luth endpoints', async () => {
  const calls: string[] = [];
  const restore = mockFetch(async (input) => {
    calls.push(String(input));
    if (calls.at(-1)?.endsWith('/api/auth/sign-in/email')) {
      return new Response(JSON.stringify({ user: { id: 'u1', email: 'user@example.com', name: 'User' } }), {
        status: 200,
        headers: { 'set-auth-token': 'canonical-token' },
      });
    }
    return new Response(JSON.stringify({ authenticated: true, user: { id: 'u1', email: 'user@example.com', name: 'User' } }), { status: 200 });
  });
  try {
    const client = new KultCanonicalAuthClient('https://auth.example.com', 'https://kult.example.com');
    const result = await client.signInEmail(' User@Example.com ', 'credential');
    assert.equal(result.success, true);
    assert.equal(result.token, 'canonical-token');
    assert.ok(calls.some((url) => url.endsWith('/api/auth/sign-in/email')));
    assert.ok(calls.some((url) => url.endsWith('/api/session')));
  } finally {
    restore();
  }
});

test('registration uses the canonical Luth sign-up endpoint', async () => {
  let url = '';
  const restore = mockFetch(async (input) => {
    url = String(input);
    return new Response(JSON.stringify({ user: { id: 'u1', email: 'user@example.com', name: 'User' } }), { status: 200 });
  });
  try {
    const client = new KultCanonicalAuthClient('https://auth.example.com', 'https://kult.example.com');
    const result = await client.signUpEmail('user@example.com', 'credential', 'User');
    assert.equal(result.success, true);
    assert.ok(url.endsWith('/api/session'));
  } finally {
    restore();
  }
});

test('Google sign-in requests the provider redirect from Luth', async () => {
  let body: any;
  const restore = mockFetch(async (_input, init) => {
    body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ url: 'https://accounts.google.com/oauth' }), { status: 200 });
  });
  try {
    const client = new KultCanonicalAuthClient('https://auth.example.com', 'https://kult.example.com');
    const result = await client.signInGoogle('https://kult.example.com/?auth=google');
    assert.equal(result.redirectUrl, 'https://accounts.google.com/oauth');
    assert.deepEqual(body, { provider: 'google', callbackURL: 'https://kult.example.com/?auth=google' });
  } finally {
    restore();
  }
});

test('authentication failures are returned without manufacturing a session', async () => {
  const restore = mockFetch(async () => new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 }));
  try {
    const client = new KultCanonicalAuthClient('https://auth.example.com', 'https://kult.example.com');
    const result = await client.signInEmail('user@example.com', 'credential');
    assert.equal(result.success, false);
    assert.equal(result.token, undefined);
    assert.ok(result.error);
  } finally {
    restore();
  }
});
