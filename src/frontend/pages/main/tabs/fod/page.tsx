import React,{useEffect,useState} from 'react';

export default function FodPage(){
  const [flows,setFlows]=useState<any[]>([]); const [selected,setSelected]=useState(''); const [input,setInput]=useState('{}'); const [output,setOutput]=useState('');
  useEffect(()=>{fetch('/api/fod/flows').then(r=>r.json()).then(setFlows);},[]);
  const run=async()=>{const r=await fetch('/api/fod/flows/'+encodeURIComponent(selected)+'/execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input:JSON.parse(input),userId:'ui'})});setOutput(JSON.stringify(await r.json(),null,2));};
  return <section data-skipo-module="fod"><h1>FOD</h1><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select capability</option>{flows.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><textarea value={input} onChange={e=>setInput(e.target.value)}/><button type="button" disabled={!selected} onClick={run}>Execute</button><pre>{output}</pre></section>;
}
