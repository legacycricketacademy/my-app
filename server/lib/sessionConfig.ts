import session from 'express-session';
import type { RequestHandler } from 'express';
import { COOKIE_SECRET, SESSION_NAME, isProd } from './env.js';

// PG store setup for production
let PgSessionStore: any = null;
if (isProd) {
  try {
    // Synchronous require for production (CommonJS interop)
    const connectPgSimple = require('connect-pg-simple');
    PgSessionStore = connectPgSimple(session);
    console.log('✅ PostgreSQL session store loaded (production)');
  } catch (e) {
    console.error('❌ Failed to load connect-pg-simple:', e);
    console.warn('⚠️ Falling back to memory session store');
  }
}

export function buildSessionMiddleware(): RequestHandler {
  const common = {
    name: SESSION_NAME,
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: (isProd ? 'lax' : 'lax') as 'lax',
      secure: isProd, // true on Render (https), false locally
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };

  // In production, use PG store if available; otherwise fall back to memory
  if (isProd && PgSessionStore && process.env.DATABASE_URL) {
    console.log('✅ Using PostgreSQL session store (production)');
    return session({
      ...common,
      store: new PgSessionStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
      }),
    });
  }

  console.log('✅ Using memory session store (development or PG not available)');
  return session({
    ...common,
  });
}

