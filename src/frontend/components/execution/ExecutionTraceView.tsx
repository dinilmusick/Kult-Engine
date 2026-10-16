/**
 * @file ExecutionTraceView.tsx
 * @description Node-by-node execution trace and debug view (§12 of IMPLEMENTATION-SPEC.md).
 */

import React from 'react';
import { Play, CheckCircle, AlertOctagon, Terminal } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';

export const ExecutionTraceView: React.FC = () => {
  const { lastRun, isRunning, runService } = useServiceDocumentStore();

  return (
    <div className="h-full flex flex-col font-mono text-xs select-none">
      {/* Action Header */}
      <div className="flex items-center justify-between p-2.5 bg-[var(--skipo-bg)] border-b border-[var(--skipo-border-color)]/20">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[var(--skipo-accent)]" />
          <span className="font-bold text-[var(--skipo-text)]">Execution Trace & Debugger</span>
          {lastRun && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              lastRun.status === 'passed' ? 'bg-[var(--skipo-success)]/20 text-[var(--skipo-success)]' : 'bg-[var(--skipo-danger)]/20 text-[var(--skipo-danger)]'
            }`}>
              {lastRun.status} in {lastRun.durationMs}ms
            </span>
          )}
        </div>

        <button
          onClick={() => runService()}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs hover:opacity-90 disabled:opacity-50"
        >
          <Play size={12} />
          <span>{isRunning ? 'Running...' : 'Run Service'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-[var(--skipo-border-color)]/20 overflow-hidden">
        {/* Node Results Table */}
        <div className="overflow-y-auto p-2">
          <span className="text-[10px] font-bold text-[var(--skipo-text-muted)] uppercase block mb-1.5">
            Node Step Pipeline
          </span>
          <div className="space-y-1.5">
            {lastRun?.nodeResults.map((res) => (
              <div
                key={res.nodeId}
                className="p-2 rounded border border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {res.status === 'passed' ? (
                      <CheckCircle size={12} className="text-[var(--skipo-success)]" />
                    ) : (
                      <AlertOctagon size={12} className="text-[var(--skipo-danger)]" />
                    )}
                    <span className="font-bold text-[var(--skipo-text)]">{res.nodeId}</span>
                  </div>
                  <span className="text-[10px] text-[var(--skipo-text-muted)]">{res.durationMs}ms</span>
                </div>
                <div className="text-[10px] bg-black/30 p-1.5 rounded overflow-x-auto text-[var(--skipo-text-muted)]">
                  <div>Outputs: {JSON.stringify(res.outputValues)}</div>
                </div>
              </div>
            ))}
            {!lastRun && (
              <div className="p-4 text-center text-[var(--skipo-text-muted)] italic">
                Press "Run Service" to evaluate the service graph and view step-by-step traces.
              </div>
            )}
          </div>
        </div>

        {/* Engine Logs & Output Console */}
        <div className="overflow-y-auto p-2 bg-black/40 flex flex-col">
          <span className="text-[10px] font-bold text-[var(--skipo-text-muted)] uppercase block mb-1.5">
            Engine Console Logs
          </span>
          <div className="space-y-1 font-mono text-[10px] text-[var(--skipo-text-muted)] flex-1">
            {lastRun?.logs.map((log, idx) => (
              <div key={idx} className="leading-tight">
                <span className="text-[var(--skipo-accent)]">&gt;</span> {log}
              </div>
            ))}
            {lastRun?.errors.map((err, idx) => (
              <div key={`err-${idx}`} className="text-[var(--skipo-danger)] leading-tight font-bold">
                ! {err}
              </div>
            ))}
            {!lastRun && (
              <div className="text-[var(--skipo-text-muted)] italic">Waiting for engine execution...</div>
            )}
          </div>

          {lastRun?.output && Object.keys(lastRun.output).length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--skipo-border-color)]/20">
              <span className="text-[10px] font-bold text-[var(--skipo-accent)] block mb-1">
                Final Service Output:
              </span>
              <pre className="text-[10px] text-[var(--skipo-text)] bg-black/60 p-2 rounded max-h-24 overflow-y-auto">
                {JSON.stringify(lastRun.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
