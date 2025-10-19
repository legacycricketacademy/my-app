// client/src/pages/parent/SettingsPage.tsx
import ProfileSettings from '../settings/components/ProfileSettings';
import NotificationsSettings from '../settings/components/NotificationsSettings';
import PaymentSettings from '../settings/components/PaymentSettings';
import SupportSettings from '../settings/components/SupportSettings';
import { useState } from 'react';

const TABS = [
  { key:'profile', label:'Profile', node:<ProfileSettings/> },
  { key:'notifications', label:'Notifications', node:<NotificationsSettings/> },
  { key:'payments', label:'Payments', node:<PaymentSettings/> },
  { key:'support', label:'Support', node:<SupportSettings/> },
];

export default function ParentSettingsPage() {
  const [tab, setTab] = useState('profile');
  const active = TABS.find(t => t.key === tab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Settings</div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.key}
            className={`px-3 py-1 rounded ${t.key===active.key ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={()=>setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div>{active.node}</div>
    </div>
  );
}
