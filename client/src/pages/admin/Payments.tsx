import { useEffect, useState } from "react";

type Payment = {
  id: number|string;
  parentId?: string;
  kidName?: string;
  amount: number;
  method?: string; // "stripe" | "cash" | "link"
  note?: string;
  status: "pending"|"paid";
  createdAt?: string;
};

export default function Payments() {
  const [pending, setPending] = useState<Payment[]>([]);
  const [paid, setPaid] = useState<Payment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ kidName:"", amount:"", method:"stripe", note:"" });

  async function loadAll(){
    const p = await fetch("/api/payments?status=pending").then(r=>r.json());
    const d = await fetch("/api/payments?status=paid").then(r=>r.json());
    setPending(Array.isArray(p)?p:[]); setPaid(Array.isArray(d)?d:[]);
  }
  useEffect(()=>{ loadAll(); },[]);

  async function createPayment(e:any){
    e.preventDefault();
    const body = {
      kidName: form.kidName,
      amount: Number(form.amount),
      method: form.method,
      note: form.note,
      status: "pending"
    };
    await fetch("/api/payments",{ method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify(body)});
    setShowNew(false); setForm({ kidName:"", amount:"", method:"stripe", note:"" }); loadAll();
  }
  async function markPaid(id: number|string){
    await fetch(`/api/payments/${id}`, { method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ status:"paid" })});
    loadAll();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-payments">Payments</h1>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        data-testid="btn-record-payment"
        aria-label="Record Payment"
        onClick={()=>setShowNew(true)}
      >Record Payment</button>

      {showNew && (
        <form onSubmit={createPayment} data-testid="modal-new-payment" className="space-y-4 border p-4 rounded bg-gray-50 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Kid Name</label>
            <input
              data-testid="input-kid-name"
              className="w-full border rounded px-3 py-2"
              placeholder="Kid name"
              value={form.kidName}
              onChange={e=>setForm(f=>({ ...f, kidName:e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              data-testid="input-amount"
              className="w-full border rounded px-3 py-2"
              placeholder="Amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e=>setForm(f=>({ ...f, amount:e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              data-testid="select-method"
              className="w-full border rounded px-3 py-2"
              value={form.method}
              onChange={e=>setForm(f=>({ ...f, method:e.target.value }))}
            >
              <option value="stripe">Stripe</option>
              <option value="cash">Cash</option>
              <option value="link">Payment Link</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <input
              data-testid="input-note"
              className="w-full border rounded px-3 py-2"
              placeholder="Note"
              value={form.note}
              onChange={e=>setForm(f=>({ ...f, note:e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button data-testid="btn-save-payment" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" type="submit">Save</button>
            <button data-testid="btn-cancel-payment" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" type="button" onClick={()=>setShowNew(false)}>Cancel</button>
          </div>
        </form>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2" data-testid="heading-pending">Pending Payments</h2>
      <ul data-testid="list-pending" className="space-y-2 mb-6">
        {pending.map(p=>(
          <li key={p.id} className="flex items-center gap-3 p-3 border rounded bg-yellow-50">
            <span className="flex-1">{p.kidName} — ${p.amount}</span>
            <button 
              data-testid={`btn-mark-paid-${p.id}`} 
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700" 
              onClick={()=>markPaid(p.id)}
            >Mark Paid</button>
          </li>
        ))}
        {pending.length===0 && <li data-testid="empty-pending" className="text-gray-500">No pending payments</li>}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2" data-testid="heading-paid">Paid Payments</h2>
      <ul data-testid="list-paid" className="space-y-2">
        {paid.map(p=>(
          <li key={p.id} className="p-3 border rounded bg-green-50">{p.kidName} — ${p.amount}</li>
        ))}
        {paid.length===0 && <li data-testid="empty-paid" className="text-gray-500">No paid payments</li>}
      </ul>
    </div>
  );
}

