import type { KloksGeneratedArtifact } from './kloksExporter';

export interface KloksPromotionTarget {
  id: string;
  repository: string;
  branch: string;
  serviceRoot: string;
  exportFile: string;
  manifestFile: string;
  packageFile: string;
  workflow: string;
  manifestSchema?: string;
  packageName?: string;
}

export interface KloksCompatibilityReport {
  compatible: boolean;
  reasons: string[];
  packageName?: string;
  version?: string;
}

export class KloksPromotionRegistry {
  private readonly targets = new Map<string, KloksPromotionTarget>();

  register(target: KloksPromotionTarget): this {
    if (!target.id || !target.repository || !target.branch) throw new Error('Promotion target requires id, repository and branch');
    this.targets.set(target.id, { ...target });
    return this;
  }

  get(id: string): KloksPromotionTarget {
    const target = this.targets.get(id);
    if (!target) throw new Error('Unknown Kloks promotion target: ' + id);
    return target;
  }

  list(): KloksPromotionTarget[] {
    return [...this.targets.values()].map((target) => ({ ...target }));
  }

  inspect(target: KloksPromotionTarget, packageJson: unknown, manifest: unknown): KloksCompatibilityReport {
    const reasons: string[] = [];
    const pkg = packageJson as { name?: unknown; version?: unknown; private?: unknown };
    const man = manifest as { services?: unknown; $schema?: unknown };
    if (pkg.private === true) reasons.push('Target package is private');
    if (typeof pkg.name !== 'string' || !pkg.name) reasons.push('Target package has no name');
    if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pkg.version)) reasons.push('Target package has no valid semantic version');
    if (!Array.isArray(man.services)) reasons.push('Target manifest must expose a services array');
    if (target.packageName && pkg.name !== target.packageName) reasons.push('Target package name does not match registry');
    if (target.manifestSchema && man.$schema !== target.manifestSchema) reasons.push('Target manifest schema does not match registry');
    return { compatible: reasons.length === 0, reasons, packageName: typeof pkg.name === 'string' ? pkg.name : undefined, version: typeof pkg.version === 'string' ? pkg.version : undefined };
  }
}

export const DEFAULT_KLOKS_TARGET: KloksPromotionTarget = {
  id: 'ultrst-kloks-services',
  repository: 'dinilmusick/Kloks',
  branch: 'main',
  serviceRoot: 'packages/services/src/generated',
  exportFile: 'packages/services/src/index.ts',
  manifestFile: 'packages/services/kloks.manifest.json',
  packageFile: 'packages/services/package.json',
  workflow: 'CI',
  manifestSchema: 'https://skipo.dev/schemas/kloks-manifest.v1.json',
  packageName: '@kloks/services',
};
