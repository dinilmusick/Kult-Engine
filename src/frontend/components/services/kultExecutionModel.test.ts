import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionProject, KULT_EXECUTION_RESULT_MARKER, parseExecutionResult } from './kultExecutionModel';
import { createFunctionalityAsset } from './functionalityEditorModel';

function service() {
  return {
    schemaVersion: '1',
    service: { id: 'svc', name: 'Demo', version: '1.0.0', description: '', inputPorts: [], outputPorts: [] },
    nodes: [], edges: [], assets: [], tests: [], metadata: {},
  };
}

test('builds an executable WebContainer project with runtime dependencies and context', () => {
  const fn = createFunctionalityAsset({
    id: 'echo',
    name: 'Echo',
    inputSignature: 'string',
    outputSignature: 'string',
    libraries: ['@ultrst-armada/gutts', 'zod'],
  });
  fn.mainFunction = 'export async function main(input: unknown, state: StateData) { return { input, hasState: !!state }; }';
  fn.helpers = [{ id: 'h1', name: 'helper', signature: 'declare function helper(): void;', implementation: 'export function helper() {}' }];
  fn.events = [{ id: 'e1', name: 'changed', signature: 'declare function changed(): void;', implementation: 'export function changed() {}' }];

  const project = buildExecutionProject(service(), [fn], 'echo');
  const packageJson = JSON.parse(project.files['package.json'].file.contents);
  const runner = project.files['runner.ts'].file.contents;

  assert.deepEqual(packageJson.dependencies, {
    '@ultrst-armada/gutts': 'latest',
    zod: 'latest',
  });
  assert.match(project.files['functionalities/echo.ts'].file.contents, /helper/);
  assert.match(project.files['functionalities/echo.ts'].file.contents, /changed/);
  assert.match(runner, /KULT_FUNCTIONALITY_IDS/);
  assert.match(runner, new RegExp(KULT_EXECUTION_RESULT_MARKER));
  assert.match(runner, /createState/);
});

test('parses structured execution output even when the functionality logs first', () => {
  const raw = 'debug line\n' + KULT_EXECUTION_RESULT_MARKER + JSON.stringify({ ok: true, output: { value: 2 }, durationMs: 4 }) + '\n';
  assert.deepEqual(parseExecutionResult(raw), {
    ok: true,
    output: { value: 2 },
    durationMs: 4,
  });
});

test('rejects malformed structured execution output', () => {
  assert.deepEqual(parseExecutionResult(KULT_EXECUTION_RESULT_MARKER + '{bad'), {
    ok: false,
    error: '{bad',
  });
});
