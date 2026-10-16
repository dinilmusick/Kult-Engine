// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL FRONTEND COMPOSITION (@floks/* COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { AppShell, TopToolbar, BottomStrip, BaseCard, type WorkspaceRecord } from '@ultrst-armada/floks/ui';
import { InfiniteCanvas } from '@ultrst-armada/floks/canvas-ui';
import { LoginGate } from './gates/LoginGate';
import { WorkspaceGate } from './gates/WorkspaceGate';
import { apiClient } from '../libraries/client/apiClient';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);

  useEffect(() => {
    if (!token) return;
    apiClient.getWorkspaces()
      .then((data: any) => {
        if (data && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
          if (data.activeWorkspaceId) setActiveWorkspaceId(data.activeWorkspaceId);
        }
      })
      .catch(() => {
        setWorkspaces([{ id: 'ws-default', name: 'Default Workspace', workspacePath: '/workspace' }]);
      });
  }, [token]);

  const handleSelectWorkspace = (ws: WorkspaceRecord) => {
    setActiveWorkspaceId(ws.id);
  };

  const handleCreateWorkspace = async (input: { name: string; workspacePath?: string; storageConfig?: any }) => {
    try {
      const created = await apiClient.createWorkspace('system', input);
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
    } catch {
      const fallback: WorkspaceRecord = { id: `ws-${Date.now()}`, name: input.name, workspacePath: input.workspacePath || '/workspace' };
      setWorkspaces((prev) => [...prev, fallback]);
      setActiveWorkspaceId(fallback.id);
    }
  };

  const handleDeleteWorkspace = (id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId(null);
  };

  if (!token) {
    return <LoginGate appName="Skipo App" onSuccess={(res) => setToken(res.token || 'demo-token')} />;
  }

  if (!activeWorkspaceId) {
    return (
      <WorkspaceGate
        appName="Skipo App"
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onLogout={() => { setToken(null); setActiveWorkspaceId(null); }}
      />
    );
  }

  return (
    <AppShell
      header={<TopToolbar title="Skipo App" />}
      footer={<BottomStrip centerText="Skipo App" />}
    >
      <BaseCard>
        <InfiniteCanvas />
      </BaseCard>
    </AppShell>
  );
}

export default App;
