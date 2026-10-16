/**
 * @file KultToolbar.tsx
 * @description Master Kult Engine Top Toolbar (§25 of IMPLEMENTATION-SPEC.md).
 * Service switcher, import existing KLOKS services, execution trigger, validation badge, export action (< 200 lines).
 */

import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, Package, Beaker, LayoutTemplate, LogOut, HardDrive, Download } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { useAppStore } from '../../../frontend-state/appStore';
import { INSTALLED_KLOKS_SERVICES } from '../../../libraries/services/kloksImporter';

export const KultToolbar: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    document,
    validationReport,
    runService,
    isRunning,
    setActiveDockTab,
    importExistingService,
  } = useServiceDocumentStore();
  const { activeWorkspace } = useAppStore();
  const [showImportMenu, setShowImportMenu] = useState(false);

  return (
    <header className="h-11 px-3 bg-[var(--skipo-surface)] border-b border-[var(--skipo-border-color)]/20 flex items-center justify-between font-mono text-xs select-none shrink-0 relative">
      {/* Brand & Service Meta */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--skipo-accent)] text-black font-black flex items-center justify-center text-xs rounded">
            ▲
          </div>
          <span className="font-black text-sm tracking-wider uppercase text-[var(--skipo-text)]">
            KULT ENGINE
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[var(--skipo-border-color)]/20" />

        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--skipo-text)]">{document.service.name}</span>
          <span className="text-[10px] text-[var(--skipo-accent)] px-1.5 py-0.5 rounded border border-[var(--skipo-accent)]/30">
            v{document.service.version}
          </span>
        </div>

        {/* Import Existing KLOKS Service Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowImportMenu((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 text-[10px] text-[var(--skipo-text)] hover:border-[var(--skipo-accent)]"
          >
            <Download size={10} />
            <span>Open KLOKS</span>
          </button>

          {showImportMenu && (
            <div className="absolute left-0 top-7 w-60 bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)] rounded shadow-xl p-1.5 z-50 space-y-1">
              <span className="text-[9px] uppercase font-bold text-[var(--skipo-text-muted)] block px-1.5 py-0.5">
                Import Existing Service
              </span>
              {INSTALLED_KLOKS_SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    importExistingService(s.id);
                    setShowImportMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-[var(--skipo-surface)] text-[10px] text-[var(--skipo-text)] flex items-center justify-between"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-[8px] text-[var(--skipo-accent)]">{s.operations[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Validation Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold ${
            validationReport.isValid
              ? 'border-[var(--skipo-success)]/30 text-[var(--skipo-success)] bg-[var(--skipo-success)]/10'
              : 'border-[var(--skipo-danger)]/30 text-[var(--skipo-danger)] bg-[var(--skipo-danger)]/10'
          }`}
          data-skipo-label="Validation Status"
          data-skipo-desc="Continuous KRNLTS contract and graph topology validation"
        >
          {validationReport.isValid ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          <span>{validationReport.isValid ? 'Valid DAG' : `${validationReport.errorCount} Errors`}</span>
        </div>

        {/* Run Button */}
        <button
          onClick={() => {
            setActiveDockTab('execution');
            runService();
          }}
          disabled={isRunning}
          data-skipo-label="Run Service"
          data-skipo-desc="Execute compiled SERVICE_IR topologically with captured probe traces"
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--skipo-accent)] text-black font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Play size={12} />
          <span>{isRunning ? 'Running...' : 'Run Graph'}</span>
        </button>

        {/* Tests Button */}
        <button
          onClick={() => setActiveDockTab('tests')}
          data-skipo-label="Test Suite"
          data-skipo-desc="Open KRNLTS service test cases and assertion runner"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 text-[var(--skipo-text)] hover:border-[var(--skipo-accent)] transition-colors"
        >
          <Beaker size={12} className="text-[var(--skipo-accent)]" />
          <span>Tests</span>
        </button>

        {/* UI Surface Button */}
        <button
          onClick={() => setActiveDockTab('uipreview')}
          data-skipo-label="UI Surface"
          data-skipo-desc="Author and preview interactive UI schema bound to service ports"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 text-[var(--skipo-text)] hover:border-[var(--skipo-accent)] transition-colors"
        >
          <LayoutTemplate size={12} className="text-[var(--skipo-accent)]" />
          <span>UI Surface</span>
        </button>

        {/* Export to KLOKS Button */}
        <button
          onClick={() => setActiveDockTab('export')}
          data-skipo-label="KLOKS Export"
          data-skipo-desc="Generate and promote compiled KLOKS package artifact and manifests"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--skipo-bg)] border border-[var(--skipo-border-color)]/30 text-[var(--skipo-text)] hover:border-[var(--skipo-accent)] transition-colors"
        >
          <Package size={12} className="text-[var(--skipo-accent)]" />
          <span>Export</span>
        </button>
      </div>

      {/* Right User & Workspace controls */}
      <div className="flex items-center gap-3">
        {activeWorkspace && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--skipo-border-color)]/20 text-[var(--skipo-text-muted)] text-[11px]">
            <HardDrive size={11} className="text-[var(--skipo-accent)]" />
            <span className="text-[var(--skipo-text)] truncate max-w-[120px]">{activeWorkspace.name}</span>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            data-skipo-label="Sign Out"
            data-skipo-desc="Terminate current session and return to workspace gate"
            className="p-1 rounded text-[var(--skipo-danger)] hover:bg-[var(--skipo-danger)]/10"
            title="Log Out"
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </header>
  );
};
