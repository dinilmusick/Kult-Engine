import * as ts from 'typescript';

export interface GeneratedServiceFile { path: string; content: string; }
export interface QualityDiagnostic { path: string; line?: number; code: string; message: string; }
export interface ServiceQualityReport {
  ok: boolean;
  diagnostics: QualityDiagnostic[];
  metrics: { files: number; maxLines: number };
}

const forbiddenImports = /(?:from\s+|import\s*\(\s*)["'](?:\.\.\/){2,}|["'](?:@\/)?Skipo\//;
const stubPattern = /\b(?:TODO|FIXME)\b|throw new Error\(["']Not implemented|return\s+(?:null|undefined)\s*;/;

function lineOf(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length;
}

export function validateGeneratedService(files: GeneratedServiceFile[]): ServiceQualityReport {
  const diagnostics: QualityDiagnostic[] = [];
  let maxLines = 0;
  if (!files.length) diagnostics.push({ path: '', code: 'EMPTY_ARTIFACT', message: 'Generated service contains no files' });

  for (const file of files) {
    const lines = file.content.split(/\r?\n/).length;
    maxLines = Math.max(maxLines, lines);
    if (!/\.(?:ts|tsx|js|jsx)$/.test(file.path)) continue;
    if (lines > 200) diagnostics.push({
      path: file.path, code: 'LAW_L9_LINE_LIMIT', line: 201,
      message: `Source file has ${lines} lines; maximum is 200`,
    });

    const syntax = ts.transpileModule(file.content, {
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    for (const diagnostic of syntax.diagnostics ?? []) {
      const start = diagnostic.start ?? 0;
      diagnostics.push({
        path: file.path, line: lineOf(file.content, start), code: 'TS_SYNTAX',
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      });
    }

    if (file.path === 'src/index.ts' && !/createServiceDefinition\s*\(/.test(file.content)) diagnostics.push({
      path: file.path,
      code: 'KRNL_SERVICE_DEFINITION',
      message: 'Generated service entrypoint must use the KRNLTS service-definition API.',
    });
    if (file.path === 'src/index.ts' && !/createService\s*\(/.test(file.content)) diagnostics.push({
      path: file.path,
      code: 'KRNL_SERVICE_RUNTIME',
      message: 'Generated service entrypoint must instantiate through KRNLTS createService.',
    });

    if (forbiddenImports.test(file.content)) diagnostics.push({
      path: file.path, code: 'LAW_L20_IMPORT_ISOLATION',
      message: 'Direct Skipo/root-relative framework import is forbidden; use hydrated libraries.',
    });

    const stubMatch = file.content.match(stubPattern);
    if (stubMatch) diagnostics.push({
      path: file.path, code: 'LAW_L2_STUB', line: lineOf(file.content, stubMatch.index ?? 0),
      message: 'Stub/TODO/trivial return detected in generated service.',
    });
  }

  return { ok: diagnostics.length === 0, diagnostics, metrics: { files: files.length, maxLines } };
}
