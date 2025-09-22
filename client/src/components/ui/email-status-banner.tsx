/**
 * Email Status Banner Component
 * Shows when email is disabled in the current environment
 */

import { AlertCircle, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailStatus {
  enabled: boolean;
  fromEmail: string;
  replyToEmail: string;
}

export function EmailStatusBanner() {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check email status
    fetch('/api/email/status')
      .then(res => res.json())
      .then(data => {
        setEmailStatus(data);
        setIsVisible(!data.enabled);
      })
      .catch(err => {
        console.warn('Failed to fetch email status:', err);
        setIsVisible(false);
      });
  }, []);

  if (!isVisible || !emailStatus) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Email Notifications Disabled
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Email notifications are currently disabled in this environment. 
            Users will not receive welcome emails, payment reminders, or other notifications.
          </p>
          <div className="mt-2 text-xs text-amber-600">
            <p>To enable email notifications:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Set the <code className="bg-amber-100 px-1 rounded">SENDGRID_API_KEY</code> environment variable</li>
              <li>Configure <code className="bg-amber-100 px-1 rounded">EMAIL_FROM</code> and <code className="bg-amber-100 px-1 rounded">EMAIL_REPLY_TO</code></li>
              <li>Verify your sender domain in SendGrid</li>
            </ul>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-600 hover:text-amber-800 ml-2"
          aria-label="Dismiss banner"
        >
          ×
        </button>
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
