// Simple schema definitions for the cricket academy app

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  fullName?: string;
  username?: string;
  firebaseUid?: string;
  emailStatus?: string;
  lastSignInAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 'admin' | 'parent' | 'coach';

export const insertUserSchema = {
  email: '',
  username: '',
  fullName: '',
  role: 'parent' as UserRole,
  firebaseUid: '',
  emailStatus: 'unverified' as const,
};

export type SessionDuration = '30' | '45' | '60' | '90';

export const sessionDurations: SessionDuration[] = ['30', '45', '60', '90'];

export const feeAmounts = {
  '30': 25,
  '45': 35,
  '60': 45,
  '90': 65,
};

// Mock users table for database queries
export const users = {
  id: 'id',
  email: 'email',
  username: 'username',
  fullName: 'fullName',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
};
