import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionProject, parseExecutionResult } from './kultExecutionModel';
import { createFunctionalityAsset } from './functionalityEditorModel';

test('builds an executable WebContainer project from functionality assets', () => {
  const fn = createFunctionalityAsset({
    id: 'echo',
    name: 'Echo',
    inputSignature: 'string',
    outputSignature: 'string',
  });
  const project = buildExecutionProject(
    {
      schemaVersion: '1',
      service: { id: 'svc', name: 'Demo', version: '1.0.0', description: '', inputPorts: [], outputPorts: [] },
      nodes: [],
      edges: [],
      assets: [],
      tests: [],
      metadata: {},
    },
    [fn],
    'echo',
  );
  assert.ok(project.files['functionalities/echo.ts']);
  assert.ok(project.files['runner.ts']);
  assert.match(project.files['runner.ts'].file.contents, /main0/);
});

test('parses structured execution output', () => {
  assert.deepEqual(parseExecutionResult('{"ok":true,"output":{"value":2},"durationMs":4}'), {
    ok: true,
    output: { value: 2 },
    durationMs: 4,
  });
});
