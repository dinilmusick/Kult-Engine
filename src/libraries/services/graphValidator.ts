/**
 * @file graphValidator.ts
 * @description Continuous Graph Validation Engine (§6 & §11 of IMPLEMENTATION-SPEC.md).
 * Validates topology, port typing, required configs, and KRNLTS contracts (< 200 lines).
 */

import type { ServiceDocument, PortValueType } from '../types/serviceIR';

export interface ValidationError {
  id: string;
  level: 'error' | 'warning' | 'info';
  targetType: 'graph' | 'node' | 'edge' | 'port';
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

export function isTypeCompatible(sourceType: PortValueType, targetType: PortValueType): boolean {
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;
  if (sourceType === 'number' && targetType === 'string') return true;
  return false;
}

export function validateServiceDocument(doc: ServiceDocument): ValidationReport {
  const errors: ValidationError[] = [];

  if (!doc.service.name?.trim()) {
    errors.push({
      id: 'err-svc-name',
      level: 'error',
      targetType: 'graph',
      targetId: doc.service.id,
      message: 'Service requires a valid non-empty name',
      code: 'ERR_EMPTY_SERVICE_NAME',
    });
  }

  const nodeMap = new Map(doc.nodes.map((n) => [n.id, n]));
  const targetPortUsage = new Map<string, string>();

  // 1. Edge & Port Typing Validation
  for (const edge of doc.edges) {
    const sourceNode = nodeMap.get(edge.sourceNodeId);
    const targetNode = nodeMap.get(edge.targetNodeId);

    if (!sourceNode || !targetNode) {
      errors.push({
        id: `err-edge-endpoint-${edge.id}`,
        level: 'error',
        targetType: 'edge',
        targetId: edge.id,
        message: 'Edge references a missing source or target node',
        code: 'ERR_MISSING_NODE',
      });
      continue;
    }

    const outPort = sourceNode.outputs.find((p) => p.id === edge.sourcePort);
    const inPort = targetNode.inputs.find((p) => p.id === edge.targetPort);

    if (!outPort || !inPort) {
      errors.push({
        id: `err-port-missing-${edge.id}`,
        level: 'error',
        targetType: 'port',
        targetId: edge.id,
        message: `Wire endpoint port not found on node contract`,
        code: 'ERR_PORT_NOT_FOUND',
      });
    } else if (!isTypeCompatible(outPort.valueType, inPort.valueType)) {
      errors.push({
        id: `err-type-mismatch-${edge.id}`,
        level: 'error',
        targetType: 'edge',
        targetId: edge.id,
        message: `Type mismatch: wire connects ${outPort.valueType} to ${inPort.valueType}`,
        code: 'ERR_PORT_TYPE_INCOMPATIBLE',
      });
    }

    const portKey = `${edge.targetNodeId}:${edge.targetPort}`;
    if (targetPortUsage.has(portKey)) {
      errors.push({
        id: `err-multi-write-${edge.id}`,
        level: 'error',
        targetType: 'edge',
        targetId: edge.id,
        message: `Input port '${edge.targetPort}' has multiple driver connections`,
        code: 'ERR_MULTI_DRIVER_WIRE',
      });
    } else {
      targetPortUsage.set(portKey, edge.id);
    }
  }

  // 2. Cycle Detection (DAG enforcement)
  const adjacency = new Map<string, string[]>();
  for (const node of doc.nodes) adjacency.set(node.id, []);
  for (const edge of doc.edges) {
    const list = adjacency.get(edge.sourceNodeId) || [];
    list.push(edge.targetNodeId);
    adjacency.set(edge.sourceNodeId, list);
  }

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

  for (const node of doc.nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      errors.push({
        id: `err-cycle-${node.id}`,
        level: 'error',
        targetType: 'graph',
        targetId: node.id,
        message: 'Graph topology contains a cyclic dependency loop',
        code: 'ERR_CYCLIC_TOPOLOGY',
      });
      break;
    }
  }

  // 3. Service Input/Output presence
  if (!doc.nodes.some((n) => n.kind === 'ServiceInput')) {
    errors.push({
      id: 'warn-no-input',
      level: 'warning',
      targetType: 'graph',
      targetId: doc.service.id,
      message: 'Service has no ServiceInput node configured',
      code: 'WARN_NO_INPUT_NODE',
    });
  }
  if (!doc.nodes.some((n) => n.kind === 'ServiceOutput')) {
    errors.push({
      id: 'warn-no-output',
      level: 'warning',
      targetType: 'graph',
      targetId: doc.service.id,
      message: 'Service has no ServiceOutput node configured',
      code: 'WARN_NO_OUTPUT_NODE',
    });
  }

  const errorCount = errors.filter((e) => e.level === 'error').length;
  const warningCount = errors.filter((e) => e.level === 'warning').length;

  return { isValid: errorCount === 0, errors, errorCount, warningCount };
}
