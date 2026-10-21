/**
 * @file KultWorkspace.tsx
 * @description Master Kult Visual Authoring Workspace (§25 of IMPLEMENTATION-SPEC.md).
 * Composes toolbar, asset catalog, reactive canvas, inspector, dock panel, and bottom strip.
 */

import React, { useState } from 'react';
import { KultToolbar } from '../toolbar/KultToolbar';
import { AssetBrowserPanel } from '../assets/AssetBrowserPanel';
import { KultCanvas } from '../canvas/KultCanvas';
import { NodeInspectorPanel } from '../inspector/NodeInspectorPanel';
import { BottomDockPanel } from '../bottom-panel/BottomDockPanel';
import { KultBottomStrip } from '../bottom-strip/KultBottomStrip';
import { useGlobalHoverInspection } from '../../hooks/useGlobalHoverInspection';

export interface KultWorkspaceProps {
  onLogout?: () => void;
  onOpenServices?: () => void;
}

export const KultWorkspace: React.FC<KultWorkspaceProps> = ({ onLogout, onOpenServices }) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Activate Law L18/L19 global inspection
  useGlobalHoverInspection();

  return (
    <div className="h-screen w-screen bg-[var(--skipo-bg)] text-[var(--skipo-text)] flex flex-col font-mono overflow-hidden">
      {/* Top Toolbar */}
      <KultToolbar onLogout={onLogout} onOpenServices={onOpenServices} />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Asset Catalog */}
        {!isLeftCollapsed && <AssetBrowserPanel />}

        {/* Center: Interactive Graph Canvas */}
        <main className="flex-1 h-full overflow-hidden relative flex flex-col">
          <div className="flex-1 relative">
            <KultCanvas />
          </div>

          {/* Bottom Dock (Traces, Tests, UI Schema, Export) */}
          <BottomDockPanel
            isCollapsed={isDockCollapsed}
            onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
          />
        </main>

        {/* Right: Node & Contract Inspector */}
        {!isRightCollapsed && <NodeInspectorPanel />}
      </div>

      {/* Skipo Governance Bottom Strip */}
      <KultBottomStrip />
    </div>
  );
};
