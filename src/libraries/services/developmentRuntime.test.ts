import test from 'node:test';
import assert from 'node:assert/strict';
import { DevelopmentRuntime, resolveDevelopmentCommand } from '@ultrst-armada/kloks/development';

test('Kult consumes the canonical Kloks development command plan', () => {
  assert.deepEqual(resolveDevelopmentCommand('build'), ['pnpm', ['build']]);
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
  assert.deepEqual(operationNames, ['boot', 'mount', 'run', 'runCommand', 'teardown', 'command']);
});
