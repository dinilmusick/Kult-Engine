/**
 * @file AssetBrowserPanel.tsx
 * @description KLOKS & KRNLTS Asset Discovery Browser & Service Importer (§5, §7 & §8).
 * Enables discovering, searching, inserting real KLOKS assets, and importing existing services.
 */

import React, { useState } from 'react';
import { Search, Plus, Layers, Sparkles, Box, Shield, Activity, Download, MoreVertical } from 'lucide-react';
import { searchAssets, type DiscoveredAsset } from '../../../libraries/services/assetDiscovery';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { apiClient } from '../../../libraries/client/apiClient';
import { useAppStore } from '../../../frontend-state/appStore';


const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'services', label: 'Services', icon: Box },
  { id: 'functions', label: 'Functions', icon: Sparkles },
  { id: 'audio-midi', label: 'Audio', icon: Activity },
  { id: 'contracts', label: 'Contracts', icon: Shield },
];

import { STARTER_KLOKS_ARITHMETIC_SERVICE } from '../../../libraries/services/starterServices';
export const AssetBrowserPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addNodeFromAsset, document } = useServiceDocumentStore();
  const { user } = useAppStore();
  const assets = searchAssets(query, selectedCategory);
  const kloks = assets.filter((asset) => asset.category === 'services' && asset.package === '@ultrst-armada/kloks');
  const local = document.service.id.startsWith('local.') ? [document.service] : [];

  const handleAddAsset = (asset: DiscoveredAsset) => {
    const count = document.nodes.length;
    addNodeFromAsset(asset, { x: 200 + (count % 3) * 100, y: 140 + Math.floor(count / 3) * 90 });
  };

  const renderTile = (asset: DiscoveredAsset, viewOnly = true) => (
    <div key={asset.export} className="p-2.5 rounded border border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)]">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold truncate">{asset.name}</span>
        <span className="text-[9px] text-[var(--skipo-accent)]">{viewOnly ? 'KLOKS' : 'LOCAL'}</span>
      </div>
      <p className="text-[10px] text-[var(--skipo-text-muted)] line-clamp-2">{asset.description}</p>
      <div className="flex gap-2 text-[9px] text-[var(--skipo-text-muted)] mt-1"><span>{asset.inputPorts.length} in</span><span>•</span><span>{asset.outputPorts.length} out</span></div>
      {viewOnly ? (
        <div className="mt-2 text-[9px] text-[var(--skipo-text-muted)]">View only • right-click to copy locally</div>
      ) : (
        <button onClick={() => handleAddAsset(asset)} className="mt-2 w-full py-1 rounded bg-[var(--skipo-surface-hover)] text-[10px] font-bold">Open locally</button>
      )}
      {viewOnly && (
        <button onContextMenu={async (e) => { e.preventDefault(); if (user?.id) await apiClient.copyKloksServiceLocally(asset.export, user.id); handleAddAsset(asset); }} onClick={() => handleAddAsset(asset)}
          className="mt-1 w-full py-1 rounded border border-[var(--skipo-border-color)]/30 text-[10px]">
          Edit this service locally
        </button>
      )}
    </div>
  );

  return (
    <aside className="w-72 h-full border-r border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] flex flex-col font-mono text-xs">
      <div className="p-3 border-b border-[var(--skipo-border-color)]/20">
        <span className="font-black text-sm">Services</span>
        <div className="relative mt-2"><Search size={13} className="absolute left-2.5 top-2.5 text-[var(--skipo-text-muted)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services..." className="w-full bg-[var(--skipo-bg)] border rounded pl-8 pr-2 py-1.5 text-xs" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        <section><div className="font-black text-[10px] uppercase mb-2">KLOKS services · view only</div>{kloks.map((a) => renderTile(a, true))}</section>
        <section><div className="font-black text-[10px] uppercase mb-2 flex items-center justify-between">Local services <Plus size={12} /></div>
          {local.length ? local.map((service) => <div key={service.id} className="p-2 border rounded text-[10px]">{service.name}<div className="text-[9px] text-[var(--skipo-text-muted)]">Editable local working copy</div></div>) : (
            <button onClick={() => useServiceDocumentStore.getState().setDocument({ ...STARTER_KLOKS_ARITHMETIC_SERVICE, service: { ...STARTER_KLOKS_ARITHMETIC_SERVICE.service, id: 'local.new-service', name: 'New Local Service' } })}
              className="w-full p-3 border border-dashed rounded text-[10px]">＋ Create new local service</button>
          )}
        </section>
      </div>
    </aside>
  );
};
