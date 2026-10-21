import React from 'react';
import { Play, Loader2, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import type { ServiceDocument } from '../../../libraries/types/serviceIR';
import type { FunctionalityAsset } from './functionalityEditorModel';
import { buildExecutionProject } from './kultExecutionModel';
import { runInWebContainer } from './kultWebContainer';

export const ServiceTestRunner: React.FC<{
  service: ServiceDocument;
  functionalities: FunctionalityAsset[];
  orchestrations: Array<{ id: string; name: string; description: string; functionalityIds: string[] }>;
  onClose: () => void;
}> = ({ service, functionalities, orchestrations, onClose }) => {
  const [mode, setMode] = React.useState<'functionality' | 'service'>('functionality');
  const [targetId, setTargetId] = React.useState(functionalities[0]?.id || '');
  const [orchestrationId, setOrchestrationId] = React.useState(orchestrations[0]?.id || '');
  const [input, setInput] = React.useState('{}');
  const [running, setRunning] = React.useState(false);
  const [logs, setLogs] = React.useState('');
  const [result, setResult] = React.useState<{ ok: boolean; output?: unknown; error?: string; durationMs?: number } | null>(null);

  const selectedFunctionality = functionalities.find(item => item.id === targetId);
  const selectedOrchestration = orchestrations.find(item => item.id === orchestrationId);

  async function run() {
    setRunning(true);
    setResult(null);
    setLogs('');
    try {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(input);
      } catch {
        throw new Error('Test input must be valid JSON.');
      }

      const project = buildExecutionProject(service, functionalities, targetId);
      const targetIndex = Math.max(0, functionalities.findIndex(item => item.id === targetId));
      const execution = await runInWebContainer(
        project,
        parsed,
        targetIndex,
        mode === 'service'
          ? { mode, orchestrationIds: selectedOrchestration?.functionalityIds || [] }
          : { mode },
      );
      setLogs(execution.output);
      setResult(execution.result);
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-6xl max-h-[92vh] rounded border border-[var(--skipo-border-color)]/40 bg-[var(--skipo-surface)] text-[var(--skipo-text)] flex flex-col overflow-hidden">
        <header className="h-12 shrink-0 px-4 border-b border-[var(--skipo-border-color)]/30 flex items-center justify-between">
          <div>
            <div className="font-black text-sm">Run Service</div>
            <div className="text-[9px] text-[var(--skipo-text-muted)]">Node.js execution inside a browser WebContainer</div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 rounded border text-[10px]">Close</button>
        </header>

        <div className="grid grid-cols-2 gap-3 p-3 border-b border-[var(--skipo-border-color)]/30">
          <label className="text-[9px]">
            Execution target
            <select className="mt-1 w-full rounded border bg-[var(--skipo-bg)] px-2 py-2 text-xs" value={mode} onChange={e => setMode(e.target.value as 'functionality' | 'service')}>
              <option value="functionality">Single functionality</option>
              <option value="service" disabled={!orchestrations.length}>Service orchestration</option>
            </select>
          </label>
          {mode === 'functionality' ? (
            <label className="text-[9px]">
              Functionality
              <select className="mt-1 w-full rounded border bg-[var(--skipo-bg)] px-2 py-2 text-xs" value={targetId} onChange={e => setTargetId(e.target.value)}>
                {functionalities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          ) : (
            <label className="text-[9px]">
              Orchestration
              <select className="mt-1 w-full rounded border bg-[var(--skipo-bg)] px-2 py-2 text-xs" value={orchestrationId} onChange={e => setOrchestrationId(e.target.value)}>
                {orchestrations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
        </div>

        <main className="min-h-0 flex-1 grid grid-cols-2 gap-px bg-[var(--skipo-border-color)]/20">
          <section className="min-h-0 p-3 bg-[var(--skipo-bg)] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="font-black text-xs">Test input</div>
              <button disabled={running || !functionalities.length || (mode === 'service' && !selectedOrchestration)} onClick={() => void run()} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold text-[10px] disabled:opacity-40">
                {running ? <Loader2 size={12} className="animate-spin"/> : <Play size={12}/>}
                {running ? 'Running…' : 'Run'}
              </button>
            </div>
            <textarea value={input} onChange={e => setInput(e.target.value)} spellCheck={false} className="flex-1 min-h-40 resize-none rounded border bg-[var(--skipo-surface)] p-3 font-mono text-xs outline-none" />
            {selectedFunctionality && mode === 'functionality' && <div className="mt-2 text-[9px] text-[var(--skipo-text-muted)]">{selectedFunctionality.inputSignature} → {selectedFunctionality.outputSignature}</div>}
            {selectedOrchestration && mode === 'service' && <div className="mt-2 text-[9px] text-[var(--skipo-text-muted)]">{selectedOrchestration.functionalityIds.length} functionality steps</div>}
          </section>

          <section className="min-h-0 p-3 bg-[var(--skipo-bg)] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {result?.ok ? <CheckCircle2 size={14}/> : result ? <XCircle size={14}/> : <Terminal size={14}/>}
              <div className="font-black text-xs">Result</div>
              {result && <span className="text-[9px]">{result.ok ? 'PASS' : 'FAIL'}{result.durationMs != null ? ' · ' + result.durationMs + 'ms' : ''}</span>}
            </div>
            <pre className="flex-1 min-h-40 overflow-auto rounded border bg-[var(--skipo-surface)] p-3 font-mono text-[10px] whitespace-pre-wrap">{result ? JSON.stringify(result.ok ? result.output : { error: result.error }, null, 2) : 'No execution yet.'}</pre>
            {!!logs && <details className="mt-2 shrink-0"><summary className="cursor-pointer text-[9px] text-[var(--skipo-text-muted)]">WebContainer output</summary><pre className="mt-1 max-h-32 overflow-auto rounded border p-2 text-[8px] whitespace-pre-wrap">{logs}</pre></details>}
          </section>
        </main>
      </div>
    </div>
  );
};
