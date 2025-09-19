import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJWKS = () => {
  if (!JWKS && process.env.KEYCLOAK_ISSUER_URL) {
    JWKS = createRemoteJWKSet(new URL(`${process.env.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/certs`));
  }
  return JWKS;
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export const verifyJwt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Skip JWT verification if Keycloak is disabled
  if (process.env.KEYCLOAK_ENABLED !== 'true') {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwks = getJWKS();
    if (!jwks) {
      throw new Error('JWKS not initialized - KEYCLOAK_ISSUER_URL not set');
    }

    const { payload } = await jwtVerify(token, jwks, {
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
