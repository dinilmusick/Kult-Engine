/**
 * @file NodeInspectorPanel.tsx
 * @description Node & Service Contract Inspector (§10 of IMPLEMENTATION-SPEC.md).
 * Displays typed port contracts, configuration inputs, and runtime probe values with Monaco syntax highlighting.
 */

import React from 'react';
import { Sliders, Trash2, Cpu, Sparkles } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { MonacoCodeViewer } from '../common/MonacoCodeViewer';

export const NodeInspectorPanel: React.FC = () => {
  const {
    document,
    selectedNodeId,
    lastRun,
    updateNodeConfig,
    removeNode,
  } = useServiceDocumentStore();

  const selectedNode = document.nodes.find((n) => n.id === selectedNodeId);
  const nodeResult = lastRun?.nodeResults.find((r) => r.nodeId === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside
        className="w-72 h-full border-l border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] p-4 flex flex-col font-mono text-xs select-none"
        data-skipo-label="Service Inspector"
        data-skipo-desc="Inspection of overall KRNLTS service metadata, nodes count, and wire topology"
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--skipo-border-color)]/20">
          <Cpu size={14} className="text-[var(--skipo-accent)]" />
          <span className="font-bold text-sm text-[var(--skipo-text)]">Service Contract</span>
        </div>

        <div className="space-y-3 text-[11px] text-[var(--skipo-text-muted)]">
          <div>
            <span className="block uppercase text-[9px] font-bold text-[var(--skipo-text)]">Service Name</span>
            <span className="text-[var(--skipo-text)] font-semibold">{document.service.name}</span>
          </div>
          <div>
            <span className="block uppercase text-[9px] font-bold text-[var(--skipo-text)]">Service ID</span>
            <span>{document.service.id}</span>
          </div>
          <div>
            <span className="block uppercase text-[9px] font-bold text-[var(--skipo-text)]">Version</span>
            <span className="text-[var(--skipo-accent)]">{document.service.version}</span>
          </div>
          <div>
            <span className="block uppercase text-[9px] font-bold text-[var(--skipo-text)]">Description</span>
            <p className="mt-0.5 leading-relaxed">{document.service.description}</p>
          </div>
          <div className="pt-2 border-t border-[var(--skipo-border-color)]/20">
            <span className="block uppercase text-[9px] font-bold text-[var(--skipo-text)] mb-1">Topology</span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20">
                <span className="block text-base font-bold text-[var(--skipo-text)]">{document.nodes.length}</span>
                <span className="text-[9px]">Nodes</span>
              </div>
              <div className="p-2 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20">
                <span className="block text-base font-bold text-[var(--skipo-text)]">{document.edges.length}</span>
                <span className="text-[9px]">Wires</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 h-full border-l border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] flex flex-col font-mono text-xs select-none"
      data-skipo-label="Node Inspector"
      data-skipo-desc="Configure selected node parameters, inspect port contracts, and view probe output"
    >
      {/* Header */}
      <div className="p-3 border-b border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)] flex items-center justify-between">
        <div>
          <span className="font-bold text-sm text-[var(--skipo-text)] block truncate">{selectedNode.type}</span>
          <span className="text-[10px] text-[var(--skipo-text-muted)] font-mono">{selectedNode.id}</span>
        </div>
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="p-1.5 rounded hover:bg-[var(--skipo-danger)]/20 text-[var(--skipo-danger)] transition-colors"
          title="Delete Node"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-[11px]">
        {/* Node Kind & Version */}
        <div className="flex items-center justify-between p-2 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20">
          <span className="text-[var(--skipo-text-muted)]">Kind:</span>
          <span className="text-[var(--skipo-accent)] font-bold">{selectedNode.kind}</span>
        </div>

        {/* Inputs list */}
        <div>
          <span className="uppercase text-[10px] font-bold text-[var(--skipo-text)] block mb-1.5">
            Input Ports ({selectedNode.inputs.length})
          </span>
          <div className="space-y-1">
            {selectedNode.inputs.map((p) => (
              <div key={p.id} className="p-1.5 rounded bg-[var(--skipo-bg)] flex items-center justify-between">
                <span className="text-[var(--skipo-text)]">{p.name}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--skipo-surface)] text-[var(--skipo-text-muted)] uppercase">
                  {p.valueType}
                </span>
              </div>
            ))}
            {selectedNode.inputs.length === 0 && (
              <div className="text-[10px] text-[var(--skipo-text-muted)] italic">No input ports</div>
            )}
          </div>
        </div>

        {/* Outputs list */}
        <div>
          <span className="uppercase text-[10px] font-bold text-[var(--skipo-text)] block mb-1.5">
            Output Ports ({selectedNode.outputs.length})
          </span>
          <div className="space-y-1">
            {selectedNode.outputs.map((p) => (
              <div key={p.id} className="p-1.5 rounded bg-[var(--skipo-bg)] flex items-center justify-between">
                <span className="text-[var(--skipo-text)] font-semibold">{p.name}</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--skipo-surface)] text-[var(--skipo-accent)] uppercase">
                  {p.valueType}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Config properties editor */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sliders size={12} className="text-[var(--skipo-accent)]" />
            <span className="uppercase text-[10px] font-bold text-[var(--skipo-text)]">Configuration</span>
          </div>
          <div className="space-y-2">
            {Object.entries(selectedNode.config).map(([key, val]) => (
              <div key={key}>
                <label className="block text-[10px] text-[var(--skipo-text-muted)] mb-0.5">{key}</label>
                <input
                  type={typeof val === 'number' ? 'number' : 'text'}
                  value={String(val)}
                  onChange={(e) => {
                    const parsed = typeof val === 'number' ? Number(e.target.value) : e.target.value;
                    updateNodeConfig(selectedNode.id, { [key]: parsed });
                  }}
                  className="w-full bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 rounded px-2 py-1 text-xs text-[var(--skipo-text)] focus:outline-none focus:border-[var(--skipo-accent)]"
                />
              </div>
            ))}
            {Object.keys(selectedNode.config).length === 0 && (
              <div className="text-[10px] text-[var(--skipo-text-muted)] italic">No configurable parameters</div>
            )}
          </div>
        </div>

        {/* Runtime Probe Result with Monaco */}
        {nodeResult && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[var(--skipo-success)]">
              <span className="font-bold flex items-center gap-1">
                <Sparkles size={11} />
                <span>Captured Runtime Probe</span>
              </span>
              <span className="text-[9px]">{nodeResult.durationMs}ms</span>
            </div>
            <div className="h-32">
              <MonacoCodeViewer
                value={JSON.stringify(nodeResult.outputValues, null, 2)}
                language="json"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
