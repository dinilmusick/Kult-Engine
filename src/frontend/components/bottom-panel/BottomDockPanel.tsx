/**
 * @file BottomDockPanel.tsx
 * @description Dockable bottom workspace panel for traces, tests, UI preview, and KLOKS export.
 */

import React from 'react';
import { Terminal, Beaker, LayoutTemplate, Package, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { ExecutionTraceView } from '../execution/ExecutionTraceView';
import { TestCaseView } from '../tests/TestCaseView';
import { UISchemaView } from '../uipreview/UISchemaView';
import { KloksExportView } from '../export/KloksExportView';

const TABS = [
  { id: 'execution', label: 'Execution Trace', icon: Terminal },
  { id: 'tests', label: 'Test Suite', icon: Beaker },
  { id: 'uipreview', label: 'UI Surface', icon: LayoutTemplate },
  { id: 'export', label: 'KLOKS Export', icon: Package },
  { id: 'raw', label: 'Raw IR', icon: Code },
] as const;

export const BottomDockPanel: React.FC<{ isCollapsed: boolean; onToggleCollapse: () => void }> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { activeDockTab, setActiveDockTab, document } = useServiceDocumentStore();

  return (
    <div
      className={`border-t border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] flex flex-col transition-all duration-200 select-none ${
        isCollapsed ? 'h-9' : 'h-72'
      }`}
    >
      {/* Dock Tab Bar */}
      <div className="h-9 px-3 bg-[var(--skipo-bg)] border-b border-[var(--skipo-border-color)]/20 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeDockTab === tab.id && !isCollapsed;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveDockTab(tab.id);
                  if (isCollapsed) onToggleCollapse();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                  active
                    ? 'bg-[var(--skipo-surface)] text-[var(--skipo-accent)] font-bold border-b-2 border-[var(--skipo-accent)]'
                    : 'text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]'
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Dock Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {activeDockTab === 'execution' && <ExecutionTraceView />}
          {activeDockTab === 'tests' && <TestCaseView />}
          {activeDockTab === 'uipreview' && <UISchemaView />}
          {activeDockTab === 'export' && <KloksExportView />}
          {activeDockTab === 'raw' && (
            <div className="h-full p-3 bg-black/60 overflow-y-auto font-mono text-[11px] text-[var(--skipo-text)]">
              <pre>{JSON.stringify(document, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
