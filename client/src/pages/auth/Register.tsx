import { useState } from "react";
export default function Register(){
  const [f,setF] = useState({ parentName:"", email:"", phone:"", childName:"", ageGroup:"U11", role:"parent" });
  const [msg,setMsg] = useState<string|null>(null);
  async function onSubmit(e:any){ e.preventDefault();
    const r = await fetch("/api/registration",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(f) });
    setMsg(r.ok ? "Thank you! We received your registration. Check your email to verify." : "Something went wrong.");
  }
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-register">Register</h1>
      <form onSubmit={onSubmit} className="grid gap-2" data-testid="form-register">
        <select value={f.role} onChange={e=>setF({...f, role:e.target.value})} data-testid="reg-role">
          <option value="parent">Parent</option>
          <option value="coach">Coach</option>
        </select>
        <input placeholder="Parent/Coach name" value={f.parentName} onChange={e=>setF({...f,parentName:e.target.value})} data-testid="reg-parent-name" required/>
        <input placeholder="Email" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} data-testid="reg-email" required/>
        <input placeholder="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} data-testid="reg-phone"/>
        <input placeholder="Child name" value={f.childName} onChange={e=>setF({...f,childName:e.target.value})} data-testid="reg-child-name"/>
        <select value={f.ageGroup} onChange={e=>setF({...f,ageGroup:e.target.value})} data-testid="reg-age-group">
          <option value="U7">U7</option><option value="U11">U11</option><option value="U13">U13</option><option value="U15">U15</option>
        </select>
        <button className="btn btn-primary" data-testid="reg-submit">Submit</button>
      </form>
      {msg && <p className="mt-3" data-testid="reg-result">{msg}</p>}
    </div>
  );
}
