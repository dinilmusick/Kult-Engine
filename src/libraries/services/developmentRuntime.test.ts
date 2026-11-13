import test from 'node:test';
import assert from 'node:assert/strict';
import { DevelopmentRuntime, resolveDevelopmentCommand } from '@ultrst-armada/kloks/development';

test('Kult consumes the canonical Kloks development command plan', () => {
  assert.deepEqual(resolveDevelopmentCommand('build'), ['pnpm', ['build']]);
  assert.deepEqual(resolveDevelopmentCommand('validate'), ['pnpm', ['validate']]);
});

test('Kult can execute through the GitHub Actions provider contract', async () => {
  let called = false;
  const runtime = new DevelopmentRuntime(
    { run: async () => ({ exitCode: 1, output: 'web' }) } as any,
    { dispatchWorkflow: async (...args: unknown[]) => { called = args[0] === 'dinilmusick/Kult-Engine'; } } as any,
  );
  const result = await runtime.run({
    provider: 'github-actions',
    task: 'test',
    repository: 'dinilmusick/Kult-Engine',
    workflowId: 'development-runtime.yml',
    ref: 'main',
  });
  assert.equal(result.ok, true);
  assert.equal(called, true);
});

test('Kult imports the canonical Kloks WebContainer service surface', async () => {
  const { WebContainerServiceDefinition } = await import('@ultrst-armada/kloks/development');
  const operationNames = Object.values(WebContainerServiceDefinition.operations as Record<string, { name: string }>).map(operation => operation.name);
  assert.deepEqual(operationNames, ['boot', 'mount', 'run', 'runCommand', 'spawnCommand', 'teardown', 'command']);
});

test('Kult propagates Playwright service-UI inspection errors and screenshots', async () => {
  const { createKultBrowserInspection } = await import('./developmentRuntime.js');
  let received: unknown;
  const inspector = createKultBrowserInspection({
    inspect: async request => {
      received = request;
      return { ok: false, errors: [{ kind: 'pageerror', message: 'service editor crashed' }], logs: [{ type: 'warning', message: 'service editor warning' }], screenshots: ['artifacts/service-editor.png'] };
    },
  });
  const request = { url: 'http://localhost:4173/service-editor', captureDom: true };
  const result = await inspector.inspectServiceUI(request);
  assert.deepEqual(received, request);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.kind, 'pageerror');
  assert.equal(result.logs[0]?.type, 'warning');
  assert.equal(result.screenshots[0], 'artifacts/service-editor.png');
});

test('Kult loads the shared Kloks inspector by default in Node engineering sessions', async () => {
  const { createKultBrowserInspection } = await import('./developmentRuntime.js');
  const result = await createKultBrowserInspection().inspectServiceUI({ url: 'http://localhost:4173/service-editor' });
  assert.equal(typeof result, 'object');
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});
