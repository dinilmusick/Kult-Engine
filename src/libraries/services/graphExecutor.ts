/**
 * @file graphExecutor.ts
 * @description Real Execution & Debugger Engine (§10, §12 & §14 of IMPLEMENTATION-SPEC.md).
 * Enforces pre-execution validation, strict topological order, and authentic KRNLTS evaluation.
 */

import type { ServiceDocument, ExecutionRun, NodeExecutionResult } from '../types/serviceIR';
import { validateServiceDocument } from './graphValidator';
import { executeKrnlNode } from './krnlRuntime';

export async function executeServiceGraph(
  doc: ServiceDocument,
  suppliedInputs: Record<string, unknown> = {}
): Promise<ExecutionRun> {
  const startTime = Date.now();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nodeResults: NodeExecutionResult[] = [];
  const logs: string[] = [`[KRNLTS] Starting authoritative service execution: ${doc.service.name}`];
  const errors: string[] = [];

  // §10: Strict Pre-Execution Validation Gate — NO EXECUTION ON INVALID GRAPH
  const validation = validateServiceDocument(doc);
  if (!validation.isValid) {
    const errorMsgs = validation.errors.map((e) => `[${e.code}] ${e.message}`);
    return {
      runId,
      serviceRevision: doc.service.version || '1.0.0',
      startedAt: new Date(startTime).toISOString(),
      status: 'failed',
      input: suppliedInputs,
      nodeResults: [],
      logs: [...logs, '[KRNLTS] Execution blocked: Graph has fatal validation errors'],
      errors: errorMsgs,
      output: {},
      durationMs: Date.now() - startTime,
    };
  }

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

    // Inject service inputs for ServiceInput nodes
    if (node.kind === 'ServiceInput') {
      for (const p of node.outputs) {
        if (suppliedInputs[p.name] !== undefined) {
          nodeInputValues[p.name] = suppliedInputs[p.name];
        } else if (p.defaultValue !== undefined) {
          nodeInputValues[p.name] = p.defaultValue;
        }
      }
    }

    // Apply defaults for unsupplied inputs
    for (const inPort of node.inputs) {
      if (nodeInputValues[inPort.name] === undefined && inPort.defaultValue !== undefined) {
        nodeInputValues[inPort.name] = inPort.defaultValue;
      }
    }

    try {
      // Execute authentic KRNLTS node callable
      const nodeOutputs = await executeKrnlNode(node, nodeInputValues, node.config);
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
      logs.push(`[${node.type}] Node ${node.id} executed successfully (${nodeDuration}ms)`);
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
      break; // Halt on first unhandled node failure
    }
  }

  const durationMs = Date.now() - startTime;
  logs.push(`[KRNLTS] Pipeline execution finished in ${durationMs}ms`);

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
