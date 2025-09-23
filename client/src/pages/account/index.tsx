import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { TID } from '@/ui/testids';

// Mock data for account information
const mockAccountData = {
  profile: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-01',
  },
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  children: [
    { id: 1, name: 'John Smith', age: 12, team: 'Under 12s A' },
    { id: 2, name: 'Sarah Johnson', age: 10, team: 'Under 10s B' },
  ],
  organization: {
    name: 'Legacy Cricket Academy',
    role: 'Administrator',
    permissions: ['manage_users', 'manage_sessions', 'view_reports'],
  },
};

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8" data-testid={TID.common.empty}>
      <div className="text-gray-500 text-sm">{message}</div>
    </div>
  );
}

// Tab component
function Tab({ 
  id, 
  label, 
  isActive, 
  onClick, 
  testId 
}: { 
  id: string; 
  label: string; 
  isActive: boolean; 
  onClick: (id: string) => void;
  testId: string;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      data-testid={testId}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {label}
    </button>
  );
}

// Profile tab content
function ProfileTab() {
  const [profileData, setProfileData] = useState(mockAccountData.profile);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Information</h2>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">{profileData.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{profileData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="text-sm text-gray-900">{profileData.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="text-sm text-gray-900">{profileData.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Security tab content
function SecurityTab() {
  const [securityData, setSecurityData] = useState(mockAccountData.security);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Security Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <Button 
            variant={securityData.twoFactorEnabled ? "destructive" : "default"}
            onClick={() => {
              // TODO: Implement 2FA functionality
              alert('2FA functionality coming soon!');
            }}
          >
            {securityData.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Password</h3>
          <p className="text-sm text-gray-600 mb-4">
            Last changed: {securityData.lastPasswordChange}
          </p>
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement password change functionality
              alert('Password change functionality coming soon!');
            }}
          >
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}

// Notifications tab content
function NotificationsTab() {
  const [notifications, setNotifications] = useState(mockAccountData.notifications);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Notification Preferences</h2>
      
      <div className="space-y-4">
        {Object.entries(notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium capitalize">{key} Notifications</h3>
              <p className="text-sm text-gray-600">
                Receive notifications via {key === 'email' ? 'email' : key === 'sms' ? 'SMS' : 'push notifications'}
              </p>
            </div>
            <Button
              variant={value ? "destructive" : "default"}
              onClick={() => handleToggle(key as keyof typeof notifications)}
            >
              {value ? 'Disable' : 'Enable'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Children tab content (Parent only)
function ChildrenTab() {
  const [children, setChildren] = useState(mockAccountData.children);

  const handleEditChild = (childId: string) => {
    // TODO: Implement edit child functionality
    alert(`Edit functionality for child ${childId} coming soon!`);
  };

  const handleRemoveChild = (childId: string) => {
    if (confirm('Are you sure you want to remove this child?')) {
      setChildren(children.filter(child => child.id !== childId));
    }
  };

  const handleAddChild = () => {
    // TODO: Implement add child functionality
    alert('Add child functionality coming soon!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Children</h2>
        <Button onClick={handleAddChild}>Add Child</Button>
      </div>

      {children.length === 0 ? (
        <EmptyState message="No children registered yet. Add your first child to get started." />
      ) : (
        <div className="space-y-4">
          {children.map(child => (
            <div key={child.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{child.name}</h3>
                  <p className="text-sm text-gray-600">Age: {child.age} | Team: {child.team}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditChild(child.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleRemoveChild(child.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Organization tab content (Admin only)
function OrganizationTab() {
  const orgData = mockAccountData.organization;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Organization Settings</h2>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Organization Information</h3>
          <div className="mt-2 space-y-2">
            <p className="text-sm"><span className="font-medium">Name:</span> {orgData.name}</p>
            <p className="text-sm"><span className="font-medium">Your Role:</span> {orgData.role}</p>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Permissions</h3>
          <div className="mt-2">
            <ul className="text-sm space-y-1">
              {orgData.permissions.map(permission => (
                <li key={permission} className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-4">Please sign in to access your account.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const isParent = user.role === 'parent';

  const tabs = [
    { id: 'profile', label: 'Profile', testId: TID.account.tabProfile },
    { id: 'security', label: 'Security', testId: TID.account.tabSecurity },
    { id: 'notifications', label: 'Notifications', testId: TID.account.tabNotifications },
    ...(isParent ? [{ id: 'children', label: 'Children', testId: TID.account.tabChildren }] : []),
    ...(isAdmin ? [{ id: 'organization', label: 'Organization', testId: TID.account.tabOrg }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'security':
        return <SecurityTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'children':
        return <ChildrenTab />;
      case 'organization':
        return <OrganizationTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <MainLayout title="Account">
      <div className="space-y-6" data-testid={TID.account.page}>
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <Tab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
                testId={tab.testId}
              />
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="p-6">
            {renderTabContent()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}