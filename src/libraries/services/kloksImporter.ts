/**
 * @file kloksImporter.ts
 * @description Existing KLOKS Service Import & Reverse Mapping (§5 & §18).
 * Distinguishes GRAPH_NATIVE (lossless) from CODE_IMPORTED (authoritative facade boundary).
 */

import type { ServiceDocument, NodeSpec, EdgeSpec, PortSpec } from '../types/serviceIR';

export interface ImportCandidate {
  id: string;
  name: string;
  package: string;
  version: string;
  type: 'GRAPH_NATIVE' | 'CODE_IMPORTED';
  description: string;
  operations: string[];
}

export const INSTALLED_KLOKS_SERVICES: ImportCandidate[] = [
  {
    id: 'kloks.service.a',
    name: 'Service A (Arithmetic)',
    package: '@ultrst-armada/kloks/services',
    version: '1.4.2',
    type: 'CODE_IMPORTED',
    description: 'Deterministic math operations (add, multiply) running on KrnlTS ServiceInstance',
    operations: ['add', 'multiply'],
  },
  {
    id: 'kloks.service.b',
    name: 'Service B (Stateful Counter)',
    package: '@ultrst-armada/kloks/services',
    version: '1.4.2',
    type: 'CODE_IMPORTED',
    description: 'Stateful reactive counter with increment and reset operations',
    operations: ['increment', 'getCount', 'reset'],
  },
  {
    id: 'kloks.service.auth',
    name: 'Auth Client Service',
    package: '@ultrst-armada/kloks/services',
    version: '1.4.2',
    type: 'CODE_IMPORTED',
    description: 'User registration, login, session tokens, and workspace permissions',
    operations: ['login', 'getState', 'register'],
  },
  {
    id: 'kloks.service.audio',
    name: 'Audio Hardware Service',
    package: '@ultrst-armada/kloks/audio-midi',
    version: '1.4.2',
    type: 'CODE_IMPORTED',
    description: 'Pro-audio hardware stream and discrete named bus manager',
    operations: ['getNamedBus', 'connectStream', 'getState'],
  },
];

export function importKloksServiceCandidate(candidateId: string): ServiceDocument {
  const candidate = INSTALLED_KLOKS_SERVICES.find((c) => c.id === candidateId) || INSTALLED_KLOKS_SERVICES[0];

  const inputPorts: PortSpec[] = candidate.id === 'kloks.service.a'
    ? [
        { id: 'p_op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: 'add' },
        { id: 'p_a', name: 'a', direction: 'input', valueType: 'number', defaultValue: 10 },
        { id: 'p_b', name: 'b', direction: 'input', valueType: 'number', defaultValue: 5 },
      ]
    : [
        { id: 'p_op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: candidate.operations[0] },
        { id: 'p_param', name: 'delta', direction: 'input', valueType: 'number', defaultValue: 1 },
      ];

  const outputPorts: PortSpec[] = candidate.id === 'kloks.service.a'
    ? [{ id: 'p_res', name: 'result', direction: 'output', valueType: 'number' }]
    : [{ id: 'p_count', name: 'count', direction: 'output', valueType: 'number' }];

  const facadeNodeId = `node-imported-${candidate.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const inputNodeId = 'node-service-input';
  const outputNodeId = 'node-service-output';

  const nodes: NodeSpec[] = [
    {
      id: inputNodeId,
      kind: 'ServiceInput',
      type: 'ServiceInput',
      version: '1.0.0',
      position: { x: 80, y: 180 },
      config: {},
      inputs: [],
      outputs: inputPorts.map((p) => ({ ...p, direction: 'output' })),
    },
    {
      id: facadeNodeId,
      kind: 'ServiceFacade',
      type: candidate.id === 'kloks.service.a' ? 'ServiceAFacade' : candidate.id === 'kloks.service.b' ? 'ServiceBFacade' : 'AuthClientServiceFacade',
      version: candidate.version,
      position: { x: 420, y: 150 },
      config: {
        provenance: candidate.package,
        importType: candidate.type,
        operations: candidate.operations,
      },
      inputs: [...inputPorts],
      outputs: [...outputPorts],
      metadata: { importProvenance: candidate.package },
    },
    {
      id: outputNodeId,
      kind: 'ServiceOutput',
      type: 'ServiceOutput',
      version: '1.0.0',
      position: { x: 780, y: 180 },
      config: {},
      inputs: outputPorts.map((p) => ({ ...p, direction: 'input' })),
      outputs: [],
    },
  ];

  const edges: EdgeSpec[] = inputPorts.map((p, i) => ({
    id: `e-in-${i}`,
    sourceNodeId: inputNodeId,
    sourcePort: p.id,
    targetNodeId: facadeNodeId,
    targetPort: p.id,
  })).concat(
    outputPorts.map((p, i) => ({
      id: `e-out-${i}`,
      sourceNodeId: facadeNodeId,
      sourcePort: p.id,
      targetNodeId: outputNodeId,
      targetPort: p.id,
    }))
  );

  return {
    schemaVersion: '1.0.0',
    service: {
      id: candidate.id,
      name: candidate.name,
      version: candidate.version,
      description: candidate.description,
      inputPorts,
      outputPorts,
    },
    nodes,
    edges,
    uiSchema: {
      version: '1.0.0',
      title: `${candidate.name} Interface`,
      description: `Authoritative controls for ${candidate.name}`,
      fields: inputPorts.map((p) => ({
        id: `f-${p.id}`,
        type: p.valueType === 'number' ? 'number' : 'text',
        label: p.name.toUpperCase(),
        targetPort: p.name,
        defaultValue: p.defaultValue,
      })),
      submitActionLabel: 'Execute Service',
      outputBindingPort: outputPorts[0].name,
    },
    assets: [
      {
        package: candidate.package,
        export: candidate.name,
        version: candidate.version,
        source: candidate.package,
        contractFingerprint: `kloks_sig_${candidate.id}`,
        category: 'services',
      },
    ],
    tests: [
      {
        id: `test-${candidate.id}`,
        name: `Default Test for ${candidate.name}`,
        input: Object.fromEntries(inputPorts.map((p) => [p.name, p.defaultValue])),
        assertions: [{ port: outputPorts[0].name, operator: 'defined', value: true }],
        enabled: true,
      },
    ],
    metadata: {
      importedFrom: candidate.package,
      importType: candidate.type,
      importedAt: new Date().toISOString(),
    },
  };
}

export function importCustomServiceDocument(jsonString: string): ServiceDocument {
  const parsed = JSON.parse(jsonString);
  if (!parsed.service || !parsed.nodes || !parsed.edges) {
    throw new Error('Invalid SERVICE_IR: missing service, nodes, or edges declarations');
  }
  return parsed as ServiceDocument;
}
