// client/src/components/VerifyEmailBanner.tsx
import { useState } from 'react';

export function VerifyEmailBanner() {
  const [hidden, setHidden] = useState(false);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (hidden) return null;

  async function resend() {
    setPending(true);
    setMsg(null);
    try {
      const res = await fetch('/api/keycloak/resend-verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        setMsg(`Could not resend: ${res.status} ${t || res.statusText}`);
      } else {
        setMsg('Verification email sent. Please check your inbox.');
      }
    } catch (e: any) {
      setMsg(`Request failed: ${e?.message || 'unknown error'}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 flex items-center justify-between">
      <div className="mr-4">
        <div className="font-medium">Please verify your email to unlock all features.</div>
        {msg && <div className="text-sm mt-1">{msg}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={resend}
          disabled={pending}
          className="rounded-md bg-amber-600 text-white px-3 py-1 text-sm disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Resend verification email'}
        </button>
        <button
          onClick={() => setHidden(true)}
          className="rounded-md border border-amber-300 px-2 py-1 text-sm"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
