import { validateServiceDocument } from './graphValidator';
import { generateKloksArtifact } from './kloksExporter';
import { validateGeneratedService, type QualityDiagnostic } from './serviceQualityValidator';
import type { ServiceDocument } from '../types/serviceIR';

export interface KultValidationResult {
  semantic: ReturnType<typeof validateServiceDocument>;
  code: {
    ok: boolean;
    diagnostics: QualityDiagnostic[];
    metrics: { files: number; maxLines: number };
  };
  ok: boolean;
}

export async function validateKultService(document: ServiceDocument): Promise<KultValidationResult> {
  const semantic = validateServiceDocument(document);
  if (!semantic.isValid) {
    return { semantic, code: { ok: false, diagnostics: [], metrics: { files: 0, maxLines: 0 } }, ok: false };
  }
  const artifact = generateKloksArtifact(document);
  const code = validateGeneratedService(artifact.files.map((file) => ({ path: file.path, content: file.content })));
  return { semantic, code, ok: semantic.isValid && code.ok };
}
