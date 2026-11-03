export interface WorkflowRunSource {
  id: number;
  name?: string;
  status?: string;
  conclusion?: string | null;
  head_branch?: string;
  head_sha?: string;
  html_url?: string;
  created_at?: string;
}

export interface CiWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  commit: string;
  url: string;
  createdAt: string;
}

export function normalizeCiWorkflowRun(run: WorkflowRunSource, repository: string): CiWorkflowRun {
  return {
    id: run.id,
    name: run.name || "GitHub Actions workflow",
    status: run.status || "unknown",
    conclusion: run.conclusion ?? null,
    branch: run.head_branch || "unknown",
    commit: run.head_sha || "",
    url: run.html_url || `https://github.com/${repository}/actions/runs/${run.id}`,
    createdAt: run.created_at || "",
  };
}
