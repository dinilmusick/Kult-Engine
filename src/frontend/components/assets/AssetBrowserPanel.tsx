/**
 * @file AssetBrowserPanel.tsx
 * @description KLOKS & KRNLTS Asset Discovery Browser & Service Importer (§5, §7 & §8).
 * Enables discovering, searching, inserting real KLOKS assets, and importing existing services.
 */

import React, { useState } from 'react';
import { Search, Plus, Layers, Sparkles, Box, Shield, Activity, Download } from 'lucide-react';
import { searchAssets, type DiscoveredAsset } from '../../../libraries/services/assetDiscovery';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { INSTALLED_KLOKS_SERVICES } from '../../../libraries/services/kloksImporter';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'services', label: 'Services', icon: Box },
  { id: 'functions', label: 'Functions', icon: Sparkles },
  { id: 'audio-midi', label: 'Audio', icon: Activity },
  { id: 'contracts', label: 'Contracts', icon: Shield },
];

export const AssetBrowserPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addNodeFromAsset, importExistingService, document } = useServiceDocumentStore();

  const assets = searchAssets(query, selectedCategory);

  const handleAddAsset = (asset: DiscoveredAsset) => {
    const count = document.nodes.length;
    const x = 200 + (count % 3) * 100;
    const y = 140 + Math.floor(count / 3) * 90;
    addNodeFromAsset(asset, { x, y });
  };

  return (
    <aside className="w-72 h-full border-r border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] flex flex-col font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm text-[var(--skipo-text)]">KLOKS Catalog</span>
          <span className="text-[10px] text-[var(--skipo-accent)] px-1.5 py-0.5 rounded border border-[var(--skipo-accent)]/30">
            {assets.length} items
          </span>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--skipo-text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search KLOKS exports..."
            className="w-full bg-[var(--skipo-surface)] border border-[var(--skipo-border-color)]/30 rounded pl-8 pr-2.5 py-1.5 text-xs text-[var(--skipo-text)] placeholder-[var(--skipo-text-muted)] focus:outline-none focus:border-[var(--skipo-accent)]"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-[var(--skipo-border-color)]/10 shrink-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] whitespace-nowrap ${
                active ? 'bg-[var(--skipo-accent)] text-black font-bold' : 'bg-[var(--skipo-bg)] text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]'
              }`}
            >
              <Icon size={11} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Asset Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {assets.map((asset) => (
          <div key={asset.export} className="p-2.5 rounded border border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)] hover:border-[var(--skipo-accent)]/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[var(--skipo-text)] truncate">{asset.name}</span>
                <span className="text-[9px] text-[var(--skipo-accent)]">{asset.kind}</span>
              </div>
              <p className="text-[10px] text-[var(--skipo-text-muted)] line-clamp-2 mb-2 leading-relaxed">
                {asset.description}
              </p>
              <div className="flex items-center gap-2 text-[9px] text-[var(--skipo-text-muted)]">
                <span>{asset.inputPorts.length} in</span>
                <span>•</span>
                <span>{asset.outputPorts.length} out</span>
                <span>•</span>
                <span className="text-[var(--skipo-text)]/70 font-sans">{asset.source.split('/').pop()}</span>
              </div>
            </div>

            <button
              onClick={() => handleAddAsset(asset)}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1 rounded bg-[var(--skipo-surface-hover)] border border-[var(--skipo-border-color)]/30 hover:bg-[var(--skipo-accent)] hover:text-black font-bold text-[10px] transition-colors"
            >
              <Plus size={11} />
              <span>Insert to Graph</span>
            </button>
          </div>
        ))}
      </div>

      {/* Import Existing KLOKS Service (§5 & §18) */}
      <div className="p-2.5 border-t border-[var(--skipo-border-color)]/20 bg-[var(--skipo-bg)] shrink-0 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] flex items-center gap-1">
          <Download size={11} className="text-[var(--skipo-accent)]" />
          <span>Import KLOKS Service</span>
        </span>
        <div className="space-y-1">
          {INSTALLED_KLOKS_SERVICES.map((svc) => (
            <button
              key={svc.id}
              onClick={() => importExistingService(svc.id)}
              className="w-full text-left px-2 py-1 rounded border border-[var(--skipo-border-color)]/20 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)] text-[10px] truncate text-[var(--skipo-text)] flex items-center justify-between"
            >
              <span className="truncate">{svc.name}</span>
              <span className="text-[8px] text-[var(--skipo-accent)] uppercase">{svc.type.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
