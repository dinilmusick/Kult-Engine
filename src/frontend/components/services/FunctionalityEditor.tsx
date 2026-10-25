import React from 'react';
import { MonacoEditor } from '@ultrst-armada/floks/canvas-ui';
import { MonacoIdeServiceFacade } from '@ultrst-armada/kloks/services';
import { ArrowLeft, Code2, Database, Library, Plus, Save, Trash2, X, Zap } from 'lucide-react';
import {
  buildFunctionalityContext,
  type FunctionalityAsset,
  type FunctionalityEvent,
  type FunctionalityHelper,
  removeEvent,
  removeHelper,
  setFunctionalityLibrary,
  removeFunctionalityLibrary,
  upsertEvent,
  upsertHelper,
} from './functionalityEditorModel';

type Tab = 'main' | 'helpers' | 'events' | 'state' | 'libraries';

const inputClass = 'w-full rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-bg)] px-2 py-1.5 text-xs';
const cardClass = 'rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] p-3';

export const FunctionalityEditor: React.FC<{
  functionality: FunctionalityAsset;
  onClose: () => void;
  onSave: (functionality: FunctionalityAsset) => void;
}> = ({ functionality, onClose, onSave }) => {
  const [asset, setAsset] = React.useState(functionality);
  const [tab, setTab] = React.useState<Tab>('main');
  const [editingHelper, setEditingHelper] = React.useState<FunctionalityHelper | null>(null);
  const [editingEvent, setEditingEvent] = React.useState<FunctionalityEvent | null>(null);
  const context = buildFunctionalityContext(asset);

  React.useEffect(() => setAsset(functionality), [functionality]);

  const update = (patch: Partial<FunctionalityAsset>) => setAsset(prev => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
      <header className="h-12 shrink-0 border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--skipo-bg)]" title="Close">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="font-black text-sm">{asset.name}</div>
            <div className="text-[9px] text-[var(--skipo-text-muted)]">KRNLTS functionality editor</div>
          </div>
        </div>
        <button
          onClick={() => onSave(asset)}
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs"
        >
          <Save size={13} /> Save Functionality
        </button>
      </header>

      <nav className="h-10 shrink-0 border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] flex items-center px-3 gap-1">
        {([
          ['main', 'Main Function', Code2],
          ['helpers', 'Helpers', Code2],
          ['events', 'Events', Zap],
          ['state', 'State Data', Database],
          ['libraries', 'Libraries', Library],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`h-8 px-3 rounded text-[10px] font-bold flex items-center gap-1.5 ${tab === id ? 'bg-[var(--skipo-accent)] text-black' : 'hover:bg-[var(--skipo-bg)]'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </nav>

      <main className="min-h-0 flex-1 p-3">
        {tab === 'main' && (
          <MonacoEditor
            height="100%"
            language="typescript"
            theme="vs-dark"
            value={asset.mainFunction}
            sessionId={`kult:${asset.id}:main`}
            ideService={MonacoIdeServiceFacade}
            onChange={value => update({ mainFunction: value ?? '' })}
            minimap={false}
            fontSize={13}
          />
        )}

        {tab === 'helpers' && (
          <AssetTiles
            title="Helper Functions"
            description="One editable helper asset per tile. Double-click a tile to open its implementation."
            addLabel="Add Helper"
            items={asset.helpers.map(helper => ({ id: helper.id, title: helper.name, subtitle: helper.signature }))}
            onAdd={() => setEditingHelper({
              id: `helper-${Date.now().toString(36)}`,
              name: 'newHelper',
              signature: 'declare function newHelper(): void;',
              implementation: 'export function newHelper() {}',
            })}
            onOpen={id => {
              const helper = asset.helpers.find(item => item.id === id);
              if (helper) setEditingHelper(helper);
            }}
            onRemove={id => setAsset(prev => removeHelper(prev, id))}
          />
        )}

        {tab === 'events' && (
          <AssetTiles
            title="Events"
            description="One event asset per tile. Double-click a tile to open its implementation."
            addLabel="Add Event"
            items={asset.events.map(event => ({ id: event.id, title: event.name, subtitle: event.signature }))}
            onAdd={() => setEditingEvent({
              id: `event-${Date.now().toString(36)}`,
              name: 'newEvent',
              signature: 'declare function newEvent(): void;',
              implementation: 'export function newEvent() {}',
            })}
            onOpen={id => {
              const event = asset.events.find(item => item.id === id);
              if (event) setEditingEvent(event);
            }}
            onRemove={id => setAsset(prev => removeEvent(prev, id))}
          />
        )}

        {tab === 'state' && (
          <MonacoEditor
            height="100%"
            language="typescript"
            theme="vs-dark"
            value={asset.stateData}
            sessionId={`kult:${asset.id}:state`}
            ideService={MonacoIdeServiceFacade}
            onChange={value => update({ stateData: value ?? '' })}
            minimap={false}
            fontSize={13}
          />
        )}

        {tab === 'libraries' && (
          <LibrariesEditor
            libraries={asset.libraries}
            onAdd={library => setAsset(prev => setFunctionalityLibrary(prev, library))}
            onRemove={library => setAsset(prev => removeFunctionalityLibrary(prev, library))}
          />
        )}
      </main>

      <footer className="h-8 shrink-0 border-t border-[var(--skipo-border-color)]/30 px-3 flex items-center text-[9px] text-[var(--skipo-text-muted)]">
        Context: {context.helperNames.length} helpers · {context.eventNames.length} events · {context.libraryNames.length} libraries · generated functionality.ts is read-only
      </footer>

      {editingHelper && (
        <AssetEditorOverlay
          title={editingHelper.name}
          assetType="Helper"
          value={editingHelper.implementation}
          name={editingHelper.name}
          signature={editingHelper.signature}
          onClose={() => setEditingHelper(null)}
          onChange={(name, signature, implementation) => setEditingHelper({ ...editingHelper, name, signature, implementation })}
          onSave={() => {
            setAsset(prev => upsertHelper(prev, editingHelper));
            setEditingHelper(null);
          }}
        />
      )}

      {editingEvent && (
        <AssetEditorOverlay
          title={editingEvent.name}
          assetType="Event"
          value={editingEvent.implementation}
          name={editingEvent.name}
          signature={editingEvent.signature}
          onClose={() => setEditingEvent(null)}
          onChange={(name, signature, implementation) => setEditingEvent({ ...editingEvent, name, signature, implementation })}
          onSave={() => {
            setAsset(prev => upsertEvent(prev, editingEvent));
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
};

function AssetTiles(props: {
  title: string;
  description: string;
  addLabel: string;
  items: Array<{ id: string; title: string; subtitle: string }>;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-black text-xs">{props.title}</h2>
          <p className="text-[9px] text-[var(--skipo-text-muted)] mt-1">{props.description}</p>
        </div>
        <button onClick={props.onAdd} className="flex items-center gap-1 px-2 py-1.5 rounded bg-[var(--skipo-accent)] text-black text-[10px] font-bold">
          <Plus size={13} /> {props.addLabel}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {props.items.map(item => (
          <div
            key={item.id}
            onDoubleClick={() => props.onOpen(item.id)}
            className={`${cardClass} cursor-pointer hover:border-[var(--skipo-accent)]/60`}
            title="Double-click to edit"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-xs">{item.title}</div>
              <button onClick={e => { e.stopPropagation(); props.onRemove(item.id); }} className="p-1 rounded hover:bg-[var(--skipo-bg)]">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="mt-2 text-[9px] text-[var(--skipo-text-muted)] break-words">{item.subtitle}</div>
            <div className="mt-3 text-[8px] uppercase tracking-wider text-[var(--skipo-text-muted)]">Double-click to edit</div>
          </div>
        ))}
      </div>
      {!props.items.length && <div className="py-10 text-center text-[10px] text-[var(--skipo-text-muted)]">No assets yet.</div>}
    </section>
  );
}

function AssetEditorOverlay(props: {
  title: string;
  assetType: string;
  value: string;
  name: string;
  signature: string;
  onClose: () => void;
  onChange: (name: string, signature: string, implementation: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-6xl max-h-[92vh] rounded border border-[var(--skipo-border-color)]/40 bg-[var(--skipo-surface)] overflow-hidden flex flex-col">
        <header className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-[var(--skipo-border-color)]/30">
          <div className="font-black text-xs">{props.assetType}: {props.title}</div>
          <button onClick={props.onClose} className="p-1.5 rounded hover:bg-[var(--skipo-bg)]"><X size={14} /></button>
        </header>
        <div className="grid grid-cols-2 gap-2 p-2 shrink-0">
          <label className="text-[9px]">Name<input className={inputClass} value={props.name} onChange={e => props.onChange(e.target.value, props.signature, props.value)} /></label>
          <label className="text-[9px]">Signature<input className={inputClass} value={props.signature} onChange={e => props.onChange(props.name, e.target.value, props.value)} /></label>
        </div>
        <div className="min-h-0 flex-1">
          <MonacoEditor
            height="100%"
            language="typescript"
            theme="vs-dark"
            value={props.value}
            sessionId={`kult:asset:${props.name}`}
            ideService={MonacoIdeServiceFacade}
            onChange={value => props.onChange(props.name, props.signature, value ?? '')}
            minimap={false}
            fontSize={13}
          />
        </div>
        <footer className="h-11 shrink-0 flex justify-end items-center gap-2 px-3 border-t border-[var(--skipo-border-color)]/30">
          <button onClick={props.onClose} className="px-3 py-1.5 rounded border text-[10px]">Close</button>
          <button onClick={props.onSave} className="px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold text-[10px]">Save {props.assetType}</button>
        </footer>
      </div>
    </div>
  );
}

function LibrariesEditor(props: {
  libraries: string[];
  onAdd: (library: string) => void;
  onRemove: (library: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/kult/npm/search?q=' + encodeURIComponent(query));
      const data = await response.json();
      setResults(Array.isArray(data.packages) ? data.packages : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="h-full overflow-auto">
      <h2 className="font-black text-xs">Registered functionality libraries</h2>
      <p className="text-[9px] text-[var(--skipo-text-muted)] mt-1">Libraries are exposed to the Main Function, Helpers, and Events through the generated context.</p>
      <div className="mt-3 space-y-2">
        {props.libraries.map(library => (
          <div key={library} className={`${cardClass} flex items-center justify-between`}>
            <span className="text-xs font-bold">{library}</span>
            {library !== '@ultrst-armada/gutts' && <button onClick={() => props.onRemove(library)}><Trash2 size={13} /></button>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Search npm packages..." />
        <button onClick={search} className="px-3 rounded border text-xs">{loading ? '...' : 'Search'}</button>
      </div>
      {!!results.length && <div className="mt-2 space-y-1">{results.map(result => <button key={result} onClick={() => props.onAdd(result)} className="block w-full text-left p-2 rounded border text-[10px]">{result}</button>)}</div>}
    </section>
  );
}
