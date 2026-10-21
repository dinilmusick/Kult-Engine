import React from 'react';
import { Cloud, Server } from 'lucide-react';
import { LocalServicesMenu, type LocalServiceRecord } from './LocalServicesMenu';
import { ServiceEditor } from './ServiceEditor';

export const ServicesWorkspace: React.FC<{
  services: LocalServiceRecord[];
  onSave: (s: LocalServiceRecord) => void;
  onCreate: () => void;
  onBack: () => void;
}> = ({ services, onSave, onCreate, onBack }) => {
  const [editor, setEditor] = React.useState<LocalServiceRecord | null>(null);
  if (editor) return <ServiceEditor service={editor} onBack={()=>setEditor(null)} onSave={s=>{onSave(s);setEditor(s)}}/>;
  return <div className="h-full flex flex-col"><div className="h-12 px-4 flex items-center justify-between border-b border-[var(--skipo-border-color)]/30 bg-[var(--skipo-surface)]"><button onClick={onBack} className="text-xs">← Workspaces</button><div className="flex gap-2 text-[10px]"><span className="px-2 py-1 rounded bg-[var(--skipo-bg)]"><Server size={11} className="inline"/> Local services</span><span className="px-2 py-1 rounded border border-dashed opacity-50"><Cloud size={11} className="inline"/> Cloud services · later</span></div></div><LocalServicesMenu services={services} onOpen={setEditor} onCreate={onCreate}/></div>;
};
