// Hard block to prevent old imports
throw new Error("Do not import from '@/shared/toast'. Use '@/shared/toast' instead.");

// Re-export as fallback (will never be reached due to throw above)
export { ToastProvider, useToast, notify } from "@/shared/toast";
export function Toaster(){ return null; }
