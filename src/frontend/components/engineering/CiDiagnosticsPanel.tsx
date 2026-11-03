import React, { useCallback, useEffect, useState } from "react";
import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import { normalizeCiWorkflowRun, type CiWorkflowRun, type WorkflowRunSource } from "./ciDiagnosticsModel";

const REPOSITORY = "dinilmusick/Kult-Engine";
const INSPECTION_WORKFLOW = `https://github.com/${REPOSITORY}/actions/workflows/browser-inspection.yml`;

export const CiDiagnosticsPanel: React.FC = () => {
  const [runs, setRuns] = useState<CiWorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPOSITORY}/actions/runs?branch=main&per_page=8`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok) throw new Error(`GitHub Actions returned HTTP ${response.status}`);
      const payload = await response.json() as { workflow_runs?: WorkflowRunSource[] };
      setRuns((payload.workflow_runs || []).map((run) => normalizeCiWorkflowRun(run, REPOSITORY)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="h-full overflow-auto bg-[var(--skipo-bg)] text-[var(--skipo-text)] p-4 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black"><Activity size={15}/> Build & browser diagnostics</div>
          <p className="text-[10px] text-[var(--skipo-text-muted)] mt-1">Read-only CI and browser-inspection evidence for {REPOSITORY}.</p>
        </div>
        <button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-1 rounded border px-3 py-2 text-[10px] disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </header>
      <div className="flex flex-wrap gap-2 text-[10px]">
        <a className="rounded border px-3 py-2" href={`https://github.com/${REPOSITORY}/actions`} target="_blank" rel="noreferrer">All CI runs <ExternalLink size={10} className="inline"/></a>
        <a className="rounded border px-3 py-2" href={INSPECTION_WORKFLOW} target="_blank" rel="noreferrer">Run browser inspection <ExternalLink size={10} className="inline"/></a>
      </div>
      {error && <div role="alert" className="border border-red-500/50 p-3 text-xs text-red-300">{error}</div>}
      {runs.map((run) => (
        <article key={run.id} className="rounded border border-[var(--skipo-border-color)]/40 bg-[var(--skipo-surface)] p-3">
          <div className="flex items-center justify-between gap-2"><strong className="text-xs">{run.name}</strong><span className={`text-[9px] font-bold uppercase ${run.conclusion === "success" ? "text-emerald-400" : run.conclusion === "failure" ? "text-red-400" : "text-amber-300"}`}>{run.conclusion || run.status}</span></div>
          <div className="mt-1 text-[9px] text-[var(--skipo-text-muted)]">{run.branch} · {run.commit.slice(0, 12) || "commit unavailable"}</div>
          <a href={run.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--skipo-accent)]">Open run logs and artifacts <ExternalLink size={10}/></a>
        </article>
      ))}
      {!loading && !error && runs.length === 0 && <p className="text-xs text-[var(--skipo-text-muted)]">No workflow runs were returned.</p>}
      {loading && runs.length === 0 && <p className="text-xs text-[var(--skipo-text-muted)]">Loading CI evidence…</p>}
    </section>
  );
};
