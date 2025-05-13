/**
 * Audit Logging Service
 * 
 * Handles the creation and management of audit logs for security-sensitive operations
 */

import { Request, Response } from 'express';
import { MultiTenantStorage } from '../multi-tenant-storage';

// Define interface for storage requirements
interface IMultiTenantStorage {
  createAuditLog(logEntry: AuditLogEntry): Promise<void>;
}

// Audit log types
export type AuditAction = 
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'password_changed'
  | 'profile_updated'
  | 'session_created'
  | 'session_invalidated'
  | 'role_changed'
  | 'academy_access_granted'
  | 'academy_access_revoked'
  | 'data_exported'
  | 'admin_action';

export interface AuditLogEntry {
  id?: number;
  userId?: number;
  action: AuditAction;
  details: string;
  ipAddress: string;
  userAgent?: string;
  timestamp?: Date;
  academyId?: number | null;
  targetUserId?: number | null;
  targetResourceId?: number | null;
  targetResourceType?: string | null;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  storage: IMultiTenantStorage,
  entry: AuditLogEntry
): Promise<void> {
  try {
    await storage.createAuditLog(entry);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logs should never block application flow
  }
}

/**
 * Get the client IP address from a request
 */
export function getClientIp(req: Request): string {
  // Check various headers for proxied requests
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // Get the first IP if there are multiple
    const ips = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0] 
      : xForwardedFor.split(',')[0].trim();
    return ips;
  }
  
  // Other common headers
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  
  // Fall back to remote address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Audit logging middleware
 */
export function auditMiddleware(storage: IMultiTenantStorage) {
  return (req: Request, res: Response, next: Function) => {
    // Store IP address for later use in audit logs
    res.locals.ipAddress = getClientIp(req);
    res.locals.userAgent = req.headers['user-agent'] || 'unknown';
    
    // Continue with request
    next();
  };
}

/**
 * Create an audit log for a successful login
 */
export async function auditSuccessfulLogin(
  storage: IMultiTenantStorage,
  userId: number,
  req: Request,
  details: string = 'User logged in successfully'
): Promise<void> {
  await createAuditLog(storage, {
    userId,
    action: 'login',
    details,
    ipAddress: req.res?.locals.ipAddress || getClientIp(req),
    userAgent: req.res?.locals.userAgent || req.headers['user-agent'],
    academyId: req.academyId
  });
}

/**
 * Create an audit log for a failed login attempt
 */
export async function auditFailedLogin(
  storage: IMultiTenantStorage,
  req: Request,
  username: string,
  reason: string
): Promise<void> {
  await createAuditLog(storage, {
    action: 'login_failed',
    details: `Failed login attempt for username: ${username}. Reason: ${reason}`,
    ipAddress: res.locals.ipAddress || getClientIp(req),
    userAgent: res.locals.userAgent || req.headers['user-agent']
  });
}

/**
 * Create an audit log for a password reset request
 */
export async function auditPasswordReset(
  storage: IMultiTenantStorage,
  userId: number | undefined,
  email: string,
  req: Request,
  successful: boolean = true
): Promise<void> {
  await createAuditLog(storage, {
    userId,
    action: 'password_reset',
    details: successful
      ? `Password reset requested for email: ${email}`
      : `Failed password reset attempt for email: ${email}`,
    ipAddress: res.locals.ipAddress || getClientIp(req),
    userAgent: res.locals.userAgent || req.headers['user-agent']
  });
}

/**
 * Create an audit log for a user registration
 */
export async function auditRegistration(
  storage: IMultiTenantStorage,
  userId: number,
  email: string,
  role: string,
  req: Request
): Promise<void> {
  await createAuditLog(storage, {
    userId,
    action: 'register',
    details: `New user registered with email: ${email}, role: ${role}`,
    ipAddress: res.locals.ipAddress || getClientIp(req),
    userAgent: res.locals.userAgent || req.headers['user-agent'],
    academyId: req.academyId
  });
}

/**
 * Create an audit log for an admin action
 */
export async function auditAdminAction(
  storage: IMultiTenantStorage,
  adminUserId: number,
  action: string,
  details: string,
  targetUserId?: number,
  targetResourceId?: number,
  targetResourceType?: string,
  req?: Request
): Promise<void> {
  await createAuditLog(storage, {
    userId: adminUserId,
    action: 'admin_action',
    details: `Admin ${action}: ${details}`,
    ipAddress: req ? (res.locals.ipAddress || getClientIp(req)) : 'server',
    userAgent: req ? (res.locals.userAgent || req.headers['user-agent']) : 'server',
    academyId: req?.academyId,
    targetUserId,
    targetResourceId,
    targetResourceType
  });
}