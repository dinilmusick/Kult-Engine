import { describe, expect, it } from 'vitest';
import { buildServiceAuthoringOperations } from './serviceUiAuthoringModel';

describe('service UI authoring model', () => {
  it('maps authored functionality signatures into service operations', () => {
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
    expect(operations[0]).toMatchObject({
      operationId: 'fn.login',
      name: 'login',
      inputFields: [{ name: 'input', type: 'email, password' }],
      outputFields: [{ name: 'output', type: 'session' }],
    });
  });
});

// Registry propagation verification: consume released Kloks/Floks packages.
