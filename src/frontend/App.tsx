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
import { ServicesWorkspace } from './components/services/ServicesWorkspace';
import type { LocalServiceRecord } from './components/services/LocalServicesMenu';
import { STARTER_SERVICES } from '../libraries/services/starterServices';
import { apiClient } from '../libraries/client/apiClient';
import { useAppStore } from '../frontend-state/appStore';

export function App() {
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('kultAuthToken') : null);
  const [userId, setUserId] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('kultUserId') : null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const { setActiveWorkspace } = useAppStore();
  const [showServices, setShowServices] = useState(false);
  const [localServices, setLocalServices] = useState<LocalServiceRecord[]>([]);

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
            if (found) { setActiveWorkspace(found); loadWorkspace(found.id); }
          }
        }
      })
      .catch((error) => console.error('Failed to load workspaces', error));
  }, [token, userId, setActiveWorkspace]);

  const loadWorkspace = async (workspaceId: string) => {
    try { const data = await fetch('/api/db/workspace?workspaceId=' + encodeURIComponent(workspaceId) + '&userId=' + encodeURIComponent(userId || '')).then(r => r.json());
      const services = Array.isArray(data?.data?.services) ? data.data.services : STARTER_SERVICES.map(document => ({ id: document.service.id, folder: document.service.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), document, updatedAt: new Date().toISOString() }));
      setLocalServices(services);
    } catch { setLocalServices([]); }
  };

  const handleSelectWorkspace = (ws: WorkspaceRecord) => {
    setActiveWorkspaceId(ws.id); setActiveWorkspace(ws as any); loadWorkspace(ws.id);
  };

  const handleCreateWorkspace = async (input: { name: string; workspacePath?: string; storageConfig?: any }) => {
    try {
      if (!userId) throw new Error('No authenticated user');
      const res = await apiClient.createWorkspace(userId, input);
      const created = res.workspace || { id: `ws-${Date.now()}`, name: input.name, workspacePath: input.workspacePath || '/workspace' };
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
      setActiveWorkspace(created);
      await loadWorkspace(created.id);
    } catch (error) {
      console.error('Failed to create workspace', error);
      throw error;
    }
    /* unreachable fallback removed */

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

  if (showServices) return <ServicesWorkspace services={localServices} onBack={()=>setShowServices(false)} onCreate={()=>{ const document = { ...STARTER_SERVICES[0], service: { ...STARTER_SERVICES[0].service, id: 'local.' + Date.now().toString(36), name: 'New Local Service', description: '' }, nodes: [], edges: [], assets: [], tests: [], metadata: { author: userId || 'local' } }; setLocalServices(prev => [...prev, { id: document.service.id, folder: document.service.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), document, updatedAt: new Date().toISOString() }]); }} onSave={async s=>{ setLocalServices(prev=>prev.map(x=>x.id===s.id?s:x)); await fetch('/api/db/workspace',{method:'POST',headers:{'Content-Type':'application/json','x-user-id':userId||''},body:JSON.stringify({workspaceId:activeWorkspaceId,services:localServices.map(x=>x.id===s.id?s:x)})}); }} />;

  return (
    <KultWorkspace
      onOpenServices={() => setShowServices(true)}
      onLogout={() => {
        setToken(null); setUserId(null); setActiveWorkspaceId(null);
        localStorage.removeItem('kultAuthToken'); localStorage.removeItem('kultUserId');
      }}
    />
  );
}

export default App;
