/**
 * @file UISchemaView.tsx
 * @description UI Schema Authoring & Live Interactive Surface Preview (§15 & §16 of IMPLEMENTATION-SPEC.md).
 * Binds UI inputs and action triggers directly to the KRNLTS service execution graph.
 */

import React, { useState } from 'react';
import { Play, Sparkles, LayoutTemplate, Layers } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';

export const UISchemaView: React.FC = () => {
  const { document, runService, isRunning } = useServiceDocumentStore();
  const schema = document.uiSchema;

  // Local form state bound to UI schema fields
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (schema?.fields) {
      for (const field of schema.fields) {
        initial[field.targetPort] = field.defaultValue ?? 0;
      }
    }
    return initial;
  });

  const [liveOutput, setLiveOutput] = useState<Record<string, any> | null>(null);

  if (!schema) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center text-center font-mono text-xs text-[var(--skipo-text-muted)]">
        <LayoutTemplate size={28} className="mb-2 text-[var(--skipo-accent)]" />
        <p>No UI Schema configured for this service yet.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const run = await runService(formValues);
    setLiveOutput(run.output);
  };

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 divide-x divide-[var(--skipo-border-color)]/20 font-mono text-xs select-none">
      {/* Left: UI Schema Bindings Contract */}
      <div className="p-4 overflow-y-auto bg-[var(--skipo-bg)] flex flex-col">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--skipo-border-color)]/20">
          <Layers size={14} className="text-[var(--skipo-accent)]" />
          <span className="font-bold text-[var(--skipo-text)]">UI Schema Bindings</span>
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block">Surface Title</span>
            <span className="text-[var(--skipo-text)] font-semibold">{schema.title}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block">Description</span>
            <p className="text-[var(--skipo-text-muted)] text-[11px]">{schema.description}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block mb-1">
              Bound Input Fields ({schema.fields.length})
            </span>
            <div className="space-y-1.5">
              {schema.fields.map((field) => (
                <div key={field.id} className="p-2 rounded bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/20 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-[var(--skipo-text)] block">{field.label}</span>
                    <span className="text-[9px] text-[var(--skipo-text-muted)]">Target Port: <span className="text-[var(--skipo-accent)]">{field.targetPort}</span></span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--skipo-bg)] text-[var(--skipo-text)] uppercase font-bold">
                    {field.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block">Output Binding Port</span>
            <span className="text-[var(--skipo-accent)] font-bold">{schema.outputBindingPort}</span>
          </div>
        </div>
      </div>

      {/* Right: Live Interactive Form Rendering */}
      <div className="p-4 overflow-y-auto bg-[var(--skipo-surface)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--skipo-border-color)]/20">
            <span className="font-bold text-[var(--skipo-text)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--skipo-accent)]" />
              <span>Live Surface Preview</span>
            </span>
            <span className="text-[9px] text-[var(--skipo-success)] font-bold uppercase">Connected to Graph</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {schema.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-[11px] font-semibold text-[var(--skipo-text)] mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formValues[field.targetPort] ?? ''}
                  onChange={(e) => {
                    const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                    setFormValues((prev) => ({ ...prev, [field.targetPort]: val }));
                  }}
                  className="w-full bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 rounded px-2.5 py-1.5 text-xs text-[var(--skipo-text)] focus:outline-none focus:border-[var(--skipo-accent)] font-mono"
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

        {/* Live Bound Output Display */}
        {liveOutput && (
          <div className="mt-4 p-3 rounded border border-[var(--skipo-success)]/40 bg-[var(--skipo-bg)]">
            <span className="text-[10px] font-bold text-[var(--skipo-success)] block mb-1 uppercase tracking-wide">
              Live Bound Result ({schema.outputBindingPort}):
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
