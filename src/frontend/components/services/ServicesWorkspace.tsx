import React from 'react';
import { Cloud, Server, ArrowLeft } from 'lucide-react';
import { LocalServicesMenu, type LocalServiceRecord } from './LocalServicesMenu';
import { ServiceEditor } from './ServiceEditor';

type View = 'chooser' | 'local' | 'editor';

export const ServicesWorkspace: React.FC<{
  services: LocalServiceRecord[];
  onSave: (s: LocalServiceRecord) => void;
  onCreate: () => void;
  onBack: () => void;
}> = ({ services, onSave, onCreate, onBack }) => {
  const [view, setView] = React.useState<View>('chooser');
  const [editor, setEditor] = React.useState<LocalServiceRecord | null>(null);

  if (editor) return <ServiceEditor service={editor} onBack={()=>{setEditor(null);setView('local')}} onSave={s=>{onSave(s);setEditor(s)}}/>;

  if (view === 'local') return <div className="h-full flex flex-col">
    <div className="h-12 px-4 flex items-center border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
      <button onClick={()=>setView('chooser')} className="flex items-center gap-1 text-xs"><ArrowLeft size={13}/> Services</button>
    </div>
    <div className="flex-1"><LocalServicesMenu services={services} onOpen={s=>setEditor(s)} onCreate={onCreate}/></div>
  </div>;

  return <div className="h-full bg-[var(--skipo-bg)] text-[var(--skipo-text)]">
    <div className="h-12 px-4 flex items-center border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]">
      <button onClick={onBack} className="text-xs">← Workspace</button>
      <span className="ml-4 font-black text-xs">Services</span>
    </div>
    <div className="p-6 grid grid-cols-2 gap-4 max-w-3xl">
      <button onClick={()=>setView('local')} className="text-left p-6 rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]">
        <Server size={24} className="text-[var(--skipo-accent)] mb-4"/><div className="font-black">Local Services</div><div className="text-[10px] text-[var(--skipo-text-muted)] mt-1">Editable service folders belonging to this workspace.</div><div className="text-[9px] mt-4">{services.length} service{services.length===1?'':'s'}</div>
      </button>
      <button disabled className="text-left p-6 rounded border border-dashed opacity-50 cursor-not-allowed">
        <Cloud size={24} className="mb-4"/><div className="font-black">Cloud Services</div><div className="text-[10px] text-[var(--skipo-text-muted)] mt-1">KLOKS catalog. View-only until the promotion workflow is enabled.</div><div className="text-[9px] mt-4">Coming after local authoring</div>
      </button>
    </div>
  </div>;
};
