import { strict as assert } from 'node:assert';
import test from 'node:test';
import { buildServiceAuthoringOperations } from './serviceUiAuthoringModel';

test('service UI authoring maps functionality signatures into service operations', () => {
  const operations = buildServiceAuthoringOperations([{
    id: 'fn.login',
    name: 'login',
    description: 'Authenticate a user',
    inputSignature: 'email, password',
    outputSignature: 'session',
    tags: [],
    mainFunction: '',
    helpers: [],
    events: [],
    stateData: '',
    libraries: [],
  }]);
  assert.deepEqual(operations[0], {
    operationId: 'fn.login',
    name: 'login',
    description: 'Authenticate a user',
    inputFields: [{ name: 'input', type: 'email, password' }],
    outputFields: [{ name: 'output', type: 'session' }],
  });
});
