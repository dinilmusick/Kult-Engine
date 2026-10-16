/**
 * @file graphValidator.ts
 * @description Schema-Based Graph & Contract Validation Engine (§6 & §11).
 * Enforces strict typing, DAG topology, single-driver invariants, and UI schema bindings (< 200 lines).
 */

import type { ServiceDocument, PortSpec, PortValueType } from '../types/serviceIR';

export interface ValidationError {
  id: string;
  level: 'error' | 'warning' | 'info';
  targetType: 'graph' | 'node' | 'edge' | 'port' | 'ui';
  targetId: string;
  message: string;
  code: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
  warningCount: number;
  errorCount: number;
}

export function isTypeCompatible(
  source: PortSpec | PortValueType,
  target: PortSpec | PortValueType,
  transform?: string
): { compatible: boolean; reason?: string } {
  const srcType = typeof source === 'string' ? source : source.valueType;
  const tgtType = typeof target === 'string' ? target : target.valueType;

  // Polymorphic 'any' accepts all connections
  if (srcType === 'any' || tgtType === 'any') return { compatible: true };

  // Explicit adapter transforms bridge distinct types
  if (transform) {
    if (transform === 'toString' && tgtType === 'string') return { compatible: true };
    if (transform === 'toNumber' && tgtType === 'number') return { compatible: true };
    if (transform === 'jsonParse' && srcType === 'string' && (tgtType === 'object' || tgtType === 'array')) return { compatible: true };
  }

  // Exact type match
  if (srcType === tgtType) {
    if (typeof source === 'object' && typeof target === 'object') {
      if (source.cardinality === 'many' && target.cardinality === 'one') {
        return { compatible: false, reason: 'Cardinality mismatch: array cannot bind to scalar port' };
      }
      if (source.nullable && target.nullable === false) {
        return { compatible: false, reason: 'Nullability mismatch: nullable output bound to non-nullable input' };
      }
    }
    return { compatible: true };
  }

  return { compatible: false, reason: `Incompatible types: ${srcType} cannot wire into ${tgtType} without transform` };
}

export function validateServiceDocument(doc: ServiceDocument): ValidationReport {
  const errors: ValidationError[] = [];

  if (!doc.service.name?.trim()) {
    errors.push({ id: 'err-name', level: 'error', targetType: 'graph', targetId: doc.service.id, message: 'Service requires non-empty name', code: 'ERR_EMPTY_NAME' });
  }

  const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));
  const targetPortUsage = new Map<string, string>();

  // 1. Edge & Port Typing Validation
  for (const edge of doc.edges) {
    const srcNode = nodeMap.get(edge.sourceNodeId);
    const tgtNode = nodeMap.get(edge.targetNodeId);

    if (!srcNode || !tgtNode) {
      errors.push({ id: `e-node-${edge.id}`, level: 'error', targetType: 'edge', targetId: edge.id, message: 'Edge references non-existent node', code: 'ERR_MISSING_NODE' });
      continue;
    }

    const outPort = srcNode.outputs.find((p) => p.id === edge.sourcePort);
    const inPort = tgtNode.inputs.find((p) => p.id === edge.targetPort);

    if (!outPort || !inPort) {
      errors.push({ id: `e-port-${edge.id}`, level: 'error', targetType: 'port', targetId: edge.id, message: 'Port not found on node contract', code: 'ERR_PORT_NOT_FOUND' });
      continue;
    }

    const check = isTypeCompatible(outPort, inPort, edge.transform);
    if (!check.compatible) {
      errors.push({ id: `e-type-${edge.id}`, level: 'error', targetType: 'edge', targetId: edge.id, message: check.reason || 'Type mismatch', code: 'ERR_TYPE_MISMATCH' });
    }

    const portKey = `${edge.targetNodeId}:${edge.targetPort}`;
    if (targetPortUsage.has(portKey)) {
      errors.push({ id: `e-multi-${edge.id}`, level: 'error', targetType: 'edge', targetId: edge.id, message: `Input port '${edge.targetPort}' has multiple driver wires`, code: 'ERR_MULTI_DRIVER' });
    } else {
      targetPortUsage.set(portKey, edge.id);
    }
  }

  // 2. Cycle Detection (Strict DAG)
  const adjacency = new Map<string, string[]>();
  for (const n of doc.nodes) adjacency.set(n.id, []);
  for (const e of doc.edges) adjacency.get(e.sourceNodeId)?.push(e.targetNodeId);

  const visited = new Set<string>();
  const inStack = new Set<string>();
  function hasCycle(curr: string): boolean {
    visited.add(curr);
    inStack.add(curr);
    for (const neighbor of adjacency.get(curr) || []) {
      if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
      if (inStack.has(neighbor)) return true;
    }
    inStack.delete(curr);
    return false;
  }

  for (const n of doc.nodes) {
    if (!visited.has(n.id) && hasCycle(n.id)) {
      errors.push({ id: `err-cycle-${n.id}`, level: 'error', targetType: 'graph', targetId: n.id, message: 'Graph topology contains a cyclic dependency loop', code: 'ERR_CYCLE' });
      break;
    }
  }

  // 3. UI Schema Binding Validation
  if (doc.uiSchema) {
    const serviceInputs = doc.service.inputPorts;
    const inputNode = doc.nodes.find((n) => n.kind === 'ServiceInput');
    const availablePorts = new Map<string, PortSpec>();
    for (const p of serviceInputs) availablePorts.set(p.name, p);
    if (inputNode) {
      for (const p of inputNode.outputs) availablePorts.set(p.name, p);
    }

    for (const f of doc.uiSchema.fields) {
      const boundPort = availablePorts.get(f.targetPort);
      if (!boundPort) {
        errors.push({ id: `ui-bind-${f.id}`, level: 'error', targetType: 'ui', targetId: f.id, message: `UI field '${f.label}' binds to missing port '${f.targetPort}'`, code: 'ERR_UI_PORT_MISSING' });
      } else {
        const expectedType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string';
        if (boundPort.valueType !== 'any' && boundPort.valueType !== expectedType) {
          errors.push({ id: `ui-type-${f.id}`, level: 'error', targetType: 'ui', targetId: f.id, message: `UI field type (${f.type}) does not match port type (${boundPort.valueType})`, code: 'ERR_UI_TYPE_MISMATCH' });
        }
      }
    }
  }

  // 4. Input & Output presence warnings
  if (!doc.nodes.some((n) => n.kind === 'ServiceInput')) {
    errors.push({ id: 'w-no-in', level: 'warning', targetType: 'graph', targetId: doc.service.id, message: 'Service missing ServiceInput node', code: 'WARN_NO_INPUT' });
  }
  if (!doc.nodes.some((n) => n.kind === 'ServiceOutput')) {
    errors.push({ id: 'w-no-out', level: 'warning', targetType: 'graph', targetId: doc.service.id, message: 'Service missing ServiceOutput node', code: 'WARN_NO_OUTPUT' });
  }

  const errorCount = errors.filter((e) => e.level === 'error').length;
  const warningCount = errors.filter((e) => e.level === 'warning').length;
  return { isValid: errorCount === 0, errors, errorCount, warningCount };
}
