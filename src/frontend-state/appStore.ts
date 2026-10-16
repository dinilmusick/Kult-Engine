// ══════════════════════════════════════════════════════════════════════════════
// APP STORE — SKIPO SCAFFOLD (MyApp)
// Zustand store for auth state and active workspace.
// Agent extends this with domain-specific state slices.
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
}

export interface Workspace {
  id: string;
  name: string;
  storageProvider?: string;
  storageConnectionId?: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setWorkspaces: (workspaces: Workspace[], activeId?: string | null) => void;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  activeWorkspace: null,
  workspaces: [],

  login: (user, token) => set({ isAuthenticated: true, user, token }),

  logout: () => set({
    isAuthenticated: false,
    user: null,
    token: null,
    activeWorkspace: null,
    workspaces: [],
  }),

  setWorkspaces: (workspaces, activeId) => set((s) => ({
    workspaces,
    activeWorkspace: workspaces.find((w) => w.id === (activeId ?? s.activeWorkspace?.id))
      ?? workspaces[0]
      ?? null,
  })),

  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
}));
