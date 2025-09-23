/**
 * Keycloak JWT Token Verification Middleware
 * Verifies access tokens using Keycloak's JWKS endpoint
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';

// Get authentication provider from config
const AUTH_PROVIDER = config.authProvider;

// Keycloak configuration from config
const KEYCLOAK_URL = config.keycloak?.url;
const KEYCLOAK_REALM = config.keycloak?.realm;
const KEYCLOAK_CLIENT_ID = config.keycloak?.clientId;

// Only warn about Keycloak configuration if AUTH_PROVIDER is set to keycloak
if (AUTH_PROVIDER === 'keycloak' && (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID)) {
  console.warn('AUTH_PROVIDER is set to keycloak but Keycloak environment variables are not configured. JWT verification will be disabled.');
} else if (AUTH_PROVIDER !== 'keycloak') {
  console.log(`AUTH_PROVIDER is set to ${AUTH_PROVIDER}, skipping Keycloak configuration.`);
}

// JWKS client for fetching public keys
const client = KEYCLOAK_URL && KEYCLOAK_REALM ? jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5
}) : null;

// Expected issuer and audience
const expectedIssuer = KEYCLOAK_URL && KEYCLOAK_REALM ? 
  `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}` : null;
const expectedAudience = KEYCLOAK_CLIENT_ID;

interface KeycloakToken {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  aud: string | string[];
  iss: string;
  exp: number;
  iat: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

/**
 * Get signing key from JWKS
 */
async function getSigningKey(kid: string): Promise<string> {
  if (!client) {
    throw new Error('JWKS client not initialized');
  }

  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      
      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        reject(new Error('Unable to find a signing key'));
        return;
      }
      
      resolve(signingKey);
    });
  });
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<KeycloakToken> {
  if (!expectedIssuer || !expectedAudience) {
    throw new Error('Keycloak configuration missing');
  }

  // Decode header to get kid
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new Error('Invalid token format');
  }

  // Get signing key
  const signingKey = await getSigningKey(decoded.header.kid);

  // Verify token
  const payload = jwt.verify(token, signingKey, {
    algorithms: ['RS256'],
    issuer: expectedIssuer,
    audience: expectedAudience,
  }) as KeycloakToken;

  return payload;
}

/**
 * Extract token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Require authentication middleware
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  console.log('Auth token received:', token);
  
  // Handle mock tokens if AUTH_PROVIDER is mock
  if (AUTH_PROVIDER === 'mock') {
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Parse mock token format: mock:<id>:<role>
    if (token.startsWith('mock:')) {
      const parts = token.split(':');
      if (parts.length === 3) {
        const [, id, role] = parts;
        req.user = {
          id,
          email: `test+${id}@example.com`,
          name: role === 'admin' ? 'Test Admin' : 'Test Parent',
          roles: [role]
        };
        console.log('Mock user set:', req.user);
        return next();
      }
    }
    
    // Legacy mock token support
    if (token.startsWith('mock-token-')) {
      const userId = token.replace('mock-token-', '');
      let user;
      if (token === 'mock-token-admin') {
        user = {
          id: '1',
          email: 'test+1@example.com',
          name: 'Test Admin',
          roles: ['admin']
        };
      } else {
        user = {
          id: '2',
          email: 'test+2@example.com',
          name: 'Test Parent',
          roles: ['parent']
        };
      }
      req.user = user;
      console.log('Mock user set:', req.user);
      return next();
    }
    
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // If AUTH_PROVIDER is keycloak, require proper Keycloak configuration
  if (AUTH_PROVIDER === 'keycloak') {
    if (!expectedIssuer || !expectedAudience) {
      return res.status(500).json({ error: 'JWT verification not configured' });
    }

    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
  } else {
    // For other providers or when not configured, skip authentication
    console.log(`AUTH_PROVIDER is ${AUTH_PROVIDER}, skipping authentication`);
    return next();
  }

  verifyToken(token)
    .then((payload) => {
      // Extract user information
      const roles = [
        ...(payload.realm_access?.roles || []),
        ...(payload.resource_access?.[KEYCLOAK_CLIENT_ID!]?.roles || [])
      ];

      req.user = {
        id: payload.sub,
        email: payload.email || payload.preferred_username || '',
        name: payload.name || payload.preferred_username || 'User',
        roles
      };

      next();
    })
    .catch((error) => {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    });
}

/**
 * Require specific role middleware
 */
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For mock authentication, check roles directly
    if (AUTH_PROVIDER === 'mock') {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.user.roles.includes(role)) {
        return res.status(403).json({ error: 'Insufficient role' });
      }

      return next();
    }

    // Skip role check if Keycloak is not configured
    if (!expectedIssuer || !expectedAudience) {
      console.warn('Keycloak not configured, skipping role check');
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Skip auth if Keycloak is not configured
  if (!expectedIssuer || !expectedAudience) {
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return next();
  }

  verifyToken(token)
    .then((payload) => {
      const roles = [
        ...(payload.realm_access?.roles || []),
        ...(payload.resource_access?.[KEYCLOAK_CLIENT_ID!]?.roles || [])
      ];

      req.user = {
        id: payload.sub,
        email: payload.email || payload.preferred_username || '',
        name: payload.name || payload.preferred_username || 'User',
        roles
      };

      next();
    })
    .catch((error) => {
      console.warn('Optional token verification failed:', error);
      next(); // Continue without user info
    });
}
