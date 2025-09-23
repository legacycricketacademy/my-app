import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, signOut } from '@/lib/auth';
import { safeInitials } from '@/lib/strings';
import { TID } from '@/ui/testids';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    signOut();
    window.location.href = '/auth';
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    window.location.href = '/account';
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    window.location.href = '/account?tab=settings';
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        className="flex items-center space-x-2 px-3 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-testid={TID.header.userMenuTrigger}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {safeInitials(user.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
            <div className="text-xs text-gray-500 capitalize">{user.role}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          onKeyDown={handleMenuKeyDown}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              data-testid={TID.header.userMenuProfile}
            >
              <User className="h-4 w-4 mr-3" />
              Profile
            </button>
            <button
              onClick={handleSettingsClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              data-testid={TID.header.userMenuSettings}
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>
            <div className="border-t border-gray-100"></div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              data-testid={TID.header.userMenuSignout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

