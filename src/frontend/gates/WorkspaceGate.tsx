import React from "react";
import type { WorkspaceRecord } from "@ultrst-armada/floks/ui";
import { WorkspacesMenu } from "../components/workspaces/WorkspacesMenu";

export interface WorkspaceGateProps {
  workspaces: WorkspaceRecord[];
  activeWorkspaceId?: string | null;
  onSelectWorkspace: (ws: WorkspaceRecord) => void;
  onCreateWorkspace?: (input: { name: string; workspacePath?: string; storageProvider?: "local" | "backblaze"; storageConfig?: Record<string, unknown> }) => Promise<void> | void;
  onDeleteWorkspace?: (id: string) => Promise<void> | void;
  onLogout?: () => void;
  userId?: string | null;
}

export const WorkspaceGate: React.FC<WorkspaceGateProps> = ({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onLogout,
  userId,
}) => {
  if (!onCreateWorkspace) {
    throw new Error("Kult WorkspaceGate requires an explicit workspace creation handler.");
  }

  return (
    <WorkspacesMenu
      workspaces={workspaces}
      onSelectWorkspace={onSelectWorkspace}
      onCreateWorkspace={onCreateWorkspace}
      onDeleteWorkspace={onDeleteWorkspace}
      onLogout={onLogout}
      userId={userId}
    />
  );
};
