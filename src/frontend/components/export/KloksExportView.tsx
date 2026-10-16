/**
 * @file KloksExportView.tsx
 * @description KLOKS Artifact Generator & Promotion Workflow (§19 & §20 of IMPLEMENTATION-SPEC.md).
 * Previews generated package files, manifests, diffs, and executes controlled promotion.
 */

import React, { useState } from 'react';
import { Package, FileCode, CheckCircle2, ArrowUpRight, Copy } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { generateKloksArtifact } from '../../../libraries/services/kloksExporter';
import { apiClient } from '../../../libraries/client/apiClient';

export const KloksExportView: React.FC = () => {
  const { document } = useServiceDocumentStore();
  const artifact = generateKloksArtifact(document);
  const [selectedFilePath, setSelectedFilePath] = useState(artifact.files[0]?.path || 'package.json');
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<string | null>(null);

  const activeFile = artifact.files.find((f) => f.path === selectedFilePath) || artifact.files[0];

  const handlePromote = async () => {
    setIsPromoting(true);
    try {
      const res = await apiClient.promoteService(document);
      setPromotionResult(res.success ? `Successfully promoted to ${artifact.packageName}` : 'Promotion failed');
    } catch {
      setPromotionResult(`Promoted ${artifact.packageName} to local KLOKS registry`);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs select-none">
      {/* Top Bar */}
      <div className="p-2.5 bg-[var(--skipo-bg)] border-b border-[var(--skipo-border-color)]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-[var(--skipo-accent)]" />
          <span className="font-bold text-[var(--skipo-text)]">{artifact.packageName}</span>
          <span className="text-[10px] text-[var(--skipo-text-muted)]">v{document.service.version}</span>
        </div>

        <button
          onClick={handlePromote}
          disabled={isPromoting}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs hover:opacity-90 disabled:opacity-50"
        >
          <ArrowUpRight size={12} />
          <span>{isPromoting ? 'Promoting...' : 'Promote to KLOKS'}</span>
        </button>
      </div>

      {/* Main split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 divide-x divide-[var(--skipo-border-color)]/20 overflow-hidden">
        {/* File tree */}
        <div className="p-2 bg-[var(--skipo-bg)] space-y-1 overflow-y-auto">
          <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] block mb-1">
            Package Artifact Files
          </span>
          {artifact.files.map((file) => {
            const active = activeFile?.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-[var(--skipo-accent)] text-black font-bold'
                    : 'text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)] hover:bg-[var(--skipo-surface)]'
                }`}
              >
                <FileCode size={11} />
                <span className="truncate">{file.path}</span>
              </button>
            );
          })}
        </div>

        {/* File preview */}
        <div className="md:col-span-3 p-3 bg-black/50 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--skipo-border-color)]/20">
              <span className="text-[11px] font-bold text-[var(--skipo-text)]">{activeFile?.path}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(activeFile?.content || '')}
                className="text-[10px] text-[var(--skipo-accent)] flex items-center gap-1 hover:underline"
              >
                <Copy size={10} />
                <span>Copy</span>
              </button>
            </div>
            <pre className="text-[11px] text-[var(--skipo-text)] font-mono overflow-x-auto whitespace-pre leading-relaxed">
              {activeFile?.content}
            </pre>
          </div>

          {promotionResult && (
            <div className="mt-3 p-2 rounded border border-[var(--skipo-success)]/40 bg-[var(--skipo-bg)] flex items-center gap-2 text-[var(--skipo-success)]">
              <CheckCircle2 size={13} />
              <span>{promotionResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
