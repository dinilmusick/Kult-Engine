/**
 * @file KultBottomStrip.tsx
 * @description Canonical Skipo Bottom Strip (Laws L9, L18, L19).
 * Displays live hover inspection text, active API status, and environment indicators.
 */

import React from 'react';
import { useInspectionStore } from '../../../frontend-state/inspectionStore';
import { Activity, ShieldCheck } from 'lucide-react';

export const KultBottomStrip: React.FC = () => {
  const { hoverLabel, hoverDescription, isDKeyPressed, activeApiCount } = useInspectionStore();
  const isHovering = Boolean(hoverLabel);

  return (
    <footer className="h-7 px-3 bg-[var(--skipo-bg)] border-t border-[var(--skipo-border-color)]/20 flex items-center justify-between font-mono text-[11px] select-none shrink-0 text-[var(--skipo-text-muted)]">
      {/* Left indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[var(--skipo-accent)] font-bold">
          <ShieldCheck size={11} />
          <span>KULT v1.0</span>
        </div>
        <span>•</span>
        <span className="text-[10px]">KRNLTS Node DAG</span>
      </div>

      {/* Center Dynamic Inspection (Law L9 & L19) */}
      <div className="flex-1 px-4 text-center truncate">
        {isHovering ? (
          <span className="text-[var(--skipo-text)]">
            {isDKeyPressed && hoverDescription ? (
              <span className="text-[10px] text-[var(--skipo-accent)] italic">{hoverDescription}</span>
            ) : (
              <span className="font-semibold text-xs text-[var(--skipo-text)]">
                {hoverLabel}
                <span className="text-[9px] text-[var(--skipo-text-muted)] ml-2">[Hold D for Details]</span>
              </span>
            )}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--skipo-text-muted)]/70">
            Hover any element to inspect contract contracts • Hold D for details
          </span>
        )}
      </div>

      {/* Right API and System status */}
      <div className="flex items-center gap-2">
        {activeApiCount > 0 ? (
          <div className="flex items-center gap-1 text-[var(--skipo-accent)] font-bold animate-pulse">
            <Activity size={11} />
            <span>Syncing ({activeApiCount})</span>
          </div>
        ) : (
          <span className="text-[10px] text-[var(--skipo-success)] font-bold">● Operational</span>
        )}
      </div>
    </footer>
  );
};
