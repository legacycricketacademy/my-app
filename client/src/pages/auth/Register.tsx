import { useState } from "react";
import { flags } from "@/utils/featureFlags";

export default function Register() {
  const [f, setF] = useState({ parentName:"", email:"", phone:"", childName:"", ageGroup:"U7", notes:"" });
  const [ok, setOk] = useState<string|null>(null);
  async function submit(e:any){ 
    e.preventDefault();
    const r = await fetch("/api/registration", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(f) });
    setOk(r.ok ? "Thank you! We received your registration." : "Something went wrong. Please try again.");
  }
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-register">Register for Legacy Cricket Academy</h1>
      <form onSubmit={submit} data-testid="form-register" className="grid gap-2">
        <input placeholder="Parent name" value={f.parentName} onChange={e=>setF({...f,parentName:e.target.value})} data-testid="reg-parent-name" required />
        <input placeholder="Email" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} data-testid="reg-email" required />
        <input placeholder="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} data-testid="reg-phone" />
        <input placeholder="Child name" value={f.childName} onChange={e=>setF({...f,childName:e.target.value})} data-testid="reg-child-name" required />
        <select value={f.ageGroup} onChange={e=>setF({...f,ageGroup:e.target.value})} data-testid="reg-age-group">
          <option value="U7">U7 (5-7)</option>
          <option value="U11">U11 (8-11)</option>
          <option value="U13">U13 (12-13)</option>
          <option value="U15">U15 (14-15)</option>
        </select>
        <textarea placeholder="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} data-testid="reg-notes" />
        <button className="btn btn-primary mt-2" data-testid="reg-submit">Submit</button>
      </form>
      {ok && <p className="mt-3" data-testid="reg-result">{ok}</p>}
      {!flags.emailEnabled && <p className="text-xs opacity-70 mt-2">Note: email notifications disabled in this environment.</p>}
    </div>
  );
}
