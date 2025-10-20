import session from 'express-session';
import type { RequestHandler } from 'express';
import { COOKIE_SECRET, SESSION_NAME, isProd } from './env.js';

// Lazy import PG store only in prod so dev never loads it
let PgSessionStore: any = null;
if (isProd) {
  try {
    // Dynamic import for production only - use async import for ESM
    import('connect-pg-simple').then((module) => {
      const connectPgSimple = module.default;
      PgSessionStore = connectPgSimple(session);
      console.log('✅ PostgreSQL session store loaded (production)');
    }).catch((e) => {
      console.error('❌ Failed to load connect-pg-simple:', e);
    });
  } catch (e) {
    console.error('❌ Failed to load connect-pg-simple:', e);
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

  // TEMPORARY: Use memory store for all environments until DB tables are set up
  console.log('✅ Using memory session store (temporary for e2e testing)');
  return session({
    ...common,
  });
}

