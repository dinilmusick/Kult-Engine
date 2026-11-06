import type { KloksGeneratedArtifact } from './kloksExporter';
import { validateGeneratedService } from './serviceQualityValidator';
import type { KloksPromotionTarget } from './kloksPromotionRegistry';

export type VersionBump = 'PATCH' | 'MINOR' | 'MAJOR';

export interface PromotionFile { path: string; content: string; sha?: string; }
export interface PromotionProvider {
  readFile(path: string, ref: string): Promise<{ content: string; sha?: string }>;
  commitFiles(input: { branch: string; message: string; files: PromotionFile[] }): Promise<{ commitSha: string }>;
  dispatchWorkflow(input: { workflow: string; ref: string; inputs?: Record<string, string> }): Promise<{ startedAt: string }>;
  pollWorkflow(input: { workflow: string; ref: string; startedAfter: string }): Promise<{ status: string; conclusion: string | null; runId?: number }>;
}
export interface PromotionResult {
  ok: boolean;
  dryRun: boolean;
  version?: string;
  changedFiles: string[];
  commitSha?: string;
  workflow?: { status: string; conclusion: string | null; runId?: number };
  diagnostics: string[];
}

const bump = (version: string, kind: VersionBump): string => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error('Invalid semantic version: ' + version);
  const [major, minor, patch] = match.slice(1).map(Number);
  return kind === 'MAJOR' ? `${major + 1}.0.0` : kind === 'MINOR' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
};
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const join = (left: string, right: string): string => left.replace(/\/$/, '') + '/' + right.replace(/^\//, '');

export class KloksPromotionPipeline {
  constructor(private readonly provider: PromotionProvider, private readonly target: KloksPromotionTarget) {}

  async promote(artifact: KloksGeneratedArtifact, options: { dryRun?: boolean; bump?: VersionBump; workflowInputs?: Record<string, string> } = {}): Promise<PromotionResult> {
    const diagnostics: string[] = [];
    const quality = validateGeneratedService(artifact.files);
    if (!quality.ok) return { ok: false, dryRun: Boolean(options.dryRun), changedFiles: [], diagnostics: quality.diagnostics.map((d) => `${d.path}: ${d.message}`) };
    if (!artifact.files.length) throw new Error('Cannot promote an empty artifact');

    const manifestSnapshot = await this.provider.readFile(this.target.manifestFile, this.target.branch);
    const packageSnapshot = await this.provider.readFile(this.target.packageFile, this.target.branch);
    const exportSnapshot = await this.provider.readFile(this.target.exportFile, this.target.branch);
    const manifest = JSON.parse(manifestSnapshot.content) as { services?: Record<string, unknown>[] };
    const pkg = JSON.parse(packageSnapshot.content) as { name?: string; version?: string };
    if (!pkg.version) throw new Error('Target package has no version');

    const services = manifest.services ?? [];
    const serviceId = String(artifact.manifest.serviceId ?? artifact.packageName);
    if (services.some((service) => String(service.id ?? service.serviceId) === serviceId)) {
      diagnostics.push(`Service ${serviceId} already registered; promotion is idempotent`);
      return { ok: true, dryRun: Boolean(options.dryRun), version: pkg.version, changedFiles: [], diagnostics };
    }

    const nextVersion = bump(pkg.version, options.bump ?? artifact.contractDiff.versionRecommendation);
    const name = String(artifact.manifest.name ?? artifact.packageName);
    const directory = join(this.target.serviceRoot, slug(name));
    const files = artifact.files.map((file) => ({ path: join(directory, file.path), content: file.content }));
    const exportLine = `export * from './generated/${slug(name)}/src/index.js';`;
    const exportContent = exportSnapshot.content.includes(exportLine) ? exportSnapshot.content : exportSnapshot.content.trimEnd() + '\n' + exportLine + '\n';

    files.push(
      { path: this.target.exportFile, content: exportContent },
      { path: this.target.manifestFile, content: JSON.stringify({ ...manifest, services: [...services, artifact.manifest] }, null, 2) + '\n' },
      { path: this.target.packageFile, content: JSON.stringify({ ...pkg, version: nextVersion }, null, 2) + '\n' },
    );

    const changedFiles = files.map((file) => file.path);
    if (options.dryRun) return { ok: true, dryRun: true, version: nextVersion, changedFiles, diagnostics };

    const commit = await this.provider.commitFiles({ branch: this.target.branch, message: `feat: promote ${serviceId} to Kloks`, files });
    const dispatch = await this.provider.dispatchWorkflow({ workflow: this.target.workflow, ref: this.target.branch, inputs: options.workflowInputs });
    const workflow = await this.provider.pollWorkflow({ workflow: this.target.workflow, ref: this.target.branch, startedAfter: dispatch.startedAt });
    if (workflow.conclusion !== 'success') return { ok: false, dryRun: false, version: nextVersion, changedFiles, commitSha: commit.commitSha, workflow, diagnostics: [...diagnostics, 'Promotion CI did not complete successfully'] };
    return { ok: true, dryRun: false, version: nextVersion, changedFiles, commitSha: commit.commitSha, workflow, diagnostics };
  }
}
