import { strict as assert } from 'node:assert';
import { KloksPromotionPipeline, type PromotionProvider } from './kloksPromotion';
import type { KloksGeneratedArtifact } from './kloksExporter';
import { KloksPromotionRegistry } from './kloksPromotionRegistry';

const artifact: KloksGeneratedArtifact = {
  packageName: '@ultrst-armada/kloks-example',
  files: [{ path: 'src/index.ts', content: 'export const example = 1;\n', type: 'source' }],
  manifest: { serviceId: 'example.service', name: 'Example Service', version: '1.0.0' },
  changeSummary: 'test',
  contractDiff: { addedSymbols: ['ExampleService'], changedSignatures: [], versionRecommendation: 'MINOR' },
};

const target = {
  id: 'test',
  repository: 'test/Kloks',
  branch: 'main',
  serviceRoot: 'generated',
  exportFile: 'index.ts',
  manifestFile: 'manifest.json',
  packageFile: 'package.json',
  workflow: 'CI',
};

async function run(): Promise<void> {
  const state = new Map([['manifest.json', JSON.stringify({ services: [] })], ['package.json', JSON.stringify({ name: '@kloks/services', version: '1.0.0' })], ['index.ts', '']]);
  let commits = 0;
  let dispatches = 0;
  const provider: PromotionProvider = {
    async readFile(path) { return { content: state.get(path) ?? '' }; },
    async commitFiles({ files }) { commits += 1; for (const file of files) state.set(file.path, file.content); return { commitSha: 'commit-1' }; },
    async dispatchWorkflow() { dispatches += 1; return { startedAt: new Date().toISOString() }; },
    async pollWorkflow() { return { status: 'completed', conclusion: 'success', runId: 42 }; },
  };

  const dryRun = await new KloksPromotionPipeline(provider, target).promote(artifact, { dryRun: true });
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.version, '1.1.0');
  assert.equal(commits, 0);

  const promoted = await new KloksPromotionPipeline(provider, target).promote(artifact);
  assert.equal(promoted.ok, true);
  assert.equal(promoted.version, '1.1.0');
  assert.equal(commits, 1);
  assert.equal(dispatches, 1);

  const repeated = await new KloksPromotionPipeline(provider, target).promote(artifact);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.changedFiles.length, 0);
}


async function verifyRegistry(): Promise<void> {
  const registry = new KloksPromotionRegistry();
  registry.register({
    id: 'test-target',
    repository: 'dinilmusick/Kloks',
    branch: 'main',
    serviceRoot: 'packages/services/src/generated',
    exportFile: 'packages/services/src/index.ts',
    manifestFile: 'packages/services/kloks.manifest.json',
    packageFile: 'package.json',
    workflow: 'CI',
    packageName: '@ultrst-armada/kloks',
  });
  assert.equal(registry.get('test-target').repository, 'dinilmusick/Kloks');
  assert.equal(registry.list().length, 1);
  const compatible = registry.inspect(registry.get('test-target'), {
    name: '@ultrst-armada/kloks',
    version: '1.0.0',
    private: false,
  }, { services: [] });
  assert.equal(compatible.compatible, true);
  const incompatible = registry.inspect(registry.get('test-target'), {
    name: '@other/package',
    version: 'bad',
    private: true,
  }, {});
  assert.equal(incompatible.compatible, false);
  assert.equal(incompatible.reasons.length >= 3, true);
}

void run();
void verifyRegistry();
