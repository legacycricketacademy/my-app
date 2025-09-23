import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { TID } from '@/ui/testids';

interface RoleBadgeProps {
  className?: string;
}

export function RoleBadge({ className = '' }: RoleBadgeProps) {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'parent':
        return 'bg-blue-100 text-blue-800';
      case 'coach':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)} ${className}`}
      data-testid={TID.header.roleBadge}
    >
      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    </span>
  );
}

