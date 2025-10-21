import React, { createContext, useContext, useMemo } from "react";

// Minimal, crash-proof toast context.
// If your UI library's toaster exists, you can swap implementations later.
type ToastInput = { title?: string; description?: string };
type Ctx = { toast: (input: ToastInput) => void };
const ToastCtx = createContext<Ctx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo<Ctx>(() => ({
    toast: (t) => {
      // Non-blocking fallback; replaces "useToast is not defined" crash.
      if (typeof window !== "undefined" && (window as any).console) {
        console.log("[toast]", t);
      }
    },
  }), []);
  return <ToastCtx.Provider value={api}>{children}<Toaster /></ToastCtx.Provider>;
}

export function useToast(): Ctx {
  return useContext(ToastCtx);
}

// Stub Toaster so layout doesn't break if real toaster not wired yet.
export function Toaster() { return null; }
