import React from 'react';
import { CodeValidationServiceFacade, WebContainerServiceFacade } from '@ultrst-armada/kloks/development/client';
import type { ServiceDocument } from '../../../libraries/types/serviceIR';
import type { FunctionalityAsset } from './functionalityEditorModel';
import { buildExecutionProject } from './kultExecutionModel';

type Result = {
  ok: boolean;
  diagnostics: Array<{ layer: string; ok: boolean; exitCode: number; command: string; output: string }>;
  failedLayers: string[];
};

export const ServiceDiagnosticsPanel: React.FC<{
  service: ServiceDocument;
  functionalities: FunctionalityAsset[];
  targetId: string;
  onClose: () => void;
}> = ({ service, functionalities, targetId, onClose }) => {
  const [running, setRunning] = React.useState(false);
  const [installOutput, setInstallOutput] = React.useState('');
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState('');

  const run = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    setInstallOutput('');
    try {
      const project = buildExecutionProject(service, functionalities, targetId);
      await WebContainerServiceFacade.execute('mount', { files: project.files });
      const install = await WebContainerServiceFacade.execute<
        { command: string; args: string[] },
        { exitCode: number; output: string }
      >('runCommand', { command: 'pnpm', args: ['install', '--no-frozen-lockfile', '--ignore-scripts'] });
      setInstallOutput(install.output);
      if (install.exitCode !== 0) throw new Error('Dependency installation failed with exit code ' + install.exitCode);
      const validation = await CodeValidationServiceFacade.execute<
        { layers: Array<'syntax' | 'lint' | 'test' | 'build'>; cwd: string },
        Result
      >('validate', { layers: ['syntax', 'lint', 'test', 'build'], cwd: '/' });
      setResult(validation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 p-4 flex items-center justify-center">
      <section className="w-full h-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden rounded border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] text-[var(--skipo-text)]">
        <header className="h-12 shrink-0 px-4 flex items-center justify-between border-b border-[var(--skipo-border-color)]/30">
          <div><strong className="text-xs">Service diagnostics</strong><div className="text-[9px] text-[var(--skipo-text-muted)]">TypeScript · lint · tests · build · canonical Kloks WebContainer</div></div>
          <div className="flex gap-2"><button disabled={running} onClick={() => void run()} className="px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black text-[10px] font-bold disabled:opacity-50">{running ? 'Checking…' : 'Run checks'}</button><button onClick={onClose} className="px-3 py-1.5 rounded border text-[10px]">Close</button></div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
          {error && <div role="alert" className="p-3 border border-red-500/50 text-red-300 text-xs">{error}</div>}
          {result && <div className="text-xs font-bold">{result.ok ? 'All checks passed' : 'Failed: ' + result.failedLayers.join(', ')}</div>}
          {installOutput && <details open className="border rounded p-2"><summary className="text-[10px] cursor-pointer">Dependency installation output</summary><pre className="mt-2 whitespace-pre-wrap text-[9px]">{installOutput}</pre></details>}
          {result?.diagnostics.map(item => <article key={item.layer} className="border rounded p-3 space-y-2">
            <div className="flex justify-between text-xs"><strong>{item.layer.toUpperCase()}</strong><span>{item.ok ? 'PASS' : 'FAIL'} · exit {item.exitCode}</span></div>
            <div className="text-[9px] text-[var(--skipo-text-muted)]">{item.command}</div>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[9px]">{item.output || 'No output.'}</pre>
          </article>)}
          {!result && !error && !running && <p className="text-xs text-[var(--skipo-text-muted)]">Run checks to install dependencies and validate the generated service project.</p>}
        </main>
      </section>
    </div>
  );
};
