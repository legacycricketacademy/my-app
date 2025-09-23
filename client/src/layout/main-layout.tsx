import React, { ReactNode } from 'react';
import { UserMenu } from '@/components/ui/user-menu';
import { RoleBadge } from '@/components/ui/role-badge';
import { EmailStatusBanner } from '@/components/ui/email-status-banner';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <RoleBadge />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden sm:block">Legacy Cricket Academy</span>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <EmailStatusBanner />
        {children}
      </main>
    </div>
  );
}