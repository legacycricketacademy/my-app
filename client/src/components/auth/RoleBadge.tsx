/**
 * Role Badge Component
 * Shows the current user's role in the header
 */

import React from 'react';
import { useAuth } from './ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { User, Shield } from 'lucide-react';

export function RoleBadge() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const Icon = isAdmin ? Shield : User;
  const variant = isAdmin ? 'default' : 'secondary';

  return (
    <Badge variant={variant} className="flex items-center gap-1" data-testid="role-badge">
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </span>
    </Badge>
  );
}
