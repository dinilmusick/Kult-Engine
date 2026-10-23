import { CodeValidationServiceFacade, type CodeValidationResult } from '@ultrst-armada/kloks/development';
import { validateServiceDocument } from './graphValidator';
import { generateKloksArtifact } from './kloksExporter';
import type { ServiceDocument } from '../types/serviceIR';

/** Shared authoring gate: semantic IR validation plus WebContainer diagnostics. KLOKS 1.5.2. */
export interface KultValidationResult {
  semantic: ReturnType<typeof validateServiceDocument>;
  code: CodeValidationResult;
  ok: boolean;
}

export async function validateKultService(document: ServiceDocument): Promise<KultValidationResult> {
  const semantic = validateServiceDocument(document);
  if (!semantic.isValid) {
    return { semantic, code: { ok: false, diagnostics: [], failedLayers: [] }, ok: false };
  }
  const artifact = generateKloksArtifact(document);
  const files = Object.fromEntries(artifact.files.map((file) => [file.path, { file: { contents: file.content } }]));
  const code = await CodeValidationServiceFacade.execute('validate', {
    files,
    install: true,
    layers: ['syntax', 'lint', 'test', 'krnl', 'law-l9'],
  });
  return { semantic, code, ok: semantic.isValid && code.ok };
}
