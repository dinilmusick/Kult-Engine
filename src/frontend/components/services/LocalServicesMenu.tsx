import React from 'react';
import { Plus, Server, Search } from 'lucide-react';
import type { ServiceDocument } from '../../../libraries/types/serviceIR';

export interface LocalServiceRecord {
  id: string;
  folder: string;
  document: ServiceDocument;
  updatedAt: string;
}

export const LocalServicesMenu: React.FC<{
  services: LocalServiceRecord[];
  onOpen: (service: LocalServiceRecord) => void;
  onCreate: () => void;
}> = ({ services, onOpen, onCreate }) => {
  const [query, setQuery] = React.useState('');
  const filtered = services.filter((s) => {
    const q = query.toLowerCase().trim();
    return !q || s.document.service.name.toLowerCase().includes(q) || s.document.service.description.toLowerCase().includes(q);
  });

  return <section className="h-full p-5 bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
    <div className="flex items-center justify-between mb-4">
      <div><h2 className="font-black text-lg">Local Services</h2><p className="text-[10px] text-[var(--skipo-text-muted)]">Editable services in this workspace</p></div>
      <button onClick={onCreate} className="flex items-center gap-1 px-3 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs"><Plus size={14}/> New service</button>
    </div>
    <div className="relative mb-4 max-w-md"><Search size={13} className="absolute left-3 top-2.5 text-[var(--skipo-text-muted)]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search local services..." className="w-full rounded border bg-[var(--skipo-surface)] pl-8 pr-3 py-2 text-xs"/></div>
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {filtered.map(service => <button key={service.id} onDoubleClick={() => onOpen(service)} onClick={() => onOpen(service)} className="text-left p-4 rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]">
        <Server size={18} className="mb-3 text-[var(--skipo-accent)]"/>
        <div className="font-bold truncate">{service.document.service.name}</div>
        <div className="text-[10px] text-[var(--skipo-text-muted)] mt-1 line-clamp-2">{service.document.service.description || 'No description'}</div>
        <div className="text-[9px] mt-3 text-[var(--skipo-text-muted)] font-mono">{service.folder}/</div>
      </button>)}
      {!filtered.length && <button onClick={onCreate} className="p-6 border border-dashed rounded text-xs text-left"><Plus size={16}/><div className="font-bold mt-2">Create the first local service</div></button>}
    </div>
  </section>;
};
