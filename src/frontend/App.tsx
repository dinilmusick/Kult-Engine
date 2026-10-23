/**
 * @file App.tsx
 * @description Root Frontend Controller enforcing Login Gate, Workspace Isolation Gate (Law L6),
 * and rendering the Kult Engine authoring workspace.
 */

import React, { useState, useEffect } from "react";
import { SkipoThemeProvider, BottomStripProvider, type WorkspaceRecord } from "@ultrst-armada/floks/ui";
import { LoginGate } from "./gates/LoginGate";
import { WorkspaceGate } from "./gates/WorkspaceGate";
import { ServicesWorkspace } from "./components/services/ServicesWorkspace";
import type { LocalServiceRecord } from "./components/services/LocalServicesMenu";
import { STARTER_SERVICES } from "../libraries/services/starterServices";
import { apiClient } from "../libraries/client/apiClient";
import { useAppStore } from "../frontend-state/appStore";

export function App() {
  const [token, setToken] = useState<string | null>(() => typeof window !== "undefined" ? localStorage.getItem("kultAuthToken") : null);
  const [userId, setUserId] = useState<string | null>(() => typeof window !== "undefined" ? localStorage.getItem("kultUserId") : null);
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
          // Do not auto-enter a workspace after login. Kult's first authenticated
          // screen is always the explicit workspace tile menu; opening a workspace
          // is a user action.
        }
      })
      .catch((error) => console.error("Failed to load workspaces", error));
  }, [token, userId, setActiveWorkspace]);

  const loadWorkspace = async (workspaceId: string) => {
    try {
      const data = await fetch("/api/db/workspace?workspaceId=" + encodeURIComponent(workspaceId) + "&userId=" + encodeURIComponent(userId || "")).then(r => r.json());
      const services = Array.isArray(data?.data?.services)
        ? data.data.services
        : STARTER_SERVICES.map(document => ({
            id: document.service.id,
            folder: document.service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            document,
            updatedAt: new Date().toISOString()
          }));
      setLocalServices(services);
    } catch {
      setLocalServices([]);
    }
  };

  const handleSelectWorkspace = async (ws: WorkspaceRecord) => {
    setActiveWorkspaceId(ws.id);
    setActiveWorkspace(ws as any);
    await loadWorkspace(ws.id);
    // The new Kult workspace flow opens the Services tile menu directly.
    // Do not route through the legacy KultWorkspace authoring UI.
    setShowServices(true);
  };

  const handleCreateWorkspace = async (input: { name: string; workspacePath?: string; storageConfig?: any }) => {
    try {
      if (!userId) throw new Error("No authenticated user");
      const res = await apiClient.createWorkspace(userId, input);
      const created = res.workspace || { id: `ws-${Date.now()}`, name: input.name, workspacePath: input.workspacePath || "/workspace" };
      setWorkspaces((prev) => [...prev, created]);
      // Workspace creation does not enter the workspace. The user must explicitly select it.
      setActiveWorkspaceId(null);
      setActiveWorkspace(null);
      setShowServices(false);
    } catch (error) {
      console.error("Failed to create workspace", error);
      throw error;
    }
  };

  const handleCopyKloksService = async (service: { id: string }) => {
    const result = await apiClient.copyKloksServiceLocally(service.id, userId || "");
    if (!result?.success || !result?.service) throw new Error(result?.error || "Unable to copy KLOKS service.");
    const next = result.service as LocalServiceRecord;
    setLocalServices((prev) => prev.some((item) => item.id === next.id) ? prev : [...prev, next]);
    if (activeWorkspaceId) {
      const merged = localServices.some((item) => item.id === next.id) ? localServices : [...localServices, next];
      await fetch("/api/db/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
        body: JSON.stringify({ workspaceId: activeWorkspaceId, services: merged }),
      });
    }
  };

  const handleSaveLocalService = async (s: LocalServiceRecord) => {
    const next = localServices.map(x => x.id === s.id ? s : x);
    if (!next.some(x => x.id === s.id)) next.push(s);
    setLocalServices(next);
    await fetch("/api/db/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
      body: JSON.stringify({ workspaceId: activeWorkspaceId, services: next })
    });
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (userId) await apiClient.deleteWorkspace(userId, id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId(null);
  };

  return (
    <SkipoThemeProvider defaultTheme="dark">
      <BottomStripProvider>
        {!token ? (
          <LoginGate
            appName="Kult Engine"
            onSuccess={(res) => {
              if (!res.token || !res.user) return;
              setToken(res.token);
              setUserId(res.user.id);
              localStorage.setItem("kultAuthToken", res.token);
              localStorage.setItem("kultUserId", res.user.id);
            }}
          />
        ) : !activeWorkspaceId ? (
          <WorkspaceGate
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
            userId={userId}
            onLogout={() => {
              setToken(null);
              setUserId(null);
              setActiveWorkspaceId(null);
              setActiveWorkspace(null);
              setShowServices(false);
              setLocalServices([]);
              localStorage.removeItem("kultAuthToken");
              localStorage.removeItem("kultUserId");
            }}
          />
        ) : showServices ? (
          <ServicesWorkspace
            services={localServices}
            onBack={() => {
              setShowServices(false);
              setActiveWorkspaceId(null);
              setActiveWorkspace(null);
            }}
            onCopyLocal={handleCopyKloksService}
            onCreate={() => {
              const document = {
                ...STARTER_SERVICES[0],
                service: { ...STARTER_SERVICES[0].service, id: "local." + Date.now().toString(36), name: "New Local Service", description: "" },
                nodes: [], edges: [], assets: [], tests: [],
                metadata: { author: userId || "local", libraries: ["@ultrst-armada/gutts"], functionalities: [], orchestrations: [] }
              };
              const created: LocalServiceRecord = {
                id: document.service.id,
                folder: document.service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                document,
                updatedAt: new Date().toISOString()
              };
              setLocalServices(prev => [...prev, created]);
              if (activeWorkspaceId) {
                void fetch("/api/db/workspace", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-user-id": userId || "" },
                  body: JSON.stringify({ workspaceId: activeWorkspaceId, services: [...localServices, created] })
                });
              }
            }}
            onSave={handleSaveLocalService}
            userId={userId}
          />
        ) : null}
      </BottomStripProvider>
    </SkipoThemeProvider>
  );
}

export default App;
