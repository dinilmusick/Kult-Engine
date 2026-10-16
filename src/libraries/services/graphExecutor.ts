/**
 * @file graphExecutor.ts
 * @description Real Execution & Debugger Engine (§12 & §14 of IMPLEMENTATION-SPEC.md).
 * Topologically sorts and evaluates SERVICE_IR nodes, capturing execution traces.
 */

import type { ServiceDocument, ExecutionRun, NodeExecutionResult } from '../types/serviceIR';
import { evaluateNode } from './nodeEvaluators';

export async function executeServiceGraph(
  doc: ServiceDocument,
  suppliedInputs: Record<string, unknown> = {}
): Promise<ExecutionRun> {
  const startTime = Date.now();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nodeResults: NodeExecutionResult[] = [];
  const logs: string[] = [`[KRNLTS Engine] Starting execution run ${runId}`];
  const errors: string[] = [];

  // Calculate inDegree and outgoing edges for topological sorting
  const inDegree = new Map<string, number>();
  const outgoingEdges = new Map<string, typeof doc.edges>();
  for (const node of doc.nodes) {
    inDegree.set(node.id, 0);
    outgoingEdges.set(node.id, []);
  }

  for (const edge of doc.edges) {
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
    const outs = outgoingEdges.get(edge.sourceNodeId) || [];
    outs.push(edge);
    outgoingEdges.set(edge.sourceNodeId, outs);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(nodeId);
  }

  const executionOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    executionOrder.push(curr);
    for (const edge of outgoingEdges.get(curr) || []) {
      const currentDeg = inDegree.get(edge.targetNodeId)! - 1;
      inDegree.set(edge.targetNodeId, currentDeg);
      if (currentDeg === 0) queue.push(edge.targetNodeId);
    }
  }

  for (const node of doc.nodes) {
    if (!executionOrder.includes(node.id)) executionOrder.push(node.id);
  }

  // wireValues: `${nodeId}:${portId}` -> value
  const wireValues = new Map<string, unknown>();
  let orderIndex = 1;
  const finalServiceOutputs: Record<string, unknown> = {};

  for (const nodeId of executionOrder) {
    const node = doc.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const nodeStart = Date.now();
    const nodeInputValues: Record<string, unknown> = {};

    // Collect inputs from incoming wires
    const incomingEdges = doc.edges.filter((e) => e.targetNodeId === nodeId);
    for (const edge of incomingEdges) {
      const srcVal = wireValues.get(`${edge.sourceNodeId}:${edge.sourcePort}`);
      const targetPortSpec = node.inputs.find((p) => p.id === edge.targetPort);
      const portName = targetPortSpec ? targetPortSpec.name : edge.targetPort;
      nodeInputValues[portName] = srcVal;
    }

    // If ServiceInput node, inject suppliedInputs
    if (node.kind === 'ServiceInput') {
      for (const p of node.outputs) {
        if (suppliedInputs[p.name] !== undefined) {
          nodeInputValues[p.name] = suppliedInputs[p.name];
        } else if (p.defaultValue !== undefined) {
          nodeInputValues[p.name] = p.defaultValue;
        }
      }
    }

    // Defaults for unsupplied inputs
    for (const inPort of node.inputs) {
      if (nodeInputValues[inPort.name] === undefined && inPort.defaultValue !== undefined) {
        nodeInputValues[inPort.name] = inPort.defaultValue;
      }
    }

    try {
      const nodeOutputs = evaluateNode(node.type, nodeInputValues, node.config);
      const nodeDuration = Date.now() - nodeStart;

      for (const outPort of node.outputs) {
        const val = nodeOutputs[outPort.name] ?? nodeOutputs[outPort.id];
        wireValues.set(`${node.id}:${outPort.id}`, val);
      }

      if (node.kind === 'ServiceOutput') {
        Object.assign(finalServiceOutputs, nodeInputValues);
      }

      nodeResults.push({
        nodeId: node.id,
        status: 'passed',
        inputValues: nodeInputValues,
        outputValues: nodeOutputs,
        durationMs: nodeDuration,
        executionOrder: orderIndex++,
        timestamp: new Date().toISOString(),
      });
      logs.push(`[${node.type}] Node ${node.id} evaluated in ${nodeDuration}ms`);
    } catch (err: any) {
      const errorMsg = err?.message || 'Execution error';
      errors.push(`Node ${node.id} (${node.type}) failed: ${errorMsg}`);
      nodeResults.push({
        nodeId: node.id,
        status: 'failed',
        inputValues: nodeInputValues,
        outputValues: {},
        durationMs: Date.now() - nodeStart,
        error: errorMsg,
        executionOrder: orderIndex++,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const durationMs = Date.now() - startTime;
  logs.push(`[KRNLTS Engine] Execution finished in ${durationMs}ms`);

  return {
    runId,
    serviceRevision: doc.service.version || '1.0.0',
    startedAt: new Date(startTime).toISOString(),
    status: errors.length === 0 ? 'passed' : 'failed',
    input: suppliedInputs,
    nodeResults,
    logs,
    errors,
    output: finalServiceOutputs,
    durationMs,
  };
}
