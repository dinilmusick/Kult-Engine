/**
 * @file serviceCodeCompiler.ts
 * @description Compiles SERVICE_IR graph topology into executable KRNLTS pipeline code (§3 & §19).
 */

import type { ServiceDocument } from '../types/serviceIR';

export function compileServicePipelineCode(doc: ServiceDocument): string {
  // Topological sort
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, typeof doc.edges>();
  for (const n of doc.nodes) {
    inDegree.set(n.id, 0);
    outgoing.set(n.id, []);
  }
  for (const e of doc.edges) {
    inDegree.set(e.targetNodeId, (inDegree.get(e.targetNodeId) || 0) + 1);
    outgoing.get(e.sourceNodeId)?.push(e);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);
    for (const e of outgoing.get(curr) || []) {
      const nextDeg = (inDegree.get(e.targetNodeId) || 1) - 1;
      inDegree.set(e.targetNodeId, nextDeg);
      if (nextDeg === 0) queue.push(e.targetNodeId);
    }
  }

  const lines: string[] = [
    '    // Wire values map: `${nodeId}:${portId}` -> value',
    '    const wireValues = new Map<string, any>();',
    '    const finalOutputs: Record<string, any> = {};',
  ];

  for (const nodeId of order) {
    const node = doc.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const cleanId = node.id.replace(/[^a-zA-Z0-9]/g, '_');

    lines.push(`\n    // Node: ${node.type} (${node.id})`);
    lines.push(`    const inputs_${cleanId}: Record<string, any> = {};`);

    const inEdges = doc.edges.filter((e) => e.targetNodeId === nodeId);
    for (const e of inEdges) {
      lines.push(`    inputs_${cleanId}['${e.targetPort}'] = wireValues.get('${e.sourceNodeId}:${e.sourcePort}');`);
    }

    if (node.kind === 'ServiceInput') {
      for (const p of node.outputs) {
        lines.push(`    inputs_${cleanId}['${p.name}'] = inputs['${p.name}'] ?? ${JSON.stringify(p.defaultValue ?? null)};`);
        lines.push(`    wireValues.set('${node.id}:${p.id}', inputs_${cleanId}['${p.name}']);`);
      }
    } else if (node.type === 'ServiceAFacade' || node.type === 'ServiceA') {
      lines.push(`    const out_${cleanId} = await ServiceAFacade.execute(inputs_${cleanId}['operation'] || 'add', inputs_${cleanId});`);
      lines.push(`    wireValues.set('${node.id}:result', out_${cleanId}?.result ?? 0);`);
    } else if (node.type === 'ServiceBFacade' || node.type === 'ServiceB') {
      lines.push(`    const out_${cleanId} = await ServiceBFacade.execute(inputs_${cleanId}['operation'] || 'increment', inputs_${cleanId});`);
      lines.push(`    wireValues.set('${node.id}:count', out_${cleanId}?.count ?? 0);`);
      lines.push(`    wireValues.set('${node.id}:lastUpdated', out_${cleanId}?.lastUpdated ?? Date.now());`);
    } else if (node.type === 'FunctionsServiceFacade') {
      lines.push(`    const out_${cleanId} = { formattedText: toKebabCase(String(inputs_${cleanId}['inputText'] || '')) };`);
      lines.push(`    wireValues.set('${node.id}:outText', out_${cleanId}.formattedText);`);
    } else if (node.kind === 'ServiceOutput') {
      for (const p of node.inputs) {
        lines.push(`    finalOutputs['${p.name}'] = inputs_${cleanId}['${p.name}'] ?? inputs_${cleanId}['${p.id}'];`);
      }
    } else {
      // Generic node evaluation
      lines.push(`    const out_${cleanId} = { ...inputs_${cleanId} };`);
      for (const p of node.outputs) {
        lines.push(`    wireValues.set('${node.id}:${p.id}', out_${cleanId}['${p.name}'] ?? null);`);
      }
    }
  }

  lines.push('\n    return finalOutputs as any;');
  return lines.join('\n');
}
