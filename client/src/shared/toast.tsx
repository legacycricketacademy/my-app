import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";

export type Toast = { title?: string; description?: string };
type Ctx = { toast: (t: Toast)=>void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });
const queue: Toast[] = [];

export function notify(t: Toast) {
  // safe to call from anywhere, even before mount
  queue.push(t);
  // no-op rendering here; provider will flush
}

// Compat alias for legacy imports: some files use `import { toast } from '@/shared/toast'`
// We intentionally make it provider-agnostic by delegating to the queued notifier.
export function toast(t: Toast) { notify(t); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo<Ctx>(() => ({
    toast: (t) => {
      // if you have a real UI toaster, call it here instead of console.log
      console.log("[toast]", t.title || "", t.description || "");
    },
  }), []);

  const flushed = useRef(false);
  useEffect(() => {
    if (!flushed.current && queue.length) {
      // flush queued messages
      for (const t of queue.splice(0)) api.toast(t);
      flushed.current = true;
    }
  }, [api]);

  return <ToastCtx.Provider value={api}>{children}</ToastCtx.Provider>;
}

export function useToast() {
  return useContext(ToastCtx);
}
