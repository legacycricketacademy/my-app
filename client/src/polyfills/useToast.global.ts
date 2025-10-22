/**
 * Global safety polyfill for legacy calls to `useToast()` without import.
 * Returns an object with { toast } that logs instead of crashing.
 * This prevents "ReferenceError: useToast is not defined" at runtime.
 */
type ToastArg = { title?: string; description?: string };

declare global {
  // eslint-disable-next-line no-var
  var useToast: undefined | (() => { toast: (t: ToastArg) => void });
  interface Window { __legacyToast?: (t: ToastArg) => void }
}

if (typeof globalThis.useToast !== "function") {
  // Soft no-op version so app never crashes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).useToast = () => ({
    toast: (t: ToastArg) => {
      // if provider later installs a real function, use that
      if (typeof window !== "undefined" && typeof window.__legacyToast === "function") {
        try { window.__legacyToast(t); return; } catch {}
      }
      try { console.log("[toast]", t?.title ?? "", t?.description ?? ""); } catch {}
    }
  });
}

export {};
