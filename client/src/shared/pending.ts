/**
 * Normalizes "pending" across libs (React Query v4/v5, React Router, RHF, etc.).
 * Pass any object you previously read `.isPending` or `.isLoading` from.
 */
export function isPendingLike(obj: any): boolean {
  if (!obj) return false;
  // TanStack Query v5
  if (typeof obj.isPending === "boolean") return obj.isPending;
  // TanStack Query v4
  if (typeof obj.isLoading === "boolean") return obj.isLoading;
  // React Router useNavigation(): navigation.state: 'idle' | 'loading' | 'submitting'
  if (typeof obj.state === "string") return obj.state !== "idle";
  // RHF formState.isSubmitting
  if (typeof obj.isSubmitting === "boolean") return obj.isSubmitting;
  // AbortController-like
  if (typeof obj.pending === "boolean") return obj.pending;
  // Fallback
  if (obj.status === "pending" || obj.status === "loading") return true;
  return false;
}
