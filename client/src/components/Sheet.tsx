import { useEffect } from "react";

export function Sheet({ open, onClose, title, children, testId }:{
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode; testId?:string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  
  if (!open) return null;
  const tid = testId || "sheet";
  return (
    <div className="fixed inset-0 z-[110] bg-black/40" data-testid={`${tid}-backdrop`}>
      <div role="dialog" aria-modal="true" aria-label={title}
           className="fixed inset-x-0 bottom-0 h-[92vh] bg-white rounded-t-2xl shadow-xl flex flex-col"
           data-testid={`${tid}-dialog`}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" data-testid={`${tid}-close`} className="text-2xl hover:text-gray-600">✕</button>
        </div>
        <div className="px-4 py-3 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
