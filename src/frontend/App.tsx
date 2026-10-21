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
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('kultAuthToken') : null);
  const [userId, setUserId] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('kultUserId') : null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const { setActiveWorkspace } = useAppStore();

  useEffect(() => {
    if (!token || !userId) return;
    apiClient
      .getWorkspaces(userId)
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
  }, [token, userId, setActiveWorkspace]);

  const handleSelectWorkspace = (ws: WorkspaceRecord) => {
    setActiveWorkspaceId(ws.id);
    setActiveWorkspace(ws as any);
  };

  const handleCreateWorkspace = async (input: { name: string; workspacePath?: string; storageConfig?: any }) => {
    try {
      if (!userId) throw new Error('No authenticated user');
      const res = await apiClient.createWorkspace(userId, input);
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

  const handleDeleteWorkspace = async (id: string) => {
    if (userId) await apiClient.deleteWorkspace(userId, id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId(null);
  };

  if (!token) {
    return <LoginGate appName="Kult Engine" onSuccess={(res) => {
      if (!res.token || !res.user) return;
      setToken(res.token); setUserId(res.user.id);
      localStorage.setItem('kultAuthToken', res.token); localStorage.setItem('kultUserId', res.user.id);
    }} />;
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
          setToken(null); setUserId(null); setActiveWorkspaceId(null);
          localStorage.removeItem('kultAuthToken'); localStorage.removeItem('kultUserId');
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
