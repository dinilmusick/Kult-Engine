import { discoverKloksAssets } from './assetDiscovery';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

export type AgentAssetKind = 'SERVICE' | 'UI';
export interface AgentSuggestion {
  kind: AgentAssetKind;
  name: string;
  package: string;
  reason: string;
  promotionTarget: 'KLOKS' | 'FLOKS';
}
function floksManifests(): Array<Record<string, unknown>> {
  try {
    const require = createRequire(import.meta.url);
    const root = dirname(require.resolve('@ultrst-armada/floks/package.json'));
    const manifests: Array<Record<string, unknown>> = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name === 'floks.manifest.json') {
          try { manifests.push(JSON.parse(readFileSync(path, 'utf8'))); } catch {}
        }
      }
    };
    walk(root);
    return manifests;
  } catch { return []; }
}
export class SkipoAgentService {
  inspect() {
    return {
      app: { name: 'Kult-Engine', runtime: 'skipo', selfEvolution: false },
      capabilities: ['inspect-assets', 'suggest-service-promotion', 'suggest-ui-promotion', 'validate-before-promotion', 'handoff-to-krusbl'],
      assets: { services: discoverKloksAssets(), ui: floksManifests().flatMap((m) => Array.isArray(m.components) ? m.components : []) },
    };
  }
  suggest(query = ''): AgentSuggestion[] {
    const q = query.trim().toLowerCase();
    const matches = (x: unknown) => !q || JSON.stringify(x).toLowerCase().includes(q);
    const services = discoverKloksAssets().filter(matches).slice(0, 20).map((x) => ({
      kind: 'SERVICE' as const, name: x.name, package: x.package,
      reason: 'Promote when the service is reusable outside the current Kult app.',
      promotionTarget: 'KLOKS' as const,
    }));
    const ui = floksManifests().flatMap((m) => Array.isArray(m.components) ? m.components : [])
      .filter(matches).slice(0, 20).map((x: any) => ({
        kind: 'UI' as const, name: String(x.name || x.id || 'FLOKS component'),
        package: '@ultrst-armada/floks',
        reason: 'Promote when the component is reusable outside the current Kult app.',
        promotionTarget: 'FLOKS' as const,
      }));
    return [...services, ...ui];
  }
  promotionPlan(asset: { kind: AgentAssetKind; name: string; source?: string }) {
    return {
      target: asset.kind === 'SERVICE' ? 'KLOKS' : 'FLOKS',
      asset: asset.name,
      source: asset.source || 'Kult-Engine',
      handoff: 'Krusbl promotion loop',
      requires: ['validation', 'provenance', 'CI', 'promotion review', 'published-package reconciliation'],
    };
  }
}
export const skipoAgentService = new SkipoAgentService();
