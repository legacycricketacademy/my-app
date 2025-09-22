import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Only create JWKS if KEYCLOAK_ISSUER_URL is available
const JWKS = process.env.KEYCLOAK_ISSUER_URL 
  ? createRemoteJWKSet(new URL(`${process.env.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/certs`))
  : null;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export const verifyJwt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // If Keycloak is not configured, skip JWT verification
  if (!JWKS || !process.env.KEYCLOAK_ISSUER_URL) {
    console.log('Keycloak not configured, skipping JWT verification');
    return res.status(401).json({ error: 'JWT verification not configured' });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.KEYCLOAK_ISSUER_URL,
      audience: process.env.KEYCLOAK_AUDIENCE || process.env.KEYCLOAK_CLIENT_ID,
    });

    // Extract roles from Keycloak token
    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const resourceAccess = (payload as any).resource_access;
    const realmAccess = (payload as any).realm_access;
    
    const roles = [
      ...(resourceAccess?.[clientId]?.roles || []),
      ...(realmAccess?.roles || [])
    ];
    
    req.user = {
      id: payload.sub!,
      email: (payload as any).email,
      name: (payload as any).name,
      roles: roles
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
