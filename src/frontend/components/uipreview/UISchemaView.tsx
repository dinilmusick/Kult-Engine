/**
 * @file UISchemaView.tsx
 * @description Visual UI Schema Builder & Live Interactive Surface (§15 & §16 of IMPLEMENTATION-SPEC.md).
 * Enables visual construction of fields, controls, actions, and binding validation against SERVICE_IR (< 200 lines).
 */

import React, { useState } from 'react';
import { Play, Plus, Trash2, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import type { SurfaceFieldSpec, UISchema } from '../../../libraries/types/serviceIR';

export const UISchemaView: React.FC = () => {
  const { document, runService, isRunning, updateUISchema } = useServiceDocumentStore();
  const schema: UISchema = document.uiSchema || {
    version: '1.0.0',
    title: `${document.service.name} Control Surface`,
    description: 'Interactive UI controls bound to KRNLTS service ports',
    fields: [],
    submitActionLabel: 'Execute Service',
    outputBindingPort: document.service.outputPorts[0]?.name || 'result',
  };

  const availableInputPorts = document.service.inputPorts.map((p) => p.name);
  const availableOutputPorts = document.service.outputPorts.map((p) => p.name);

  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of schema.fields) init[f.targetPort] = f.defaultValue ?? '';
    return init;
  });
  const [liveOutput, setLiveOutput] = useState<Record<string, any> | null>(null);

  const handleAddField = () => {
    const targetPort = availableInputPorts[schema.fields.length % availableInputPorts.length] || 'input';
    const newField: SurfaceFieldSpec = {
      id: `f-${Date.now().toString(36)}`,
      label: `Field ${schema.fields.length + 1}`,
      type: 'number',
      targetPort,
      defaultValue: 0,
    };
    updateUISchema({ ...schema, fields: [...schema.fields, newField] });
  };

  const handleRemoveField = (id: string) => {
    updateUISchema({ ...schema, fields: schema.fields.filter((f) => f.id !== id) });
  };

  const handleUpdateField = (id: string, updates: Partial<SurfaceFieldSpec>) => {
    updateUISchema({
      ...schema,
      fields: schema.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const run = await runService(formValues);
    setLiveOutput(run.output);
  };

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-x divide-[var(--skipo-border-color)]/20 font-mono text-xs select-none">
      {/* Left: Visual UI Schema Builder */}
      <div className="p-3 bg-[var(--skipo-bg)] flex flex-col overflow-y-auto space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--skipo-border-color)]/20">
          <div className="flex items-center gap-1.5 font-bold text-[var(--skipo-text)]">
            <Layers size={13} className="text-[var(--skipo-accent)]" />
            <span>UI Schema Builder</span>
          </div>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--skipo-accent)] text-black font-bold text-[10px]"
          >
            <Plus size={11} />
            <span>Add Field</span>
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-[var(--skipo-text-muted)] block mb-0.5">Surface Title</label>
            <input
              type="text"
              value={schema.title}
              onChange={(e) => updateUISchema({ ...schema, title: e.target.value })}
              className="w-full bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 rounded px-2 py-1 text-[11px] text-[var(--skipo-text)]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--skipo-text-muted)] block mb-0.5">Submit Action Label</label>
            <input
              type="text"
              value={schema.submitActionLabel}
              onChange={(e) => updateUISchema({ ...schema, submitActionLabel: e.target.value })}
              className="w-full bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 rounded px-2 py-1 text-[11px] text-[var(--skipo-text)]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--skipo-text-muted)] block mb-0.5">Output Binding Port</label>
            <select
              value={schema.outputBindingPort}
              onChange={(e) => updateUISchema({ ...schema, outputBindingPort: e.target.value })}
              className="w-full bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 rounded px-2 py-1 text-[11px] text-[var(--skipo-text)]"
            >
              {availableOutputPorts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bound Fields List */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--skipo-border-color)]/20">
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block">
            Configured Fields ({schema.fields.length})
          </span>
          {schema.fields.map((f) => {
            const isBoundValid = availableInputPorts.includes(f.targetPort);
            return (
              <div key={f.id} className="p-2 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => handleUpdateField(f.id, { label: e.target.value })}
                    className="bg-transparent font-bold text-[var(--skipo-text)] border-b border-transparent hover:border-[var(--skipo-border-color)]/40 focus:outline-none"
                  />
                  <button onClick={() => handleRemoveField(f.id)} className="text-[var(--skipo-danger)] p-0.5">
                    <Trash2 size={11} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[var(--skipo-text-muted)] block">Type</span>
                    <select
                      value={f.type}
                      onChange={(e) => handleUpdateField(f.id, { type: e.target.value as any })}
                      className="w-full bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20 rounded px-1 py-0.5 text-[var(--skipo-text)]"
                    >
                      <option value="number">number</option>
                      <option value="text">text</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[var(--skipo-text-muted)] block">Target Port</span>
                    <select
                      value={f.targetPort}
                      onChange={(e) => handleUpdateField(f.id, { targetPort: e.target.value })}
                      className="w-full bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/20 rounded px-1 py-0.5 text-[var(--skipo-text)]"
                    >
                      {availableInputPorts.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  {isBoundValid ? (
                    <span className="text-[var(--skipo-success)] flex items-center gap-1"><CheckCircle2 size={10} /> Valid Binding</span>
                  ) : (
                    <span className="text-[var(--skipo-danger)] flex items-center gap-1"><AlertTriangle size={10} /> Unbound Port</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Live Interactive Surface Rendering */}
      <div className="p-4 bg-[var(--skipo-surface)] flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="pb-2 mb-3 border-b border-[var(--skipo-border-color)]/20 flex items-center justify-between">
            <span className="font-bold text-sm text-[var(--skipo-text)]">{schema.title}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--skipo-success)]/10 text-[var(--skipo-success)] font-bold">LIVE PREVIEW</span>
          </div>

          <form onSubmit={handleRun} className="space-y-3">
            {schema.fields.map((f) => (
              <div key={f.id}>
                <label className="block text-[11px] font-semibold text-[var(--skipo-text)] mb-1">{f.label}</label>
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={formValues[f.targetPort] ?? ''}
                  onChange={(e) => {
                    const val = f.type === 'number' ? Number(e.target.value) : e.target.value;
                    setFormValues((prev) => ({ ...prev, [f.targetPort]: val }));
                  }}
                  className="w-full bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 rounded px-2.5 py-1.5 text-xs text-[var(--skipo-text)] focus:outline-none focus:border-[var(--skipo-accent)]"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isRunning}
              className="w-full mt-2 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
            >
              <Play size={12} />
              <span>{isRunning ? 'Executing Graph...' : schema.submitActionLabel}</span>
            </button>
          </form>
        </div>

        {liveOutput && (
          <div className="mt-4 p-3 rounded border border-[var(--skipo-success)]/40 bg-[var(--skipo-bg)]">
            <span className="text-[10px] font-bold text-[var(--skipo-success)] block mb-1 uppercase">
              Result ({schema.outputBindingPort}):
            </span>
            <div className="text-sm font-bold text-[var(--skipo-text)]">
              {String(liveOutput[schema.outputBindingPort] ?? JSON.stringify(liveOutput))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
