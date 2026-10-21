// @skipo:service kloks.service.storage
// @skipo:schema kloks.service.storage.ui@1.0.0
// @skipo:package @ultrst-armada/floks@^1.2.4
// @skipo:export ui
// @skipo:section Storage.ui.TilesSection
// @skipo:component WorkspaceTilesMenu
// @skipo:origin GENERATED
import React from 'react';
import { WorkspaceTilesMenu, type WorkspaceRecord } from '@ultrst-armada/floks/ui';
import { apiClient } from '../../libraries/client/apiClient';

export interface WorkspaceGateProps {
  workspaces: WorkspaceRecord[];
  activeWorkspaceId?: string | null;
  onSelectWorkspace: (ws: WorkspaceRecord) => void;
  onCreateWorkspace?: (input: { name: string; workspacePath?: string; storageConfig?: any }) => Promise<void> | void;
  onDeleteWorkspace?: (id: string) => Promise<void> | void;
  onLogout?: () => void;
  appName?: string;
}

export const WorkspaceGate: React.FC<WorkspaceGateProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onLogout,
  appName = 'SKIPO APP',
}) => {
  return (
    <WorkspaceTilesMenu
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      onSelectWorkspace={onSelectWorkspace}
      onCreateWorkspace={async (input: any) => {
        if (onCreateWorkspace) {
          await onCreateWorkspace(input);
        } else {
          await apiClient.createWorkspace('system', input as any);
        }
      }}
      onDeleteWorkspace={onDeleteWorkspace}
      onLogout={onLogout}
    />
  );
};
