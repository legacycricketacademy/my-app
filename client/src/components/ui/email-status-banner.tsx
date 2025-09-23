/**
 * Email Status Banner Component
 * Shows when email is disabled in the current environment
 * Only shows for admin users when EMAIL_BANNER config is 'on'
 */

import { AlertCircle, Mail, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { config } from '@/config';
import { getCurrentUser } from '@/lib/auth';

interface EmailStatus {
  enabled: boolean;
  fromEmail: string;
  replyToEmail: string;
}

export function EmailStatusBanner() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissedState = localStorage.getItem('email-banner:dismissed');
    if (dismissedState === 'true') {
      setDismissed(true);
    }

    // Check email status
    fetch('/api/email/status')
      .then(res => res.json())
      .then(data => {
        setEmailStatus(data);
      })
      .catch(err => {
        console.warn('Failed to fetch email status:', err);
      });
  }, []);

  // Show only when:
  // 1. EMAIL_BANNER config is 'on'
  // 2. User is admin
  // 3. Banner not dismissed
  // 4. Email is disabled
  if (
    config.emailBanner !== 'on' ||
    user?.role !== 'admin' ||
    dismissed ||
    !emailStatus ||
    emailStatus.enabled
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('email-banner:dismissed', 'true');
  };

  return (
    <div 
      className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
      data-testid="email-banner"
    >
      <div className="flex items-start">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Email Service Disabled
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Email notifications are currently disabled. Emails will be logged to the console instead of being sent.
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={handleDismiss}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            aria-label="Don't show again"
          >
            Don't show again
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmailStatusIndicator() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

  useEffect(() => {
    fetch('/api/email/status')
      .then(res => res.json())
      .then(setEmailStatus)
      .catch(() => setEmailStatus(null));
  }, []);

  if (!emailStatus) {
    return null;
  }

  return (
    <div className="flex items-center text-xs text-gray-500">
      <Mail className={`h-3 w-3 mr-1 ${emailStatus.enabled ? 'text-green-500' : 'text-amber-500'}`} />
      <span className={emailStatus.enabled ? 'text-green-600' : 'text-amber-600'}>
        Email {emailStatus.enabled ? 'enabled' : 'disabled'}
      </span>
    </div>
  );
}
