// ══════════════════════════════════════════════════════════════════════════════
// SKIPO CANONICAL API CLIENT (Aspect 13 & BottomStrip Indicator Integration)
// Encapsulates all network communication to preserve component purity
// ══════════════════════════════════════════════════════════════════════════════

import { useInspectionStore } from '../../frontend-state/inspectionStore';

async function wrappedFetch(url: string, init?: RequestInit): Promise<Response> {
  const store = useInspectionStore.getState();
  store.incrementApiCount();
  try {
    const headers = new Headers(init?.headers || {});
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('kultCanonicalSessionToken') : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(url, { ...init, headers });
    return res;
  } finally {
    store.decrementApiCount();
  }
}

export const apiClient = {
  async listKloksServices() {
    const res = await wrappedFetch('/api/kult/kloks/services');
    return res.json();
  },

  async copyKloksServiceLocally(serviceId: string, _userId?: string) {
    const res = await wrappedFetch('/api/kult/kloks/services/' + encodeURIComponent(serviceId) + '/copy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async loadWorkspace(workspaceId: string) {
    const res = await wrappedFetch('/api/db/workspace?workspaceId=' + encodeURIComponent(workspaceId));
    return res.json();
  },

  async saveWorkspace(workspaceId: string, services: unknown[]) {
    const res = await wrappedFetch('/api/db/workspace', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, services }),
    });
    return res.json();
  },

  async login() { return { success: false, error: 'Use canonical SRKL authentication.' }; },

  async register() { return { success: false, error: 'Use canonical SRKL authentication.' }; },

  async getWorkspaces(_userId?: string) {
    const res = await wrappedFetch('/api/auth/workspaces');
    return res.json();
  },

  async deleteWorkspace(_userId: string, workspaceId: string) {
    const res = await wrappedFetch('/api/auth/workspaces?workspaceId=' + encodeURIComponent(workspaceId), { method: 'DELETE' });
    return res.json();
  },

  async createWorkspace(_userId: string, data: Record<string, unknown>) {
    const res = await wrappedFetch('/api/auth/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSrklBackblazeAccounts(_userId?: string) {
    const res = await wrappedFetch('/api/srkl/backblaze/accounts');
    return res.json();
  },

  async listSrklBackblazeBuckets(account: Record<string, unknown>) {
    const res = await wrappedFetch('/api/srkl/backblaze/buckets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    return res.json();
  },

  async getStorageConnections(_userId?: string) {
    const res = await wrappedFetch('/api/auth/storage/connections');
    return res.json();
  },

  async saveStorageConnection(_userId: string, data: Record<string, unknown>) {
    const res = await wrappedFetch('/api/auth/storage/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async testStorageConnection(data: Record<string, unknown>) {
    const res = await wrappedFetch('/api/auth/storage/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // BullMQ Command Queue Dispatches
  async dispatchCommand(type: string, payload: Record<string, unknown> = {}, priority: string = 'NORMAL') {
    const res = await wrappedFetch('/api/commands/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, priority }),
    });
    return res.json();
  },

  async getCommandStatus(jobId: string) {
    const res = await wrappedFetch(`/api/commands/${jobId}/status`);
    return res.json();
  },

  async validateService(document: any) {
    const res = await wrappedFetch('/api/kult/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    return res.json();
  },

  async executeService(document: any, inputs: Record<string, unknown> = {}) {
    const res = await wrappedFetch('/api/kult/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, inputs }),
    });
    return res.json();
  },

  async exportArtifact(document: any) {
    const res = await wrappedFetch('/api/kult/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    return res.json();
  },

  async promoteService(document: any) {
    const res = await wrappedFetch('/api/kult/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document }),
    });
    return res.json();
  },
};
