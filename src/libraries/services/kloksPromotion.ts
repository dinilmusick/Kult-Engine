import type { ServiceDocument } from "../types/serviceIR";
import { validateKultService } from "./codeValidation";
import { generateKloksArtifact, type KloksGeneratedArtifact } from "./kloksExporter";
import { runArtifactEngineering, type EngineeringResult } from "./serviceEngineeringRuntime";

export interface PromotionFile { path: string; content: string; sha?: string; }
export interface PromotionGitHubClient {
  getFile: (account: string, repository: string, path: string, ref: string) => Promise<{ content: string; sha: string } | null>;
  commitFile: (account: string, repository: string, path: string, content: string, message: string, branch: string, sha?: string) => Promise<{ commitSha: string }>;
  dispatchWorkflow: (account: string, repository: string, workflow: string, ref: string, inputs?: Record<string, string>) => Promise<void>;
  pollWorkflow: (account: string, repository: string, workflow: string, ref: string, startedAfter: string, options?: { timeoutMs?: number; intervalMs?: number }) => Promise<{ id: number; status: string; conclusion: string | null; html_url?: string }>;
}
export interface PromotionTarget {
  id: string;
  account: string; repository: string; branch: string; workflow: string;
  servicePath: string; exportPath: string; exportStatement: string;
  packageJsonPath: string; npmPackageName: string; npmRegistryUrl?: string;
}
export interface PromotionResult {
  success: boolean;
  status: "blocked" | "committed" | "ci_failed" | "published" | "failed" | "dry_run" | "noop";
  version?: string; changedFiles: string[]; commitShas: string[];
  ci?: { runId: number; status: string; conclusion: string | null; htmlUrl?: string };
  publication?: { packageName: string; version: string; published: boolean; registryUrl: string };
  diagnostics: string[];
  validation?: Awaited<ReturnType<typeof validateKultService>>;
  engineering?: EngineeringResult;
}
export interface PromotionTargetCompatibility {
  targetId: string;
  compatible: boolean;
  checks: Record<string, boolean>;
  reasons: string[];
}

export class KloksPromotionTargetRegistry {
  private readonly targets = new Map<string, PromotionTarget>();

  register(target: PromotionTarget): void {
    this.targets.set(target.id, target);
  }

  unregister(targetId: string): void {
    this.targets.delete(targetId);
  }

  list(): PromotionTarget[] {
    return [...this.targets.values()];
  }

  get(targetId: string): PromotionTarget | undefined {
    return this.targets.get(targetId);
  }

  async inspectCompatibility(targetId: string, github: PromotionGitHubClient): Promise<PromotionTargetCompatibility> {
    const target = this.targets.get(targetId);
    if (!target) return { targetId, compatible: false, checks: {}, reasons: ["Unknown promotion target."] };
    const [packageFile, exportFile, workflowFile] = await Promise.all([
      github.getFile(target.account, target.repository, target.packageJsonPath, target.branch),
      github.getFile(target.account, target.repository, target.exportPath, target.branch),
      github.getFile(target.account, target.repository, ".github/workflows/" + target.workflow, target.branch),
    ]);
    const checks = {
      packageJson: Boolean(packageFile),
      exportPath: Boolean(exportFile),
      workflow: Boolean(workflowFile),
      targetConfig: Boolean(target.servicePath && target.npmPackageName && target.exportStatement),
    };
    const reasons = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name + " check failed.");
    return { targetId, compatible: reasons.length === 0, checks, reasons };
  }
}

export interface PromotionOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
  engineer?: (files: { path: string; content: string }[], timeoutMs?: number) => Promise<EngineeringResult>;
  fetchImpl?: typeof fetch;
  dryRun?: boolean;
}

const decodeBase64 = (value: string): string => {
  const binary = atob(value.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};
const normalizeFileContent = (content: string): string => {
  try { return decodeBase64(content); } catch { return content; }
};
const encodeVersion = (version: string, recommendation: "PATCH" | "MINOR" | "MAJOR"): string => {
  const [major, minor, patch] = version.replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  if (recommendation === "MAJOR") return (major + 1) + ".0.0";
  if (recommendation === "MINOR") return major + "." + (minor + 1) + ".0";
  return major + "." + minor + "." + (patch + 1);
};
const readJson = <T>(content: string): T => JSON.parse(normalizeFileContent(content));
const joinPath = (root: string, path: string): string => [root.replace(/\/$/, ""), path.replace(/^\//, "")].filter(Boolean).join("/");

export async function promoteKultServiceToKloks(
  document: ServiceDocument,
  target: PromotionTarget,
  github: PromotionGitHubClient,
  options: PromotionOptions = {},
): Promise<PromotionResult> {
  const diagnostics: string[] = [];
  const validation = await validateKultService(document);
  if (!validation.ok) return { success: false, status: "blocked", changedFiles: [], commitShas: [], diagnostics: ["Validation failed before promotion."], validation };

  const artifact = generateKloksArtifact(document);
  const engineer = options.engineer || runArtifactEngineering;
  const engineering = await engineer(artifact.files.map((file) => ({ path: file.path, content: file.content })), options.timeoutMs);
  if (!engineering.ok) return { success: false, status: "blocked", changedFiles: [], commitShas: [], diagnostics: ["Artifact engineering failed before promotion."], validation, engineering };

  const packageFile = await github.getFile(target.account, target.repository, target.packageJsonPath, target.branch);
  if (!packageFile) return { success: false, status: "failed", changedFiles: [], commitShas: [], diagnostics: ["Target package.json was not found."], validation, engineering };
  const packageJson = readJson<Record<string, unknown>>(packageFile.content);
  const currentVersion = String(packageJson.version || "0.0.0");
  const manifestPath = joinPath(target.servicePath, "kloks.manifest.json");
  const existingManifest = await github.getFile(target.account, target.repository, manifestPath, target.branch);
  if (existingManifest) {
    try {
      const parsed = readJson<Record<string, unknown>>(existingManifest.content);
      if (parsed.contractFingerprint === artifact.manifest.contractFingerprint) {
        return {
          success: true, status: "noop", version: currentVersion, changedFiles: [], commitShas: [],
          diagnostics: ["Target already contains the same service contract fingerprint."], validation, engineering,
        };
      }
    } catch { /* malformed target metadata is replaceable */ }
  }
  const nextVersion = encodeVersion(currentVersion, artifact.contractDiff.versionRecommendation);
  packageJson.version = nextVersion;

  const exportExisting = await github.getFile(target.account, target.repository, target.exportPath, target.branch);
  const exportContent = normalizeFileContent(exportExisting?.content || "");
  const exportUpdated = exportContent.includes(target.exportStatement) ? exportContent : exportContent.trimEnd() + "\n" + target.exportStatement + "\n";
  const changedFiles: PromotionFile[] = artifact.files.map((file) => ({ path: joinPath(target.servicePath, file.path), content: file.content }));
  changedFiles.push({ path: target.exportPath, content: exportUpdated, sha: exportExisting?.sha });
  changedFiles.push({ path: target.packageJsonPath, content: JSON.stringify(packageJson, null, 2) + "\n", sha: packageFile.sha });

  if (options.dryRun) return {
    success: true, status: "dry_run", version: nextVersion, changedFiles: changedFiles.map((file) => file.path), commitShas: [],
    diagnostics: [...diagnostics, "Dry-run completed without mutation, workflow dispatch or publication verification."], validation, engineering,
  };

  const commitShas: string[] = [];
  for (const file of changedFiles) {
    const existing = file.sha ? { sha: file.sha } : await github.getFile(target.account, target.repository, file.path, target.branch);
    const commit = await github.commitFile(target.account, target.repository, file.path, file.content, "feat(kult): promote " + document.service.name + " v" + nextVersion, target.branch, existing?.sha);
    commitShas.push(commit.commitSha);
    diagnostics.push("Committed " + file.path);
  }

  const startedAfter = new Date().toISOString();
  await github.dispatchWorkflow(target.account, target.repository, target.workflow, target.branch, { service: artifact.packageName, version: nextVersion });
  const ci = await github.pollWorkflow(target.account, target.repository, target.workflow, target.branch, startedAfter, {
    timeoutMs: options.timeoutMs,
    intervalMs: options.pollIntervalMs,
  });
  const ciResult = { runId: ci.id, status: ci.status, conclusion: ci.conclusion, htmlUrl: ci.html_url };
  if (ci.status !== "completed" || ci.conclusion !== "success") {
    return { success: false, status: "ci_failed", version: nextVersion, changedFiles: changedFiles.map((file) => file.path), commitShas, ci: ciResult, diagnostics: [...diagnostics, "Promotion CI did not complete successfully."], validation, engineering };
  }

  const registryUrl = (target.npmRegistryUrl || "https://registry.npmjs.org").replace(/\/$/, "");
  const fetchImpl = options.fetchImpl || fetch;
  const publicationResponse = await fetchImpl(registryUrl + "/" + encodeURIComponent(target.npmPackageName));
  let published = false;
  if (publicationResponse.ok) {
    const registry = await publicationResponse.json() as { versions?: Record<string, unknown> };
    published = Boolean(registry.versions && registry.versions[nextVersion]);
  }
  const publication = { packageName: target.npmPackageName, version: nextVersion, published, registryUrl };
  if (!published) return { success: false, status: "committed", version: nextVersion, changedFiles: changedFiles.map((file) => file.path), commitShas, ci: ciResult, publication, diagnostics: [...diagnostics, "CI succeeded but npm publication was not independently observed."], validation, engineering };
  return { success: true, status: "published", version: nextVersion, changedFiles: changedFiles.map((file) => file.path), commitShas, ci: ciResult, publication, diagnostics, validation, engineering };
}

export type { KloksGeneratedArtifact };
