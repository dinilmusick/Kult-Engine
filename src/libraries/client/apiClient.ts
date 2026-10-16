// ══════════════════════════════════════════════════════════════════════════════
// SKIPO CANONICAL API CLIENT (Aspect 13 & BottomStrip Indicator Integration)
// Encapsulates all network communication to preserve component purity
// ══════════════════════════════════════════════════════════════════════════════

import { useInspectionStore } from '../../frontend-state/inspectionStore';

async function wrappedFetch(url: string, init?: RequestInit): Promise<Response> {
  const store = useInspectionStore.getState();
  store.incrementApiCount();
  try {
    const res = await fetch(url, init);
    return res;
  } finally {
    store.decrementApiCount();
  }
}

export const apiClient = {
  async login(email?: string, password?: string, isAdmin: boolean = false) {
    const res = await wrappedFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, isAdmin }),
    });
    return res.json();
  },

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const res = await wrappedFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getWorkspaces(userId?: string) {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;
    const res = await wrappedFetch('/api/auth/workspaces', { headers });
    return res.json();
  },

  async createWorkspace(userId: string, data: Record<string, unknown>) {
    const res = await wrappedFetch('/api/auth/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getStorageConnections(userId?: string) {
    const headers: Record<string, string> = {};
    if (userId) headers['x-user-id'] = userId;
    const res = await wrappedFetch('/api/auth/storage/connections', { headers });
    return res.json();
  },

  async saveStorageConnection(userId: string, data: Record<string, unknown>) {
    const res = await wrappedFetch('/api/auth/storage/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
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
};
