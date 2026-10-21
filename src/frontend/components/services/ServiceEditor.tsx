import React from 'react';
import { ArrowLeft, Plus, Save, Package, GitBranch, Layers3 } from 'lucide-react';
import type { ServiceDocument } from '../../../libraries/types/serviceIR';
import type { LocalServiceRecord } from './LocalServicesMenu';

interface Functionality { id: string; name: string; description: string; inputSignature: string; outputSignature: string; tags: string[]; }
interface Orchestration { id: string; name: string; description: string; functionalityIds: string[]; }

const card = "rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] p-3";
const input = "w-full rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-bg)] px-2 py-1.5 text-xs";

export const ServiceEditor: React.FC<{
  service: LocalServiceRecord;
  onBack: () => void;
  onSave: (service: LocalServiceRecord) => void;
}> = ({ service, onBack, onSave }) => {
  const [doc, setDoc] = React.useState<ServiceDocument>(service.document);
  const [libraries, setLibraries] = React.useState<string[]>(['@ultrst-armada/gutts']);
  const [functionality, setFunctionality] = React.useState<Functionality[]>([]);
  const [orchestrations, setOrchestrations] = React.useState<Orchestration[]>([]);
  const [showFunctionDialog, setShowFunctionDialog] = React.useState(false);
  const [showOrchestrationDialog, setShowOrchestrationDialog] = React.useState(false);
  const [npmQuery, setNpmQuery] = React.useState('');
  const [npmResults, setNpmResults] = React.useState<string[]>([]);
  const [loadingNpm, setLoadingNpm] = React.useState(false);

  const update = (patch: Partial<ServiceDocument['service']>) => setDoc(prev => ({ ...prev, service: { ...prev.service, ...patch }}));

  async function searchNpm() {
    if (!npmQuery.trim()) return;
    setLoadingNpm(true);
    try {
      const res = await fetch('/api/kult/npm/search?q=' + encodeURIComponent(npmQuery));
      const data = await res.json();
      setNpmResults(Array.isArray(data.packages) ? data.packages : []);
    } finally { setLoadingNpm(false); }
  }

  const addLibrary = (name: string) => { if (!libraries.includes(name)) setLibraries(prev => [...prev, name]); };

  return <div className="h-full w-full bg-[var(--skipo-bg)] text-[var(--skipo-text)] flex flex-col">
    <header className="h-12 shrink-0 border-b border-[var(--skipo-border-color)]/30 flex items-center justify-between px-4 bg-[var(--skipo-surface)]">
      <div className="flex items-center gap-3"><button onClick={onBack} className="p-1.5 rounded hover:bg-[var(--skipo-bg)]"><ArrowLeft size={15}/></button><div><div className="font-black">{doc.service.name}</div><div className="text-[9px] text-[var(--skipo-text-muted)]">{service.folder}/</div></div></div>
      <button onClick={() => onSave({...service, document: doc, updatedAt: new Date().toISOString()})} className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs"><Save size={13}/> Save</button>
    </header>
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px bg-[var(--skipo-border-color)]/20 overflow-hidden">
      <section className="overflow-auto p-4 bg-[var(--skipo-bg)]">
        <h3 className="font-black text-xs mb-3 flex items-center gap-2"><Layers3 size={14}/> Service metadata</h3>
        <div className="space-y-2">
          <label className="block text-[10px]">Name<input className={input} value={doc.service.name} onChange={e => update({name:e.target.value})}/></label>
          <label className="block text-[10px]">Version<input className={input} value={doc.service.version} onChange={e => update({version:e.target.value})}/></label>
          <label className="block text-[10px]">Description<textarea className={input} rows={4} value={doc.service.description} onChange={e => update({description:e.target.value})}/></label>
          <div className="text-[9px] text-[var(--skipo-text-muted)]">Folder: <code>{service.folder}/</code></div>
        </div>
      </section>
      <section className="overflow-auto p-4 bg-[var(--skipo-bg)]">
        <div className="flex items-center justify-between mb-3"><h3 className="font-black text-xs flex items-center gap-2"><Package size={14}/> Imported libraries</h3><span className="text-[9px]">available to all functionalities & orchestrations</span></div>
        <div className="grid grid-cols-2 gap-2">{libraries.map(lib => <div key={lib} className="p-3 rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] text-xs font-bold">{lib}{lib === '@ultrst-armada/gutts' && <div className="text-[9px] font-normal text-[var(--skipo-text-muted)] mt-1">default import</div>}</div>)}</div>
        <div className="mt-3 flex gap-2"><input className={input} value={npmQuery} onChange={e=>setNpmQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchNpm()} placeholder="Search npm packages..."/><button onClick={searchNpm} className="px-3 rounded border text-xs">{loadingNpm?'...':'Search'}</button></div>
        {!!npmResults.length && <div className="mt-2 max-h-36 overflow-auto space-y-1">{npmResults.map(name=><button key={name} onClick={()=>addLibrary(name)} className="block w-full text-left p-2 rounded border text-[10px]">{name}</button>)}</div>}
      </section>
      <section className="overflow-auto p-4 bg-[var(--skipo-bg)]">
        <div className="flex items-center justify-between mb-3"><h3 className="font-black text-xs flex items-center gap-2"><GitBranch size={14}/> Functionalities</h3><button onClick={()=>setShowFunctionDialog(true)} className="p-1.5 rounded bg-[var(--skipo-accent)] text-black"><Plus size={14}/></button></div>
        <div className="grid grid-cols-2 gap-2">{functionality.map(f=><div key={f.id} className={card}><div className="font-bold text-xs">{f.name}</div><div className="text-[9px] mt-1">{f.description}</div><div className="text-[8px] mt-2 text-[var(--skipo-text-muted)]">{f.inputSignature} → {f.outputSignature}</div><div className="text-[8px] mt-1">{f.tags.join(' · ')}</div></div>)}</div>
        {!functionality.length && <div className="text-[10px] text-[var(--skipo-text-muted)]">No functionalities yet. Use + to define the service API.</div>}
      </section>
      <section className="overflow-auto p-4 bg-[var(--skipo-bg)]">
        <div className="flex items-center justify-between mb-3"><h3 className="font-black text-xs">Orchestrations</h3><button disabled={functionality.length < 2} onClick={()=>setShowOrchestrationDialog(true)} className="p-1.5 rounded bg-[var(--skipo-accent)] text-black disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14}/></button></div>
        <div className="text-[9px] text-[var(--skipo-text-muted)] mb-2">{functionality.length < 2 ? 'Add at least two functionalities to enable orchestration creation.' : 'Compose existing functionalities into a service orchestration.'}</div>
        <div className="grid grid-cols-2 gap-2">{orchestrations.map(o=><div key={o.id} className={card}><div className="font-bold text-xs">{o.name}</div><div className="text-[9px]">{o.description}</div><div className="text-[8px] mt-1">{o.functionalityIds.length} functionalities</div></div>)}</div>
      </section>
    </div>
    {showFunctionDialog && <FunctionDialog onClose={()=>setShowFunctionDialog(false)} onCreate={f=>{setFunctionality(p=>[...p,{...f,id:'fn-'+Date.now().toString(36)}]);setShowFunctionDialog(false)}}/>}
    {showOrchestrationDialog && <OrchestrationDialog functions={functionality} onClose={()=>setShowOrchestrationDialog(false)} onCreate={o=>{setOrchestrations(p=>[...p,{...o,id:'orch-'+Date.now().toString(36)}]);setShowOrchestrationDialog(false)}}/>}
  </div>;
};

function FunctionDialog({onClose,onCreate}:{onClose:()=>void;onCreate:(f:Omit<Functionality,'id'>)=>void}) {
  const [name,setName]=React.useState(''); const [description,setDescription]=React.useState(''); const [inputSignature,setInputSignature]=React.useState(''); const [outputSignature,setOutputSignature]=React.useState(''); const [tags,setTags]=React.useState('');
  return <Dialog title="New functionality" onClose={onClose}><Field label="Name" value={name} onChange={setName}/><Field label="Input signature" value={inputSignature} onChange={setInputSignature}/><Field label="Output signature" value={outputSignature} onChange={setOutputSignature}/><Field label="Description" value={description} onChange={setDescription}/><Field label="Tags" value={tags} onChange={setTags}/><button disabled={!name.trim()||!inputSignature.trim()||!outputSignature.trim()} onClick={()=>onCreate({name,description,inputSignature,outputSignature,tags:tags.split(',').map(x=>x.trim()).filter(Boolean)})} className="w-full mt-3 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">Create</button></Dialog>;
}
function OrchestrationDialog({functions,onClose,onCreate}:{functions:Functionality[];onClose:()=>void;onCreate:(o:Omit<Orchestration,'id'>)=>void}) {
  const [name,setName]=React.useState(''); const [description,setDescription]=React.useState(''); const [ids,setIds]=React.useState<string[]>([]);
  return <Dialog title="New orchestration" onClose={onClose}><Field label="Name" value={name} onChange={setName}/><Field label="Description" value={description} onChange={setDescription}/><div className="text-[10px] font-bold mt-2">Functionalities</div>{functions.map(f=><label key={f.id} className="flex gap-2 text-[10px] py-1"><input type="checkbox" checked={ids.includes(f.id)} onChange={e=>setIds(p=>e.target.checked?[...p,f.id]:p.filter(id=>id!==f.id))}/>{f.name}</label>)}<button disabled={!name.trim()||ids.length<2} onClick={()=>onCreate({name,description,functionalityIds:ids})} className="w-full mt-3 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">Create</button></Dialog>;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="block text-[10px] mt-2">{label}<input className={input} value={value} onChange={e=>onChange(e.target.value)}/></label>; }
function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) { return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"><div className="w-[420px] max-h-[85vh] overflow-auto rounded border bg-[var(--skipo-surface)] p-4"><div className="flex justify-between font-black text-sm"><span>{title}</span><button onClick={onClose}>×</button></div>{children}</div></div>; }
