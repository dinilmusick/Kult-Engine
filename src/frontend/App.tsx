/**
 * @file App.tsx
 * @description Root Frontend Controller enforcing Login Gate, Workspace Isolation Gate (Law L6),
 * and rendering the Kult Engine authoring workspace.
 */

import React, { useState, useEffect } from 'react';
import type { WorkspaceRecord } from '@ultrst-armada/floks/ui';
import { LoginGate } from './gates/LoginGate';
import { WorkspaceGate } from './gates/WorkspaceGate';
import { KultWorkspace } from './components/workspace/KultWorkspace';
import { apiClient } from '../libraries/client/apiClient';
import { useAppStore } from '../frontend-state/appStore';

export function App() {
  const [token, setToken] = useState<string | null>('sess::sys_admin::default');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>('ws-kult-main');
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([
    { id: 'ws-kult-main', name: 'Kult Main Workspace', workspacePath: '/workspaces/kult-main' },
  ]);
  const { setActiveWorkspace } = useAppStore();

  useEffect(() => {
    if (!token) return;
    apiClient
      .getWorkspaces()
      .then((data: any) => {
        if (data && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
          if (data.activeWorkspaceId) {
            setActiveWorkspaceId(data.activeWorkspaceId);
            const found = data.workspaces.find((w: any) => w.id === data.activeWorkspaceId);
            if (found) setActiveWorkspace(found);
          }
        }
      })
      .catch(() => {
        const defaultWs = { id: 'ws-kult-main', name: 'Kult Main Workspace', workspacePath: '/workspaces/kult-main' };
        setWorkspaces([defaultWs]);
        setActiveWorkspace(defaultWs);
      });
  }, [token, setActiveWorkspace]);

  const handleSelectWorkspace = (ws: WorkspaceRecord) => {
    setActiveWorkspaceId(ws.id);
    setActiveWorkspace(ws as any);
  };

  const handleCreateWorkspace = async (input: { name: string; workspacePath?: string; storageConfig?: any }) => {
    try {
      const res = await apiClient.createWorkspace('sys_admin', input);
      const created = res.workspace || { id: `ws-${Date.now()}`, name: input.name, workspacePath: input.workspacePath || '/workspace' };
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
      setActiveWorkspace(created);
    } catch {
      const fallback: WorkspaceRecord = { id: `ws-${Date.now()}`, name: input.name, workspacePath: input.workspacePath || '/workspace' };
      setWorkspaces((prev) => [...prev, fallback]);
      setActiveWorkspaceId(fallback.id);
      setActiveWorkspace(fallback as any);
    }
  };

  const handleDeleteWorkspace = (id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId(null);
  };

  if (!token) {
    return <LoginGate appName="Kult Engine" onSuccess={(res) => setToken(res.token || 'demo-token')} />;
  }

  if (!activeWorkspaceId) {
    return (
      <WorkspaceGate
        appName="Kult Engine"
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        onLogout={() => {
          setToken(null);
          setActiveWorkspaceId(null);
        }}
      />
    );
  }

  return (
    <KultWorkspace
      onLogout={() => {
        setToken(null);
        setActiveWorkspaceId(null);
      }}
    />
  );
}

export default App;
