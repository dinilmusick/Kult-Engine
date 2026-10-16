/**
 * @file starterServices.ts
 * @description Authoritative pre-authored KRNLTS service definitions powered by KLOKS facades.
 */

import type { ServiceDocument } from '../types/serviceIR';

export const STARTER_KLOKS_ARITHMETIC_SERVICE: ServiceDocument = {
  schemaVersion: '1.0.0',
  service: {
    id: 'svc-kloks-arithmetic',
    name: 'Kloks Arithmetic Service',
    version: '1.0.0',
    description: 'Deterministic mathematical operations composed on KrnlTS ServiceInstance',
    entryNodeId: 'node-in',
    inputPorts: [
      { id: 'in-op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: 'add' },
      { id: 'in-a', name: 'a', direction: 'input', valueType: 'number', defaultValue: 25 },
      { id: 'in-b', name: 'b', direction: 'input', valueType: 'number', defaultValue: 15 },
    ],
    outputPorts: [
      { id: 'out-res', name: 'result', direction: 'output', valueType: 'number' },
    ],
  },
  nodes: [
    {
      id: 'node-in',
      kind: 'ServiceInput',
      type: 'ServiceInput',
      version: '1.0.0',
      position: { x: 80, y: 160 },
      config: {},
      inputs: [],
      outputs: [
        { id: 'p-op', name: 'operation', direction: 'output', valueType: 'string', defaultValue: 'add' },
        { id: 'p-a', name: 'a', direction: 'output', valueType: 'number', defaultValue: 25 },
        { id: 'p-b', name: 'b', direction: 'output', valueType: 'number', defaultValue: 15 },
      ],
    },
    {
      id: 'node-facade-a',
      kind: 'ServiceFacade',
      type: 'ServiceAFacade',
      version: '1.4.2',
      position: { x: 420, y: 140 },
      config: { runtime: 'server', deployment: 'local' },
      inputs: [
        { id: 'op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: 'add' },
        { id: 'a', name: 'a', direction: 'input', valueType: 'number', defaultValue: 25 },
        { id: 'b', name: 'b', direction: 'input', valueType: 'number', defaultValue: 15 },
      ],
      outputs: [
        { id: 'result', name: 'result', direction: 'output', valueType: 'number' },
      ],
    },
    {
      id: 'node-out',
      kind: 'ServiceOutput',
      type: 'ServiceOutput',
      version: '1.0.0',
      position: { x: 780, y: 160 },
      config: {},
      inputs: [
        { id: 'p-res-in', name: 'result', direction: 'input', valueType: 'number' },
      ],
      outputs: [],
    },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 'node-in', sourcePort: 'p-op', targetNodeId: 'node-facade-a', targetPort: 'op' },
    { id: 'e2', sourceNodeId: 'node-in', sourcePort: 'p-a', targetNodeId: 'node-facade-a', targetPort: 'a' },
    { id: 'e3', sourceNodeId: 'node-in', sourcePort: 'p-b', targetNodeId: 'node-facade-a', targetPort: 'b' },
    { id: 'e4', sourceNodeId: 'node-facade-a', sourcePort: 'result', targetNodeId: 'node-out', targetPort: 'p-res-in' },
  ],
  uiSchema: {
    version: '1.0.0',
    title: 'Arithmetic Calculator Surface',
    description: 'Interactive mathematical computation bound to KrnlTS Service A',
    fields: [
      { id: 'f-a', type: 'number', label: 'Operand A', targetPort: 'a', defaultValue: 25 },
      { id: 'f-b', type: 'number', label: 'Operand B', targetPort: 'b', defaultValue: 15 },
    ],
    submitActionLabel: 'Compute Calculation',
    outputBindingPort: 'result',
  },
  assets: [
    {
      package: '@ultrst-armada/kloks',
      export: 'ServiceAFacade',
      version: '1.4.2',
      source: '@ultrst-armada/kloks/services',
      contractFingerprint: 'kloks_svc_a_v1',
      category: 'services',
    },
  ],
  tests: [
    {
      id: 't-add',
      name: 'Deterministic Addition Test (25 + 15 = 40)',
      input: { a: 25, b: 15, operation: 'add' },
      expectedOutput: { result: 40 },
      assertions: [{ port: 'result', operator: 'equals', value: 40 }],
      enabled: true,
    },
    {
      id: 't-mult',
      name: 'Multiplication Test (10 * 5 = 50)',
      input: { a: 10, b: 5, operation: 'multiply' },
      expectedOutput: { result: 50 },
      assertions: [{ port: 'result', operator: 'equals', value: 50 }],
      enabled: true,
    },
  ],
  metadata: { author: 'Kult System', createdAt: '2026-10-16' },
};

export const STARTER_SERVICES = [
  STARTER_KLOKS_ARITHMETIC_SERVICE,
];
