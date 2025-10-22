import { useEffect } from "react";

export default function Modal({
  open, onClose, title, children, testId,
}: { open: boolean; onClose: ()=>void; title: string; children: React.ReactNode; testId?: string }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid={`${testId||'modal'}-backdrop`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-xl shadow-xl w-[95%] max-w-md p-4"
        data-testid={`${testId||'modal'}-dialog`}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button aria-label="Close" onClick={onClose} data-testid={`${testId||'modal'}-close`} className="text-2xl hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

