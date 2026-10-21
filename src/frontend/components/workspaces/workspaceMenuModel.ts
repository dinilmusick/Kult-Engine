export type WorkspaceStorageMode = "local" | "backblaze";

export interface WorkspaceDraft {
  name: string;
  workspacePath?: string;
  storageProvider: WorkspaceStorageMode;
  storageConfig: Record<string, unknown>;
}

export function createWorkspaceDraft(name: string, storageProvider: WorkspaceStorageMode): WorkspaceDraft {
  const trimmed = name.trim();
  return {
    name: trimmed,
    workspacePath: storageProvider === "local" ? "/workspaces" : undefined,
    storageProvider,
    storageConfig: storageProvider === "local" ? { rootPath: "/workspaces" } : { bucketName: "", endpoint: "" },
  };
}

export function shouldShowWorkspaceMenu(hasAuthenticatedUser: boolean, hasSelectedWorkspace: boolean): boolean {
  return hasAuthenticatedUser && !hasSelectedWorkspace;
}
