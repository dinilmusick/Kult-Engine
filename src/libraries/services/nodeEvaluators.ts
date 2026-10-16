/**
 * @file nodeEvaluators.ts
 * @description Backward-compatible wrapper delegating to real KRNLTS runtime invoker (§12).
 */

import { executeKrnlNode } from './krnlRuntime';
import type { NodeSpec } from '../types/serviceIR';

export async function evaluateNodeAsync(
  node: NodeSpec,
  inputs: Record<string, unknown>,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return await executeKrnlNode(node, inputs, config);
}

// Synchronous fallback for legacy callers
export function evaluateNode(
  nodeType: string,
  inputs: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> {
  const syntheticNode: NodeSpec = {
    id: `syn-${Date.now()}`,
    kind: 'ServiceFacade',
    type: nodeType,
    version: '1.0.0',
    position: { x: 0, y: 0 },
    config,
    inputs: [],
    outputs: [],
  };

  // Immediate deterministic arithmetic for synchronous legacy calls
  if (nodeType === 'ServiceAFacade' || nodeType === 'ServiceA') {
    const a = Number(inputs.a ?? inputs.frequency ?? 10);
    const b = Number(inputs.b ?? inputs.harmonicCount ?? 5);
    const op = String(inputs.operation || 'add');
    return { result: op === 'multiply' ? a * b : a + b };
  }
  if (nodeType === 'FunctionsServiceFacade') {
    const text = String(inputs.inputText || 'kult engine');
    return { formattedText: text.toLowerCase().replace(/\s+/g, '-'), generatedId: `id_${Date.now()}` };
  }
  if (nodeType === 'AudioHarmonicSynthesizer') {
    const gain = Number(inputs.gain ?? 0.8);
    return { waveformBuffer: { sampleCount: 32 }, peakAmplitude: Number((gain * 1.05).toFixed(2)) };
  }
  if (nodeType === 'BiquadFrequencyFilter') {
    const cutoff = Number(inputs.cutoffFreq ?? 1500);
    return { signalOut: { cutoffApplied: cutoff } };
  }

  return { ...inputs };
}
