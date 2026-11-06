import { validateServiceDocument } from './graphValidator';
import { generateKloksArtifact } from './kloksExporter';
import { validateGeneratedService, type QualityDiagnostic } from './serviceQualityValidator';
import type { ServiceDocument } from '../types/serviceIR';

export interface KultValidationResult {
  semantic: ReturnType<typeof validateServiceDocument>;
  code: {
    ok: boolean;
    diagnostics: QualityDiagnostic[];
    failedLayers: string[];
    metrics: { files: number; maxLines: number };
  };
  ok: boolean;
}

export async function validateKultService(document: ServiceDocument): Promise<KultValidationResult> {
  const semantic = validateServiceDocument(document);
  if (!semantic.isValid) {
    return { semantic, code: { ok: false, diagnostics: [], failedLayers: [], metrics: { files: 0, maxLines: 0 } }, ok: false };
  }
  const artifact = generateKloksArtifact(document);
  const quality = validateGeneratedService(artifact.files.map((file) => ({ path: file.path, content: file.content })));
  const failedLayers = [...new Set(quality.diagnostics.map((diagnostic) => diagnostic.code))];
  return { semantic, code: { ...quality, failedLayers }, ok: semantic.isValid && quality.ok };
}
