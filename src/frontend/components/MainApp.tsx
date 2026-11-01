import React,{useState} from 'react';
import { KultWorkspace, type KultWorkspaceProps } from './workspace/KultWorkspace';
import AikoPage from '../pages/main/tabs/aiko/page';
import FodPage from '../pages/main/tabs/fod/page';

export const MainApp: React.FC<KultWorkspaceProps> = props => {
  const [tab,setTab]=useState<'workspace'|'aiko'|'fod'>('workspace');
  return <div className="h-screen w-screen">
    <nav className="h-10 flex items-center gap-2 border-b border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] px-3">
      <button type="button" onClick={()=>setTab('workspace')}>Workspace</button>
      <button type="button" onClick={()=>setTab('aiko')}>Aiko</button>
      <button type="button" onClick={()=>setTab('fod')}>FOD</button>
    </nav>
    <main className="h-[calc(100%-2.5rem)]">{tab==='workspace'&&<KultWorkspace {...props}/>} {tab==='aiko'&&<AikoPage/>} {tab==='fod'&&<FodPage/>}</main>
  </div>;
};
export default MainApp;
