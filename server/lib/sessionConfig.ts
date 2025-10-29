import session from 'express-session';
import type { RequestHandler } from 'express';
import { COOKIE_SECRET, SESSION_NAME, isProd } from './env.js';
import { pool } from '../../db/index.js';

// Lazily load PG session store
let PgSessionStore: any = null;
async function loadPgSessionStore() {
  if (PgSessionStore) return PgSessionStore;
  if (!isProd) return null;
  
  try {
    const connectPgSimple = await import('connect-pg-simple');
    PgSessionStore = (connectPgSimple.default || connectPgSimple)(session);
    console.log('✅ PostgreSQL session store loaded (production)');
    return PgSessionStore;
  } catch (e) {
    console.error('❌ Failed to load connect-pg-simple:', e);
    console.warn('⚠️ Falling back to memory session store');
    return null;
  }
}

export async function buildSessionMiddleware(): Promise<RequestHandler> {
  // Only set domain if explicitly provided in env
  const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined;
  // Remove leading dot if present to ensure exact domain matching
  const normalizedDomain = COOKIE_DOMAIN?.startsWith('.') ? COOKIE_DOMAIN.slice(1) : COOKIE_DOMAIN;
  
  const common = {
    name: SESSION_NAME,
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',  // 'none' for cross-site cookies on Render
      secure: isProd, // true on Render (https), false locally
      ...(normalizedDomain && { domain: normalizedDomain }), // Only set if env provided
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  // FORCE MEMORY STORE to avoid SSL certificate errors
  // TODO: Fix PostgreSQL SSL configuration properly later
  console.log('🔧 Using memory session store (FORCED - to avoid SSL errors)');
  return session({
    ...common,
  });
  
  // Disabled PG store for now to fix SSL issues
  // const store = await loadPgSessionStore();
  // if (isProd && store && process.env.DATABASE_URL && false) { // disabled
  //   console.log('✅ Using PostgreSQL session store (production)');
  //   return session({
  //     ...common,
  //     store: new store({
  //       pool: pool, // Use pool with SSL config instead of conString
  //       createTableIfMissing: true,
  //       ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
  //     }),
  //   });
  // }
}

