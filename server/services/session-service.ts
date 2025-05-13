/**
 * Session Management Service
 * 
 * Handles secure session persistence, token management, and session validation
 */

import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { auth as firebaseAuth } from '../firebase-admin';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import { MultiTenantStorage } from '../multi-tenant-storage';

// Define interface for storage requirements
interface IMultiTenantStorage {
  getUser(id: number): Promise<any>;
  validateSession(userId: number, sessionId: string, tokenVersion: number): Promise<boolean>;
  createSession(userId: number, sessionId: string): Promise<void>;
  invalidateSession(userId: number, sessionId: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  createAuditLog(logEntry: any): Promise<void>;
}

// Promisify scrypt for password comparison
const scryptAsync = promisify(scrypt);

// Session token types
interface AccessTokenPayload {
  userId: number;
  role: string;
  academyId?: number | null;
  sessionId: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: number;
  sessionId: string;
  tokenVersion: number;
  type: 'refresh';
}

// Session token response
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Get secret keys from environment
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_key_development_only';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key_development_only';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create new session tokens
 */
export function createSessionTokens(
  userId: number,
  role: string,
  academyId?: number | null,
  sessionId?: string
): SessionTokens {
  // Generate a new session ID if not provided
  const newSessionId = sessionId || generateSessionId();
  
  // Create access token with user data
  const accessToken = jwt.sign(
    {
      userId,
      role,
      academyId,
      sessionId: newSessionId,
      type: 'access'
    } as AccessTokenPayload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  // Create refresh token with minimal data
  const refreshToken = jwt.sign(
    {
      userId,
      sessionId: newSessionId,
      tokenVersion: 1, // For invalidating refresh tokens
      type: 'refresh'
    } as RefreshTokenPayload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    
    // Ensure it's an access token
    if (payload.type !== 'access') {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying access token:', error);
    return null;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    
    // Ensure it's a refresh token
    if (payload.type !== 'refresh') {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
}

/**
 * Verify and refresh tokens
 */
export async function refreshTokens(
  refreshToken: string,
  storage: IMultiTenantStorage
): Promise<SessionTokens | null> {
  // Verify the refresh token
  const refreshPayload = verifyRefreshToken(refreshToken);
  if (!refreshPayload) {
    return null;
  }
  
  try {
    // Get the user from the database
    const user = await storage.getUser(refreshPayload.userId);
    if (!user) {
      return null;
    }
    
    // Check if the session is still valid
    const isValidSession = await storage.validateSession(
      user.id,
      refreshPayload.sessionId,
      refreshPayload.tokenVersion
    );
    
    if (!isValidSession) {
      return null;
    }
    
    // Create new tokens with the same session ID
    return createSessionTokens(
      user.id,
      user.role,
      user.academyId,
      refreshPayload.sessionId
    );
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return null;
  }
}

/**
 * Set session cookies
 */
export function setSessionCookies(
  res: Response,
  tokens: SessionTokens,
  secure: boolean = process.env.NODE_ENV === 'production'
): void {
  // Set the access token in a httpOnly cookie
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY * 1000 // Convert to milliseconds
  });
  
  // Set the refresh token in a httpOnly cookie with longer expiry
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY * 1000 // Convert to milliseconds
  });
  
  // Set non-httpOnly token expiry for client-side refresh logic
  res.cookie('token_expiry', Date.now() + (tokens.expiresIn * 1000), {
    httpOnly: false,
    secure,
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_EXPIRY * 1000
  });
}

/**
 * Clear session cookies
 */
export function clearSessionCookies(res: Response): void {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('token_expiry');
}

/**
 * Authentication middleware
 */
export function authenticate(
  storage: IMultiTenantStorage,
  requireAuth: boolean = true
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check for access token in cookies
    const accessToken = req.cookies?.access_token;
    
    // No token and auth required - reject
    if (!accessToken && requireAuth) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // No token but auth not required - continue
    if (!accessToken && !requireAuth) {
      return next();
    }
    
    // Verify the access token
    const accessPayload = verifyAccessToken(accessToken);
    
    // Token is valid
    if (accessPayload) {
      // Set the authenticated user and role in the request
      req.user = { id: accessPayload.userId, role: accessPayload.role };
      
      // Set academy context if available
      if (accessPayload.academyId) {
        req.academyId = accessPayload.academyId;
      }
      
      return next();
    }
    
    // Access token invalid, try refreshing with refresh token
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      // No refresh token and auth required - reject
      if (requireAuth) {
        return res.status(401).json({ message: 'Authentication required' });
      } else {
        return next();
      }
    }
    
    try {
      // Attempt to refresh the tokens
      const newTokens = await refreshTokens(refreshToken, storage);
      
      if (!newTokens) {
        // Refresh failed and auth required - reject
        if (requireAuth) {
          clearSessionCookies(res);
          return res.status(401).json({ message: 'Authentication required' });
        } else {
          return next();
        }
      }
      
      // Set new cookies
      setSessionCookies(res, newTokens);
      
      // Verify the new access token
      const newAccessPayload = verifyAccessToken(newTokens.accessToken);
      
      if (newAccessPayload) {
        // Set the authenticated user and role
        req.user = { id: newAccessPayload.userId, role: newAccessPayload.role };
        
        // Set academy context if available
        if (newAccessPayload.academyId) {
          req.academyId = newAccessPayload.academyId;
        }
      }
      
      return next();
    } catch (error) {
      console.error('Error in authentication middleware:', error);
      
      // Auth error and auth required - reject
      if (requireAuth) {
        clearSessionCookies(res);
        return res.status(401).json({ message: 'Authentication failed' });
      } else {
        return next();
      }
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // User is authorized
    next();
  };
}

/**
 * Extend the Express Request interface
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        [key: string]: any;
      };
      academyId?: number;
    }
  }
}

/**
 * Handle login and create a new session
 */
export async function handleLogin(
  storage: IMultiTenantStorage,
  userId: number,
  role: string,
  academyId: number | null,
  res: Response
): Promise<void> {
  try {
    // Create a new session in the database
    const sessionId = generateSessionId();
    await storage.createSession(userId, sessionId);
    
    // Generate tokens for the session
    const tokens = createSessionTokens(userId, role, academyId, sessionId);
    
    // Set cookies
    setSessionCookies(res, tokens);
    
    // Update last login time
    await storage.updateLastLogin(userId);
    
    // Create audit log entry
    await storage.createAuditLog({
      userId,
      action: 'login',
      details: `User logged in successfully`,
      ipAddress: res.locals.ipAddress || 'unknown'
    });
  } catch (error) {
    console.error('Error handling login:', error);
    throw error;
  }
}

/**
 * Handle logout
 */
export async function handleLogout(
  storage: IMultiTenantStorage,
  userId: number | undefined,
  refreshToken: string | undefined,
  res: Response
): Promise<void> {
  try {
    // Clear session cookies
    clearSessionCookies(res);
    
    // If we have a refresh token, invalidate the session
    if (refreshToken && userId) {
      const refreshPayload = verifyRefreshToken(refreshToken);
      
      if (refreshPayload) {
        await storage.invalidateSession(userId, refreshPayload.sessionId);
      }
      
      // Create audit log entry
      await storage.createAuditLog({
        userId,
        action: 'logout',
        details: `User logged out`,
        ipAddress: res.locals.ipAddress || 'unknown'
      });
    }
  } catch (error) {
    console.error('Error handling logout:', error);
    throw error;
  }
}