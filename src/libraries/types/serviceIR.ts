/**
 * @file serviceIR.ts
 * @description Canonical SERVICE_IR definitions according to IMPLEMENTATION-SPEC.md §4.
 * Serializable, versioned intermediate representation for KRNLTS services.
 */

export type PortDirection = 'input' | 'output';
export type PortValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
export type PortClassification = 'execution' | 'data' | 'config';

export interface PortSpec {
  id: string;
  name: string;
  direction: PortDirection;
  valueType: PortValueType;
  schema?: Record<string, unknown>;
  cardinality?: 'one' | 'many';
  nullable?: boolean;
  classification?: PortClassification;
  defaultValue?: unknown;
}

export type NodeKind =
  | 'ServiceInput'
  | 'ServiceOutput'
  | 'Constant'
  | 'Parameter'
  | 'PureFunction'
  | 'Transform'
  | 'Validation'
  | 'EntityState'
  | 'ServiceFacade'
  | 'Control'
  | 'ProtocolEvent';

export interface NodeSpec {
  id: string;
  kind: NodeKind;
  type: string;
  version: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: PortSpec[];
  outputs: PortSpec[];
  metadata?: Record<string, unknown>;
}

export interface EdgeSpec {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
  transform?: string;
}

export interface AssetRef {
  package: string;
  export: string;
  version: string;
  source: string;
  contractFingerprint: string;
  category: 'functions' | 'state-graph' | 'audio-midi' | 'services' | 'backend' | 'orchestrations' | 'contracts';
}

export interface TestAssertion {
  port: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'defined';
  value: unknown;
}

export interface ServiceTestCase {
  id: string;
  name: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
  expectedError?: string;
  assertions: TestAssertion[];
  enabled: boolean;
}

export interface SurfaceFieldSpec {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  label: string;
  targetPort: string;
  options?: string[];
  defaultValue?: unknown;
}

export interface UISchema {
  version: string;
  title: string;
  description: string;
  fields: SurfaceFieldSpec[];
  submitActionLabel: string;
  outputBindingPort: string;
}

export interface ServiceDocument {
  schemaVersion: string;
  service: {
    id: string;
    name: string;
    version: string;
    description: string;
    entryNodeId?: string;
    inputPorts: PortSpec[];
    outputPorts: PortSpec[];
  };
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  uiSchema?: UISchema;
  assets: AssetRef[];
  tests: ServiceTestCase[];
  metadata: Record<string, unknown>;
}

export type NodeExecutionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  inputValues: Record<string, unknown>;
  outputValues: Record<string, unknown>;
  durationMs: number;
  error?: string;
  executionOrder: number;
  timestamp: string;
}

export interface ExecutionRun {
  runId: string;
  serviceRevision: string;
  startedAt: string;
  status: 'running' | 'passed' | 'failed';
  input: Record<string, unknown>;
  nodeResults: NodeExecutionResult[];
  logs: string[];
  errors: string[];
  output: Record<string, unknown>;
  durationMs: number;
}
