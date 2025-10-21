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

export default function PaymentsPage() {
  const [pending, setPending] = useState<Payment[]>([]);
  const [paid, setPaid] = useState<Payment[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ kidName:"", amount:"", method:"stripe", note:"" });

  async function loadAll(){
    const p = await fetch("/api/payments?status=pending", { credentials: 'include' }).then(r=>r.json());
    const d = await fetch("/api/payments?status=paid", { credentials: 'include' }).then(r=>r.json());
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
    await fetch("/api/payments",{ 
      method:"POST", 
      headers:{ "Content-Type":"application/json"}, 
      body: JSON.stringify(body),
      credentials: 'include'
    });
    setShowNew(false); 
    setForm({ kidName:"", amount:"", method:"stripe", note:"" }); 
    loadAll();
  }
  
  async function markPaid(id: number|string){
    await fetch(`/api/payments/${id}`, { 
      method:"PUT", 
      headers:{ "Content-Type":"application/json"}, 
      body: JSON.stringify({ status:"paid" }),
      credentials: 'include'
    });
    loadAll();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-payments">Payments</h1>
        <p className="text-gray-600 mt-1">Manage payments and transaction history</p>
      </div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-6 font-medium"
        data-testid="btn-record-payment"
        aria-label="Record Payment"
        onClick={()=>setShowNew(true)}
      >
        Record New Payment
      </button>

      {showNew && (
        <form onSubmit={createPayment} data-testid="modal-new-payment" className="space-y-4 border border-gray-200 p-6 rounded-lg bg-white shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Payment</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              data-testid="input-kid-name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter student name"
              value={form.kidName}
              onChange={e=>setForm(f=>({ ...f, kidName:e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              data-testid="input-amount"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={e=>setForm(f=>({ ...f, amount:e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              data-testid="select-method"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.method}
              onChange={e=>setForm(f=>({ ...f, method:e.target.value }))}
            >
              <option value="stripe">Stripe</option>
              <option value="cash">Cash</option>
              <option value="link">Payment Link</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <input
              data-testid="input-note"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a note..."
              value={form.note}
              onChange={e=>setForm(f=>({ ...f, note:e.target.value }))}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              data-testid="btn-save-payment" 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium" 
              type="submit"
            >
              Save Payment
            </button>
            <button 
              data-testid="btn-cancel-payment" 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium" 
              type="button" 
              onClick={()=>setShowNew(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3" data-testid="heading-pending">
            Pending Payments
          </h2>
          <ul data-testid="list-pending" className="space-y-2">
            {pending.map(p=>(
              <li key={p.id} className="flex items-center justify-between gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{p.kidName}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">${p.amount}</div>
                  {p.note && <div className="text-sm text-gray-600 mt-1">{p.note}</div>}
                  <div className="text-xs text-gray-500 mt-1">Method: {p.method}</div>
                </div>
                <button 
                  data-testid={`btn-mark-paid-${p.id}`} 
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium whitespace-nowrap" 
                  onClick={()=>markPaid(p.id)}
                >
                  Mark Paid
                </button>
              </li>
            ))}
            {pending.length===0 && (
              <li data-testid="empty-pending" className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                No pending payments
              </li>
            )}
          </ul>
        </div>

        {/* Paid Payments */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3" data-testid="heading-paid">
            Paid Payments
          </h2>
          <ul data-testid="list-paid" className="space-y-2">
            {paid.map(p=>(
              <li key={p.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="font-medium text-gray-900">{p.kidName}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">${p.amount}</div>
                {p.note && <div className="text-sm text-gray-600 mt-1">{p.note}</div>}
                <div className="text-xs text-gray-500 mt-1">Method: {p.method}</div>
              </li>
            ))}
            {paid.length===0 && (
              <li data-testid="empty-paid" className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                No paid payments
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
