import { useEffect, useState } from "react";

type Row = { id?: number|string; sessionId: string|number; date?: string; title?: string; status: "yes"|"no"|"" };

export default function ParentAvailability(){
  const [rows,setRows] = useState<Row[]>([]);
  const parentId = "parent-1"; // replace with real user id from auth provider in your app

  useEffect(()=>{
    (async()=>{
      // sessions list (reuse existing endpoint)
      const sessions = await fetch("/api/sessions").then(r=>r.json()).catch(()=>[]);
      const avail = await fetch(`/api/availability?parentId=${parentId}`).then(r=>r.json()).catch(()=>[]);
      const mapped = (Array.isArray(sessions)?sessions:[]).slice(0,8).map((s:any)=>({
        sessionId: s.id, date: s.startTime, title: s.title, status: (avail.find((a:any)=>a.sessionId===s.id)?.status)||""
      }));
      setRows(mapped);
    })();
  },[]);

  async function setStatus(sessionId:any, status:"yes"|"no"){
    await fetch("/api/availability", { method:"POST", headers:{ "Content-Type":"application/json"},
      body: JSON.stringify({ parentId, sessionId, status })});
    setRows(rs => rs.map(r=> r.sessionId===sessionId ? { ...r, status } : r));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-parent-availability">Upcoming Sessions — Your Availability</h1>
      <ul className="grid gap-2" data-testid="list-availability">
        {rows.map(r=>(
          <li key={r.sessionId} className="flex items-center gap-2">
            <span className="min-w-[180px]">{r.title || 'Session'} — {r.date?.toString().slice(0,16)}</span>
            <button onClick={()=>setStatus(r.sessionId,"yes")} className={`btn btn-sm ${r.status==='yes'?'btn-primary':''}`} data-testid={`avail-yes-${r.sessionId}`}>Yes</button>
            <button onClick={()=>setStatus(r.sessionId,"no")} className={`btn btn-sm ${r.status==='no'?'btn-primary':''}`} data-testid={`avail-no-${r.sessionId}`}>No</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
