/**
 * Keycloak JWT Token Verification Middleware
 * Verifies access tokens using Keycloak's JWKS endpoint
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Keycloak configuration from environment variables
const KEYCLOAK_URL = process.env.VITE_KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.VITE_KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.VITE_KEYCLOAK_CLIENT_ID;

if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
  console.warn('Keycloak environment variables not configured. JWT verification will be disabled.');
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
  // Skip auth if Keycloak is not configured
  if (!expectedIssuer || !expectedAudience) {
    console.warn('Keycloak not configured, skipping authentication');
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
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
    // Skip role check if Keycloak is not configured
    if (!expectedIssuer || !expectedAudience) {
      console.warn('Keycloak not configured, skipping role check');
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: `Role '${role}' required` });
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
