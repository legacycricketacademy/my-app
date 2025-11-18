import { useEffect } from "react";

export default function Modal({
  open, onClose, title, children, testId,
}: { open: boolean; onClose: ()=>void; title: string; children: React.ReactNode; testId?: string }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent){ if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  
  if (!open) return null;
  
  const tid = testId || 'modal';
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" 
      data-testid={`${tid}-backdrop`}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-xl shadow-2xl w-[95%] max-w-2xl max-h-[90vh] p-0 flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        data-testid={`${tid}-dialog`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button 
            aria-label="Close" 
            onClick={onClose} 
            data-testid={`${tid}-close`} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

