/**
 * @file KultServiceNode.tsx
 * @description Custom React Flow Node Component for KRNLTS Service IR (§9 of IMPLEMENTATION-SPEC.md).
 * Renders typed input/output handles, status badges, and captured probe values.
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';
import type { NodeSpec, NodeExecutionResult } from '../../../libraries/types/serviceIR';

export interface KultNodeData {
  spec: NodeSpec;
  lastResult?: NodeExecutionResult;
  isSelected?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  number: '#38bdf8', // sky
  string: '#fbbf24', // amber
  boolean: '#34d399', // emerald
  object: '#c084fc', // purple
  array: '#60a5fa', // blue
  any: '#94a3b8', // slate
};

export const KultServiceNode: React.FC<{ data: KultNodeData }> = ({ data }) => {
  const { spec, lastResult, isSelected } = data;
  const status = lastResult?.status || 'idle';

  return (
    <div
      className={`min-w-[220px] rounded-lg border bg-[var(--skipo-surface)] shadow-lg transition-all font-mono select-none overflow-hidden ${
        isSelected
          ? 'border-[var(--skipo-accent)] ring-2 ring-[var(--skipo-accent)]/30'
          : 'border-[var(--skipo-border-color)]/30 hover:border-[var(--skipo-accent)]/60'
      }`}
      data-skipo-label={`Node: ${spec.type}`}
      data-skipo-desc={`KRNLTS Node (${spec.kind}) with ${spec.inputs.length} in / ${spec.outputs.length} out ports`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--skipo-bg)] border-b border-[var(--skipo-border-color)]/20">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Cpu size={13} className="text-[var(--skipo-accent)] shrink-0" />
          <span className="text-xs font-bold truncate text-[var(--skipo-text)]">{spec.type}</span>
        </div>
        <div className="flex items-center gap-1">
          {status === 'passed' && <CheckCircle2 size={12} className="text-[var(--skipo-success)]" />}
          {status === 'failed' && <AlertTriangle size={12} className="text-[var(--skipo-danger)]" />}
          {status === 'running' && <Play size={12} className="text-[var(--skipo-accent)] animate-pulse" />}
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)]">
            {spec.kind === 'ServiceInput' ? 'IN' : spec.kind === 'ServiceOutput' ? 'OUT' : spec.kind.substring(0, 5)}
          </span>
        </div>
      </div>

      {/* Ports Area */}
      <div className="p-2 space-y-1.5 text-[11px]">
        {/* Input Ports */}
        {spec.inputs.map((port, idx) => (
          <div key={port.id} className="relative flex items-center justify-start py-0.5 pl-3">
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              style={{
                background: TYPE_COLORS[port.valueType] || '#94a3b8',
                width: 9,
                height: 9,
                left: -5,
              }}
            />
            <span className="text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)] truncate">
              {port.name}
            </span>
            <span
              className="ml-1 text-[9px] px-1 py-0.2 rounded font-sans uppercase"
              style={{ color: TYPE_COLORS[port.valueType] }}
            >
              {port.valueType}
            </span>
          </div>
        ))}

        {/* Output Ports */}
        {spec.outputs.map((port) => (
          <div key={port.id} className="relative flex items-center justify-end py-0.5 pr-3">
            <span
              className="mr-1 text-[9px] px-1 py-0.2 rounded font-sans uppercase"
              style={{ color: TYPE_COLORS[port.valueType] }}
            >
              {port.valueType}
            </span>
            <span className="text-[var(--skipo-text)] truncate font-semibold">
              {port.name}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              style={{
                background: TYPE_COLORS[port.valueType] || '#94a3b8',
                width: 9,
                height: 9,
                right: -5,
              }}
            />
          </div>
        ))}

        {/* Captured Value Probe in Last Run */}
        {lastResult && lastResult.status === 'passed' && (
          <div className="mt-2 pt-1.5 border-t border-[var(--skipo-border-color)]/20 px-1 text-[10px] text-[var(--skipo-success)] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={10} />
              <span>Eval OK ({lastResult.durationMs}ms)</span>
            </span>
            <span className="text-[var(--skipo-text-muted)] text-[9px]">#{lastResult.executionOrder}</span>
          </div>
        )}
      </div>
    </div>
  );
};
