// client/src/components/EmailVerificationBanner.tsx
import { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmailVerificationBannerProps {
  emailVerified: boolean;
  userId?: string;
}

export function EmailVerificationBanner({ emailVerified, userId }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Don't show if email is verified or banner was dismissed
  if (emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/keycloak/resend-verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.ok) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to send verification email. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Email not verified.</span>{' '}
              Please verify your email to unlock all features.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={sending}
            className="bg-white hover:bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            <Mail className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Resend verification email'}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-yellow-100 text-yellow-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
