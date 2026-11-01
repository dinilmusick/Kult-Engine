import React,{useState} from 'react';

export default function AikoPage(){
  const [request,setRequest]=useState(''); const [output,setOutput]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async()=>{setBusy(true);try{const r=await fetch('/api/converse',{method:'POST',headers:{'content-type':'application/json','x-user-id':'ui'},body:JSON.stringify({request})});setOutput(JSON.stringify(await r.json(),null,2));}finally{setBusy(false);}};
  return <section data-skipo-module="aiko"><h1>Aiko</h1><textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="Tell the application agent what to do."/><button type="button" onClick={submit} disabled={busy||!request.trim()}>{busy?'Running…':'Run'}</button><pre>{output}</pre></section>;
}
