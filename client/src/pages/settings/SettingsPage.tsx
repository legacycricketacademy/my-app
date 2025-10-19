// client/src/pages/settings/SettingsPage.tsx
import ProfileSettings from './components/ProfileSettings';
import NotificationsSettings from './components/NotificationsSettings';
import PaymentSettings from './components/PaymentSettings';
import SupportSettings from './components/SupportSettings';
import AcademyConfig from './components/AcademyConfig';
import AccessRolesSettings from './components/AccessRolesSettings';
import DataManagement from './components/DataManagement';
import { useState } from 'react';
import { useAuth } from '@/auth/session';

const TABS = [
  { key:'profile', label:'Profile', node:<ProfileSettings/> },
  { key:'notifications', label:'Notifications', node:<NotificationsSettings/> },
  { key:'payments', label:'Payments', node:<PaymentSettings/> },
  { key:'support', label:'Support', node:<SupportSettings/> },
  { key:'academy', label:'Academy Config', node:<AcademyConfig/> , admin:true},
  { key:'access', label:'Access & Roles', node:<AccessRolesSettings/>, admin:true},
  { key:'data', label:'Data Management', node:<DataManagement/>, admin:true},
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const tabs = TABS.filter(t => !t.admin || isAdmin);
  const active = tabs.find(t => t.key === tab) ?? tabs[0];

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Settings</div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
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
