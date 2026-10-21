import React from 'react';
import { ArrowLeft, Plus, Save, Package, GitBranch, Layers3, Code2, Play } from 'lucide-react';
import type { ServiceDocument } from '../../../libraries/types/serviceIR';
import type { LocalServiceRecord } from './LocalServicesMenu';
import { validateServiceEditor } from './serviceEditorModel';
import { FunctionalityEditor } from './FunctionalityEditor';
import { ServiceTestRunner } from './ServiceTestRunner';
import {
  createFunctionalityAsset,
  normalizeFunctionalityAsset,
  type FunctionalityAsset,
} from './functionalityEditorModel';

interface Orchestration { id: string; name: string; description: string; functionalityIds: string[]; }

const card = "rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)] p-3";
const input = "w-full rounded border border-[var(--skipo-border-color)]/30 bg-[var(--skipo-bg)] px-2 py-1.5 text-xs";

export const ServiceEditor: React.FC<{
  service: LocalServiceRecord;
  onBack: () => void;
  onSave: (service: LocalServiceRecord) => void;
}> = ({ service, onBack, onSave }) => {
  const [doc, setDoc] = React.useState<ServiceDocument>(service.document);
  const [folder, setFolder] = React.useState(service.folder);
  const [libraries, setLibraries] = React.useState<string[]>(Array.isArray(service.document.metadata?.libraries) ? service.document.metadata.libraries as string[] : ['@ultrst-armada/gutts']);
  const [functionalities, setFunctionalities] = React.useState<FunctionalityAsset[]>(
    Array.isArray(service.document.metadata?.functionalities)
      ? (service.document.metadata.functionalities as Array<Partial<FunctionalityAsset> & { id: string; name: string; description?: string; inputSignature?: string; outputSignature?: string; tags?: string[] }>).map(raw =>
          normalizeFunctionalityAsset(raw, {
            id: raw.id,
            name: raw.name,
            description: raw.description ?? '',
            inputSignature: raw.inputSignature ?? 'unknown',
            outputSignature: raw.outputSignature ?? 'unknown',
            tags: raw.tags ?? [],
          }),
        )
      : [],
  );
  const [orchestrations, setOrchestrations] = React.useState<Orchestration[]>(Array.isArray(service.document.metadata?.orchestrations) ? service.document.metadata.orchestrations as Orchestration[] : []);
  const [editingFunctionality, setEditingFunctionality] = React.useState<FunctionalityAsset | null>(null);
  const [showFunctionDialog, setShowFunctionDialog] = React.useState(false);
  const [showOrchestrationDialog, setShowOrchestrationDialog] = React.useState(false);
  const [showTestRunner, setShowTestRunner] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [splitX, setSplitX] = React.useState(50);
  const [splitY, setSplitY] = React.useState(50);
  const [dragging, setDragging] = React.useState<'x' | 'y' | null>(null);

  const update = (patch: Partial<ServiceDocument['service']>) => setDoc(prev => ({ ...prev, service: { ...prev.service, ...patch } }));

  React.useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (dragging === 'x') setSplitX(Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100)));
      else setSplitY(Math.max(20, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100)));
    };
    const onMouseUp = () => setDragging(null);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [dragging]);

  const validation = validateServiceEditor({
    name: doc.service.name,
    version: doc.service.version,
    folder,
    libraries,
    functionalities,
    orchestrations,
  });

  const save = () => onSave({
    ...service,
    folder,
    document: {
      ...doc,
      metadata: { ...doc.metadata, libraries, functionalities, orchestrations },
    },
    updatedAt: new Date().toISOString(),
  });

  return <div className="h-full w-full bg-[var(--skipo-bg)] text-[var(--skipo-text)] flex flex-col">
    <header className="h-12 shrink-0 border-b border-[var(--skipo-border-color)]/30 flex items-center justify-between px-4 bg-[var(--skipo-surface)]">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-[var(--skipo-bg)]"><ArrowLeft size={15}/></button>
        <div><div className="font-black">{doc.service.name}</div><div className="text-[9px] text-[var(--skipo-text-muted)]">{service.folder}/</div></div>
      </div>
      <div className="flex items-center gap-2"><button onClick={()=>setShowTestRunner(true)} disabled={!functionalities.length} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs disabled:opacity-40"><Play size={13}/> Test</button><button disabled={!validation.isValid} onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs disabled:opacity-40"><Save size={13}/> Save</button></div>
    </header>

    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[var(--skipo-bg)] select-none">
      <section style={{position:'absolute',left:0,top:0,width:`${splitX}%`,height:`${splitY}%`}} className="p-4 overflow-auto bg-[var(--skipo-bg)] border-r border-b border-[var(--skipo-border-color)]/20">
        <h3 className="font-black text-xs mb-3 flex items-center gap-2"><Layers3 size={14}/> Service metadata</h3>
        <div className="space-y-2">
          <label className="block text-[10px]">Name<input className={input} value={doc.service.name} onChange={e=>update({name:e.target.value})}/></label>
          <label className="block text-[10px]">Version<input className={input} value={doc.service.version} onChange={e=>update({version:e.target.value})}/></label>
          <label className="block text-[10px]">Description<textarea className={input} rows={4} value={doc.service.description} onChange={e=>update({description:e.target.value})}/></label>
          <label className="block text-[10px]">Folder<input className={input} value={folder} onChange={e=>setFolder(e.target.value)}/></label>
          {!validation.isValid && <div className="mt-3 rounded border border-[var(--skipo-danger)]/30 p-2 text-[9px] text-[var(--skipo-danger)]">{validation.errors.map(error=><div key={error}>• {error}</div>)}</div>}
        </div>
      </section>

      <section style={{position:'absolute',left:`${splitX}%`,top:0,width:`${100-splitX}%`,height:`${splitY}%`}} className="p-4 overflow-auto bg-[var(--skipo-bg)] border-b border-[var(--skipo-border-color)]/20">
        <div className="flex items-center justify-between mb-3"><h3 className="font-black text-xs flex items-center gap-2"><Package size={14}/> Imported libraries</h3><span className="text-[9px]">service-level libraries</span></div>
        <div className="grid grid-cols-2 gap-2">{libraries.map(lib=><div key={lib} className={`${card} text-xs font-bold`}>{lib}{lib==='@ultrst-armada/gutts'&&<div className="text-[9px] font-normal text-[var(--skipo-text-muted)] mt-1">default import</div>}</div>)}</div>
      </section>

      <section style={{position:'absolute',left:0,top:`${splitY}%`,width:`${splitX}%`,height:`${100-splitY}%`}} className="p-4 overflow-auto bg-[var(--skipo-bg)] border-r border-[var(--skipo-border-color)]/20">
        <div className="flex items-center justify-between mb-3">
          <div><h3 className="font-black text-xs flex items-center gap-2"><GitBranch size={14}/> Functionalities</h3><div className="text-[9px] text-[var(--skipo-text-muted)]">Double-click a functionality to open its KRNLTS IDE.</div></div>
          <button onClick={()=>setShowFunctionDialog(true)} className="p-1.5 rounded bg-[var(--skipo-accent)] text-black"><Plus size={14}/></button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {functionalities.map(fn=><div key={fn.id} onDoubleClick={()=>setEditingFunctionality(fn)} className={`${card} cursor-pointer hover:border-[var(--skipo-accent)]/60`} title="Double-click to edit functionality">
            <div className="flex items-start justify-between gap-2"><div className="font-bold text-xs">{fn.name}</div><Code2 size={13}/></div>
            <div className="text-[9px] mt-1">{fn.description}</div>
            <div className="text-[8px] mt-2 text-[var(--skipo-text-muted)]">{fn.inputSignature} → {fn.outputSignature}</div>
            <div className="text-[8px] mt-1">{fn.tags.join(' · ')}</div>
            <div className="text-[8px] mt-2 text-[var(--skipo-text-muted)]">{fn.helpers.length} helpers · {fn.events.length} events · {fn.libraries.length} libraries</div>
          </div>)}
        </div>
        {!functionalities.length&&<div className="text-[10px] text-[var(--skipo-text-muted)]">No functionalities yet. Use + to define the service API.</div>}
      </section>

      <section style={{position:'absolute',left:`${splitX}%`,top:`${splitY}%`,width:`${100-splitX}%`,height:`${100-splitY}%`}} className="p-4 overflow-auto bg-[var(--skipo-bg)]">
        <div className="flex items-center justify-between mb-3"><h3 className="font-black text-xs">Orchestrations</h3><button disabled={functionalities.length<2} onClick={()=>setShowOrchestrationDialog(true)} className="p-1.5 rounded bg-[var(--skipo-accent)] text-black disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14}/></button></div>
        <div className="text-[9px] text-[var(--skipo-text-muted)] mb-2">{functionalities.length<2?'Add at least two functionalities to enable orchestration creation.':'Compose existing functionalities into a service orchestration.'}</div>
        <div className="grid grid-cols-2 gap-2">{orchestrations.map(o=><div key={o.id} className={card}><div className="font-bold text-xs">{o.name}</div><div className="text-[9px]">{o.description}</div><div className="text-[8px] mt-1">{o.functionalityIds.length} functionalities</div></div>)}</div>
      </section>

      <div onMouseDown={()=>setDragging('x')} style={{left:`${splitX}%`,top:0,width:'8px',transform:'translateX(-4px)'}} className="absolute h-full cursor-col-resize hover:bg-[var(--skipo-accent)]/40 z-20 flex items-center justify-center"><div className="w-1 h-12 bg-[var(--skipo-border-color)]/60 rounded-full"/></div>
      <div onMouseDown={()=>setDragging('y')} style={{top:`${splitY}%`,left:0,height:'8px',transform:'translateY(-4px)'}} className="absolute w-full cursor-row-resize hover:bg-[var(--skipo-accent)]/40 z-20 flex items-center justify-center"><div className="h-1 w-12 bg-[var(--skipo-border-color)]/60 rounded-full"/></div>
    </div>

    {showFunctionDialog&&<FunctionDialog onClose={()=>setShowFunctionDialog(false)} onCreate={fn=>{setFunctionalities(prev=>[...prev,fn]);setShowFunctionDialog(false)}}/>}
    {showOrchestrationDialog&&<OrchestrationDialog functions={functionalities} onClose={()=>setShowOrchestrationDialog(false)} onCreate={o=>{setOrchestrations(prev=>[...prev,{...o,id:'orch-'+Date.now().toString(36)}]);setShowOrchestrationDialog(false)}}/>}
    {editingFunctionality&&<FunctionalityEditor functionality={editingFunctionality} onClose={()=>setEditingFunctionality(null)} onSave={fn=>{setFunctionalities(prev=>prev.map(item=>item.id===fn.id?fn:item));setEditingFunctionality(null)}}/>}
    {showTestRunner&&<ServiceTestRunner service={doc} functionalities={functionalities} orchestrations={orchestrations} onClose={()=>setShowTestRunner(false)}/>} 
  </div>;
};

function FunctionDialog({onClose,onCreate}:{onClose:()=>void;onCreate:(f:FunctionalityAsset)=>void}) {
  const [name,setName]=React.useState(''); const [description,setDescription]=React.useState(''); const [inputSignature,setInputSignature]=React.useState(''); const [outputSignature,setOutputSignature]=React.useState(''); const [tags,setTags]=React.useState('');
  return <Dialog title="New functionality" onClose={onClose}><Field label="Name" value={name} onChange={setName}/><Field label="Input signature" value={inputSignature} onChange={setInputSignature}/><Field label="Output signature" value={outputSignature} onChange={setOutputSignature}/><Field label="Description" value={description} onChange={setDescription}/><Field label="Tags" value={tags} onChange={setTags}/><button disabled={!name.trim()||!inputSignature.trim()||!outputSignature.trim()} onClick={()=>onCreate(createFunctionalityAsset({id:'fn-'+Date.now().toString(36),name,description,inputSignature,outputSignature,tags:tags.split(',').map(x=>x.trim()).filter(Boolean)}))} className="w-full mt-3 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">Create</button></Dialog>;
}
function OrchestrationDialog({functions,onClose,onCreate}:{functions:FunctionalityAsset[];onClose:()=>void;onCreate:(o:Omit<Orchestration,'id'>)=>void}) {
  const [name,setName]=React.useState(''); const [description,setDescription]=React.useState(''); const [ids,setIds]=React.useState<string[]>([]);
  return <Dialog title="New orchestration" onClose={onClose}><Field label="Name" value={name} onChange={setName}/><Field label="Description" value={description} onChange={setDescription}/>{functions.map(f=><label key={f.id} className="flex gap-2 text-[10px] py-1"><input type="checkbox" checked={ids.includes(f.id)} onChange={e=>setIds(p=>e.target.checked?[...p,f.id]:p.filter(id=>id!==f.id))}/>{f.name}</label>)}<button disabled={!name.trim()||ids.length<2} onClick={()=>onCreate({name,description,functionalityIds:ids})} className="w-full mt-3 py-2 rounded bg-[var(--skipo-accent)] text-black font-bold text-xs">Create</button></Dialog>;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="block text-[10px] mt-2">{label}<input className={input} value={value} onChange={e=>onChange(e.target.value)}/></label>; }
function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) { return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"><div className="w-[420px] max-h-[85vh] overflow-auto rounded border bg-[var(--skipo-surface)] p-4"><div className="flex justify-between font-black text-sm"><span>{title}</span><button onClick={onClose}>×</button></div>{children}</div></div>; }
