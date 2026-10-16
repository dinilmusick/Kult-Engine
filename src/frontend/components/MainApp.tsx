// ══════════════════════════════════════════════════════════════════════════════
// SKIPO CANONICAL MAIN APP SHELL (Aspect 03, 10 & Laws L7, L9, L18, L19)
// Features: Tabs (Overview, Node Graph, BullMQ Queue), BottomStrip, Hover Inspection
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Database, HardDrive, LogOut, Network, Cpu, Layout, Settings } from 'lucide-react';
import { useAppStore } from '../../frontend-state/appStore';
import { BaseButton, BaseBadge, BaseCard } from './ui';
import { SettingsTab } from '../../libraries/skipo/ui/components/settings/SettingsTab';
import { BottomStrip } from './bottom-strip/BottomStrip';
import { NodeGraphView } from './nodegraph/NodeGraphView';
import { QueueView } from './queue/QueueView';
import { useGlobalHoverInspection } from '../hooks/useGlobalHoverInspection';
import { apiClient } from '../../libraries/client/apiClient';

export const MainApp: React.FC = () => {
  const { user, activeWorkspace, logout, setWorkspaces } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'queue' | 'settings'>('graph');

  useGlobalHoverInspection();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.getWorkspaces();
        if (data.success && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces, data.activeWorkspaceId);
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    }
    loadData();
  }, [setWorkspaces]);

  return (
    <div className="h-screen w-screen bg-[var(--skipo-bg)] text-[var(--skipo-text)] flex flex-col font-mono select-none overflow-hidden pb-8">
      {/* Top Header */}
      <header className="h-12 border-b border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--skipo-accent)] text-black font-black flex items-center justify-center text-xs">
              ▲
            </div>
            <span className="font-black text-sm tracking-wider uppercase">MyApp</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <BaseButton
              variant={activeTab === 'graph' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('graph')}
              data-skipo-label="Node Graph"
              data-skipo-desc="Open visual canvas with mouse navigation and hotkeys"
              className="flex items-center gap-1.5"
            >
              <Network size={13} />
              <span>Node Graph</span>
            </BaseButton>

            <BaseButton
              variant={activeTab === 'queue' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('queue')}
              data-skipo-label="BullMQ Queue"
              data-skipo-desc="Manage and dispatch background queue execution jobs"
              className="flex items-center gap-1.5"
            >
              <Cpu size={13} />
              <span>BullMQ Queue</span>
            </BaseButton>

            <BaseButton
              variant={activeTab === 'overview' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              data-skipo-label="Overview"
              data-skipo-desc="View app architecture and core system connections"
              className="flex items-center gap-1.5"
            >
              <Layout size={13} />
              <span>Overview</span>
            </BaseButton>

            <BaseButton
              variant={activeTab === 'settings' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('settings')}
              data-skipo-label="Settings"
              data-skipo-desc="Manage app appearance, themes, and system settings"
              className="flex items-center gap-1.5"
            >
              <Settings size={13} />
              <span>Settings</span>
            </BaseButton>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {activeWorkspace && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--skipo-border-color)] bg-[var(--skipo-bg)]"
              data-skipo-label="Active Workspace"
              data-skipo-desc={`Currently active workspace context: ${activeWorkspace.name}`}
            >
              <HardDrive size={13} className="text-[var(--skipo-accent)]" />
              <span className="font-bold text-[var(--skipo-text)]">{activeWorkspace.name}</span>
            </div>
          )}

          <span className="text-[var(--skipo-text-muted)] text-[11px]">
            {user?.email || 'Authenticated'}
          </span>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={logout}
            data-skipo-label="Sign Out"
            data-skipo-desc="Terminate authenticated user session"
            className="text-[var(--skipo-danger)]"
          >
            <LogOut size={13} />
          </BaseButton>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'graph' && (
          <div className="w-full h-full">
            <NodeGraphView />
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
            <QueueView />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto">
            <SettingsTab
              appName="MyApp"
              activeWorkspaceName={activeWorkspace?.name || 'Local Workspace'}
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto flex flex-col gap-6">
            <BaseCard className="p-6 border border-[var(--skipo-border-color)] bg-[var(--skipo-surface)]">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--skipo-border-color)] pb-3">
                <h2 className="text-base font-black uppercase tracking-wider text-[var(--skipo-text)]">
                  MyApp Architecture Overview
                </h2>
                <BaseBadge variant="success" size="sm">Fully Configured</BaseBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-[var(--skipo-border-color)] bg-[var(--skipo-bg)]">
                  <div className="flex items-center gap-2 font-bold mb-1 text-[var(--skipo-accent)]">
                    <Database size={14} />
                    <span>Neon Serverless Database</span>
                  </div>
                  <p className="text-[var(--skipo-text-muted)]">Isomorphic zero-drift driver across Node and Cloudflare.</p>
                </div>

                <div className="p-3 border border-[var(--skipo-border-color)] bg-[var(--skipo-bg)]">
                  <div className="flex items-center gap-2 font-bold mb-1 text-[var(--skipo-accent)]">
                    <HardDrive size={14} />
                    <span>Unified Cloud Storage</span>
                  </div>
                  <p className="text-[var(--skipo-text-muted)]">S3, Backblaze B2 & Supabase connections via unified core.</p>
                </div>
              </div>
            </BaseCard>
          </div>
        )}
      </main>

      {/* Global Canonical Bottom Strip */}
      <BottomStrip />
    </div>
  );
};
